import {
    VALIDATION_PRESETS,
    addField,
    addPage,
    buildCondition,
    availableConditionSources,
    availablePageConditionSources,
    conditionSources,
    deleteField,
    deletePage,
    describeCondition,
    editablePages,
    findPreset,
    firstBackwardsDependency,
    generateFieldId,
    generatePageId,
    moveField,
    moveFieldToPage,
    movePage,
    operatorsFor,
    renamePage,
    setFieldCondition,
    testPattern,
    updateField,
    validationForType,
    validationKindFor,
    whyCannotChangeField,
    whyCannotDeleteField,
    whyCannotDeletePage,
    whyCannotMoveField,
    whyCannotMovePage,
} from './builder-operations';
import { validateAnswers, validateTemplate } from './engine';
import { RESEARCH_SEED } from './seed';
import { FormField, FormTemplate } from '../types/form-template-types';

const f = (over: Partial<FormField> & { id: string }): FormField => ({
    type: 'text', label: over.id, required: false, ...over,
});

const base = (): FormTemplate => ({
    id: 't', grantType: 'research', name: 'T', version: 1, status: 'draft', isActive: false,
    pages: [
        { id: 'about-grant', title: 'About Grant', kind: 'about', fields: [] },
        {
            id: 'info', title: 'My Information', kind: 'fields', fields: [
                f({ id: 'title', label: 'Title of Project', required: true, locked: true }),
                f({ id: 'otherStaff', label: 'Other Staff' }),
            ],
        },
        {
            id: 'questions', title: 'Application Questions', kind: 'fields', fields: [
                f({ id: 'continuation', label: 'Continuation', type: 'radio', options: ['Yes', 'No'] }),
                f({ id: 'einNumber', label: 'EIN #' }),
            ],
        },
        { id: 'review', title: 'Review', kind: 'review', fields: [] },
    ],
});

const ids = (t: FormTemplate, pageId: string) =>
    t.pages.find((p) => p.id === pageId)!.fields.map((x) => x.id);

describe('generated IDs', () => {
    test('a question ID is slugged from its label and marked as admin-made', () => {
        expect(generateFieldId('Budget notes for 2027', [])).toBe('custom_budget_notes_for_2027');
    });

    test('an ID is never reused, even for the same label', () => {
        const taken = ['custom_budget', 'custom_budget_2'];
        expect(generateFieldId('Budget', taken)).toBe('custom_budget_3');
    });

    test('a label with no usable characters still produces an ID', () => {
        expect(generateFieldId('???', [])).toBe('custom_question');
    });

    test('page IDs follow the same rules', () => {
        expect(generatePageId('Budget Detail', [])).toBe('budget-detail');
        expect(generatePageId('Budget Detail', ['budget-detail'])).toBe('budget-detail-2');
    });
});

