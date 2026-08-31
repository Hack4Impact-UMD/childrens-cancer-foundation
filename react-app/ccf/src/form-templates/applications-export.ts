/**
 * Exporting applications once the questions are no longer fixed.
 *
 * A CSV with hardcoded columns quietly drops every question an admin adds —
 * and a question that cannot be exported may as well not have been asked. The
 * columns here are derived instead: the locked fields first, because every
 * application has them, then each form's own order, then anything an
 * application answered that no current form still asks.
 */

import { FormLike, isFieldVisible } from './engine';
import { NON_ANSWER_KEYS, exportColumns, humanizeFieldId } from './viewer';
import { Answers, FormField } from '../types/form-template-types';

export interface ExportColumn {
    fieldId: string;
    label: string;
}

const fieldsOf = (form: FormLike): FormField[] =>
    form.pages.flatMap((page) => page.fields || []);

/**
 * Columns for a set of applications: everything the given forms ask, plus any
 * answer the applications carry that no form mentions any more.
 */
export const buildExportColumns = (
    forms: FormLike[],
    applications: Answers[] = []
): ExportColumn[] => {
    const labels = new Map<string, string>();
    forms.forEach((form) => fieldsOf(form).forEach((f) => {
        if (!labels.has(f.id)) labels.set(f.id, f.label);
    }));

    const columns: ExportColumn[] = exportColumns(forms).map((fieldId) => ({
        fieldId,
        label: labels.get(fieldId) || humanizeFieldId(fieldId),
    }));

    const known = new Set(columns.map((c) => c.fieldId));
    applications.forEach((application) => {
        Object.keys(application || {}).forEach((key) => {
            if (known.has(key) || NON_ANSWER_KEYS.includes(key)) return;
            known.add(key);
            columns.push({ fieldId: key, label: humanizeFieldId(key) });
        });
    });

    return columns;
};

/** Spreadsheet-safe: quotes doubled, formula triggers defused. */
export const csvCell = (value: any): string => {
    if (value === null || value === undefined) return '""';

    let text: string;
    if (typeof value === 'boolean') text = value ? 'Yes' : 'No';
    else if (Array.isArray(value)) text = value.join('; ');
    else if (typeof value === 'object') text = String((value as any).name ?? JSON.stringify(value));
    else text = String(value);

    const escaped = text.replace(/"/g, '""');
    return `"${/^[=+\-@\t\r]/.test(escaped) ? `\t${escaped}` : escaped}"`;
};

export interface ExportOptions {
    /** Columns prepended to every row — cycle, decision, score and the like. */
    metadata?: ExportColumn[];
}

/** Every definition of a field across the supplied forms, keyed by field ID. */
const definitionsByFieldId = (forms: FormLike[]): Map<string, FormField[]> => {
    const map = new Map<string, FormField[]>();
    forms.forEach((form) => fieldsOf(form).forEach((field) => {
        const existing = map.get(field.id);
        if (existing) existing.push(field);
        else map.set(field.id, [field]);
    }));
    return map;
};

/**
 * True when this question was never actually put to this applicant, because
 * their own earlier answers hid it — the applicant who ticks "Continuation:
 * Yes", fills in the follow-up, then switches to "No".
 *
 * The viewer already drops those rows; without the same rule here the CSV
 * would report an answer the application's own detail page says was never
 * given. A field no form mentions at all is a different thing — a question
 * that has since been removed — and the export deliberately keeps those.
 */
const wasNotAsked = (
    definitions: Map<string, FormField[]>,
    fieldId: string,
    application: Answers
): boolean => {
    const defined = definitions.get(fieldId);
    // Judged across every version supplied, so an answer stays in the export
    // if any version of the form would have asked for it.
    return Boolean(defined?.length) && defined!.every((f) => !isFieldVisible(f, application));
};

/**
 * A CSV of applications and their answers. `forms` should include every
 * template version represented in the set, so no answer is left out of a
 * mixed export.
 */
export const applicationsToCsv = (
    applications: Answers[],
    forms: FormLike[],
    options: ExportOptions = {}
): string => {
    const metadata = options.metadata ?? [];
    const answers = buildExportColumns(forms, applications);
    const definitions = definitionsByFieldId(forms);

    const header = [...metadata, ...answers].map((c) => csvCell(c.label)).join(',');
    const rows = applications.map((application) => [
        // Metadata is about the application, not an answer, so it is never
        // subject to the form's own visibility rules.
        ...metadata.map((c) => csvCell(application?.[c.fieldId])),
        ...answers.map((c) => csvCell(
            wasNotAsked(definitions, c.fieldId, application) ? null : application?.[c.fieldId]
        )),
    ].join(','));

    return [header, ...rows].join('\n');
};

/** Hands the browser a file without leaving the page. */
export const downloadCsv = (filename: string, csv: string): void => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
