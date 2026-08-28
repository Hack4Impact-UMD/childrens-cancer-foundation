/**
 * The form engine: pure functions over (template, answers).
 *
 * Nothing here imports React or Firebase, because the same answers have to be
 * judged identically in three places — while the applicant types, when the
 * client decides whether Submit is live, and inside the cloud function that
 * actually writes the application. Two implementations would eventually
 * disagree, and the disagreement would surface as an applicant who cannot
 * submit a form the app told them was complete.
 *
 * The rule that ties visibility and validation together: a field that is not
 * visible is not required and is not validated, but its answer is kept. An
 * applicant who changes their mind twice does not lose what they typed, and a
 * hidden question can never block submission.
 */

import {
    Answers,
    Condition,
    FieldErrors,
    FormField,
    FormPage,
    FormTemplate,
    PublishedVersion,
    TemplateProblem,
    VisibilityRule,
} from '../types/form-template-types';

/** Anything with pages: a draft template or a published version. */
export type FormLike = Pick<FormTemplate, 'pages'> | Pick<PublishedVersion, 'pages'>;

/**
 * A required answer is missing when it is blank, unset, or — for a checkbox
 * used as an attestation — left unchecked.
 */
export const isBlank = (value: any): boolean =>
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

const asNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    // Currency answers arrive as "75,000" or "$75,000" from free-text inputs.
    const cleaned = String(value ?? '').replace(/[$,\s]/g, '');
    return cleaned === '' ? NaN : Number(cleaned);
};

export const evaluateCondition = (condition: Condition, answers: Answers): boolean => {
    const value = answers?.[condition.field];

    if (condition.answered !== undefined) {
        return condition.answered ? !isBlank(value) : isBlank(value);
    }
    if (condition.equals !== undefined) {
        return value === condition.equals;
    }
    if (condition.notEquals !== undefined) {
        return value !== condition.notEquals;
    }
    if (condition.oneOf !== undefined) {
        return condition.oneOf.includes(value);
    }
    if (condition.greaterThan !== undefined) {
        const n = asNumber(value);
        return !isNaN(n) && n > condition.greaterThan;
    }
    if (condition.lessThan !== undefined) {
        const n = asNumber(value);
        return !isNaN(n) && n < condition.lessThan;
    }
    // A condition with no comparison is meaningless; treat it as unmet rather
    // than silently showing the field.
    return false;
};

export const evaluateVisibility = (rule: VisibilityRule | undefined, answers: Answers): boolean => {
    if (!rule) return true;
    const { all, any } = rule;

    if (all && all.length > 0 && !all.every((c) => evaluateCondition(c, answers))) {
        return false;
    }
    if (any && any.length > 0 && !any.some((c) => evaluateCondition(c, answers))) {
        return false;
    }
    return true;
};

export const isFieldVisible = (field: FormField, answers: Answers): boolean =>
    evaluateVisibility(field.showWhen, answers);

export const isPageVisible = (page: FormPage, answers: Answers): boolean =>
    evaluateVisibility(page.showWhen, answers);

export const getVisiblePages = (form: FormLike, answers: Answers): FormPage[] =>
    form.pages.filter((page) => isPageVisible(page, answers));

/** Visible fields on one page, in template order. */
export const getVisibleFields = (page: FormPage, answers: Answers): FormField[] =>
    (page.fields || []).filter((field) => isFieldVisible(field, answers));

/** Every visible field across every visible page, in template order. */
export const getAllVisibleFields = (form: FormLike, answers: Answers): FormField[] =>
    getVisiblePages(form, answers).flatMap((page) => getVisibleFields(page, answers));

export const findField = (form: FormLike, fieldId: string): FormField | undefined => {
    for (const page of form.pages) {
        const match = (page.fields || []).find((f) => f.id === fieldId);
        if (match) return match;
    }
    return undefined;
};

