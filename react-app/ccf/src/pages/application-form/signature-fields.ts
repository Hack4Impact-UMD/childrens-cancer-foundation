import { SignatureFields } from './Components/SignatureBlock';

// The typed-name fields keep their original names (`signaturePI`,
// `signatureDeptHead`) so existing drafts, submitted applications and the
// cloud function's validation continue to work; the title/institution/date/
// agreement fields added alongside them make the signature an attestation.
export const PI_SIGNATURE_FIELDS: SignatureFields = {
    name: 'signaturePI',
    title: 'signaturePITitle',
    institution: 'signaturePIInstitution',
    date: 'signaturePIDate',
    agreed: 'signaturePIAgreed',
};

export const DEPT_HEAD_SIGNATURE_FIELDS: SignatureFields = {
    name: 'signatureDeptHead',
    title: 'signatureDeptHeadTitle',
    institution: 'signatureDeptHeadInstitution',
    date: 'signatureDeptHeadDate',
    agreed: 'signatureDeptHeadAgreed',
};

// Every signature field an applicant must complete before submitting.
export const SIGNATURE_REQUIRED_FIELDS = [
    PI_SIGNATURE_FIELDS,
    DEPT_HEAD_SIGNATURE_FIELDS,
].flatMap((fields) => [fields.name, fields.title, fields.institution, fields.date, fields.agreed]);

const SIGNATURE_FIELD_DISPLAY_NAMES: Record<string, string> = {
    [PI_SIGNATURE_FIELDS.name]: 'Signature — Principal Investigator Full Name',
    [PI_SIGNATURE_FIELDS.title]: 'Signature — Principal Investigator Title',
    [PI_SIGNATURE_FIELDS.institution]: 'Signature — Principal Investigator Institution',
    [PI_SIGNATURE_FIELDS.date]: 'Signature — Principal Investigator Date',
    [PI_SIGNATURE_FIELDS.agreed]: 'Signature — Principal Investigator "I Agree"',
    [DEPT_HEAD_SIGNATURE_FIELDS.name]: 'Signature — Department Head Full Name',
    [DEPT_HEAD_SIGNATURE_FIELDS.title]: 'Signature — Department Head Title',
    [DEPT_HEAD_SIGNATURE_FIELDS.institution]: 'Signature — Department Head Institution',
    [DEPT_HEAD_SIGNATURE_FIELDS.date]: 'Signature — Department Head Date',
    [DEPT_HEAD_SIGNATURE_FIELDS.agreed]: 'Signature — Department Head "I Agree"',
};

export const getSignatureFieldDisplayName = (field: string): string | undefined =>
    SIGNATURE_FIELD_DISPLAY_NAMES[field];
