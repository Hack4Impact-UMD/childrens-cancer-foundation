/**
 * Firestore access for form templates.
 *
 * Layout:
 *   formTemplates/{templateId}                 the working draft admins edit
 *   formTemplates/{templateId}/versions/{n}    immutable published copies
 *
 * Applications reference a version by `formTemplateId` + `formVersion`, so a
 * published version is never edited and never deleted — doing so would make
 * every application pointing at it unreadable. The rules enforce that; this
 * module simply never asks.
 *
 * All the decisions (what the next version number is, which templates end up
 * active, whether a draft may be published) live in `form-templates/versioning`
 * so they can be tested without a database.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../index';
import {
    FormTemplate,
    GrantType,
    PublishedVersion,
} from '../types/form-template-types';
import {
    applyActivation,
    canEdit,
    checkPublishable,
    createPublishedVersion,
    discardDraftInto,
    forFirestore,
    liveVersionNumber,
    nextVersionNumber,
    startDraftFrom,
    versionAsTemplate,
    whyCannotStartDraft,
} from '../form-templates/versioning';
import { getSeedTemplate } from '../form-templates/seed';

const TEMPLATES = 'formTemplates';
const VERSIONS = 'versions';

const templateRef = (templateId: string) => doc(db, TEMPLATES, templateId);
const versionsRef = (templateId: string) => collection(db, TEMPLATES, templateId, VERSIONS);
const versionRef = (templateId: string, version: number) =>
    doc(db, TEMPLATES, templateId, VERSIONS, String(version));

export const getTemplate = async (templateId: string): Promise<FormTemplate | null> => {
    const snap = await getDoc(templateRef(templateId));
    return snap.exists() ? ({ ...(snap.data() as FormTemplate), id: snap.id }) : null;
};

export const listTemplates = async (grantType?: GrantType): Promise<FormTemplate[]> => {
    const snap = grantType
        ? await getDocs(query(collection(db, TEMPLATES), where('grantType', '==', grantType)))
        : await getDocs(collection(db, TEMPLATES));
    return snap.docs.map((d) => ({ ...(d.data() as FormTemplate), id: d.id }));
};

/**
 * The form applicants fill in for a grant type.
 *
 * This resolves to the *published version* the active template points at, not
 * to the template document — the document holds the admin's working copy, and
 * an unfinished draft must never reach an applicant.
 *
 * Falls back to the seeded form if nothing is published yet, or if Firestore
 * is unreachable, rather than showing an applicant an empty form.
 */
export const getActiveTemplate = async (grantType: GrantType): Promise<FormTemplate> => {
    try {
        const snap = await getDocs(
            query(
                collection(db, TEMPLATES),
                where('grantType', '==', grantType),
                where('isActive', '==', true)
            )
        );
        const [match] = snap.docs;
        if (match) {
            const template = { ...(match.data() as FormTemplate), id: match.id };
            const live = liveVersionNumber(template);
            if (live) {
                const published = await getVersion(template.id, live);
                if (published) return versionAsTemplate(published);
            }
        }
    } catch (error) {
        console.error('Error loading active form template:', error);
    }
    return getSeedTemplate(grantType);
};

export const listVersions = async (templateId: string): Promise<PublishedVersion[]> => {
    const snap = await getDocs(versionsRef(templateId));
    return snap.docs
        .map((d) => d.data() as PublishedVersion)
        .sort((a, b) => a.version - b.version);
};

/**
 * The version an application was submitted under. Returns null when it cannot
 * be found; callers fall back to the seed rather than rendering nothing.
 */
export const getVersion = async (
    templateId: string,
    version: number
): Promise<PublishedVersion | null> => {
    const snap = await getDoc(versionRef(templateId, version));
    return snap.exists() ? (snap.data() as PublishedVersion) : null;
};

export const saveDraft = async (template: FormTemplate, editedBy: string): Promise<void> => {
    if (!canEdit(template)) {
        throw new Error('Published versions are a historical record and cannot be edited.');
    }
    await setDoc(
        templateRef(template.id),
        forFirestore({
            ...template,
            status: 'draft',
            updatedAt: new Date().toISOString(),
            lastModifiedBy: editedBy,
        }),
        { merge: true }
    );
};

export interface PublishResult {
    ok: boolean;
    version?: number;
    /** Reasons publishing was refused. */
    errors?: string[];
    /** Present when publishing succeeded but the admin should know something. */
    warning?: string;
}

/**
 * Freeze the draft into a new immutable version and make it the live form.
 * The version write and the activation happen in one batch so there is never a
 * moment where a grant type has no active template.
 */
