import {
    applicationsToCsv,
    buildExportColumns,
    csvCell,
} from './applications-export';
import { NONRESEARCH_SEED, RESEARCH_SEED } from './seed';
import { FormTemplate } from '../types/form-template-types';

const form = (): FormTemplate => ({
    id: 't', grantType: 'research', name: 'T', version: 1, status: 'published', isActive: true,
    pages: [
        { id: 'about', title: 'About', kind: 'about', fields: [] },
        {
            id: 'info', title: 'My Information', kind: 'fields', fields: [
                { id: 'otherStaff', type: 'text', label: 'Other Staff', required: false },
                { id: 'title', type: 'text', label: 'Title of Project', required: true, locked: true },
            ],
        },
    ],
});

describe('buildExportColumns', () => {
    test('locked fields lead, so every row starts with what every application has', () => {
        expect(buildExportColumns([form()]).map((c) => c.fieldId)).toEqual(['title', 'otherStaff']);
    });

    test('columns carry the label the form asks the question with', () => {
        expect(buildExportColumns([form()])[0]).toEqual({ fieldId: 'title', label: 'Title of Project' });
    });

    test('a question added in a later version still gets a column', () => {
        const v2 = form();
        v2.pages[1].fields.push({ id: 'custom_budget', type: 'text', label: 'Budget notes', required: false });

        const columns = buildExportColumns([form(), v2]).map((c) => c.fieldId);
        expect(columns).toContain('custom_budget');
        expect(columns.filter((c) => c === 'title')).toHaveLength(1);
    });

    test('an answer no current form asks for is still exported', () => {
        // The question was removed, but the applications that answered it are
        // still the record of what was asked at the time.
        const columns = buildExportColumns([form()], [{ title: 'A', einNumber: '12-3456789' }]);
        expect(columns).toContainEqual({ fieldId: 'einNumber', label: 'Ein Number' });
    });

    test('server-managed keys never become columns', () => {
        const columns = buildExportColumns([form()], [{
            title: 'A', status: 'submitted', decision: 'accepted', creatorId: 'uid',
            submitTime: 'now', averageScore: 2.1, formVersion: 1,
        }]);
        expect(columns.map((c) => c.fieldId)).toEqual(['title', 'otherStaff']);
    });

    test('the real seeded forms export without losing a field', () => {
        const columns = buildExportColumns([RESEARCH_SEED, NONRESEARCH_SEED]).map((c) => c.fieldId);
        ['title', 'principalInvestigator', 'requestor', 'amountRequested', 'signaturePIAgreed', 'explanation']
            .forEach((id) => expect(columns).toContain(id));
    });
});

describe('csvCell', () => {
    test('quotes are doubled so a comma or quote cannot break the row', () => {
        expect(csvCell('A "quoted", comma')).toBe('"A ""quoted"", comma"');
    });

    test('a formula trigger is defused rather than executed by a spreadsheet', () => {
        expect(csvCell('=SUM(A1:A9)')).toBe('"\t=SUM(A1:A9)"');
        expect(csvCell('+1 555 0100')).toBe('"\t+1 555 0100"');
        expect(csvCell('@handle')).toBe('"\t@handle"');
    });

    test('booleans read as answers, not as true and false', () => {
        expect(csvCell(true)).toBe('"Yes"');
        expect(csvCell(false)).toBe('"No"');
    });

    test('a missing answer is an empty cell, never "undefined"', () => {
        expect(csvCell(undefined)).toBe('""');
        expect(csvCell(null)).toBe('""');
    });

    test('a stored file shows its name', () => {
        expect(csvCell({ name: 'proposal.pdf' })).toBe('"proposal.pdf"');
    });

    test('multi-select answers are joined readably', () => {
        expect(csvCell(['A', 'B'])).toBe('"A; B"');
    });
});

describe('applicationsToCsv', () => {
    const applications = [
        { title: 'First study', otherStaff: 'Dr Roe', status: 'submitted' },
        { title: 'Second study' },
    ];

    test('a header row and one row per application', () => {
        const lines = applicationsToCsv(applications, [form()]).split('\n');
        expect(lines).toHaveLength(3);
        expect(lines[0]).toBe('"Title of Project","Other Staff"');
        expect(lines[1]).toBe('"First study","Dr Roe"');
        expect(lines[2]).toBe('"Second study",""');
    });

    test('metadata columns come first, before any answer', () => {
        const csv = applicationsToCsv(
            [{ title: 'A', decision: 'accepted' }],
            [form()],
            { metadata: [{ fieldId: 'decision', label: 'Decision' }] }
        );
        expect(csv.split('\n')[0]).toBe('"Decision","Title of Project","Other Staff"');
        expect(csv.split('\n')[1]).toBe('"accepted","A",""');
    });

    test('an application answering a retired question keeps its answer in the file', () => {
        const csv = applicationsToCsv([{ title: 'A', einNumber: '12-3456789' }], [form()]);
        expect(csv.split('\n')[0]).toContain('"Ein Number"');
        expect(csv.split('\n')[1]).toContain('"12-3456789"');
    });

    test('an empty set still produces a usable header', () => {
        expect(applicationsToCsv([], [form()])).toBe('"Title of Project","Other Staff"');
    });

    test('every row has the same number of cells as the header', () => {
        const lines = applicationsToCsv(
            [{ title: 'A' }, { title: 'B', custom_extra: 'x' }],
            [form()]
        ).split('\n');
        const width = lines[0].split('","').length;
        lines.forEach((line) => expect(line.split('","').length).toBe(width));
    });
});

