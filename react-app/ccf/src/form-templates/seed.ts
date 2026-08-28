/**
 * The forms CCF uses today, expressed as templates.
 *
 * This is a transcription, not a redesign: every field ID, label, required
 * flag and option list matches the hand-written forms in
 * `pages/application-form/`. `seed.test.ts` holds that claim to account, so
 * changing a form without changing the seed (or the other way round) fails the
 * build rather than quietly producing two different application forms.
 *
 * Research and NextGen share their pages in code today, so they share a page
 * builder here. Splitting them is a product decision, not a technical one.
 */

import { FormField, FormPage, FormTemplate, GrantType } from '../types/form-template-types';

/**
 * Field IDs read by name elsewhere in the app. Grant Awards, the admin
 * database, reviewer assignment, the CSV export and the cloud function all
 * depend on these, so the builder must never let an admin delete, hide,
 * or un-require them. Adding a feature that reads a new field by name means
 * adding it here.
 */
export const LOCKED_FIELD_IDS = [
    'title',
    'institution',
    'amountRequested',
    'principalInvestigator',
    'requestor',
    'institutionEmail',
    'adminOfficialName',
    'adminEmail',
    'adminPhoneNumber',
    'typesOfCancerAddressed',
    'timeframe',
    'file',
] as const;

const YES_NO_NA = ['Yes', 'No', 'N/A'];

const locked = (id: string): boolean => (LOCKED_FIELD_IDS as readonly string[]).includes(id);

/** Applies the lock list so it can never drift from a hand-set flag. */
const field = (f: Omit<FormField, 'locked'>): FormField =>
    locked(f.id) ? { ...f, locked: true } : f;

/* ------------------------------------------------------------------ *
 * Research / NextGen
 * ------------------------------------------------------------------ */

const myInformationPage = (): FormPage => ({
    id: 'my-information',
    title: 'My Information',
    kind: 'fields',
    fields: [
        field({ id: 'title', type: 'text', label: 'Title of Project', required: true, placeholder: 'Enter title of project' }),
        field({ id: 'principalInvestigator', type: 'text', label: 'Principal Investigator Name/Title', required: true, placeholder: 'Enter PI name/title' }),
        field({ id: 'otherStaff', type: 'text', label: 'Other Staff Name/Title', required: false, placeholder: 'Enter other staff name/title' }),
        field({ id: 'coPI', type: 'checkbox', label: 'Co-PI?', required: false }),
        field({ id: 'institution', type: 'text', label: 'Institution', required: true, placeholder: 'Enter institution' }),
        field({ id: 'department', type: 'text', label: 'Department', required: true, placeholder: 'Enter department' }),
        field({ id: 'departmentHead', type: 'text', label: 'Department Head', required: true, placeholder: 'Enter department head name/title' }),
        field({ id: 'institutionAddress', type: 'text', label: 'Street Address', required: true, placeholder: 'Enter street address' }),
        field({ id: 'institutionCityStateZip', type: 'text', label: 'City/St/Zip', required: true, placeholder: 'Enter city, state, zip' }),
        field({ id: 'institutionPhoneNumber', type: 'phone', label: 'Phone', required: true, placeholder: 'Enter phone number' }),
        field({ id: 'institutionEmail', type: 'email', label: 'Email', required: true, placeholder: 'Enter email' }),
        field({ id: 'typesOfCancerAddressed', type: 'text', label: 'Types of Cancer Being Addressed', required: true, placeholder: 'Enter types of cancer' }),
        field({ id: 'adminOfficialName', type: 'text', label: 'Administration Official Name/Title to be notified if awarded', required: true, placeholder: 'Enter admin official name/title' }),
        field({ id: 'adminOfficialAddress', type: 'text', label: 'Admin Street Address', required: true, placeholder: 'Enter admin official address' }),
        field({ id: 'adminOfficialCityStateZip', type: 'text', label: 'Admin City/St/Zip', required: true, placeholder: 'Enter admin city, state, zip' }),
        field({ id: 'adminPhoneNumber', type: 'phone', label: 'Admin Phone Number', required: true, placeholder: 'Enter admin phone number' }),
        field({ id: 'adminEmail', type: 'email', label: 'Admin Email', required: true, placeholder: 'Enter admin email' }),
    ],
});

