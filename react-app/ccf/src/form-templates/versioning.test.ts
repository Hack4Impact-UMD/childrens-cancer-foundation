import {
    applyActivation,
    forFirestore,
    canEdit,
    checkPublishable,
    createPublishedVersion,
    grantTypesWithoutActiveTemplate,
    nextVersionNumber,
    startDraftFrom,
} from './versioning';
import { RESEARCH_SEED } from './seed';
import { FormTemplate } from '../types/form-template-types';

const draft = (over: Partial<FormTemplate> = {}): FormTemplate => ({
    id: 'tpl-1',
    grantType: 'research',
    name: 'Research Grant Application',
    version: 1,
    status: 'draft',
    isActive: false,
    pages: [
        { id: 'about', title: 'About Grant', kind: 'about', fields: [] },
        {
            id: 'p1',
            title: 'My Information',
            kind: 'fields',
            fields: [{ id: 'title', type: 'text', label: 'Title of Project', required: true, locked: true }],
        },
    ],
    ...over,
});

describe('forFirestore', () => {
    test('drops keys whose value is undefined', () => {
        expect(forFirestore({ a: 1, b: undefined })).toEqual({ a: 1 });
        expect('b' in (forFirestore({ a: 1, b: undefined }) as any)).toBe(false);
    });

    test('reaches into nested fields, where the builder actually produces them', () => {
        const template = draft();
        template.pages[1].fields[0].placeholder = undefined;
        template.pages[1].fields[0].validation = { minLength: 2, maxLength: undefined };

        const clean: any = forFirestore(template);
        expect('placeholder' in clean.pages[1].fields[0]).toBe(false);
        expect(clean.pages[1].fields[0].validation).toEqual({ minLength: 2 });
    });

    test('keeps falsy values that are real answers', () => {
        expect(forFirestore({ required: false, order: 0, label: '', tags: [] }))
            .toEqual({ required: false, order: 0, label: '', tags: [] });
    });

    test('walks arrays as well as objects', () => {
        expect(forFirestore({ pages: [{ id: 'p', title: undefined }] }))
            .toEqual({ pages: [{ id: 'p' }] });
    });

    test('null survives — it is a value, not an absence', () => {
        expect(forFirestore({ a: null })).toEqual({ a: null });
    });

    test('the seeded templates carry no undefined anywhere', () => {
        // The bug this pins: Firestore rejected the whole seed write because a
        // signature field spelled "no placeholder" as `placeholder: undefined`.
        const hasUndefined = (value: any): boolean => {
            if (Array.isArray(value)) return value.some(hasUndefined);
            if (value && typeof value === 'object') {
                return Object.values(value).some((v) => v === undefined || hasUndefined(v));
            }
            return false;
        };
        expect(hasUndefined(RESEARCH_SEED)).toBe(false);
    });
});

describe('nextVersionNumber', () => {
    test('starts at 1 and always moves forward', () => {
        expect(nextVersionNumber([])).toBe(1);
        expect(nextVersionNumber([{ version: 1 }])).toBe(2);
        expect(nextVersionNumber([{ version: 3 }, { version: 1 }, { version: 2 }])).toBe(4);
    });

    test('a gap in the history does not let a number be reused', () => {
        expect(nextVersionNumber([{ version: 1 }, { version: 7 }])).toBe(8);
    });
});

describe('createPublishedVersion', () => {
    test('carries the identity an application needs to find it again', () => {
        const version = createPublishedVersion(draft(), {
            publishedBy: 'admin@ccf.org',
            publishedAt: '2027-01-05T10:00:00.000Z',
            version: 2,
            changeNote: 'Reworded the EIN question',
        });

        expect(version).toMatchObject({
            templateId: 'tpl-1',
            version: 2,
            grantType: 'research',
            name: 'Research Grant Application',
            publishedBy: 'admin@ccf.org',
            publishedAt: '2027-01-05T10:00:00.000Z',
            changeNote: 'Reworded the EIN question',
        });
    });

    test('omits an absent change note rather than storing undefined', () => {
        const version = createPublishedVersion(draft(), { publishedBy: 'a@b.org' });
        expect('changeNote' in version).toBe(false);
    });

    test('defaults the version number to the template it was cut from', () => {
        expect(createPublishedVersion(draft({ version: 5 }), { publishedBy: 'a@b.org' }).version).toBe(5);
    });

    test('the frozen copy is deep, so later edits cannot reach into it', () => {
        const template = draft();
        const version = createPublishedVersion(template, { publishedBy: 'a@b.org' });

        template.pages[1].fields[0].label = 'Something else entirely';
        template.pages.push({ id: 'p2', title: 'Added later', kind: 'fields', fields: [] });

        expect(version.pages[1].fields[0].label).toBe('Title of Project');
        expect(version.pages).toHaveLength(2);
    });

    test('a real seeded template survives the round trip', () => {
        const version = createPublishedVersion(RESEARCH_SEED, { publishedBy: 'a@b.org' });
        expect(JSON.parse(JSON.stringify(version.pages))).toEqual(RESEARCH_SEED.pages);
    });
});

