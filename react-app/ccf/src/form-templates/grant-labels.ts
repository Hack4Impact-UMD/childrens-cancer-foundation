import { GrantType } from '../types/form-template-types';

/**
 * What a grant type is called in front of a person.
 *
 * The stored value is a terse enum, and interpolating it straight into a
 * sentence produces copy like "the form applicants fill in for nextgen
 * grants". Everything admin-facing goes through here instead.
 */
export const GRANT_LABELS: Record<GrantType, string> = {
    research: 'Research Grant',
    nextgen: 'NextGen Award',
    nonresearch: 'Non-Research Grant',
};

export const grantLabel = (grantType: GrantType): string =>
    GRANT_LABELS[grantType] ?? grantType;
