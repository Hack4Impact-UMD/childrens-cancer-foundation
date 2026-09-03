import {
    checkPatternSafety,
    evaluateCondition,
    findField,
    findPageForField,
    getAllVisibleFields,
    getProblemsByPage,
    getVisibleFields,
    getVisiblePages,
    isBlank,
    isComplete,
    isFieldVisible,
    validateAnswers,
    validateField,
    validateTemplate,
} from './engine';
import { VALIDATION_PRESETS } from './builder-operations';
import { FormField, FormTemplate } from '../types/form-template-types';

const field = (over: Partial<FormField> & { id: string }): FormField => ({
    type: 'text',
    label: over.id,
    required: false,
    ...over,
});

const template = (fields: FormField[][], pageOver: any[] = []): FormTemplate => ({
    id: 't',
    grantType: 'research',
    name: 'T',
    version: 1,
    status: 'draft',
    isActive: false,
    pages: fields.map((pageFields, i) => ({
        id: `p${i + 1}`,
        title: `Page ${i + 1}`,
        kind: 'fields',
        fields: pageFields,
        ...(pageOver[i] || {}),
    })),
});

describe('isBlank', () => {
    test('blank values', () => {
        [null, undefined, '', '   ', false, []].forEach((v) => expect(isBlank(v)).toBe(true));
    });

    test('present values, including a checked box and a zero', () => {
        [true, 0, '0', 'text', ['a'], { a: 1 }].forEach((v) => expect(isBlank(v)).toBe(false));
    });

    test('an unchecked attestation counts as missing', () => {
        // The bug this encodes: `false !== ''` made unchecked boxes look filled.
        expect(isBlank(false)).toBe(true);
    });
});

describe('evaluateCondition', () => {
    const answers = { continuation: 'Yes', amount: '75,000', staff: '', flag: true };

    test('equals / notEquals', () => {
        expect(evaluateCondition({ field: 'continuation', equals: 'Yes' }, answers)).toBe(true);
        expect(evaluateCondition({ field: 'continuation', equals: 'No' }, answers)).toBe(false);
        expect(evaluateCondition({ field: 'continuation', notEquals: 'No' }, answers)).toBe(true);
    });

    test('oneOf', () => {
        expect(evaluateCondition({ field: 'continuation', oneOf: ['Yes', 'N/A'] }, answers)).toBe(true);
        expect(evaluateCondition({ field: 'continuation', oneOf: ['No'] }, answers)).toBe(false);
    });

    test('answered treats blank and unchecked as unanswered', () => {
        expect(evaluateCondition({ field: 'continuation', answered: true }, answers)).toBe(true);
        expect(evaluateCondition({ field: 'staff', answered: true }, answers)).toBe(false);
        expect(evaluateCondition({ field: 'staff', answered: false }, answers)).toBe(true);
        expect(evaluateCondition({ field: 'missing', answered: false }, answers)).toBe(true);
    });

    test('numeric comparisons read through currency formatting', () => {
        expect(evaluateCondition({ field: 'amount', greaterThan: 50000 }, answers)).toBe(true);
        expect(evaluateCondition({ field: 'amount', lessThan: 50000 }, answers)).toBe(false);
        expect(evaluateCondition({ field: 'amount', lessThan: 100000 }, answers)).toBe(true);
    });

    test('a non-numeric answer never satisfies a numeric comparison', () => {
        expect(evaluateCondition({ field: 'continuation', greaterThan: 1 }, answers)).toBe(false);
        expect(evaluateCondition({ field: 'continuation', lessThan: 1 }, answers)).toBe(false);
    });

    test('an empty condition hides rather than shows', () => {
        expect(evaluateCondition({ field: 'continuation' }, answers)).toBe(false);
    });
});

