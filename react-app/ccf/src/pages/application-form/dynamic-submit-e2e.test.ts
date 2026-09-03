/**
 * End-to-end shape check: the answers the browser actually sends, judged the
 * way the cloud function now judges them, against the real seeded form.
 */
import { RESEARCH_SEED } from '../../form-templates/seed';
import { validateAnswers, withUploadedFile, getAllVisibleFields } from '../../form-templates/engine';

// Exactly what useApplicationDraft strips before submitting.
const SUBMIT_STRIP_FIELDS = [
    'status', 'creatorId', 'applicantEmail', 'applicationCycleId',
    'applicationCycle', 'createdAt', 'lastUpdated', 'grantType',
    'decision', 'submitTime', 'applicationId', 'file',
];

const sampleFor = (f: any): any => {
    if (f.options?.length) return f.options[0];
    switch (f.type) {
        case 'checkbox': return true;
        case 'email': return 'pi@example.org';
        case 'phone': return '4105551234';
        case 'number': case 'currency': return '75000';
        case 'date': return '2027-01-01';
        default: return 'x';
    }
};

test('a completed research application passes server-side template validation', () => {
    const answers: Record<string, any> = {};
    getAllVisibleFields(RESEARCH_SEED, {}).forEach((f: any) => { answers[f.id] = sampleFor(f); });
    // Fill conditionals revealed by the first pass.
    getAllVisibleFields(RESEARCH_SEED, answers).forEach((f: any) => {
        if (answers[f.id] === undefined) answers[f.id] = sampleFor(f);
    });

    // The browser strips these, and adds the metadata a resumed draft carries.
    const payload: Record<string, any> = { ...answers, status: 'draft', creatorId: 'uid-1' };
    SUBMIT_STRIP_FIELDS.forEach((k) => delete payload[k]);
    expect(payload).not.toHaveProperty('file');

    const server = withUploadedFile(RESEARCH_SEED, payload, 'stored.pdf');
    expect(validateAnswers(RESEARCH_SEED, server)).toEqual({});
});