export const findPageForField = (form: FormLike, fieldId: string): FormPage | undefined =>
    form.pages.find((page) => (page.fields || []).some((f) => f.id === fieldId));

/**
 * Admin-authored patterns run on the server, where a pathological expression
 * is a denial of service. Long answers are refused rather than matched, and
 * the pattern itself is checked before it is ever stored (see
 * `checkPatternSafety`).
 */
const MAX_PATTERN_INPUT = 4096;

const matchesPattern = (pattern: string, value: string): boolean => {
    if (value.length > MAX_PATTERN_INPUT) return false;
    try {
        return new RegExp(pattern).test(value);
    } catch {
        // A pattern that will not compile must not silently pass everything.
        return false;
    }
};

/** The one place a single answer is judged. Returns a message, or null. */
export const validateField = (field: FormField, value: any): string | null => {
    if (isBlank(value)) {
        return field.required ? `${field.label} is required` : null;
    }

    const text = typeof value === 'string' ? value.trim() : String(value);
    const rules = field.validation;

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        return 'Invalid email format';
    }
    if (field.type === 'phone' && !/^\d{10}$/.test(text)) {
        return 'Invalid phone number format: Please format phone numbers as XXXXXXXXXX (without parentheses or dashes)';
    }
    if (field.type === 'number' || field.type === 'currency') {
        const n = asNumber(text);
        if (isNaN(n)) return `${field.label} must be a number`;
        if (rules?.min !== undefined && n < rules.min) {
            return `${field.label} must be at least ${rules.min}`;
        }
        if (rules?.max !== undefined && n > rules.max) {
            return `${field.label} must be no more than ${rules.max}`;
        }
    }
    if (rules?.minLength !== undefined && text.length < rules.minLength) {
        return `${field.label} must be at least ${rules.minLength} characters`;
    }
    if (rules?.maxLength !== undefined && text.length > rules.maxLength) {
        return `${field.label} must be no more than ${rules.maxLength} characters`;
    }
    if (rules?.pattern && !matchesPattern(rules.pattern, text)) {
        return rules.patternMessage || `${field.label} is not in the expected format`;
    }
    if (field.options && field.options.length > 0 && !field.options.includes(text)) {
        return `${field.label} must be one of: ${field.options.join(', ')}`;
    }

    return null;
};

/**
 * Validate answers against the form. Pass `pageIds` to check only certain
 * pages — the applicant form uses that so "Save and Continue" never complains
 * about a question on a page the applicant has not reached.
 */
export const validateAnswers = (
    form: FormLike,
    answers: Answers,
    pageIds?: string[]
): FieldErrors => {
    const errors: FieldErrors = {};
    const pages = getVisiblePages(form, answers).filter(
        (page) => !pageIds || pageIds.includes(page.id)
    );

    for (const page of pages) {
        for (const field of getVisibleFields(page, answers)) {
            const message = validateField(field, answers?.[field.id]);
            if (message) errors[field.id] = message;
        }
    }
    return errors;
};

/** Missing/invalid answers grouped by page title, for the submit modal. */
export const getProblemsByPage = (
    form: FormLike,
    answers: Answers
): Record<string, string[]> => {
    const grouped: Record<string, string[]> = {};

    for (const page of getVisiblePages(form, answers)) {
        const messages: string[] = [];
        for (const field of getVisibleFields(page, answers)) {
            const message = validateField(field, answers?.[field.id]);
            if (message) messages.push(message);
        }
        if (messages.length > 0) grouped[page.title] = messages;
    }
    return grouped;
};

export const isComplete = (form: FormLike, answers: Answers): boolean =>
    Object.keys(validateAnswers(form, answers)).length === 0;

/* ------------------------------------------------------------------ *
 * Template integrity
 * ------------------------------------------------------------------ */