describe('pages', () => {
    test('a new page lands before Review, never after it', () => {
        const next = addPage(base(), 'Budget');
        expect(next.pages.map((p) => p.id)).toEqual(['about-grant', 'info', 'questions', 'budget', 'review']);
    });

    test('a page can be placed after a named page', () => {
        const next = addPage(base(), 'Budget', 'info');
        expect(next.pages.map((p) => p.id)).toEqual(['about-grant', 'info', 'budget', 'questions', 'review']);
    });

    test('adding a page leaves the original untouched', () => {
        const template = base();
        addPage(template, 'Budget');
        expect(template.pages).toHaveLength(4);
    });

    test('renaming a page keeps its ID, and so its identity', () => {
        const next = renamePage(base(), 'questions', 'Cover Sheet Questions');
        expect(next.pages.find((p) => p.id === 'questions')!.title).toBe('Cover Sheet Questions');
    });

    test('editablePages excludes the generated bookends', () => {
        expect(editablePages(base()).map((p) => p.id)).toEqual(['info', 'questions']);
    });

    describe('deleting', () => {
        test('a page holding a locked question is refused, with the reason', () => {
            expect(whyCannotDeletePage(base(), 'info'))
                .toBe('"Title of Project" is used elsewhere in the app — move it to another page first');
            expect(() => deletePage(base(), 'info')).toThrow(/used elsewhere in the app/);
        });

        test('the About Grant and Review pages cannot be deleted', () => {
            expect(whyCannotDeletePage(base(), 'about-grant'))
                .toBe('The About Grant and Review pages are part of every form');
            expect(whyCannotDeletePage(base(), 'review')).toBeTruthy();
        });

        test('a page with no locked questions can go', () => {
            expect(whyCannotDeletePage(base(), 'questions')).toBeNull();
            expect(deletePage(base(), 'questions').pages.map((p) => p.id))
                .toEqual(['about-grant', 'info', 'review']);
        });

        test('the last page of questions cannot be deleted', () => {
            const oneLeft = deletePage(base(), 'questions');
            const withoutLock = updateField(oneLeft, 'title', { locked: false } as any);
            expect(whyCannotDeletePage(withoutLock, 'info')).toBe('A form needs at least one page of questions');
        });

        test('a page another question depends on cannot be deleted', () => {
            let t = base();
            t = addField(t, 'info', { label: 'Follow up', type: 'text' });
            t = setFieldCondition(t, 'custom_follow_up', { all: [{ field: 'otherStaff', answered: true }] });
            // otherStaff lives on 'info' with the follow-up, so target the other page instead.
            let t2 = base();
            t2 = addField(t2, 'questions', { label: 'Later question', type: 'text' });
            t2 = setFieldCondition(t2, 'custom_later_question', { all: [{ field: 'otherStaff', answered: true }] });
            const withoutLock = { ...t2, pages: t2.pages.map((p) => ({ ...p, fields: p.fields.map((x) => ({ ...x, locked: false })) })) };
            expect(whyCannotDeletePage(withoutLock, 'info'))
                .toBe('"Later question" is shown based on a question on this page');
        });
    });

    describe('moving', () => {
        test('a page moves within the editable range', () => {
            const next = movePage(base(), 'questions', -1);
            expect(next.pages.map((p) => p.id)).toEqual(['about-grant', 'questions', 'info', 'review']);
        });

        test('a page cannot move past About Grant or Review', () => {
            expect(whyCannotMovePage(base(), 'info', -1)).toBe('Already as far as it goes');
            expect(whyCannotMovePage(base(), 'questions', 1)).toBe('Already as far as it goes');
        });

        test('the bookend pages cannot be moved at all', () => {
            expect(whyCannotMovePage(base(), 'about-grant', 1))
                .toBe('The About Grant and Review pages stay where they are');
        });

        test('a move that would put a question after its trigger is refused', () => {
            let t = base();
            t = addField(t, 'questions', { label: 'Follow up', type: 'text' });
            t = setFieldCondition(t, 'custom_follow_up', { all: [{ field: 'otherStaff', equals: 'x' }] });

            // 'otherStaff' is on the earlier page; swapping the pages would
            // leave the follow-up asking before its trigger.
            expect(whyCannotMovePage(t, 'questions', -1))
                .toBe('"Follow up" is shown based on a question that would come after it');
            expect(() => movePage(t, 'questions', -1)).toThrow(/would come after it/);
        });
    });
});