/** One signer's five fields. Labels stand alone so error messages do too. */
const signatureFields = (
    prefix: 'signaturePI' | 'signatureDeptHead',
    who: string,
    block: 'pi' | 'deptHead',
    namePlaceholder: string
): FormField[] => {
    const sig = (
        id: string,
        type: FormField['type'],
        shortLabel: string,
        role: string,
        placeholder?: string
    ): FormField =>
        field({
            id,
            type,
            label: `Signature — ${who} ${shortLabel}`,
            shortLabel,
            required: true,
            placeholder,
            width: 'half',
            component: 'signatureBlock',
            componentProps: { block, role },
        });

    return [
        sig(prefix, 'text', 'Full Name', 'name', namePlaceholder),
        sig(`${prefix}Title`, 'text', 'Title', 'title', 'Enter business title'),
        sig(`${prefix}Institution`, 'text', 'Institution', 'institution', 'Enter institution'),
        sig(`${prefix}Date`, 'date', 'Date', 'date'),
        sig(`${prefix}Agreed`, 'checkbox', 'I Agree', 'agree'),
    ];
};

const applicationQuestionsPage = (): FormPage => ({
    id: 'application-questions',
    title: 'Application Questions',
    kind: 'fields',
    fields: [
        field({
            id: 'includedPublishedPaper',
            type: 'radio',
            label: 'I have included in this Grant Application any paper that I have published on this Grant topic while receiving CCF funding.',
            required: true,
            options: YES_NO_NA,
        }),
        field({
            id: 'creditAgreement',
            type: 'radio',
            label: 'I am in the process of writing a paper on this Grant topic. I agree to give credit to CCF as a funder and will provide a copy of this paper when published.',
            required: true,
            options: YES_NO_NA,
        }),
        field({
            id: 'patentApplied',
            type: 'radio',
            label: 'I have applied for a Patent for discoveries in my prior years on this Grant topic, funded by CCF.',
            required: true,
            options: YES_NO_NA,
        }),
        field({
            id: 'includedFundingInfo',
            type: 'radio',
            label: 'I have included information in my Biosketch on current sources of funding, and applications pending for sources of funding for same or similar grants as this Grant Proposal.',
            required: true,
            options: YES_NO_NA,
        }),
        field({ id: 'amountRequested', type: 'currency', label: 'Amount Requested', required: true, placeholder: 'Enter amount requested' }),
        field({ id: 'dates', type: 'text', label: 'Dates of Grant Project', required: true, placeholder: 'List dates of grant project' }),
        field({ id: 'einNumber', type: 'text', label: 'EIN #', required: true, placeholder: 'Enter EIN number' }),
        field({ id: 'continuation', type: 'radio', label: 'Continuation of Current Funding', required: false, options: ['Yes', 'No'] }),
        field({
            id: 'continuationYears',
            type: 'text',
            label: 'Years of current funding',
            required: false,
            placeholder: 'If yes, list years (ex. 2022)',
            // Deliberately unconditional, because today's form always shows it.
            // This is the obvious first candidate once conditional logic lands
            // in P3 — but P0 changes nothing an applicant can see.
        }),
        field({
            id: 'attestationHumanSubjects',
            type: 'checkbox',
            label: 'I attest that all Human Subjects Research protocols have been or will be approved by our IRB, and that all Animal Subjects Research has been or will be approved by the Animal Care and Use Committee.',
            required: false,
        }),
        field({
            id: 'attestationCertification',
            type: 'checkbox',
            label: "I certify that everything in this cover sheet and included in the Grant Application is true to the best of my knowledge. I have read and recommend this Grant Proposal for CCF's consideration.",
            required: false,
        }),
        ...signatureFields('signaturePI', 'Principal Investigator', 'pi', 'Enter principal investigator full name'),
        ...signatureFields('signatureDeptHead', 'Department Head', 'deptHead', 'Enter department head full name'),
    ],
});

