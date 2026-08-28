import {
    applyActivation,
    discardDraftInto,
    forFirestore,
    hasUnpublishedChanges,
    liveVersionNumber,
    versionAsTemplate,
    whyCannotStartDraft,
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

describe('the draft lifecycle', () => {
    const live = (over: Partial<FormTemplate> = {}): FormTemplate =>
        draft({ status: 'published', isActive: true, version: 1, activeVersion: 1, ...over });

    describe('liveVersionNumber', () => {
        test('is the version applicants are filling in', () => {
            expect(liveVersionNumber(live())).toBe(1);
        });

        test('survives a draft being opened on top of it', () => {
            expect(liveVersionNumber({ status: 'draft', version: 2, activeVersion: 1 })).toBe(1);
        });

        test('falls back for templates published before activeVersion existed', () => {
            expect(liveVersionNumber({ status: 'published', version: 3 })).toBe(3);
        });

        test('is null when nothing has ever been published', () => {
            expect(liveVersionNumber({ status: 'draft', version: 1 })).toBeNull();
        });
    });

    describe('whyCannotStartDraft', () => {
        test('a published form may start one', () => {
            expect(whyCannotStartDraft(live())).toBeNull();
        });

        test('a form already being edited may not start a second', () => {
            expect(whyCannotStartDraft({ status: 'draft' }))
                .toBe('This form already has a draft in progress');
        });
    });

    describe('startDraftFrom', () => {
        test('takes the next version and moves the working copy to draft', () => {
            const next = startDraftFrom(live(), [{ version: 1 }]);
            expect(next).toMatchObject({ id: 'tpl-1', status: 'draft', version: 2 });
        });

        test('leaves the live version exactly where it was', () => {
            // Applicants must keep filling in version 1 while version 2 is written.
            const next = startDraftFrom(live(), [{ version: 1 }]);
            expect(next.activeVersion).toBe(1);
            expect(next.isActive).toBe(true);
            expect(liveVersionNumber(next)).toBe(1);
        });

        test('starts from the published pages, and editing them changes nothing live', () => {
            const published = live();
            const next = startDraftFrom(published, [{ version: 1 }]);

            next.pages[1].fields[0].label = 'Reworded for next cycle';
            expect(published.pages[1].fields[0].label).toBe('Title of Project');
        });

        test('refuses when a draft is already open', () => {
            expect(() => startDraftFrom(draft(), [{ version: 1 }]))
                .toThrow('This form already has a draft in progress');
        });

        test('a form never published keeps no live version', () => {
            const next = startDraftFrom(live({ status: 'published', activeVersion: undefined, version: 4 }), []);
            expect(next.version).toBe(5);
            expect(next.activeVersion).toBe(4);
        });
    });

    describe('hasUnpublishedChanges', () => {
        test('true only while a draft sits on top of a live version', () => {
            expect(hasUnpublishedChanges({ status: 'draft', version: 2, activeVersion: 1 })).toBe(true);
            expect(hasUnpublishedChanges({ status: 'published', version: 1, activeVersion: 1 })).toBe(false);
            expect(hasUnpublishedChanges({ status: 'draft', version: 1 })).toBe(false);
        });
    });

    describe('discardDraftInto', () => {
        const published = {
            templateId: 'tpl-1', version: 1, grantType: 'research' as const,
            name: 'Research Grant Application', publishedAt: 'x', publishedBy: 'a@b.org',
            pages: live().pages,
        };

        test('puts the working copy back to the published form', () => {
            const messy = draft({ version: 2, activeVersion: 1 });
            messy.pages[1].fields[0].label = 'Half-finished edit';

            const reverted = discardDraftInto(messy, published);
            expect(reverted.status).toBe('published');
            expect(reverted.version).toBe(1);
            expect(reverted.activeVersion).toBe(1);
            expect(reverted.pages[1].fields[0].label).toBe('Title of Project');
        });

        test('the restored copy is deep, so the version cannot be edited through it', () => {
            const reverted = discardDraftInto(draft({ version: 2 }), published);
            reverted.pages[1].fields[0].label = 'Changed after restore';
            expect(published.pages[1].fields[0].label).toBe('Title of Project');
        });
    });

    describe('versionAsTemplate', () => {
        test('a published version renders like the template it came from', () => {
            const asTemplate = versionAsTemplate({
                templateId: 'tpl-1', version: 3, grantType: 'nextgen',
                name: 'NextGen Grant Application', publishedAt: 'x', publishedBy: 'a@b.org',
                pages: live().pages,
            });
            expect(asTemplate).toMatchObject({
                id: 'tpl-1', grantType: 'nextgen', version: 3,
                status: 'published', isActive: true, activeVersion: 3,
            });
            expect(asTemplate.pages).toHaveLength(2);
        });
    });
});

describe('grantTypesWithoutActiveTemplate', () => {
    test('reports the grant types applicants could not apply for', () => {
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'published', version: 1 },
            { grantType: 'nextgen', isActive: false, status: 'published', version: 1 },
        ])).toEqual(['nextgen', 'nonresearch']);
    });

    test('a template that has never been published does not count as a live form', () => {
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'draft', version: 1 },
        ])).toContain('research');
    });

    test('a draft in progress does not take the live form away from applicants', () => {
        // The whole point of activeVersion: an admin editing the next form
        // must not leave applicants with nothing to fill in.
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'draft', version: 2, activeVersion: 1 },
            { grantType: 'nextgen', isActive: true, status: 'published', version: 1 },
            { grantType: 'nonresearch', isActive: true, status: 'published', version: 1 },
        ])).toEqual([]);
    });

    test('all three covered means nothing to report', () => {
        expect(grantTypesWithoutActiveTemplate([
            { grantType: 'research', isActive: true, status: 'published', version: 1 },
            { grantType: 'nextgen', isActive: true, status: 'published', version: 1 },
            { grantType: 'nonresearch', isActive: true, status: 'published', version: 1 },
        ])).toEqual([]);
    });
});
