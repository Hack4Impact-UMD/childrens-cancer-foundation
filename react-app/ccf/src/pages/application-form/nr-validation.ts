import { validateEmail, validatePhoneNumber } from '../../utils/validation';

// Section names match the breadcrumb page titles in NRApplicationForm so the
// "missing fields" modal points applicants at the page a field lives on.
export const NR_MY_INFORMATION = 'My Information';
export const NR_NARRATIVE = 'Narrative';

// Required fields grouped by the page that actually renders them. Validating a
// page against another page's fields blocks applicants with errors about inputs
// they cannot see yet.
export const NR_PAGE_FIELDS: Record<string, string[]> = {
    [NR_MY_INFORMATION]: [
        'title', 'requestor', 'institution', 'institutionPhoneNumber', 'institutionEmail'
    ],
    [NR_NARRATIVE]: ['amountRequested', 'timeframe', 'file'],
};

const FIELD_DISPLAY_NAMES: { [key: string]: string } = {
    'title': 'Title',
    'requestor': 'Principal Requestor',
    'institution': 'Institution',
    'institutionPhoneNumber': 'Phone Number',
    'institutionEmail': 'Email',
    'amountRequested': 'Amount Requested',
    'timeframe': 'Timeframe',
    'file': 'File'
};

export const getFieldDisplayName = (field: string): string =>
    FIELD_DISPLAY_NAMES[field] || field;

const isBlank = (value: any): boolean =>
    value === null || value === undefined || value.toString().trim() === '';

/**
 * Missing/invalid required fields for the non-research (program) grant form,
 * keyed by the section — and therefore the page — each problem belongs to.
 * Pass `sections` to check only certain pages; omit it to check the whole form.
 */
export const getNRInvalidSections = (
    formData: Record<string, any>,
    sections: string[] = Object.keys(NR_PAGE_FIELDS)
): Record<string, string[]> => {
    const invalidSections: Record<string, string[]> = {};

    const push = (section: string, message: string) => {
        if (!invalidSections[section]) invalidSections[section] = [];
        invalidSections[section].push(message);
    };

    for (const section of sections) {
        for (const field of NR_PAGE_FIELDS[section] || []) {
            if (isBlank(formData[field])) {
                push(section, `${getFieldDisplayName(field)} is required`);
            }
        }
    }

    if (sections.includes(NR_MY_INFORMATION)) {
        if (formData.institutionEmail?.trim() && validateEmail(formData.institutionEmail)) {
            push(NR_MY_INFORMATION, 'Invalid email format');
        }

        const phoneError = formData.institutionPhoneNumber?.trim()
            ? validatePhoneNumber(formData.institutionPhoneNumber)
            : null;
        if (phoneError) {
            push(NR_MY_INFORMATION, phoneError);
        }
    }

    if (sections.includes(NR_NARRATIVE) && formData.amountRequested?.trim()) {
        const amount = parseFloat(formData.amountRequested);
        if (isNaN(amount) || amount <= 0) {
            push(NR_NARRATIVE, 'Amount requested must be a valid positive number');
        }
    }

    return invalidSections;
};