const grantProposalPage = (): FormPage => ({
    id: 'grant-proposal',
    title: 'Grant Proposal',
    kind: 'fields',
    fields: [
        field({
            id: 'file',
            type: 'file',
            label: 'PDF Upload',
            required: true,
            component: 'fileUpload',
            componentProps: { accept: 'application/pdf' },
        }),
    ],
});

const aboutPage = (): FormPage => ({
    id: 'about-grant',
    title: 'About Grant',
    kind: 'about',
    fields: [],
});

const reviewPage = (): FormPage => ({
    id: 'review',
    title: 'Review',
    kind: 'review',
    fields: [],
});

const researchPages = (): FormPage[] => [
    aboutPage(),
    myInformationPage(),
    applicationQuestionsPage(),
    grantProposalPage(),
    reviewPage(),
];

/* ------------------------------------------------------------------ *
 * Non-research (the "Program" grant)
 * ------------------------------------------------------------------ */

const nonResearchPages = (): FormPage[] => [
    aboutPage(),
    {
        id: 'my-information',
        title: 'My Information',
        kind: 'fields',
        fields: [
            field({ id: 'title', type: 'text', label: 'Title of Project', required: true, placeholder: 'Enter title of project' }),
            field({ id: 'requestor', type: 'text', label: 'Principal Requestor', required: true, placeholder: 'Enter principal requestor' }),
            field({ id: 'institution', type: 'text', label: 'Institution', required: true, placeholder: 'Enter institution' }),
            field({ id: 'institutionPhoneNumber', type: 'phone', label: 'Phone Number', required: true, placeholder: 'Enter institution phone number' }),
            field({ id: 'institutionEmail', type: 'email', label: 'Email', required: true, placeholder: 'Enter institution email' }),
        ],
    },
    {
        id: 'narrative',
        title: 'Narrative',
        kind: 'fields',
        fields: [
            field({
                id: 'explanation',
                type: 'textarea',
                label: 'Explain the Project requested and justify the need for your requested Project.',
                required: false,
                placeholder: 'Type Here',
            }),
            field({
                id: 'sources',
                type: 'textarea',
                label: 'We ask that you include other sources from which you are seeking to fund the Project and any other funding source, and/or the amount contributed by your Institution/Hospital.',
                required: false,
                placeholder: 'Type Here',
            }),
            field({ id: 'amountRequested', type: 'currency', label: 'Amount Requested', required: true, placeholder: 'Enter amount requested', validation: { min: 0.01 } }),
            field({ id: 'timeframe', type: 'text', label: 'Time Frame', required: true, placeholder: 'List start and end dates of project' }),
            field({ id: 'additionalInfo', type: 'text', label: 'Additional Information', required: false, placeholder: 'Type Here' }),
            field({
                id: 'file',
                type: 'file',
                label: 'PDF Upload',
                required: true,
                component: 'fileUpload',
                componentProps: { accept: 'application/pdf' },
            }),
        ],
    },
    reviewPage(),
];

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

const seedTemplate = (grantType: GrantType, name: string, pages: FormPage[]): FormTemplate => ({
    id: `seed-${grantType}`,
    grantType,
    name,
    version: 1,
    status: 'published',
    isActive: true,
    pages,
});

export const RESEARCH_SEED = seedTemplate('research', 'Research Grant Application', researchPages());
export const NEXTGEN_SEED = seedTemplate('nextgen', 'NextGen Grant Application', researchPages());
export const NONRESEARCH_SEED = seedTemplate('nonresearch', 'Non-Research Grant Application', nonResearchPages());

export const SEED_TEMPLATES: Record<GrantType, FormTemplate> = {
    research: RESEARCH_SEED,
    nextgen: NEXTGEN_SEED,
    nonresearch: NONRESEARCH_SEED,
};

export const getSeedTemplate = (grantType: GrantType): FormTemplate => SEED_TEMPLATES[grantType];
