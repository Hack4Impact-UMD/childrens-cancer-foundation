/**
 * Every edit the builder can make, as pure functions over a template.
 *
 * Two ideas run through all of it:
 *
 *  - **Guards come in pairs.** Each destructive operation has a `whyCannot…`
 *    companion returning the reason it is refused, or null. The UI calls the
 *    guard to disable a control and explain why; the operation calls it again
 *    and throws, so a bug in the UI cannot get past it.
 *  - **Field IDs are permanent.** New fields get generated IDs that are never
 *    reused, even after the field they belonged to is deleted, because a past
 *    application may still be keyed by one.
 */

import {
    Condition,
    FieldValidation,
    FieldType,
    FormField,
    FormPage,
    FormTemplate,
    VisibilityRule,
} from '../types/form-template-types';
import { checkPatternSafety } from './engine';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Pages the builder owns: About Grant and Review are generated, not authored. */
export const isEditablePage = (page: FormPage): boolean => (page.kind ?? 'fields') === 'fields';

export const editablePages = (template: FormTemplate): FormPage[] =>
    template.pages.filter(isEditablePage);

const allFields = (template: FormTemplate): FormField[] =>
    template.pages.flatMap((p) => p.fields || []);

const allFieldIds = (template: FormTemplate): string[] => allFields(template).map((f) => f.id);

export const findFieldPage = (template: FormTemplate, fieldId: string): FormPage | undefined =>
    template.pages.find((p) => (p.fields || []).some((f) => f.id === fieldId));

/* ------------------------------------------------------------------ *
 * IDs
 * ------------------------------------------------------------------ */

/**
 * IDs for admin-created questions are prefixed and slugged from the label, so
 * a Firestore document stays readable, and suffixed on collision so an ID is
 * never reused for a different question.
 */
export const generateFieldId = (label: string, taken: string[]): string => {
    const slug = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40);
    const base = `custom_${slug || 'question'}`;

    if (!taken.includes(base)) return base;
    let n = 2;
    while (taken.includes(`${base}_${n}`)) n += 1;
    return `${base}_${n}`;
};