describe('checkPublishable', () => {
    test('a sound draft may be published', () => {
        expect(checkPublishable(draft())).toEqual({ ok: true, problems: [] });
    });

    test('structural problems block publishing', () => {
        const broken = draft({
            pages: [{
                id: 'p1', title: 'P', kind: 'fields',
                fields: [
                    { id: 'a', type: 'text', label: 'A', required: true },
                    { id: 'a', type: 'text', label: 'Duplicate', required: true },
                ],
            }],
        });
        const result = checkPublishable(broken);
        expect(result.ok).toBe(false);
        expect(result.problems.map((p) => p.message)).toContain('Duplicate field ID "a"');
    });

    test('a form with no questions is refused', () => {
        const empty = draft({ pages: [{ id: 'about', title: 'About Grant', kind: 'about', fields: [] }] });
        expect(checkPublishable(empty)).toMatchObject({
            ok: false,
            problems: [{ message: 'A form needs at least one page with a question on it' }],
        });
    });

    test('publishing into an open cycle with applications warns but is allowed', () => {
        const result = checkPublishable(draft(), { cycleIsOpen: true, applicationsInCycle: 4 });
        expect(result.ok).toBe(true);
        expect(result.warning).toMatch(/^4 application\(s\) have already been started/);
    });

    test('an open cycle with no applications yet needs no warning', () => {
        expect(checkPublishable(draft(), { cycleIsOpen: true, applicationsInCycle: 0 }).warning).toBeUndefined();
    });

    test('a closed cycle never warns', () => {
        expect(checkPublishable(draft(), { cycleIsOpen: false, applicationsInCycle: 12 }).warning).toBeUndefined();
    });

    test('every seeded template is publishable as-is', () => {
        expect(checkPublishable(RESEARCH_SEED).ok).toBe(true);
    });
});

describe('applyActivation', () => {
    const templates = [
        { id: 'r1', grantType: 'research' as const, isActive: true },
        { id: 'r2', grantType: 'research' as const, isActive: false },
        { id: 'r3', grantType: 'research' as const, isActive: false },
        { id: 'n1', grantType: 'nextgen' as const, isActive: true },
    ];

    test('exactly one template of the grant type ends up live', () => {
        expect(applyActivation(templates, 'r2')).toEqual({ r1: false, r2: true, r3: false });
    });

    test('other grant types are left alone', () => {
        expect(applyActivation(templates, 'r2')).not.toHaveProperty('n1');
    });

    test('re-activating the live template is a no-op that still returns the set', () => {
        expect(applyActivation(templates, 'r1')).toEqual({ r1: true, r2: false, r3: false });
    });

    test('activating an unknown template throws rather than deactivating everything', () => {
        expect(() => applyActivation(templates, 'nope')).toThrow(/unknown template/);
    });
});

describe('canEdit', () => {
    test('drafts are editable, published versions are not', () => {
        expect(canEdit({ status: 'draft' })).toBe(true);
        expect(canEdit({ status: 'published' })).toBe(false);
    });
});

describe('startDraftFrom', () => {
    test('the next draft is a fresh, inactive copy at the next version', () => {
        const published = draft({ status: 'published', isActive: true, version: 2 });
        const next = startDraftFrom(published, [{ version: 1 }, { version: 2 }]);

        expect(next).toMatchObject({ id: 'tpl-1', status: 'draft', isActive: false, version: 3 });
    });

    test('editing the new draft leaves the published pages untouched', () => {
        const published = draft({ status: 'published', version: 1 });
        const next = startDraftFrom(published, [{ version: 1 }]);

        next.pages[1].fields[0].label = 'Changed';
        expect(published.pages[1].fields[0].label).toBe('Title of Project');
    });

    test('falls back to the template version when no history is passed', () => {
        expect(startDraftFrom(draft({ version: 4 }), []).version).toBe(5);
    });
});

describe('grantTypesWithoutActiveTemplate', () => {
    test('reports the grant types applicants could not apply for', () => {
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'published' },
            { grantType: 'nextgen', isActive: false, status: 'published' },
        ])).toEqual(['nextgen', 'nonresearch']);
    });

    test('an active draft does not count as a live form', () => {
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'draft' },
        ])).toContain('research');
    });

    test('all three covered means nothing to report', () => {
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'published' },
            { grantType: 'nextgen', isActive: true, status: 'published' },
            { grantType: 'nonresearch', isActive: true, status: 'published' },
        ])).toEqual([]);
    });
});
