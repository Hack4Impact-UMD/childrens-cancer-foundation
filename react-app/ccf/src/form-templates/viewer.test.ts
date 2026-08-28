import {
    RETIRED_SECTION_TITLE,
    exportColumns,
    humanizeFieldId,
    needsSeedFallback,
    toDisplayRows,
    toDisplaySections,
    versionKey,
} from './viewer';
import { NONRESEARCH_SEED, RESEARCH_SEED } from './seed';
import { FormTemplate } from '../types/form-template-types';

const form = (): FormTemplate => ({
    id: 't', grantType: 'research', name: 'T', version: 1, status: 'published', isActive: true,
    pages: [
        { id: 'about', title: 'About Grant', kind: 'about', fields: [] },
        {
            id: 'info', title: 'My Information', kind: 'fields', fields: [
                { id: 'title', type: 'text', label: 'Title of Project', required: true, locked: true },
                { id: 'otherStaff', type: 'text', label: 'Other Staff Name/Title', required: false },
            ],
        },
        {
            id: 'questions', title: 'Application Questions', kind: 'fields', fields: [
                { id: 'continuation', type: 'radio', label: 'Continuation', required: false, options: ['Yes', 'No'] },
                {
                    id: 'continuationYears', type: 'text', label: 'Years of current funding', required: false,
                    showWhen: { all: [{ field: 'continuation', equals: 'Yes' }] },
                },
                { id: 'signaturePIAgreed', type: 'checkbox', label: 'Signature — Principal Investigator I Agree', required: true },
            ],
        },
        { id: 'review', title: 'Review', kind: 'review', fields: [] },
    ],
});

describe('toDisplaySections', () => {
    test('sections follow template order and skip the bookend pages', () => {
        const sections = toDisplaySections(form(), { title: 'A study' });
        expect(sections.map((s) => s.title)).toEqual(['My Information', 'Application Questions']);
    });

    test('an unanswered field reads as N/A rather than vanishing', () => {
        const rows = toDisplaySections(form(), { title: 'A study' })[0].rows;
        expect(rows).toEqual([
            { fieldId: 'title', label: 'Title of Project', value: 'A study', missing: false, width: undefined },
            { fieldId: 'otherStaff', label: 'Other Staff Name/Title', value: 'N/A', missing: true, width: undefined },
        ]);
    });

    test('hideEmpty drops unanswered rows for the compact view', () => {
        const rows = toDisplaySections(form(), { title: 'A study' }, { hideEmpty: true })[0].rows;
        expect(rows.map((r) => r.fieldId)).toEqual(['title']);
    });

    test('an attestation reads as Yes or No, never true or false', () => {
        const answered = toDisplaySections(form(), { signaturePIAgreed: true });
        const declined = toDisplaySections(form(), { signaturePIAgreed: false });
        expect(answered[1].rows.find((r) => r.fieldId === 'signaturePIAgreed')!.value).toBe('Yes');
        expect(declined[1].rows.find((r) => r.fieldId === 'signaturePIAgreed')!.value).toBe('No');
    });

    test('an unchecked box reads as No but still counts as unanswered', () => {
        // Display and validation must agree: "No" on screen, missing at submit.
        const row = toDisplaySections(form(), { signaturePIAgreed: false })[1]
            .rows.find((r) => r.fieldId === 'signaturePIAgreed')!;
        expect(row).toMatchObject({ value: 'No', missing: true });
        expect(toDisplaySections(form(), { signaturePIAgreed: false }, { hideEmpty: true })
            .some((s) => s.rows.some((r) => r.fieldId === 'signaturePIAgreed'))).toBe(false);
    });

    test('a field the applicant never saw is not part of what they submitted', () => {
        const hidden = toDisplaySections(form(), { continuation: 'No', continuationYears: '2024' });
        const ids = hidden[1].rows.map((r) => r.fieldId);
        expect(ids).not.toContain('continuationYears');
    });

    test('the same field appears once its condition is met', () => {
        const shown = toDisplaySections(form(), { continuation: 'Yes', continuationYears: '2024' });
        const row = shown[1].rows.find((r) => r.fieldId === 'continuationYears')!;
        expect(row.value).toBe('2024');
    });

    test('an answer whose question was removed is still shown, under its own heading', () => {
        const sections = toDisplaySections(form(), { title: 'A study', einNumber: '12-3456789' });
        const retired = sections[sections.length - 1];
        expect(retired.title).toBe(RETIRED_SECTION_TITLE);
        expect(retired.rows).toEqual([
            { fieldId: 'einNumber', label: 'Ein Number', value: '12-3456789', missing: false, retired: true },
        ]);
    });

    test('retired answers can be suppressed for compact views', () => {
        const sections = toDisplaySections(
            form(), { title: 'A study', einNumber: '12-3456789' }, { includeRetired: false }
        );
        expect(sections.map((s) => s.title)).not.toContain(RETIRED_SECTION_TITLE);
    });

    test('server-managed keys are never mistaken for retired questions', () => {
        const sections = toDisplaySections(form(), {
            title: 'A study',
            status: 'submitted', decision: 'accepted', creatorId: 'uid-1',
            applicationCycle: '2027', submitTime: 'now', formTemplateId: 't', formVersion: 1,
            averageScore: 2.1, assignedReviewers: ['a', 'b'],
        });
        expect(sections.map((s) => s.title)).not.toContain(RETIRED_SECTION_TITLE);
        const ids = sections.flatMap((s) => s.rows.map((r) => r.fieldId));
        ['status', 'decision', 'creatorId', 'submitTime', 'formVersion', 'averageScore', 'assignedReviewers']
            .forEach((key) => expect(ids).not.toContain(key));
    });

    test('an empty retired answer is not resurrected as a row', () => {
        const sections = toDisplaySections(form(), { title: 'A', removedThing: '', otherRemoved: false });
        expect(sections.map((s) => s.title)).not.toContain(RETIRED_SECTION_TITLE);
    });

    test('a stored file reference shows its name', () => {
        const sections = toDisplaySections(form(), { title: 'A', file: { name: 'proposal.pdf' } });
        const retired = sections[sections.length - 1];
        expect(retired.rows[0].value).toBe('proposal.pdf');
    });

    test('a page whose rows are all empty is dropped in compact mode', () => {
        const sections = toDisplaySections(form(), { title: 'A' }, { hideEmpty: true });
        expect(sections.map((s) => s.title)).toEqual(['My Information']);
    });

    test('an application with no answers at all still renders', () => {
        expect(() => toDisplaySections(form(), {})).not.toThrow();
        expect(toDisplaySections(form(), {})[0].rows.every((r) => r.missing)).toBe(true);
    });

    test('real seeded templates render a real answer set', () => {
        const sections = toDisplaySections(RESEARCH_SEED, {
            title: 'A study', principalInvestigator: 'Dr Doe', institution: 'JHU',
            signaturePI: 'Jane Doe', signaturePIAgreed: true,
        });
        expect(sections.map((s) => s.title))
            .toEqual(['My Information', 'Application Questions', 'Grant Proposal']);
        expect(sections[0].rows[0]).toMatchObject({ label: 'Title of Project', value: 'A study' });
    });
});

