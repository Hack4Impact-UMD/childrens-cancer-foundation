/**
 * The engine, exercised the way the cloud function loads it: plain
 * `require` under Node, no bundler, no TypeScript.
 *
 * The React app runs the *same file* through the `@ccf/form-engine` alias and
 * covers its behaviour in depth (`src/form-templates/engine.test.ts`). These
 * checks exist to catch the failure that suite structurally cannot see: the
 * module not loading, or not behaving identically, on the server.
 *
 *   node functions/shared/form-engine.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const engine = require('./form-engine');

let passed = 0;
const test = (name, fn) => {
    try {
        fn();
        passed += 1;
        console.log('PASS: ' + name);
    } catch (error) {
        console.error('FAIL: ' + name + '\n  ' + error.message);
        process.exitCode = 1;
    }
};

const form = {
    pages: [
        { id: 'about', title: 'About Grant', kind: 'about', fields: [] },
        {
            id: 'info',
            title: 'My Information',
            kind: 'fields',
            fields: [
                { id: 'title', type: 'text', label: 'Title of Project', required: true, locked: true },
                { id: 'institutionEmail', type: 'email', label: 'Email', required: true },
                { id: 'institutionPhoneNumber', type: 'phone', label: 'Phone', required: true },
                { id: 'otherStaff', type: 'text', label: 'Other Staff', required: false },
            ],
        },
        {
            id: 'questions',
            title: 'Application Questions',
            kind: 'fields',
            fields: [
                { id: 'continuation', type: 'radio', label: 'Continuation', required: false, options: ['Yes', 'No'] },
                {
                    id: 'continuationYears', type: 'text', label: 'Years', required: true,
                    showWhen: { all: [{ field: 'continuation', equals: 'Yes' }] },
                },
                { id: 'amountRequested', type: 'currency', label: 'Amount Requested', required: true, locked: true },
                { id: 'signaturePIAgreed', type: 'checkbox', label: 'Signature — PI I Agree', required: true },
            ],
        },
    ],
};

const complete = {
    title: 'A study',
    institutionEmail: 'info@childrenscancerfoundation.org',
    institutionPhoneNumber: '4435464479',
    continuation: 'No',
    amountRequested: '75,000',
    signaturePIAgreed: true,
};

test('the module loads under plain CommonJS and exports its API', () => {
    ['validateAnswers', 'validateField', 'getVisibleFields', 'isComplete', 'validateTemplate',
        'checkPatternSafety', 'isBlank'].forEach((name) => {
        assert.equal(typeof engine[name], 'function', name + ' should be exported');
    });
});

test('a complete application passes', () => {
    assert.deepEqual(engine.validateAnswers(form, complete), {});
    assert.equal(engine.isComplete(form, complete), true);
});

test('a missing required answer is reported against its field ID', () => {
    const answers = Object.assign({}, complete, { title: '' });
    assert.deepEqual(engine.validateAnswers(form, answers), { title: 'Title of Project is required' });
});

test('an unchecked attestation counts as missing on the server too', () => {
    const answers = Object.assign({}, complete, { signaturePIAgreed: false });
    assert.equal(engine.isComplete(form, answers), false);
});

test('a hidden required field never blocks submission', () => {
    // The dead end this prevents: the server rejecting an application over a
    // question the applicant was never shown.
    assert.equal(engine.isComplete(form, complete), true);
    const shown = Object.assign({}, complete, { continuation: 'Yes' });
    assert.deepEqual(engine.validateAnswers(form, shown), { continuationYears: 'Years is required' });
});

test('email and phone formats match the app', () => {
    const answers = Object.assign({}, complete, {
        institutionEmail: 'nope', institutionPhoneNumber: '443-546-4479',
    });
    const errors = engine.validateAnswers(form, answers);
    assert.equal(errors.institutionEmail, 'Invalid email format');
    assert.match(errors.institutionPhoneNumber, /^Invalid phone number format/);
});

test('currency answers survive their formatting', () => {
    assert.equal(engine.validateField({ id: 'a', type: 'currency', label: 'Amount', required: true }, '$75,000'), null);
});

test('problems group by page for the applicant-facing message', () => {
    const grouped = engine.getProblemsByPage(form, {});
    assert.deepEqual(Object.keys(grouped), ['My Information', 'Application Questions']);
});

test('an answer longer than the match cap is refused rather than matched', () => {
    const field = { id: 'x', type: 'text', label: 'X', required: true, validation: { pattern: '^a+$' } };
    assert.equal(engine.validateField(field, 'a'.repeat(engine.MAX_PATTERN_INPUT)), null);
    assert.equal(
        engine.validateField(field, 'a'.repeat(engine.MAX_PATTERN_INPUT + 1)),
        'X is not in the expected format'
    );
});

test('a hostile pattern is rejected before it can be stored', () => {
    assert.match(engine.checkPatternSafety('(a+)+$'), /nested repetition/);
    assert.equal(engine.checkPatternSafety('^\\d{2}-\\d{7}$'), null);
});

test('template integrity checks run server-side as well', () => {
    const problems = engine.validateTemplate({
        pages: [{
            id: 'p', title: 'P', fields: [
                { id: 'a', type: 'text', label: 'A', required: false, showWhen: { all: [{ field: 'b', equals: 'x' }] } },
                { id: 'b', type: 'text', label: 'B', required: false },
            ],
        }],
    });
    assert.equal(problems.length, 1);
    assert.match(problems[0].message, /does not come before it/);
});

test('an unknown field in the answers is ignored, not rejected', () => {
    // Applications carry metadata alongside answers; the engine only judges
    // what the template asks for.
    const answers = Object.assign({}, complete, { status: 'submitted', creatorId: 'uid-1' });
    assert.deepEqual(engine.validateAnswers(form, answers), {});
});

if (process.exitCode) {
    console.error('\nform-engine tests failed');
} else {
    console.log('\n' + passed + ' engine tests passed under Node ' + process.version);
}
