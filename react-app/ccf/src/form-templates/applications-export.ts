/**
 * Exporting applications once the questions are no longer fixed.
 *
 * A CSV with hardcoded columns quietly drops every question an admin adds —
 * and a question that cannot be exported may as well not have been asked. The
 * columns here are derived instead: the locked fields first, because every
 * application has them, then each form's own order, then anything an
 * application answered that no current form still asks.
 */

import { FormLike } from './engine';
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
    const columns = [...(options.metadata ?? []), ...buildExportColumns(forms, applications)];

    const header = columns.map((c) => csvCell(c.label)).join(',');
    const rows = applications.map((application) =>
        columns.map((c) => csvCell(application?.[c.fieldId])).join(',')
    );

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
