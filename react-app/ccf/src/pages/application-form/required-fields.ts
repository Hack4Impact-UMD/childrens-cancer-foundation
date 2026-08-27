import { getSignatureFieldDisplayName } from './signature-fields';

/**
 * A required field is missing when it is blank, unset, or — for the
 * attestation checkboxes — left unchecked.
 */
export const isMissing = (value: any): boolean =>
    value === null || value === undefined || value === false ||
    (typeof value === 'string' && value.trim() === '');

/** Label used for a field in the "missing fields" modal. */
export const getFieldDisplayName = (field: string): string => {
    if (field === 'file') return 'PDF Upload';
    return getSignatureFieldDisplayName(field) ??
        field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
};