describe('answers to questions the applicant was never actually asked', () => {
    const conditional = (): any => ({
        pages: [{
            id: 'p', title: 'P', kind: 'fields', fields: [
                { id: 'continuation', type: 'radio', label: 'Continuation', required: false, options: ['Yes', 'No'] },
                {
                    id: 'continuationYears', type: 'number', label: 'Years', required: false,
                    showWhen: { all: [{ field: 'continuation', equals: 'Yes' }] },
                },
            ],
        }],
    });

    test('are left out, the same way the application view leaves them out', () => {
        // Answered "Yes", filled the follow-up, then switched to "No".
        const csv = applicationsToCsv([{ continuation: 'No', continuationYears: '3' }], [conditional()]);

        expect(csv.split('\n')[0]).toBe('"Continuation","Years"');
        expect(csv.split('\n')[1]).toBe('"No",""');
    });

    test('are kept when the answer that reveals them still stands', () => {
        const csv = applicationsToCsv([{ continuation: 'Yes', continuationYears: '3' }], [conditional()]);
        expect(csv.split('\n')[1]).toBe('"Yes","3"');
    });

    test('the column survives for the applicants who did answer it', () => {
        const csv = applicationsToCsv(
            [{ continuation: 'No', continuationYears: '3' }, { continuation: 'Yes', continuationYears: '2' }],
            [conditional()]
        );
        expect(csv.split('\n')[1]).toBe('"No",""');
        expect(csv.split('\n')[2]).toBe('"Yes","2"');
    });

    test('an answer no form mentions is still kept — removed is not the same as unasked', () => {
        const csv = applicationsToCsv([{ continuation: 'No', custom_gone: 'kept' }], [conditional()]);
        expect(csv.split('\n')[0]).toContain('"Custom gone"');
        expect(csv.split('\n')[1]).toContain('"kept"');
    });

    test('metadata is never subject to the form\'s visibility rules', () => {
        const csv = applicationsToCsv(
            [{ continuation: 'No', continuationYears: '3', decision: 'accepted' }],
            [conditional()],
            { metadata: [{ fieldId: 'decision', label: 'Decision' }] }
        );
        expect(csv.split('\n')[1]).toBe('"accepted","No",""');
    });
});

describe('judging an answer by the version it was submitted under', () => {
    // v1 asked "Continuation years" of everyone; v2 only asks it of applicants
    // who said Continuation: Yes.
    const v1 = {
        templateId: 'seed-research', version: 1, grantType: 'research' as const,
        name: 'Research', publishedAt: 'x', publishedBy: 'a@b.org',
        pages: [{
            id: 'q', title: 'Questions', kind: 'fields' as const, fields: [
                { id: 'continuation', type: 'radio' as const, label: 'Continuation', required: false, options: ['Yes', 'No'] },
                { id: 'continuationYears', type: 'text' as const, label: 'Continuation years', required: false },
            ],
        }],
    };
    const v2 = {
        ...v1,
        version: 2,
        pages: [{
            ...v1.pages[0],
            fields: [
                v1.pages[0].fields[0],
                {
                    ...v1.pages[0].fields[1],
                    showWhen: { all: [{ field: 'continuation', equals: 'Yes' }] },
                },
            ],
        }],
    };

    const onV1 = {
        formTemplateId: 'seed-research', formVersion: 1,
        continuation: 'No', continuationYears: '3',
    };
    const onV2 = {
        formTemplateId: 'seed-research', formVersion: 2,
        continuation: 'No', continuationYears: '3',
    };

    test('a condition added later does not erase an older answer', () => {
        const csv = applicationsToCsv([onV1], [v1, v2]);
        // v1 asked it unconditionally, so the answer is real and is kept —
        // even though v2 would have hidden it for this applicant.
        expect(csv.split('\n')[1]).toContain('"3"');
    });

    test('an answer hidden by the submitted version is still blanked', () => {
        const csv = applicationsToCsv([onV2], [v1, v2]);
        // v2 only asks it when Continuation is Yes, and this applicant said No.
        expect(csv.split('\n')[1]).not.toContain('"3"');
    });

    test('both applications export side by side, each judged by its own form', () => {
        const rows = applicationsToCsv([onV1, onV2], [v1, v2]).split('\n');
        expect(rows[1]).toContain('"3"');
        expect(rows[2]).not.toContain('"3"');
    });

    test('an application predating the builder falls back to any version asking', () => {
        const legacy = { continuation: 'No', continuationYears: '3' };
        // No reference to resolve, so the looser rule applies and v1 keeps it.
        expect(applicationsToCsv([legacy], [v1, v2]).split('\n')[1]).toContain('"3"');
    });

    test('an answer no supplied version mentions is kept as a retired one', () => {
        const withRetired = { ...onV2, oldQuestion: 'kept' };
        expect(applicationsToCsv([withRetired], [v1, v2]).split('\n')[1]).toContain('"kept"');
    });
});