describe('fields', () => {
    test('a question is added to the named page with a generated ID', () => {
        const next = addField(base(), 'questions', { label: 'Budget notes', type: 'textarea' });
        expect(ids(next, 'questions')).toEqual(['continuation', 'einNumber', 'custom_budget_notes']);
        expect(next.pages[2].fields[2]).toMatchObject({ type: 'textarea', label: 'Budget notes', required: false });
    });

    test('a choice question starts with usable options', () => {
        const next = addField(base(), 'questions', { label: 'Approved?', type: 'radio' });
        expect(next.pages[2].fields[2].options).toEqual(['Yes', 'No']);
    });

    test('questions cannot be added to About Grant or Review', () => {
        expect(() => addField(base(), 'review', { label: 'Sneaky', type: 'text' }))
            .toThrow('Questions cannot be added to that page');
    });

    test('a label edit keeps the ID, so existing answers still match', () => {
        const next = updateField(base(), 'einNumber', { label: 'Employer Identification Number' });
        expect(next.pages[2].fields[1]).toMatchObject({ id: 'einNumber', label: 'Employer Identification Number' });
    });

    test('an attempt to change an ID is refused', () => {
        expect(() => updateField(base(), 'einNumber', { id: 'somethingElse' } as any))
            .toThrow('Question IDs are permanent');
    });

    test('an unsafe pattern is refused at the point of editing', () => {
        expect(() => updateField(base(), 'einNumber', { validation: { pattern: '(a+)+$' } }))
            .toThrow(/nested repetition/);
    });

    describe('locked fields', () => {
        test('may be reworded', () => {
            expect(whyCannotChangeField(f({ id: 'title', label: 'Title', locked: true }), { label: 'Project Title' }))
                .toBeNull();
            expect(updateField(base(), 'title', { label: 'Project Title' }).pages[1].fields[0].label)
                .toBe('Project Title');
        });

        test('may not be made optional', () => {
            expect(() => updateField(base(), 'title', { required: false }))
                .toThrow('"Title of Project" is used elsewhere in the app and must stay required');
        });

        test('may not be given a condition', () => {
            expect(() => setFieldCondition(base(), 'title', { all: [{ field: 'otherStaff', answered: true }] }))
                .toThrow('used elsewhere in the app and cannot be shown conditionally');
        });

        test('may not change answer format', () => {
            expect(() => updateField(base(), 'title', { type: 'number' }))
                .toThrow('so its answer format cannot change');
        });

        test('may not be deleted', () => {
            expect(whyCannotDeleteField(base(), 'title'))
                .toBe('"Title of Project" is used elsewhere in the app and cannot be removed');
            expect(() => deleteField(base(), 'title')).toThrow(/cannot be removed/);
        });
    });

    describe('deleting', () => {
        test('an ordinary question can go', () => {
            expect(whyCannotDeleteField(base(), 'einNumber')).toBeNull();
            expect(ids(deleteField(base(), 'einNumber'), 'questions')).toEqual(['continuation']);
        });

        test('a question another question depends on cannot go', () => {
            let t = addField(base(), 'questions', { label: 'Years', type: 'text' });
            t = setFieldCondition(t, 'custom_years', { all: [{ field: 'continuation', equals: 'Yes' }] });
            expect(whyCannotDeleteField(t, 'continuation')).toBe('"Years" is shown based on this question');
        });

        test('a question a page depends on cannot go', () => {
            const t = base();
            t.pages[2].showWhen = { all: [{ field: 'otherStaff', answered: true }] };
            expect(whyCannotDeleteField(t, 'otherStaff'))
                .toBe('The page "Application Questions" is shown based on this question');
        });
    });

    describe('moving', () => {
        test('a question moves within its page', () => {
            expect(ids(moveField(base(), 'einNumber', -1), 'questions')).toEqual(['einNumber', 'continuation']);
        });

        test('the ends of a page are the ends', () => {
            expect(whyCannotMoveField(base(), 'continuation', -1)).toBe('Already as far as it goes');
            expect(whyCannotMoveField(base(), 'einNumber', 1)).toBe('Already as far as it goes');
        });

        test('a move that would break a dependency is refused', () => {
            let t = addField(base(), 'questions', { label: 'Years', type: 'text' });
            t = setFieldCondition(t, 'custom_years', { all: [{ field: 'einNumber', equals: 'x' }] });
            expect(whyCannotMoveField(t, 'custom_years', -1))
                .toBe('"Years" is shown based on a question that would come after it');
        });

        test('a question keeps its ID when moved to another page', () => {
            const next = moveFieldToPage(base(), 'einNumber', 'info');
            expect(ids(next, 'info')).toEqual(['title', 'otherStaff', 'einNumber']);
            expect(ids(next, 'questions')).toEqual(['continuation']);
        });

        test('moving a question ahead of its trigger is refused', () => {
            let t = addField(base(), 'questions', { label: 'Years', type: 'text' });
            t = setFieldCondition(t, 'custom_years', { all: [{ field: 'continuation', equals: 'Yes' }] });
            expect(() => moveFieldToPage(t, 'custom_years', 'info')).toThrow(/would come after it/);
        });
    });
});

