/**
 * Turning a submitted application back into something readable.
 *
 * A submission is rendered against the version it was submitted under, so a
 * 2027 application keeps its 2027 wording however much the form changes
 * afterwards. Two cases matter as much as the happy path:
 *
 *  - a field the template asks for that the application predates — shown as
 *    "N/A" rather than crashing or vanishing;
 *  - an answer the template no longer mentions, because the question was
 *    removed — still shown, under its own heading, because hiding a question
 *    changes the form, not the archive.
 */

import { Answers, FormField, GrantType } from '../types/form-template-types';
import { FormLike, isBlank, isFieldVisible } from './engine';

export interface DisplayRow {
    fieldId: string;
    label: string;
    /** Formatted for reading; never a raw boolean or an empty string. */
    value: string;
    /** True when the application carries no answer for this field. */
    missing: boolean;
    /** True when the template no longer contains this field. */
    retired?: boolean;
    width?: FormField['width'];
}

export interface DisplaySection {
    pageId: string;
    title: string;
    rows: DisplayRow[];
}

export const RETIRED_SECTION_TITLE = 'No longer asked';

/**
 * Metadata and server-managed keys live alongside answers on an application
 * document; they are not questions and must never surface as one.
 */
export const NON_ANSWER_KEYS = [
    'status', 'decision', 'creatorId', 'applicantEmail', 'applicationId',
    'applicationCycle', 'applicationCycleId', 'grantType', 'createdAt',
    'lastUpdated', 'submitTime', 'formTemplateId', 'formVersion',
    'reviewStatus', 'averageScore', 'primaryScore', 'secondaryScore',
    'assignedReviewers', 'primaryReviewerId', 'secondaryReviewerId',
    'primaryReviewStatus', 'secondaryReviewStatus', 'recommendedAmount',
    'comments', 'archived', 'isLegacy', 'id', 'document_id',
];

const formatValue = (field: FormField | undefined, raw: any): string => {
    if (raw === null || raw === undefined || raw === '') return 'N/A';

    // An attestation reads as an answer, not as a boolean.
    if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
    if (Array.isArray(raw)) {
        return raw.length ? raw.join(', ') : 'N/A';
    }
    if (typeof raw === 'object') {
        // A File kept in draft state, or a storage reference.
        if ('name' in raw && typeof (raw as any).name === 'string') return (raw as any).name;
        return JSON.stringify(raw);
    }

    const text = String(raw).trim();
    return text === '' ? 'N/A' : text;
};

/**
 * Sections for display, in template order, followed by a section for answers
 * whose questions have since been removed. `hideEmpty` drops rows the
 * application never answered, which suits the compact cover-page view.
 */
export const toDisplaySections = (
    form: FormLike,
    answers: Answers,
    options: { hideEmpty?: boolean; includeRetired?: boolean } = {}
): DisplaySection[] => {
    const { hideEmpty = false, includeRetired = true } = options;
    const sections: DisplaySection[] = [];
    const shown = new Set<string>();

    for (const page of form.pages) {
        if ((page.kind ?? 'fields') !== 'fields') continue;

        const rows: DisplayRow[] = [];
        for (const field of page.fields) {
            shown.add(field.id);

            // A field hidden by the applicant's own answers was never asked of
            // them, so it is not part of what they submitted.
            if (!isFieldVisible(field, answers)) continue;

            const raw = answers?.[field.id];
            // The same rule the engine validates by, so a row never reads as
            // answered on screen while counting as missing at submit time.
            const missing = isBlank(raw);
            if (missing && hideEmpty) continue;

            rows.push({
                fieldId: field.id,
                label: field.label,
                value: formatValue(field, raw),
                missing,
                width: field.width,
            });
        }

        if (rows.length > 0) sections.push({ pageId: page.id, title: page.title, rows });
    }

    if (includeRetired) {
        const retired = retiredRows(form, answers, shown);
        if (retired.length > 0) {
            sections.push({ pageId: 'retired', title: RETIRED_SECTION_TITLE, rows: retired });
        }
    }

    return sections;
};

const retiredRows = (form: FormLike, answers: Answers, shown: Set<string>): DisplayRow[] => {
    const rows: DisplayRow[] = [];
    for (const [key, raw] of Object.entries(answers || {})) {
        if (shown.has(key)) continue;
        if (NON_ANSWER_KEYS.includes(key)) continue;
        if (isBlank(raw)) continue;

        rows.push({
            fieldId: key,
            // No template entry means no stored label; the ID is the only
            // honest thing left to show.
            label: humanizeFieldId(key),
            value: formatValue(undefined, raw),
            missing: false,
            retired: true,
        });
    }
    return rows;
};

/** `adminOfficialName` -> `Admin Official Name`, for retired answers only. */
export const humanizeFieldId = (id: string): string =>
    id
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (c) => c.toUpperCase());

/** Flat rows, for exports that do not care about page structure. */
export const toDisplayRows = (form: FormLike, answers: Answers): DisplayRow[] =>
    toDisplaySections(form, answers).flatMap((section) => section.rows);

/**
 * Column order for a CSV covering several template versions at once: locked
 * fields first (every application has them), then each version's own order,
 * with duplicates dropped.
 */
export const exportColumns = (forms: FormLike[]): string[] => {
    const columns: string[] = [];
    const push = (id: string) => {
        if (!columns.includes(id)) columns.push(id);
    };

    forms.forEach((form) =>
        form.pages.forEach((page) => page.fields.filter((f) => f.locked).forEach((f) => push(f.id)))
    );
    forms.forEach((form) => form.pages.forEach((page) => page.fields.forEach((f) => push(f.id))));

    return columns;
};

/** Key an application uses to find the form it was submitted under. */
export const versionKey = (templateId: string, version: number): string => `${templateId}@v${version}`;

/** Legacy applications carry no form reference; they fall back to the seed. */
export const needsSeedFallback = (application: {
    formTemplateId?: string;
    formVersion?: number;
    grantType?: GrantType;
}): boolean => !application.formTemplateId || !application.formVersion;