export const publishTemplate = async (
    templateId: string,
    publishedBy: string,
    options: { changeNote?: string; cycleIsOpen?: boolean; applicationsInCycle?: number } = {}
): Promise<PublishResult> => {
    const template = await getTemplate(templateId);
    if (!template) return { ok: false, errors: ['Template not found'] };

    const check = checkPublishable(template, options);
    if (!check.ok) {
        return { ok: false, errors: check.problems.map((p) => p.message) };
    }

    const existing = await listVersions(templateId);
    const version = nextVersionNumber(existing);
    const frozen = createPublishedVersion(template, {
        publishedBy,
        version,
        changeNote: options.changeNote,
    });

    const siblings = await listTemplates(template.grantType);
    const activation = applyActivation(
        [...siblings.filter((t) => t.id !== templateId), { ...template, isActive: true }],
        templateId
    );

    const batch = writeBatch(db);
    batch.set(versionRef(templateId, version), forFirestore(frozen));
    batch.update(templateRef(templateId), {
        version,
        status: 'published',
        isActive: true,
        activeVersion: version,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: publishedBy,
    });
    Object.entries(activation)
        .filter(([id]) => id !== templateId)
        .forEach(([id, isActive]) => batch.update(templateRef(id), { isActive }));

    await batch.commit();
    return { ok: true, version, warning: check.warning };
};

/** Make an already-published template the live one for its grant type. */
export const activateTemplate = async (templateId: string): Promise<void> => {
    const template = await getTemplate(templateId);
    if (!template) throw new Error('Template not found');
    if (template.status !== 'published') {
        throw new Error('Only a published template can be made live.');
    }

    const siblings = await listTemplates(template.grantType);
    const activation = applyActivation(siblings, templateId);

    const batch = writeBatch(db);
    Object.entries(activation).forEach(([id, isActive]) => {
        batch.update(templateRef(id), { isActive });
    });
    await batch.commit();
};

/**
 * Write the seeded templates into Firestore. Idempotent: an existing template
 * is left alone, so running this twice cannot overwrite an admin's edits.
 * Intended to be run once by an admin when the builder is first enabled.
 */
export const seedTemplatesIfMissing = async (seededBy: string): Promise<GrantType[]> => {
    const created: GrantType[] = [];

    for (const grantType of ['research', 'nextgen', 'nonresearch'] as GrantType[]) {
        const seed = getSeedTemplate(grantType);
        const existing = await getDoc(templateRef(seed.id));
        if (existing.exists()) continue;

        const now = new Date().toISOString();
        const batch = writeBatch(db);
        batch.set(templateRef(seed.id), forFirestore({
            ...seed,
            activeVersion: seed.version,
            createdAt: now,
            updatedAt: now,
            createdBy: seededBy,
            lastModifiedBy: seededBy,
        }));
        batch.set(
            versionRef(seed.id, seed.version),
            forFirestore(createPublishedVersion(seed, {
                publishedBy: seededBy,
                publishedAt: now,
                changeNote: 'Seeded from the forms in use before the builder existed',
            }))
        );
        await batch.commit();
        created.push(grantType);
    }

    return created;
};

/**
 * Open the next draft on a published form. The live version keeps serving
 * applicants throughout — only the working copy changes.
 */
export const startNewDraft = async (
    templateId: string,
    editedBy: string
): Promise<FormTemplate> => {
    const template = await getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const reason = whyCannotStartDraft(template);
    if (reason) throw new Error(reason);

    const draft = startDraftFrom(template, await listVersions(templateId));
    await setDoc(
        templateRef(templateId),
        forFirestore({
            ...draft,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: editedBy,
        })
    );
    return draft;
};

/** Throw the draft away and put the working copy back to the live version. */
export const discardDraft = async (
    templateId: string,
    editedBy: string
): Promise<FormTemplate> => {
    const template = await getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const live = liveVersionNumber({ ...template, status: 'published' });
    const published = live ? await getVersion(templateId, live) : null;
    if (!published) {
        throw new Error('This form has never been published, so there is nothing to go back to.');
    }

    const reverted = discardDraftInto(template, published);
    await setDoc(
        templateRef(templateId),
        forFirestore({
            ...reverted,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: editedBy,
        })
    );
    return reverted;
};

/** Draft-only convenience for the builder: rename without a full save. */
export const renameTemplate = async (templateId: string, name: string): Promise<void> => {
    await updateDoc(templateRef(templateId), { name, updatedAt: new Date().toISOString() });
};