describe('conditional logic', () => {
    test('only earlier questions are offered as a trigger', () => {
        expect(availableConditionSources(base(), 'einNumber').map((x) => x.id))
            .toEqual(['title', 'otherStaff', 'continuation']);
        expect(availableConditionSources(base(), 'title')).toEqual([]);
    });

    test('a page may be triggered by any question on an earlier page', () => {
        expect(availablePageConditionSources(base(), 'questions').map((x) => x.id))
            .toEqual(['title', 'otherStaff']);
    });

    test('a condition on an earlier question is accepted', () => {
        const next = setFieldCondition(base(), 'einNumber', { all: [{ field: 'continuation', equals: 'Yes' }] });
        expect(next.pages[2].fields[1].showWhen).toEqual({ all: [{ field: 'continuation', equals: 'Yes' }] });
        expect(validateTemplate(next)).toEqual([]);
    });

    test('a condition on a later question is refused', () => {
        expect(() => setFieldCondition(base(), 'continuation', { all: [{ field: 'einNumber', equals: 'x' }] }))
            .toThrow('"Continuation" can only be shown based on a question that comes before it');
    });

    test('a self-referencing condition is refused', () => {
        expect(() => setFieldCondition(base(), 'einNumber', { all: [{ field: 'einNumber', equals: 'x' }] }))
            .toThrow('cannot depend on its own answer');
    });

    test('a condition can be cleared', () => {
        const withRule = setFieldCondition(base(), 'einNumber', { all: [{ field: 'continuation', equals: 'Yes' }] });
        expect(setFieldCondition(withRule, 'einNumber', undefined).pages[2].fields[1].showWhen).toBeUndefined();
    });

    test('conditionSources reads both all and any', () => {
        expect(conditionSources({ all: [{ field: 'a', equals: '1' }], any: [{ field: 'b', equals: '2' }] }))
            .toEqual(['a', 'b']);
        expect(conditionSources(undefined)).toEqual([]);
    });

    test('a sound template has no backwards dependency', () => {
        expect(firstBackwardsDependency(base())).toBeNull();
    });

    test('conditions read back in plain English for the editor', () => {
        expect(describeCondition({ field: 'c', equals: 'Yes' }, 'Continuation')).toBe('Continuation is "Yes"');
        expect(describeCondition({ field: 'c', answered: true }, 'Continuation')).toBe('Continuation is answered');
        expect(describeCondition({ field: 'c', oneOf: ['A', 'B'] }, 'Continuation')).toBe('Continuation is one of A, B');
        expect(describeCondition({ field: 'c', greaterThan: 10 }, 'Amount')).toBe('Amount is more than 10');
        expect(describeCondition({ field: 'c' }, 'Amount')).toBe('Amount — no rule set');
    });
});

describe('validation presets', () => {
    test('every preset is safe and usable', () => {
        VALIDATION_PRESETS.filter((p) => p.validation.pattern).forEach((preset) => {
            expect(testPattern(preset.validation.pattern!, '').ok).toBeDefined();
        });
    });

    test('the EIN preset accepts the real format and rejects the rest', () => {
        const ein = VALIDATION_PRESETS.find((p) => p.id === 'ein')!.validation.pattern!;
        expect(testPattern(ein, '12-3456789')).toEqual({ ok: true, message: '"12-3456789" is accepted' });
        expect(testPattern(ein, '123456789').ok).toBe(false);
    });

    test('the whole-dollars preset accepts formatted amounts', () => {
        const dollars = VALIDATION_PRESETS.find((p) => p.id === 'wholeDollars')!.validation.pattern!;
        expect(testPattern(dollars, '$75,000').ok).toBe(true);
        expect(testPattern(dollars, '75000').ok).toBe(true);
        expect(testPattern(dollars, '75.5').ok).toBe(false);
    });

    test('a hostile pattern fails the test box rather than being saved', () => {
        expect(testPattern('(a+)+$', 'aaaa')).toEqual({
            ok: false, message: 'Pattern has nested repetition, which can hang on long answers',
        });
    });

    test('an invalid pattern is reported, not thrown', () => {
        expect(testPattern('([', 'x').ok).toBe(false);
    });

    test('a saved pattern maps back to its preset for the editor', () => {
        const ein = VALIDATION_PRESETS.find((p) => p.id === 'ein')!;
        expect(findPreset(ein.validation)!.id).toBe('ein');
        expect(findPreset({ pattern: '^custom$' })).toBeUndefined();
    });
});

