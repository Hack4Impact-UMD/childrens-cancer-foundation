/**
 * The form engine — the single implementation, shared by both runtimes.
 *
 * The browser decides what to render and when Submit goes live; the cloud
 * function decides what is actually accepted. If those were two pieces of
 * code they would eventually disagree, and the disagreement would surface as
 * an applicant who cannot submit a form the app told them was complete.
 *
 * It lives under `functions/` because that whole directory is uploaded on
 * deploy, and the React app reaches it through the `@ccf/form-engine` alias
 * configured in `react-app/ccf/craco.config.js`. Consequences worth knowing:
 *
 *  - Plain CommonJS, no TypeScript, no dependencies. `form-engine.d.ts` carries
 *    the types for the app side.
 *  - Only syntax both Node 22 and the browser build understand.
 *
 * The rule the whole design rests on: a field that is not visible is not
 * required and is not validated, but its answer is kept.
 */

'use strict';

/**
 * A required answer is missing when it is blank, unset, or — for a checkbox
 * used as an attestation — left unchecked.
 */
function isBlank(value) {
    return (
        value === null ||
        value === undefined ||
        value === false ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
    );
}

function asNumber(value) {
    if (typeof value === 'number') return value;
    // Currency answers arrive as "75,000" or "$75,000" from free-text inputs.
    const cleaned = String(value === null || value === undefined ? '' : value).replace(/[$,\s]/g, '');
    return cleaned === '' ? NaN : Number(cleaned);
}

function evaluateCondition(condition, answers) {
    const value = answers ? answers[condition.field] : undefined;

    if (condition.answered !== undefined) {
        return condition.answered ? !isBlank(value) : isBlank(value);
    }
    if (condition.equals !== undefined) return value === condition.equals;
    if (condition.notEquals !== undefined) return value !== condition.notEquals;
    if (condition.oneOf !== undefined) return condition.oneOf.indexOf(value) !== -1;
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
}

function evaluateVisibility(rule, answers) {
    if (!rule) return true;

    if (rule.all && rule.all.length > 0) {
        for (const condition of rule.all) {
            if (!evaluateCondition(condition, answers)) return false;
        }
    }
    if (rule.any && rule.any.length > 0) {
        let met = false;
        for (const condition of rule.any) {
            if (evaluateCondition(condition, answers)) { met = true; break; }
        }
        if (!met) return false;
    }
    return true;
}

function isFieldVisible(field, answers) {
    return evaluateVisibility(field.showWhen, answers);
}

function isPageVisible(page, answers) {
    return evaluateVisibility(page.showWhen, answers);
}

function getVisiblePages(form, answers) {
    return form.pages.filter((page) => isPageVisible(page, answers));
}

/** Visible fields on one page, in template order. */
function getVisibleFields(page, answers) {
    return (page.fields || []).filter((field) => isFieldVisible(field, answers));
}

/** Every visible field across every visible page, in template order. */
function getAllVisibleFields(form, answers) {
    return getVisiblePages(form, answers).reduce(
        (all, page) => all.concat(getVisibleFields(page, answers)),
        []
    );
}

function findField(form, fieldId) {
    for (const page of form.pages) {
        const match = (page.fields || []).find((f) => f.id === fieldId);
        if (match) return match;
    }
    return undefined;
}

function findPageForField(form, fieldId) {
    return form.pages.find((page) => (page.fields || []).some((f) => f.id === fieldId));
}

/**
 * Admin-authored patterns run on the server, where a pathological expression
 * is a denial of service. Long answers are refused rather than matched, and
 * the pattern itself is screened before it is ever stored.
 */
const MAX_PATTERN_INPUT = 4096;

function matchesPattern(pattern, value) {
    if (value.length > MAX_PATTERN_INPUT) return false;
    try {
        return new RegExp(pattern).test(value);
    } catch (e) {
        // A pattern that will not compile must not silently pass everything.
        return false;
    }
}

/** Types whose answer must be one of the field's `options`. */
const CHOICE_TYPES = ['radio', 'select'];

function isChoiceType(type) {
    return CHOICE_TYPES.indexOf(type) !== -1;
}

