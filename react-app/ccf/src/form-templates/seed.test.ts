/**
 * Parity between the seeded templates and the hand-written forms.
 *
 * P0 promises the templates describe exactly the forms CCF uses today. These
 * tests are how that promise is kept: the golden lists below are transcribed
 * from the live forms, so changing one without the other fails here rather
 * than shipping two different application forms.
 */

import {
    LOCKED_FIELD_IDS,
    NEXTGEN_SEED,
    NONRESEARCH_SEED,
    RESEARCH_SEED,
    SEED_TEMPLATES,
    getSeedTemplate,
} from './seed';
import { validateTemplate, findField, getLockedFieldIds } from './engine';
import { NR_PAGE_FIELDS } from '../pages/application-form/nr-validation';
import { SIGNATURE_REQUIRED_FIELDS } from '../pages/application-form/signature-fields';
import { FormTemplate } from '../types/form-template-types';

/** Field IDs of every page, in order. */
const fieldIds = (template: FormTemplate, pageId: string): string[] =>
    template.pages.find((p) => p.id === pageId)!.fields.map((f) => f.id);

const requiredIds = (template: FormTemplate): string[] =>
    template.pages.flatMap((p) => p.fields.filter((f) => f.required).map((f) => f.id));

const allIds = (template: FormTemplate): string[] =>
    template.pages.flatMap((p) => p.fields.map((f) => f.id));

/* ------------------------------------------------------------------ *
 * Golden lists — transcribed from the live forms.
 * ------------------------------------------------------------------ */

// pages/application-form/subquestions/Information.tsx, in render order.
const INFORMATION_FIELDS = [
    'title', 'principalInvestigator', 'otherStaff', 'coPI', 'institution',
    'department', 'departmentHead', 'institutionAddress', 'institutionCityStateZip',
    'institutionPhoneNumber', 'institutionEmail', 'typesOfCancerAddressed',
    'adminOfficialName', 'adminOfficialAddress', 'adminOfficialCityStateZip',
    'adminPhoneNumber', 'adminEmail',
];

// ApplicationForm.tsx `pageFields[2]` — the required subset of the above.
const INFORMATION_REQUIRED = [
    'title', 'principalInvestigator', 'institution', 'department', 'departmentHead',
    'institutionAddress', 'institutionCityStateZip', 'institutionPhoneNumber',
    'institutionEmail', 'typesOfCancerAddressed', 'adminOfficialName',
    'adminOfficialAddress', 'adminOfficialCityStateZip', 'adminPhoneNumber', 'adminEmail',
];

// ApplicationForm.tsx `pageFields[3]`, with the signature fields spread in.
const QUESTIONS_REQUIRED = [
    'includedPublishedPaper', 'creditAgreement', 'patentApplied',
    'includedFundingInfo', 'amountRequested', 'dates', 'einNumber',
    ...SIGNATURE_REQUIRED_FIELDS,
];

// Present on the page but never required.
const QUESTIONS_OPTIONAL = [
    'continuation', 'continuationYears', 'attestationHumanSubjects', 'attestationCertification',
];