export const generatePageId = (title: string, taken: string[]): string => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    const base = slug || 'page';
    if (!taken.includes(base)) return base;
    let n = 2;
    while (taken.includes(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
};

/* ------------------------------------------------------------------ *
 * Pages
 * ------------------------------------------------------------------ */

export const addPage = (
    template: FormTemplate,
    title: string,
    afterPageId?: string
): FormTemplate => {
    const next = clone(template);
    const page: FormPage = {
        id: generatePageId(title, next.pages.map((p) => p.id)),
        title,
        kind: 'fields',
        fields: [],
    };

    const index = afterPageId ? next.pages.findIndex((p) => p.id === afterPageId) : -1;
    if (index >= 0) {
        next.pages.splice(index + 1, 0, page);
    } else {
        // Default to just before the generated Review page, which is always last.
        const reviewIndex = next.pages.findIndex((p) => p.kind === 'review');
        next.pages.splice(reviewIndex >= 0 ? reviewIndex : next.pages.length, 0, page);
    }
    return next;
};

export const whyCannotDeletePage = (template: FormTemplate, pageId: string): string | null => {
    const page = template.pages.find((p) => p.id === pageId);
    if (!page) return 'That page no longer exists';
    if (!isEditablePage(page)) return 'The About Grant and Review pages are part of every form';

    const lockedHere = (page.fields || []).filter((f) => f.locked);
    if (lockedHere.length > 0) {
        return `"${lockedHere[0].label}" is used elsewhere in the app — move it to another page first`;
    }
    if (editablePages(template).length <= 1) {
        return 'A form needs at least one page of questions';
    }

    // Deleting the page would take its answers out of scope for anything that
    // depends on them.
    const removedIds = (page.fields || []).map((f) => f.id);
    const dependant = allFields(template).find(
        (f) => !removedIds.includes(f.id) && conditionSources(f.showWhen).some((id) => removedIds.includes(id))
    );
    if (dependant) {
        return `"${dependant.label}" is shown based on a question on this page`;
    }
    return null;
};

export const deletePage = (template: FormTemplate, pageId: string): FormTemplate => {
    const reason = whyCannotDeletePage(template, pageId);
    if (reason) throw new Error(reason);

    const next = clone(template);
    next.pages = next.pages.filter((p) => p.id !== pageId);
    return next;
};

export const renamePage = (template: FormTemplate, pageId: string, title: string): FormTemplate => {
    const next = clone(template);
    const page = next.pages.find((p) => p.id === pageId);
    if (!page) throw new Error('That page no longer exists');
    page.title = title;
    return next;
};

export const whyCannotMovePage = (
    template: FormTemplate,
    pageId: string,
    direction: -1 | 1
): string | null => {
    const index = template.pages.findIndex((p) => p.id === pageId);
    const page = template.pages[index];
    if (!page) return 'That page no longer exists';
    if (!isEditablePage(page)) return 'The About Grant and Review pages stay where they are';

    const target = index + direction;
    const neighbour = template.pages[target];
    if (!neighbour || !isEditablePage(neighbour)) return 'Already as far as it goes';

    // Moving a page across a question it depends on would leave the form
    // asking a follow-up before its trigger.
    const moved = clone(template);
    [moved.pages[index], moved.pages[target]] = [moved.pages[target], moved.pages[index]];
    return firstBackwardsDependency(moved);
};

export const movePage = (template: FormTemplate, pageId: string, direction: -1 | 1): FormTemplate => {
    const reason = whyCannotMovePage(template, pageId, direction);
    if (reason) throw new Error(reason);

    const next = clone(template);
    const index = next.pages.findIndex((p) => p.id === pageId);
    const target = index + direction;
    [next.pages[index], next.pages[target]] = [next.pages[target], next.pages[index]];
    return next;
};

/* ------------------------------------------------------------------ *
 * Fields
 * ------------------------------------------------------------------ */

export const DEFAULT_OPTIONS: Record<string, string[]> = {
    radio: ['Yes', 'No'],
    select: ['Option 1', 'Option 2'],
};

export const addField = (
    template: FormTemplate,
    pageId: string,
    input: { label: string; type: FieldType; required?: boolean }
): FormTemplate => {
    const next = clone(template);
    const page = next.pages.find((p) => p.id === pageId);
    if (!page) throw new Error('That page no longer exists');
    if (!isEditablePage(page)) throw new Error('Questions cannot be added to that page');

    const field: FormField = {
        id: generateFieldId(input.label, allFieldIds(next)),
        type: input.type,
        label: input.label,
        required: input.required ?? false,
    };
    if (DEFAULT_OPTIONS[input.type]) field.options = [...DEFAULT_OPTIONS[input.type]];

    page.fields.push(field);
    return next;
};

/** Changes an admin may not make to a field the rest of the app reads by name. */
export const whyCannotChangeField = (
    field: FormField,
    patch: Partial<FormField>
): string | null => {
    if (!field.locked) return null;

    if (patch.required === false) {
        return `"${field.label}" is used elsewhere in the app and must stay required`;
    }
    if (patch.showWhen) {
        return `"${field.label}" is used elsewhere in the app and cannot be shown conditionally`;
    }
    if (patch.type && patch.type !== field.type) {
        return `"${field.label}" is used elsewhere in the app, so its answer format cannot change`;
    }
    if (patch.id && patch.id !== field.id) {
        return 'Question IDs are permanent';
    }
    return null;
};

export const updateField = (
    template: FormTemplate,
    fieldId: string,
    patch: Partial<FormField>
): FormTemplate => {
    const next = clone(template);
    const page = next.pages.find((p) => (p.fields || []).some((f) => f.id === fieldId));
    if (!page) throw new Error('That question no longer exists');

    const index = page.fields.findIndex((f) => f.id === fieldId);
    const current = page.fields[index];

    const reason = whyCannotChangeField(current, patch);
    if (reason) throw new Error(reason);
    if (patch.id && patch.id !== current.id) throw new Error('Question IDs are permanent');

    if (patch.validation?.pattern) {
        const unsafe = checkPatternSafety(patch.validation.pattern);
        if (unsafe) throw new Error(unsafe);
    }

    page.fields[index] = { ...current, ...patch, id: current.id };
    return next;
};

export const whyCannotDeleteField = (template: FormTemplate, fieldId: string): string | null => {
    const field = allFields(template).find((f) => f.id === fieldId);
    if (!field) return 'That question no longer exists';
    if (field.locked) {
        return `"${field.label}" is used elsewhere in the app and cannot be removed`;
    }

    const dependant = allFields(template).find(
        (f) => f.id !== fieldId && conditionSources(f.showWhen).includes(fieldId)
    );
    if (dependant) return `"${dependant.label}" is shown based on this question`;

    const dependantPage = template.pages.find((p) => conditionSources(p.showWhen).includes(fieldId));
    if (dependantPage) return `The page "${dependantPage.title}" is shown based on this question`;

    return null;
};

export const deleteField = (template: FormTemplate, fieldId: string): FormTemplate => {
    const reason = whyCannotDeleteField(template, fieldId);
    if (reason) throw new Error(reason);

    const next = clone(template);
    next.pages.forEach((page) => {
        page.fields = (page.fields || []).filter((f) => f.id !== fieldId);
    });
    return next;
};

export const whyCannotMoveField = (
    template: FormTemplate,
    fieldId: string,
    direction: -1 | 1
): string | null => {
    const page = findFieldPage(template, fieldId);
    if (!page) return 'That question no longer exists';

    const index = page.fields.findIndex((f) => f.id === fieldId);
    const target = index + direction;
    if (target < 0 || target >= page.fields.length) return 'Already as far as it goes';

    const moved = clone(template);
    const movedPage = moved.pages.find((p) => p.id === page.id)!;
    [movedPage.fields[index], movedPage.fields[target]] = [movedPage.fields[target], movedPage.fields[index]];
    return firstBackwardsDependency(moved);
};

export const moveField = (
    template: FormTemplate,
    fieldId: string,
    direction: -1 | 1
): FormTemplate => {
    const reason = whyCannotMoveField(template, fieldId, direction);
    if (reason) throw new Error(reason);

    const next = clone(template);
    const page = next.pages.find((p) => (p.fields || []).some((f) => f.id === fieldId))!;
    const index = page.fields.findIndex((f) => f.id === fieldId);
    const target = index + direction;
    [page.fields[index], page.fields[target]] = [page.fields[target], page.fields[index]];
    return next;
};

/** Moving a question to another page keeps its ID, and so its answers. */
export const moveFieldToPage = (
    template: FormTemplate,
    fieldId: string,
    pageId: string
): FormTemplate => {
    const next = clone(template);
    const from = next.pages.find((p) => (p.fields || []).some((f) => f.id === fieldId));
    const to = next.pages.find((p) => p.id === pageId);
    if (!from || !to) throw new Error('That question no longer exists');
    if (!isEditablePage(to)) throw new Error('Questions cannot be moved to that page');

    const [field] = from.fields.splice(from.fields.findIndex((f) => f.id === fieldId), 1);
    to.fields.push(field);

    const broken = firstBackwardsDependency(next);
    if (broken) throw new Error(broken);
    return next;
};

/* ------------------------------------------------------------------ *
 * Conditional logic
 * ------------------------------------------------------------------ */

export const conditionSources = (rule?: VisibilityRule): string[] =>
    [...(rule?.all ?? []), ...(rule?.any ?? [])].map((c) => c.field);

/**
 * Questions a field may be shown based on: everything that comes before it.
 * Looking only backwards makes loops impossible by construction, and keeps the
 * form explainable — an answer only ever affects what comes after it.
 */
export const availableConditionSources = (
    template: FormTemplate,
    fieldId: string
): FormField[] => {
    const earlier: FormField[] = [];
    for (const page of template.pages) {
        for (const field of page.fields || []) {
            if (field.id === fieldId) return earlier;
            earlier.push(field);
        }
    }
    return earlier;
};

/** Sources available to a page: every question on the pages before it. */
export const availablePageConditionSources = (
    template: FormTemplate,
    pageId: string
): FormField[] => {
    const earlier: FormField[] = [];
    for (const page of template.pages) {
        if (page.id === pageId) return earlier;
        earlier.push(...(page.fields || []));
    }
    return earlier;
};

export const setFieldCondition = (
    template: FormTemplate,
    fieldId: string,
    rule: VisibilityRule | undefined
): FormTemplate => {
    const field = allFields(template).find((f) => f.id === fieldId);
    if (!field) throw new Error('That question no longer exists');

    if (rule) {
        const reason = whyCannotChangeField(field, { showWhen: rule });
        if (reason) throw new Error(reason);

        const allowed = availableConditionSources(template, fieldId).map((f) => f.id);
        for (const source of conditionSources(rule)) {
            if (source === fieldId) throw new Error(`"${field.label}" cannot depend on its own answer`);
            if (!allowed.includes(source)) {
                throw new Error(`"${field.label}" can only be shown based on a question that comes before it`);
            }
        }
    }

    const next = clone(template);
    const target = allFields(next).find((f) => f.id === fieldId)!;
    if (rule) {
        target.showWhen = rule;
    } else {
        delete target.showWhen;
    }
    return next;
};

export const describeCondition = (condition: Condition, sourceLabel: string): string => {
    if (condition.answered !== undefined) {
        return `${sourceLabel} is ${condition.answered ? 'answered' : 'not answered'}`;
    }
    if (condition.equals !== undefined) return `${sourceLabel} is "${condition.equals}"`;
    if (condition.notEquals !== undefined) return `${sourceLabel} is not "${condition.notEquals}"`;
    if (condition.oneOf !== undefined) return `${sourceLabel} is one of ${condition.oneOf.join(', ')}`;
    if (condition.greaterThan !== undefined) return `${sourceLabel} is more than ${condition.greaterThan}`;
    if (condition.lessThan !== undefined) return `${sourceLabel} is less than ${condition.lessThan}`;
    return `${sourceLabel} — no rule set`;
};

/**
 * The first field or page whose condition points at a question that does not
 * come before it. Used to refuse a move that would break the ordering rule.
 */
export const firstBackwardsDependency = (template: FormTemplate): string | null => {
    const seen = new Set<string>();

    for (const page of template.pages) {
        for (const source of conditionSources(page.showWhen)) {
            if (!seen.has(source)) {
                return `The page "${page.title}" is shown based on a question that would come after it`;
            }
        }
        for (const field of page.fields || []) {
            for (const source of conditionSources(field.showWhen)) {
                if (source === field.id || !seen.has(source)) {
                    return `"${field.label}" is shown based on a question that would come after it`;
                }
            }
            seen.add(field.id);
        }
    }
    return null;
};

/* ------------------------------------------------------------------ *
 * Validation presets
 * ------------------------------------------------------------------ */

export interface ValidationPreset {
    id: string;
    label: string;
    validation: FieldValidation;
}

/**
 * Most of what CCF wants is one of these, and a preset cannot be typed wrong.
 * The custom pattern box is the escape hatch, screened by `checkPatternSafety`
 * and paired with a test box in the editor.
 */
export const VALIDATION_PRESETS: ValidationPreset[] = [
    { id: 'none', label: 'No pattern', validation: {} },
    {
        id: 'ein',
        label: 'EIN (12-3456789)',
        validation: { pattern: '^\\d{2}-\\d{7}$', patternMessage: 'Enter an EIN like 12-3456789' },
    },
    {
        id: 'zip',
        label: 'ZIP code',
        validation: { pattern: '^\\d{5}(-\\d{4})?$', patternMessage: 'Enter a ZIP code like 21201' },
    },
    {
        id: 'year',
        label: 'Four-digit year',
        validation: { pattern: '^(19|20)\\d{2}$', patternMessage: 'Enter a four-digit year' },
    },
    {
        id: 'url',
        label: 'Web address',
        validation: { pattern: '^https?://\\S+$', patternMessage: 'Enter a web address starting with http' },
    },
    {
        id: 'wholeDollars',
        label: 'Whole dollars',
        validation: { pattern: '^\\$?\\d{1,3}(,?\\d{3})*$', patternMessage: 'Enter a whole dollar amount' },
    },
];

export const findPreset = (validation?: FieldValidation): ValidationPreset | undefined =>
    VALIDATION_PRESETS.find((p) => p.validation.pattern === validation?.pattern);

/** Answers a "try it" box in the editor: does this pattern accept this text? */
export const testPattern = (pattern: string, sample: string): { ok: boolean; message: string } => {
    const unsafe = checkPatternSafety(pattern);
    if (unsafe) return { ok: false, message: unsafe };
    try {
        return new RegExp(pattern).test(sample)
            ? { ok: true, message: `"${sample}" is accepted` }
            : { ok: false, message: `"${sample}" would be rejected` };
    } catch {
        return { ok: false, message: 'Pattern is not a valid regular expression' };
    }
};