/** The one place a single answer is judged. Returns a message, or null. */
function validateField(field, value) {
    if (isBlank(value)) {
        return field.required ? field.label + ' is required' : null;
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
        if (isNaN(n)) return field.label + ' must be a number';
        if (rules && rules.min !== undefined && n < rules.min) {
            return field.label + ' must be at least ' + rules.min;
        }
        if (rules && rules.max !== undefined && n > rules.max) {
            return field.label + ' must be no more than ' + rules.max;
        }
    }
    if (rules && rules.minLength !== undefined && text.length < rules.minLength) {
        return field.label + ' must be at least ' + rules.minLength + ' characters';
    }
    if (rules && rules.maxLength !== undefined && text.length > rules.maxLength) {
        return field.label + ' must be no more than ' + rules.maxLength + ' characters';
    }
    if (rules && rules.pattern && !matchesPattern(rules.pattern, text)) {
        return rules.patternMessage || field.label + ' is not in the expected format';
    }
    // Only a choice field is judged against its options. Other types may still
    // carry a stale `options` array — an admin who switches a Choice question
    // to Short text leaves one behind, and the editor stops showing it — and
    // that must not turn a free-text box into a list nobody can satisfy.
    if (isChoiceType(field.type) && field.options && field.options.length > 0 &&
        field.options.indexOf(text) === -1) {
        return field.label + ' must be one of: ' + field.options.join(', ');
    }

    return null;
}

/**
 * Which rules judge a submission: the live template, or the pre-builder checks.
 *
 * `claimed` is the version the browser says it rendered; `live` is the version
 * actually published for the grant type, or null when there is none. The client
 * does not get to choose — a claim that does not match the live version is
 * refused rather than honoured, because otherwise omitting the reference would
 * fall through to the weaker pre-builder checks, and naming an older version
 * would be judged by whatever that version happened to require. Either way an
 * applicant could skip every question an admin has added since.
 *
 * The I/O stays with the caller; this is only the decision.
 */
function resolveSubmissionForm(claimed, live) {
    // Nothing published for this grant type. The browser falls back to the
    // seeded form too, so both sides agree on the pre-builder checks.
    if (!live) return { use: 'legacy' };

    if (!claimed || !claimed.templateId || !claimed.version) {
        return {
            use: 'refuse',
            reason: 'This application was filled in before the current form was published. ' +
                'Please refresh your browser and try again.',
        };
    }
    if (claimed.templateId !== live.templateId || Number(claimed.version) !== live.version) {
        return {
            use: 'refuse',
            reason: 'The form has been updated since this application was started. ' +
                'Please refresh your browser and try again — your saved answers are kept.',
        };
    }
    return { use: 'template' };
}

/**
 * The answers, with the uploaded PDF standing in for every `file` question.
 *
 * The file never travels with the answers: the browser strips it and uploads it
 * to Storage directly, and only the object name reaches the cloud function. A
 * required `file` question would therefore read as unanswered and reject every
 * submission. The caller verifies the object separately — this only makes the
 * answer set match what was actually submitted.
 */
function withUploadedFile(form, answers, storedFileName) {
    const merged = Object.assign({}, answers);
    for (const page of form.pages || []) {
        for (const field of page.fields || []) {
            if (field.type === 'file') merged[field.id] = storedFileName;
        }
    }
    return merged;
}

/**
 * Validate answers against the form. Pass `pageIds` to check only certain
 * pages — the applicant form uses that so "Save and Continue" never complains
 * about a question on a page the applicant has not reached.
 */
function validateAnswers(form, answers, pageIds) {
    const errors = {};
    const pages = getVisiblePages(form, answers).filter(
        (page) => !pageIds || pageIds.indexOf(page.id) !== -1
    );

    for (const page of pages) {
        for (const field of getVisibleFields(page, answers)) {
            const message = validateField(field, answers ? answers[field.id] : undefined);
            if (message) errors[field.id] = message;
        }
    }
    return errors;
}

/** Missing/invalid answers grouped by page title, for the submit modal. */
function getProblemsByPage(form, answers) {
    const grouped = {};

    for (const page of getVisiblePages(form, answers)) {
        const messages = [];
        for (const field of getVisibleFields(page, answers)) {
            const message = validateField(field, answers ? answers[field.id] : undefined);
            if (message) messages.push(message);
        }
        if (messages.length > 0) grouped[page.title] = messages;
    }
    return grouped;
}

function isComplete(form, answers) {
    return Object.keys(validateAnswers(form, answers)).length === 0;
}

/* ------------------------------------------------------------------ *
 * Template integrity
 * ------------------------------------------------------------------ */

/**
 * Rejects regular expressions whose cost can blow up on hostile input —
 * nested quantifiers such as `(a+)+`, which hang the process rather than
 * failing. Deliberately conservative: applied when an admin saves a pattern,
 * where a false rejection is an inconvenience and a false acceptance takes
 * down submissions.
 */