describe('toDisplayRows', () => {
    test('flattens every section in order', () => {
        const rows = toDisplayRows(form(), { title: 'A', continuation: 'Yes', continuationYears: '2024' });
        expect(rows.map((r) => r.fieldId))
            .toEqual(['title', 'otherStaff', 'continuation', 'continuationYears', 'signaturePIAgreed']);
    });
});

describe('exportColumns', () => {
    test('locked fields lead, then template order, without duplicates', () => {
        const columns = exportColumns([form()]);
        expect(columns[0]).toBe('title');
        expect(columns).toEqual(['title', 'otherStaff', 'continuation', 'continuationYears', 'signaturePIAgreed']);
    });

    test('columns union across versions so no answer is left out of the CSV', () => {
        const v1 = form();
        const v2 = form();
        v2.pages[1].fields.push({ id: 'newQuestion', type: 'text', label: 'New Question', required: false });

        const columns = exportColumns([v1, v2]);
        expect(columns).toContain('newQuestion');
        expect(columns.filter((c) => c === 'title')).toHaveLength(1);
    });

    test('locked fields from every version come first', () => {
        const columns = exportColumns([NONRESEARCH_SEED, RESEARCH_SEED]);
        const firstUnlocked = columns.findIndex((id) => id === 'explanation');
        const lastLocked = columns.findIndex((id) => id === 'file');
        expect(lastLocked).toBeLessThan(firstUnlocked);
    });
});

describe('helpers', () => {
    test('humanizeFieldId is only a last resort for retired answers', () => {
        expect(humanizeFieldId('adminOfficialName')).toBe('Admin Official Name');
        expect(humanizeFieldId('einNumber')).toBe('Ein Number');
        expect(humanizeFieldId('custom_2027_budget')).toBe('Custom 2027 budget');
    });

    test('versionKey identifies a version uniquely', () => {
        expect(versionKey('tpl-1', 3)).toBe('tpl-1@v3');
    });

    test('applications predating the template system fall back to the seed', () => {
        expect(needsSeedFallback({ grantType: 'research' })).toBe(true);
        expect(needsSeedFallback({ formTemplateId: 't', grantType: 'research' })).toBe(true);
        expect(needsSeedFallback({ formTemplateId: 't', formVersion: 1 })).toBe(false);
    });
});