describe('seeded templates cover every grant type', () => {
    test('one template per grant type, each active and published', () => {
        expect(Object.keys(SEED_TEMPLATES).sort()).toEqual(['nextgen', 'nonresearch', 'research']);
        Object.values(SEED_TEMPLATES).forEach((template) => {
            expect(template.isActive).toBe(true);
            expect(template.status).toBe('published');
            expect(template.version).toBe(1);
        });
    });

    test('getSeedTemplate returns the matching grant type', () => {
        expect(getSeedTemplate('research')).toBe(RESEARCH_SEED);
        expect(getSeedTemplate('nextgen')).toBe(NEXTGEN_SEED);
        expect(getSeedTemplate('nonresearch')).toBe(NONRESEARCH_SEED);
        Object.entries(SEED_TEMPLATES).forEach(([grantType, template]) => {
            expect(template.grantType).toBe(grantType);
        });
    });

    test('every seeded template is structurally valid', () => {
        Object.values(SEED_TEMPLATES).forEach((template) => {
            expect(validateTemplate(template)).toEqual([]);
        });
    });

    test('field IDs are unique within a template', () => {
        Object.values(SEED_TEMPLATES).forEach((template) => {
            const ids = allIds(template);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });
});

describe('research seed matches the live Research form', () => {
    test('pages appear in breadcrumb order', () => {
        expect(RESEARCH_SEED.pages.map((p) => p.title)).toEqual([
            'About Grant', 'My Information', 'Application Questions', 'Grant Proposal', 'Review',
        ]);
    });

    test('About Grant and Review carry no fields — the builder does not own them', () => {
        const bookends = RESEARCH_SEED.pages.filter((p) => p.kind !== 'fields');
        expect(bookends.map((p) => p.kind)).toEqual(['about', 'review']);
        bookends.forEach((page) => expect(page.fields).toEqual([]));
    });

    test('My Information holds exactly the fields Information.tsx renders, in order', () => {
        expect(fieldIds(RESEARCH_SEED, 'my-information')).toEqual(INFORMATION_FIELDS);
    });

    test('required flags match pageFields[2]', () => {
        const page = RESEARCH_SEED.pages.find((p) => p.id === 'my-information')!;
        expect(page.fields.filter((f) => f.required).map((f) => f.id)).toEqual(INFORMATION_REQUIRED);
        expect(page.fields.filter((f) => !f.required).map((f) => f.id)).toEqual(['otherStaff', 'coPI']);
    });

    test('required flags match pageFields[3], including all ten signature fields', () => {
        const page = RESEARCH_SEED.pages.find((p) => p.id === 'application-questions')!;
        expect(page.fields.filter((f) => f.required).map((f) => f.id)).toEqual(QUESTIONS_REQUIRED);
        expect(page.fields.filter((f) => !f.required).map((f) => f.id)).toEqual(QUESTIONS_OPTIONAL);
    });

    test('the PDF upload is the only field on Grant Proposal, and it is required', () => {
        const page = RESEARCH_SEED.pages.find((p) => p.id === 'grant-proposal')!;
        expect(page.fields.map((f) => f.id)).toEqual(['file']);
        expect(page.fields[0].required).toBe(true);
        expect(page.fields[0].component).toBe('fileUpload');
    });

    test('the four cover-sheet questions offer Yes / No / N/A', () => {
        ['includedPublishedPaper', 'creditAgreement', 'patentApplied', 'includedFundingInfo'].forEach((id) => {
            const found = findField(RESEARCH_SEED, id)!;
            expect(found.type).toBe('radio');
            expect(found.options).toEqual(['Yes', 'No', 'N/A']);
        });
    });

    test('continuation offers only Yes / No', () => {
        expect(findField(RESEARCH_SEED, 'continuation')!.options).toEqual(['Yes', 'No']);
    });

    test('phone and email fields carry their formats', () => {
        ['institutionPhoneNumber', 'adminPhoneNumber'].forEach((id) => {
            expect(findField(RESEARCH_SEED, id)!.type).toBe('phone');
        });
        ['institutionEmail', 'adminEmail'].forEach((id) => {
            expect(findField(RESEARCH_SEED, id)!.type).toBe('email');
        });
    });

    test('nothing is conditional yet — P0 changes nothing an applicant sees', () => {
        RESEARCH_SEED.pages.forEach((page) => {
            expect(page.showWhen).toBeUndefined();
            page.fields.forEach((f) => expect(f.showWhen).toBeUndefined());
        });
    });

    test('NextGen asks the same questions under a different name', () => {
        expect(allIds(NEXTGEN_SEED)).toEqual(allIds(RESEARCH_SEED));
        expect(requiredIds(NEXTGEN_SEED)).toEqual(requiredIds(RESEARCH_SEED));
        expect(NEXTGEN_SEED.name).not.toBe(RESEARCH_SEED.name);
    });

    test('each grant type keeps its own Grant Proposal instructions', () => {
        const research = RESEARCH_SEED.pages.find((p) => p.id === 'grant-proposal')!.description!;
        const nextgen = NEXTGEN_SEED.pages.find((p) => p.id === 'grant-proposal')!.description!;

        expect(research).toContain('up to $100,000 for one year');
        expect(research).toContain("Applicant's Statement of Long-term Career Goals");
        expect(nextgen).toContain('up to $75,000 for one year');
        expect(nextgen).toContain('CCF-specific References');
        expect(research).not.toEqual(nextgen);
    });

    test('both carry the NIH formatting note the live pages show', () => {
        [RESEARCH_SEED, NEXTGEN_SEED].forEach((template) => {
            expect(template.pages.find((p) => p.id === 'grant-proposal')!.description)
                .toContain('font 11 points or larger');
        });
    });
});

describe('signature blocks', () => {
    const ids = [
        'signaturePI', 'signaturePITitle', 'signaturePIInstitution', 'signaturePIDate', 'signaturePIAgreed',
        'signatureDeptHead', 'signatureDeptHeadTitle', 'signatureDeptHeadInstitution',
        'signatureDeptHeadDate', 'signatureDeptHeadAgreed',
    ];

    test('the ten IDs match the ones the live form writes', () => {
        expect(SIGNATURE_REQUIRED_FIELDS).toEqual(ids);
        ids.forEach((id) => expect(findField(RESEARCH_SEED, id)).toBeDefined());
    });

    test('each signer keeps its own block, in signing order', () => {
        const blocks = ids.map((id) => findField(RESEARCH_SEED, id)!.componentProps!.block);
        expect(blocks).toEqual([...Array(5).fill('pi'), ...Array(5).fill('deptHead')]);
    });

    test('agreement is a checkbox and the date is a date', () => {
        expect(findField(RESEARCH_SEED, 'signaturePIAgreed')!.type).toBe('checkbox');
        expect(findField(RESEARCH_SEED, 'signatureDeptHeadAgreed')!.type).toBe('checkbox');
        expect(findField(RESEARCH_SEED, 'signaturePIDate')!.type).toBe('date');
    });

    test('each block carries its own heading and certification wording', () => {
        const piName = findField(RESEARCH_SEED, 'signaturePI')!;
        const deptName = findField(RESEARCH_SEED, 'signatureDeptHead')!;

        expect(piName.componentProps!.heading).toBe('Your Electronic Signature');
        expect(deptName.componentProps!.heading).toBe('Department Head Electronic Signature');
        expect(piName.componentProps!.certification)
            .toContain('true and correct to the best of your knowledge and belief');
    });

    test('labels stand alone so an error message names the signer', () => {
        expect(findField(RESEARCH_SEED, 'signatureDeptHeadAgreed')!.label)
            .toBe('Signature — Department Head I Agree');
        expect(findField(RESEARCH_SEED, 'signatureDeptHeadAgreed')!.shortLabel).toBe('I Agree');
    });
});

describe('non-research seed matches the live Program form', () => {
    test('pages appear in breadcrumb order', () => {
        expect(NONRESEARCH_SEED.pages.map((p) => p.title)).toEqual([
            'About Grant', 'My Information', 'Narrative', 'Review',
        ]);
    });

    test('My Information matches nr-validation, in render order', () => {
        expect(fieldIds(NONRESEARCH_SEED, 'my-information')).toEqual(NR_PAGE_FIELDS['My Information']);
    });

    test('Narrative requires exactly what nr-validation requires', () => {
        const page = NONRESEARCH_SEED.pages.find((p) => p.id === 'narrative')!;
        expect(page.fields.filter((f) => f.required).map((f) => f.id)).toEqual(NR_PAGE_FIELDS.Narrative);
        expect(page.fields.filter((f) => !f.required).map((f) => f.id))
            .toEqual(['explanation', 'sources', 'additionalInfo']);
    });

    test('the narrative prompts are long-form inputs', () => {
        expect(findField(NONRESEARCH_SEED, 'explanation')!.type).toBe('textarea');
        expect(findField(NONRESEARCH_SEED, 'sources')!.type).toBe('textarea');
    });

    test('the amount keeps the positive-number rule the live form enforces', () => {
        expect(findField(NONRESEARCH_SEED, 'amountRequested')!.validation).toEqual({ min: 0.01 });
    });

    test('the research-only positive check is not silently added to research', () => {
        expect(findField(RESEARCH_SEED, 'amountRequested')!.validation).toBeUndefined();
    });
});

describe('locked fields', () => {
    test('every locked ID present in a template is flagged', () => {
        Object.values(SEED_TEMPLATES).forEach((template) => {
            const present = allIds(template).filter((id) => (LOCKED_FIELD_IDS as readonly string[]).includes(id));
            expect(getLockedFieldIds(template).sort()).toEqual(present.sort());
        });
    });

    test('locked fields are required, so the builder can never make them optional', () => {
        Object.values(SEED_TEMPLATES).forEach((template) => {
            template.pages.forEach((page) => {
                page.fields.filter((f) => f.locked).forEach((f) => expect(f.required).toBe(true));
            });
        });
    });

    test('the lock list covers the fields other screens read by name', () => {
        // Sourced from GrantAwards, AdminDatabase, AssignReviewers and the
        // cloud function's validateApplicationData.
        [
            'title', 'institution', 'amountRequested', 'principalInvestigator', 'requestor',
            'institutionEmail', 'adminOfficialName', 'adminEmail', 'adminPhoneNumber',
            'typesOfCancerAddressed', 'timeframe', 'file',
        ].forEach((id) => {
            expect(LOCKED_FIELD_IDS).toContain(id);
        });
    });

    test('research locks the PI, non-research locks the requestor', () => {
        expect(findField(RESEARCH_SEED, 'principalInvestigator')!.locked).toBe(true);
        expect(findField(NONRESEARCH_SEED, 'requestor')!.locked).toBe(true);
        expect(findField(RESEARCH_SEED, 'requestor')).toBeUndefined();
    });

    test('editable fields are genuinely unlocked', () => {
        ['otherStaff', 'dates', 'einNumber', 'continuation', 'attestationCertification']
            .forEach((id) => expect(findField(RESEARCH_SEED, id)!.locked).toBeUndefined());
    });
});