function checkPatternSafety(pattern) {
    if (pattern.length > 200) return 'Pattern is too long (limit 200 characters)';
    try {
        new RegExp(pattern);
    } catch (e) {
        return 'Pattern is not a valid regular expression';
    }
    if (/(\([^)]*[+*][^)]*\)|\[[^\]]*\][+*]|\\[dws][+*])\s*[+*]/.test(pattern)) {
        return 'Pattern has nested repetition, which can hang on long answers';
    }
    return null;
}

/**
 * Structural checks on a template — the guardrails that stop the builder
 * producing a form the rest of the app cannot serve. Run before publishing.
 */
function validateTemplate(template) {
    const problems = [];
    const seenFieldIds = new Set();
    const seenPageIds = new Set();
    /** Field IDs allowed as condition targets: everything already passed. */
    const earlierFieldIds = new Set();

    for (const page of template.pages) {
        if (seenPageIds.has(page.id)) {
            problems.push({ level: 'error', target: page.id, message: 'Duplicate page ID "' + page.id + '"' });
        }
        seenPageIds.add(page.id);

        if (!page.title || !page.title.trim()) {
            problems.push({ level: 'error', target: page.id, message: 'Every page needs a title' });
        }

        const pageConditions = []
            .concat((page.showWhen && page.showWhen.all) || [])
            .concat((page.showWhen && page.showWhen.any) || []);
        for (const condition of pageConditions) {
            if (!earlierFieldIds.has(condition.field)) {
                problems.push({
                    level: 'error',
                    target: page.id,
                    message: 'Page "' + page.title + '" is shown based on "' + condition.field +
                        '", which does not come before it',
                });
            }
        }

        for (const field of page.fields || []) {
            if (seenFieldIds.has(field.id)) {
                problems.push({ level: 'error', target: field.id, message: 'Duplicate field ID "' + field.id + '"' });
            }
            seenFieldIds.add(field.id);

            if (!field.label || !field.label.trim()) {
                problems.push({ level: 'error', target: field.id, message: 'Field "' + field.id + '" needs a label' });
            }

            if ((field.type === 'radio' || field.type === 'select') && !(field.options && field.options.length)) {
                problems.push({
                    level: 'error',
                    target: field.id,
                    message: '"' + (field.label || field.id) + '" is a choice field with no options',
                });
            }

            if (field.locked) {
                if (!field.required) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: '"' + field.label + '" is used elsewhere in the app and cannot be optional',
                    });
                }
                if (field.showWhen) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: '"' + field.label + '" is used elsewhere in the app and cannot be shown conditionally',
                    });
                }
            }

            // Conditions may only look backwards. That makes loops impossible
            // by construction rather than by cycle detection, and keeps the
            // form explainable: an answer only ever affects what comes after it.
            const fieldConditions = []
                .concat((field.showWhen && field.showWhen.all) || [])
                .concat((field.showWhen && field.showWhen.any) || []);
            for (const condition of fieldConditions) {
                if (condition.field === field.id) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: '"' + field.label + '" cannot depend on its own answer',
                    });
                } else if (!earlierFieldIds.has(condition.field)) {
                    problems.push({
                        level: 'error',
                        target: field.id,
                        message: '"' + field.label + '" depends on "' + condition.field +
                            '", which does not come before it',
                    });
                }
            }

            if (field.validation && field.validation.pattern) {
                const unsafe = checkPatternSafety(field.validation.pattern);
                if (unsafe) {
                    problems.push({ level: 'error', target: field.id, message: '"' + field.label + '": ' + unsafe });
                }
            }

            earlierFieldIds.add(field.id);
        }
    }

    return problems;
}

/** Locked field IDs present in a template, in order. */
function getLockedFieldIds(form) {
    return form.pages.reduce(
        (ids, page) => ids.concat((page.fields || []).filter((f) => f.locked).map((f) => f.id)),
        []
    );
}

module.exports = {
    isBlank,
    isChoiceType,
    withUploadedFile,
    resolveSubmissionForm,
    evaluateCondition,
    evaluateVisibility,
    isFieldVisible,
    isPageVisible,
    getVisiblePages,
    getVisibleFields,
    getAllVisibleFields,
    findField,
    findPageForField,
    validateField,
    validateAnswers,
    getProblemsByPage,
    isComplete,
    checkPatternSafety,
    validateTemplate,
    getLockedFieldIds,
    MAX_PATTERN_INPUT,
};