/**
 * Rejects regular expressions whose cost can blow up on hostile input —
 * nested quantifiers such as `(a+)+`, which hang the process rather than
 * failing. This is a deliberately conservative screen: it is applied when an
 * admin saves a pattern, where a false rejection is a small inconvenience and
 * a false acceptance takes down submissions.
 */
export const checkPatternSafety = (pattern: string): string | null => {
    if (pattern.length > 200) return 'Pattern is too long (limit 200 characters)';
    try {
        // eslint-disable-next-line no-new
        new RegExp(pattern);
    } catch {
        return 'Pattern is not a valid regular expression';
    }
    if (/(\([^)]*[+*][^)]*\)|\[[^\]]*\][+*]|\\[dws][+*])\s*[+*]/.test(pattern)) {
        return 'Pattern has nested repetition, which can hang on long answers';
    }
    return null;
};

/**
 * Structural checks on a template — the guardrails that stop the builder
 * producing a form the rest of the app cannot serve. Run before publishing.
 */
export const validateTemplate = (template: FormTemplate): TemplateProblem[] => {
    const problems: TemplateProblem[] = [];
    const seenFieldIds = new Set<string>();
    const seenPageIds = new Set<string>();
    /** Field IDs allowed as condition targets: everything already passed. */
    const earlierFieldIds = new Set<string>();

    for (const page of template.pages) {
        if (seenPageIds.has(page.id)) {
            problems.push({ level: 'error', target: page.id, message: `Duplicate page ID "${page.id}"` });
        }
        seenPageIds.add(page.id);

        if (!page.title?.trim()) {
            problems.push({ level: 'error', target: page.id, message: 'Every page needs a title' });
        }

        for (const condition of [...(page.showWhen?.all ?? []), ...(page.showWhen?.any ?? [])]) {
            if (!earlierFieldIds.has(condition.field)) {
                problems.push({
                    level: 'error',
                    target: page.id,
                    message: `Page "${page.title}" is shown based on "${condition.field}", which does not come before it`,
                });
            }
        }

        for (const field of page.fields || []) {
            if (seenFieldIds.has(field.id)) {
                problems.push({ level: 'error', target: field.id, message: `Duplicate field ID "${field.id}"` });
            }
            seenFieldIds.add(field.id);

            if (!field.label?.trim()) {
                problems.push({ level: 'error', target: field.id, message: `Field "${field.id}" needs a label` });
            }

            if ((field.type === 'radio' || field.type === 'select') && !(field.options && field.options.length)) {
                problems.push({
                    level: 'error',
                    target: field.id,
                    message: `"${field.label || field.id}" is a choice field with no options`,
                });
            }

            if (field.locked) {
                if (!field.required) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: `"${field.label}" is used elsewhere in the app and cannot be optional`,
                    });
                }
                if (field.showWhen) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: `"${field.label}" is used elsewhere in the app and cannot be shown conditionally`,
                    });
                }
            }

            // Conditions may only look backwards. That makes loops impossible
            // by construction rather than by cycle detection, and keeps the
            // form explainable: an answer only ever affects what comes after it.
            for (const condition of [...(field.showWhen?.all ?? []), ...(field.showWhen?.any ?? [])]) {
                if (condition.field === field.id) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: `"${field.label}" cannot depend on its own answer`,
                    });
                } else if (!earlierFieldIds.has(condition.field)) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: `"${field.label}" depends on "${condition.field}", which does not come before it`,
                    });
                }
            }

            if (field.validation?.pattern) {
                const unsafe = checkPatternSafety(field.validation.pattern);
                if (unsafe) {
                    problems.push({ level: 'error', target: field.id, message: `"${field.label}": ${unsafe}` });
                }
            }

            earlierFieldIds.add(field.id);
        }
    }

    return problems;
};

/** Locked field IDs present in a template, in order. */
export const getLockedFieldIds = (form: FormLike): string[] =>
    form.pages.flatMap((page) => (page.fields || []).filter((f) => f.locked).map((f) => f.id));