describe('operating on the real seeded form', () => {
    test('a sequence of realistic edits leaves a valid template', () => {
        let t: FormTemplate = JSON.parse(JSON.stringify(RESEARCH_SEED));

        t = updateField(t, 'einNumber', { label: 'Employer Identification Number (EIN)' });
        t = deleteField(t, 'otherStaff');
        t = addPage(t, 'Budget Detail');
        t = addField(t, 'budget-detail', { label: 'Equipment over $5,000', type: 'radio', required: true });
        t = setFieldCondition(t, 'custom_equipment_over_5_000', {
            all: [{ field: 'continuation', equals: 'Yes' }],
        });
        t = updateField(t, 'custom_equipment_over_5_000', {
            validation: { pattern: '^(Yes|No)$', patternMessage: 'Choose Yes or No' },
        });

        expect(validateTemplate(t)).toEqual([]);
        expect(t.pages.map((p) => p.id))
            .toEqual(['about-grant', 'my-information', 'application-questions', 'grant-proposal', 'budget-detail', 'review']);
    });

    test('the locked fields of the real form resist every destructive edit', () => {
        ['title', 'principalInvestigator', 'amountRequested', 'file'].forEach((id) => {
            expect(whyCannotDeleteField(RESEARCH_SEED, id)).toMatch(/cannot be removed/);
            expect(() => updateField(RESEARCH_SEED, id, { required: false })).toThrow(/must stay required/);
        });
    });

    test('editing never mutates the seed the app falls back to', () => {
        const before = JSON.stringify(RESEARCH_SEED);
        updateField(RESEARCH_SEED, 'einNumber', { label: 'Changed' });
        addPage(RESEARCH_SEED, 'Another');
        expect(JSON.stringify(RESEARCH_SEED)).toBe(before);
    });
});