describe('visibility', () => {
    const years = field({
        id: 'years',
        showWhen: { all: [{ field: 'continuation', equals: 'Yes' }] },
    });

    test('a field with no rule is always visible', () => {
        expect(isFieldVisible(field({ id: 'plain' }), {})).toBe(true);
    });

    test('all: every condition must hold', () => {
        expect(isFieldVisible(years, { continuation: 'Yes' })).toBe(true);
        expect(isFieldVisible(years, { continuation: 'No' })).toBe(false);
        expect(isFieldVisible(years, {})).toBe(false);
    });

    test('any: one condition is enough', () => {
        const f = field({ id: 'f', showWhen: { any: [{ field: 'a', equals: '1' }, { field: 'b', equals: '2' }] } });
        expect(isFieldVisible(f, { b: '2' })).toBe(true);
        expect(isFieldVisible(f, { a: '9', b: '9' })).toBe(false);
    });

    test('all and any combine', () => {
        const f = field({
            id: 'f',
            showWhen: { all: [{ field: 'a', equals: '1' }], any: [{ field: 'b', equals: '2' }, { field: 'c', equals: '3' }] },
        });
        expect(isFieldVisible(f, { a: '1', c: '3' })).toBe(true);
        expect(isFieldVisible(f, { a: '0', c: '3' })).toBe(false);
        expect(isFieldVisible(f, { a: '1', c: '9' })).toBe(false);
    });

    test('hidden pages drop out of the page list and the field list', () => {
        const t = template(
            [[field({ id: 'a' })], [field({ id: 'b' })]],
            [{}, { showWhen: { all: [{ field: 'a', equals: 'go' }] } }]
        );
        expect(getVisiblePages(t, {}).map((p) => p.id)).toEqual(['p1']);
        expect(getVisiblePages(t, { a: 'go' }).map((p) => p.id)).toEqual(['p1', 'p2']);
        expect(getAllVisibleFields(t, {}).map((f) => f.id)).toEqual(['a']);
    });

    test('visible fields keep template order', () => {
        const page = template([[field({ id: 'a' }), field({ id: 'b' }), field({ id: 'c' })]]).pages[0];
        expect(getVisibleFields(page, {}).map((f) => f.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('validateField', () => {
    test('required and blank', () => {
        expect(validateField(field({ id: 'x', label: 'Title', required: true }), '')).toBe('Title is required');
        expect(validateField(field({ id: 'x', label: 'Title', required: true }), '  ')).toBe('Title is required');
        expect(validateField(field({ id: 'x', label: 'Agree', required: true, type: 'checkbox' }), false))
            .toBe('Agree is required');
    });

    test('optional and blank passes, and skips every other rule', () => {
        const f = field({ id: 'x', type: 'email', required: false, validation: { minLength: 5 } });
        expect(validateField(f, '')).toBeNull();
        expect(validateField(f, undefined)).toBeNull();
    });

    test('email format', () => {
        const f = field({ id: 'e', type: 'email', label: 'Email', required: true });
        expect(validateField(f, 'info@childrenscancerfoundation.org')).toBeNull();
        expect(validateField(f, 'not-an-email')).toBe('Invalid email format');
    });

    test('phone format matches the ten-digit rule the app already enforces', () => {
        const f = field({ id: 'p', type: 'phone', label: 'Phone', required: true });
        expect(validateField(f, '4435464479')).toBeNull();
        expect(validateField(f, '443-546-4479')).toMatch(/^Invalid phone number format/);
    });

    test('currency accepts formatted amounts and enforces bounds', () => {
        const f = field({ id: 'a', type: 'currency', label: 'Amount', required: true, validation: { min: 0.01 } });
        expect(validateField(f, '75,000')).toBeNull();
        expect(validateField(f, '$75,000')).toBeNull();
        expect(validateField(f, '0')).toBe('Amount must be at least 0.01');
        expect(validateField(f, 'abc')).toBe('Amount must be a number');
    });

    test('numeric max', () => {
        const f = field({ id: 'n', type: 'number', label: 'Count', required: true, validation: { max: 10 } });
        expect(validateField(f, '10')).toBeNull();
        expect(validateField(f, '11')).toBe('Count must be no more than 10');
    });

    test('length bounds', () => {
        const f = field({ id: 't', label: 'Summary', required: true, validation: { minLength: 3, maxLength: 5 } });
        expect(validateField(f, 'abcd')).toBeNull();
        expect(validateField(f, 'ab')).toBe('Summary must be at least 3 characters');
        expect(validateField(f, 'abcdef')).toBe('Summary must be no more than 5 characters');
    });

    test('custom pattern, with the admin message when one is set', () => {
        const f = field({
            id: 'ein', label: 'EIN', required: true,
            validation: { pattern: '^\\d{2}-\\d{7}$', patternMessage: 'EIN looks like 12-3456789' },
        });
        expect(validateField(f, '12-3456789')).toBeNull();
        expect(validateField(f, '123456789')).toBe('EIN looks like 12-3456789');
    });

    test('a pattern that will not compile fails closed rather than passing everything', () => {
        const f = field({ id: 'x', label: 'X', required: true, validation: { pattern: '([' } });
        expect(validateField(f, 'anything')).toBe('X is not in the expected format');
    });

    test('an answer longer than the match cap is refused, not matched', () => {
        const f = field({ id: 'x', label: 'X', required: true, validation: { pattern: '^a+$' } });
        expect(validateField(f, 'a'.repeat(4096))).toBeNull();
        expect(validateField(f, 'a'.repeat(4097))).toBe('X is not in the expected format');
    });

    test('choice fields reject answers outside their options', () => {
        const f = field({ id: 'c', type: 'radio', label: 'Choice', required: true, options: ['Yes', 'No'] });
        expect(validateField(f, 'Yes')).toBeNull();
        expect(validateField(f, 'Maybe')).toBe('Choice must be one of: Yes, No');
    });
});

describe('validateAnswers', () => {
    const t = template([
        [field({ id: 'title', label: 'Title', required: true })],
        [
            field({ id: 'continuation', label: 'Continuation', required: false }),
            field({
                id: 'years', label: 'Years', required: true,
                showWhen: { all: [{ field: 'continuation', equals: 'Yes' }] },
            }),
        ],
    ]);

    test('a hidden required field never blocks submission', () => {
        // The dead end this prevents: an error about a question nobody can see.
        expect(validateAnswers(t, { title: 'T', continuation: 'No' })).toEqual({});
        expect(isComplete(t, { title: 'T', continuation: 'No' })).toBe(true);
    });

    test('the same field is required once it is visible', () => {
        expect(validateAnswers(t, { title: 'T', continuation: 'Yes' })).toEqual({ years: 'Years is required' });
        expect(isComplete(t, { title: 'T', continuation: 'Yes' })).toBe(false);
    });

    test('an answer to a now-hidden field is kept, not flagged', () => {
        const answers = { title: 'T', continuation: 'No', years: '2024' };
        expect(validateAnswers(t, answers)).toEqual({});
        expect(answers.years).toBe('2024');
    });

    test('scoping to a page ignores later pages', () => {
        expect(validateAnswers(t, {}, ['p1'])).toEqual({ title: 'Title is required' });
        expect(validateAnswers(t, { title: 'T', continuation: 'Yes' }, ['p1'])).toEqual({});
    });

    test('problems are grouped under the page that holds the question', () => {
        expect(getProblemsByPage(t, { continuation: 'Yes' })).toEqual({
            'Page 1': ['Title is required'],
            'Page 2': ['Years is required'],
        });
    });

    test('no problems means no groups', () => {
        expect(getProblemsByPage(t, { title: 'T' })).toEqual({});
    });
});

describe('lookup helpers', () => {
    const t = template([[field({ id: 'a' })], [field({ id: 'b' })]]);

    test('findField and findPageForField', () => {
        expect(findField(t, 'b')!.id).toBe('b');
        expect(findField(t, 'nope')).toBeUndefined();
        expect(findPageForField(t, 'b')!.id).toBe('p2');
        expect(findPageForField(t, 'nope')).toBeUndefined();
    });
});

describe('checkPatternSafety', () => {
    test('accepts ordinary patterns', () => {
        ['^\\d{10}$', '^[A-Z]{2}-\\d{7}$', '^https?://.+$'].forEach((p) => {
            expect(checkPatternSafety(p)).toBeNull();
        });
    });

    test('rejects nested repetition, which can hang the server', () => {
        expect(checkPatternSafety('(a+)+$')).toMatch(/nested repetition/);
        expect(checkPatternSafety('(\\d+)*$')).toMatch(/nested repetition/);
        expect(checkPatternSafety('[a-z]+*')).not.toBeNull();
    });

    test('rejects a repeated group of alternatives', () => {
        // Ambiguous branches make the repeat exponential on a near miss, and
        // neither branch carries a quantifier for the nested-repetition rule
        // to catch.
        expect(checkPatternSafety('^(a|aa)+$')).toMatch(/alternatives/);
        expect(checkPatternSafety('^(?:a|ab)+$')).toMatch(/alternatives/);
        expect(checkPatternSafety('(x|y){2,}')).toMatch(/alternatives/);
        expect(checkPatternSafety('((a|b)|c)+')).toMatch(/alternatives/);
    });

    test('leaves every shipped preset, and other bounded shapes, alone', () => {
        // A false rejection here would take a working question away from an
        // admin, so the presets are the regression that matters most.
        VALIDATION_PRESETS.forEach((preset) => {
            if (preset.validation.pattern) {
                expect(checkPatternSafety(preset.validation.pattern)).toBeNull();
            }
        });
        // Bounded repetition cannot blow up; `|` outside a group is not
        // repeated; inside a character class it is a literal.
        expect(checkPatternSafety('^(cat|dog){1,3}$')).toBeNull();
        expect(checkPatternSafety('^a|b$')).toBeNull();
        expect(checkPatternSafety('^[a|b]+$')).toBeNull();
        expect(checkPatternSafety('^(19|20)\\d{2}$')).toBeNull();
    });

    test('rejects patterns that will not compile', () => {
        expect(checkPatternSafety('([')).toBe('Pattern is not a valid regular expression');
    });

    test('rejects very long patterns', () => {
        expect(checkPatternSafety('a'.repeat(201))).toMatch(/too long/);
    });
});

describe('validateTemplate', () => {
    const messages = (t: FormTemplate) => validateTemplate(t).map((p) => p.message);

    test('a clean template has no problems', () => {
        expect(validateTemplate(template([[field({ id: 'a', label: 'A' })]]))).toEqual([]);
    });

    test('duplicate field IDs are rejected', () => {
        const t = template([[field({ id: 'a', label: 'A' })], [field({ id: 'a', label: 'A again' })]]);
        expect(messages(t)).toContain('Duplicate field ID "a"');
    });

    test('a choice field with no options is rejected', () => {
        const t = template([[field({ id: 'c', label: 'Choice', type: 'radio' })]]);
        expect(messages(t)).toContain('"Choice" is a choice field with no options');
    });

    test('a field may not depend on a later field', () => {
        const t = template([[
            field({ id: 'first', label: 'First', showWhen: { all: [{ field: 'second', equals: 'x' }] } }),
            field({ id: 'second', label: 'Second' }),
        ]]);
        expect(messages(t)).toContain('"First" depends on "second", which does not come before it');
    });

    test('a field may depend on an earlier field, including one on an earlier page', () => {
        const t = template([
            [field({ id: 'first', label: 'First' })],
            [field({ id: 'later', label: 'Later', showWhen: { all: [{ field: 'first', equals: 'x' }] } })],
        ]);
        expect(validateTemplate(t)).toEqual([]);
    });

    test('a field may not depend on itself', () => {
        const t = template([[field({ id: 'loop', label: 'Loop', showWhen: { all: [{ field: 'loop', equals: 'x' }] } })]]);
        expect(messages(t)).toContain('"Loop" cannot depend on its own answer');
    });

    test('a page may not depend on a field that comes after it', () => {
        const t = template(
            [[field({ id: 'a', label: 'A' })], [field({ id: 'b', label: 'B' })]],
            [{ showWhen: { all: [{ field: 'b', equals: 'x' }] } }, {}]
        );
        expect(messages(t)).toContain('Page "Page 1" is shown based on "b", which does not come before it');
    });

    test('a locked field cannot be optional or conditional', () => {
        const t = template([
            [field({ id: 'gate', label: 'Gate' })],
            [field({
                id: 'title', label: 'Title', locked: true, required: false,
                showWhen: { all: [{ field: 'gate', equals: 'x' }] },
            })],
        ]);
        expect(messages(t)).toEqual(expect.arrayContaining([
            '"Title" is used elsewhere in the app and cannot be optional',
            '"Title" is used elsewhere in the app and cannot be shown conditionally',
        ]));
    });

    test('an unsafe pattern is caught before it can be published', () => {
        const t = template([[field({ id: 'x', label: 'X', validation: { pattern: '(a+)+$' } })]]);
        expect(messages(t)[0]).toMatch(/^"X": Pattern has nested repetition/);
    });

    test('missing labels and titles are caught', () => {
        const t = template([[field({ id: 'x', label: '  ' })]], [{ title: '' }]);
        expect(messages(t)).toEqual(expect.arrayContaining([
            'Every page needs a title',
            'Field "x" needs a label',
        ]));
    });
});
