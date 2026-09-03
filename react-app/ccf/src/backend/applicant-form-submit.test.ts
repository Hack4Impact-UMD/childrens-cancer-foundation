/**
 * The client/server seam for a submission.
 *
 * The cloud function reads the form reference from the *top level* of the
 * callable payload, and strips `formTemplateId`/`formVersion` out of the
 * answers as a mass-assignment guard. A reference merged into the answers is
 * therefore not merely in the wrong place — it is dropped on both sides, and
 * the whole template feature goes quiet without any error. These tests hold
 * the payload shape in place.
 */

// Jest hoists jest.mock() above the imports, so the shared spy has to be
// `mock`-prefixed to be reachable from inside the factory.
const mockCallable = jest.fn();
const mockUploadFile = jest.fn();

jest.mock('firebase/functions', () => ({
    httpsCallable: () => mockCallable,
}));

jest.mock('../index', () => ({ functions: {} }));

jest.mock('../storage/storage', () => ({
    // Referenced lazily: the factory is hoisted above the const declarations.
    uploadFileToStorage: (...args: unknown[]) => mockUploadFile(...args),
}));

import {
    submitApplication,
    uploadNonResearchApplication,
    uploadResearchApplication,
} from './applicant-form-submit';

const pdf = () =>
    new File(['%PDF-1.4'], 'proposal.pdf', { type: 'application/pdf' });

const answers = { title: 'A study', institution: 'CCF' } as any;

// Create React App's Jest preset sets `resetMocks`, so return values have to
// be set per-test rather than in the module factories.
beforeEach(() => {
    mockUploadFile.mockResolvedValue('stored-object-name.pdf');
    mockCallable.mockResolvedValue({ data: { success: true, applicationId: 'a1', message: 'ok' } });
});

const payload = () => mockCallable.mock.calls[0][0];

describe('the submission payload', () => {
    test('carries the form reference where the cloud function reads it', async () => {
        await submitApplication(answers, pdf(), 'research', {
            formTemplateId: 'seed-research',
            formVersion: 3,
        });

        expect(payload().formTemplateId).toBe('seed-research');
        expect(payload().formVersion).toBe(3);
    });

    test('keeps the reference out of the answers', async () => {
        await submitApplication(answers, pdf(), 'research', {
            formTemplateId: 'seed-research',
            formVersion: 3,
        });

        // The server deletes these from `application` before storing it, so a
        // reference smuggled in there would be discarded rather than honoured.
        expect(payload().application).not.toHaveProperty('formTemplateId');
        expect(payload().application).not.toHaveProperty('formVersion');
    });

    test('omits the reference entirely when there is no published version', async () => {
        await submitApplication(answers, pdf(), 'research');

        expect(payload()).not.toHaveProperty('formTemplateId');
        expect(payload()).not.toHaveProperty('formVersion');
        // `resolveFormVersion` returns null for that, so the server falls back
        // to the pre-builder field checks rather than throwing.
        expect(payload().grantType).toBe('research');
    });

    test('still sends the answers, grant type and stored object name', async () => {
        await submitApplication(answers, pdf(), 'nonresearch');

        expect(payload().application).toEqual(answers);
        expect(payload().storedFileName).toBe('stored-object-name.pdf');
        expect(payload().originalFileName).toBe('proposal.pdf');
    });
});

describe('the wrappers the forms actually call', () => {
    test('the research wrapper forwards the reference and the grant type', async () => {
        await uploadResearchApplication(answers, pdf(), true, {
            formTemplateId: 'seed-nextgen',
            formVersion: 2,
        });

        expect(payload().grantType).toBe('nextgen');
        expect(payload().formTemplateId).toBe('seed-nextgen');
        expect(payload().formVersion).toBe(2);
    });

    test('the non-research wrapper forwards the reference', async () => {
        await uploadNonResearchApplication(answers, pdf(), {
            formTemplateId: 'seed-nonresearch',
            formVersion: 1,
        });

        expect(payload().grantType).toBe('nonresearch');
        expect(payload().formTemplateId).toBe('seed-nonresearch');
    });
});