describe('regressions', () => {
    test('a deleted question never hands its ID to a new one', () => {
        // Applications submitted under an earlier version are still keyed by
        // the old ID; reuse would file that answer under different wording.
        let t = addField(base(), 'questions', { label: 'Budget', type: 'text' });
        expect(ids(t, 'questions')).toContain('custom_budget');

        t = deleteField(t, 'custom_budget');
        expect(t.retiredFieldIds).toContain('custom_budget');

        t = addField(t, 'questions', { label: 'Budget', type: 'text' });
        expect(ids(t, 'questions')).toContain('custom_budget_2');
        expect(ids(t, 'questions')).not.toContain('custom_budget');
    });

    test('deleting a page retires every ID it held', () => {
        let t = addPage(base(), 'Scratch');
        t = addField(t, 'scratch', { label: 'Budget', type: 'text' });
        t = deletePage(t, 'scratch');

        expect(t.retiredFieldIds).toContain('custom_budget');
        t = addField(t, 'questions', { label: 'Budget', type: 'text' });
        expect(ids(t, 'questions')).toContain('custom_budget_2');
    });

    test('a page cannot be deleted while another page is shown based on it', () => {
        // The trigger sits on a page of its own, so only the page-level
        // dependency stands between it and deletion.
        let t = addPage(base(), 'Trigger');
        t = addField(t, 'trigger', { label: 'Needs budget', type: 'radio' });
        t = { ...t, pages: t.pages.map((p) => (
            p.id === 'questions'
                ? { ...p, showWhen: { all: [{ field: 'custom_needs_budget', equals: 'Yes' }] } }
                : p
        )) };

        expect(whyCannotDeletePage(t, 'trigger')).toMatch(/Application Questions/);
        expect(() => deletePage(t, 'trigger')).toThrow(/Application Questions/);
    });

    test('a page whose questions nothing depends on still deletes', () => {
        const t = base();
        expect(whyCannotDeletePage(t, 'questions')).toBeNull();
        expect(deletePage(t, 'questions').pages.map((p) => p.id)).not.toContain('questions');
    });

    test('changing a question away from a choice type drops its stale options', () => {
        const t = updateField(base(), 'continuation', { type: 'text' });
        const field = t.pages.find((p) => p.id === 'questions')!.fields[0];

        expect(field.type).toBe('text');
        expect(field.options).toBeUndefined();
        // The invisible list must not survive to reject free-text answers.
        expect(validateTemplate(t)).toEqual([]);
    });

    test('changing a question into a choice type gives it usable options', () => {
        const t = updateField(base(), 'einNumber', { type: 'select' });
        const field = t.pages.find((p) => p.id === 'questions')!.fields[1];

        expect(field.options).toEqual(['Option 1', 'Option 2']);
        expect(validateTemplate(t)).toEqual([]);
    });

    test('only the rules a type can satisfy are offered for it', () => {
        expect(validationKindFor('text')).toBe('text');
        expect(validationKindFor('textarea')).toBe('text');
        expect(validationKindFor('email')).toBe('text');
        expect(validationKindFor('currency')).toBe('number');
        expect(validationKindFor('number')).toBe('number');
        // Length and pattern rules can only reject a valid answer on these.
        expect(validationKindFor('checkbox')).toBe('none');
        expect(validationKindFor('date')).toBe('none');
        expect(validationKindFor('radio')).toBe('none');
        expect(validationKindFor('file')).toBe('none');
    });

    test('rules a type cannot use are dropped rather than kept', () => {
        const mixed = { minLength: 2, maxLength: 9, pattern: '^x$', patternMessage: 'nope', min: 1, max: 5 };

        expect(validationForType('text', mixed))
            .toEqual({ minLength: 2, maxLength: 9, pattern: '^x$', patternMessage: 'nope' });
        expect(validationForType('currency', mixed)).toEqual({ min: 1, max: 5 });
        // Nothing survives, so the key goes rather than being left empty.
        expect(validationForType('checkbox', mixed)).toBeUndefined();
        expect(validationForType('text', undefined)).toBeUndefined();
        expect(validationForType('text', { min: 3 })).toBeUndefined();
    });

    test('changing a question away from a text type drops its stale pattern', () => {
        const withPattern = updateField(base(), 'einNumber', {
            validation: { pattern: '^\\d{2}-\\d{7}$', patternMessage: 'Enter an EIN like 12-3456789' },
        });
        const t = updateField(withPattern, 'einNumber', { type: 'checkbox', label: 'I agree' });
        const field = t.pages.find((p) => p.id === 'questions')!.fields[1];

        expect(field.validation).toBeUndefined();
        // Left behind, the pattern would be matched against the string "true"
        // and leave a box nobody could tick.
        expect(validateAnswers(t, { einNumber: true }, ['questions'])).toEqual({});
    });

    test('changing a question between numeric types keeps the bounds that still apply', () => {
        const bounded = updateField(base(), 'einNumber', { type: 'currency', validation: { min: 0.01, max: 75000 } });
        const t = updateField(bounded, 'einNumber', { type: 'number' });

        expect(t.pages.find((p) => p.id === 'questions')!.fields[1].validation).toEqual({ min: 0.01, max: 75000 });
    });

    test('a checkbox comparison is stored as the boolean the answer holds', () => {
        expect(buildCondition('coPI', 'equals', 'true', 'checkbox')).toEqual({ field: 'coPI', equals: true });
        expect(buildCondition('coPI', 'equals', 'false', 'checkbox')).toEqual({ field: 'coPI', equals: false });
        // A freshly picked checkbox source means "checked".
        expect(buildCondition('coPI', 'equals', '', 'checkbox')).toEqual({ field: 'coPI', equals: true });
        // Every other type still compares as text.
        expect(buildCondition('continuation', 'equals', 'Yes', 'radio')).toEqual({ field: 'continuation', equals: 'Yes' });
    });

    test('a checkbox is not offered comparisons it cannot answer', () => {
        expect(operatorsFor('checkbox').map((o) => o.value)).toEqual(['equals', 'notEquals', 'answered']);
        expect(operatorsFor('number').map((o) => o.value)).toContain('greaterThan');
    });

    test('a checkbox condition reads as checked rather than as the text "true"', () => {
        expect(describeCondition({ field: 'coPI', equals: true }, 'Co-PI?')).toBe('Co-PI? is checked');
        expect(describeCondition({ field: 'coPI', equals: false }, 'Co-PI?')).toBe('Co-PI? is not checked');
        expect(describeCondition({ field: 'c', equals: 'Yes' }, 'Continuation')).toBe('Continuation is "Yes"');
    });
});
