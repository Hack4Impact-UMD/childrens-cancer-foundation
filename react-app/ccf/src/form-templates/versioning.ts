/**
 * Publishing rules, as pure functions.
 *
 * A template document is the working draft an admin edits. Publishing freezes
 * a copy of it into an immutable version, and applications point at that
 * version rather than carrying their own copy of the form. The consequence the
 * whole design rests on: **a published version is never edited and never
 * deleted**, because deleting one makes every application referencing it
 * unreadable.
 *
 * The Firestore I/O lives in `backend/form-template-service.ts`; the decisions
 * live here, where they can be tested without a database.
 */

import {
    FormTemplate,
    GrantType,
    PublishedVersion,
    TemplateProblem,
} from '../types/form-template-types';
import { validateTemplate } from './engine';

/**
 * Firestore rejects a document containing `undefined` anywhere in it, and the
 * builder produces exactly that whenever an admin clears a rule — an empty
 * "Longest" box is `maxLength: undefined`, not a missing key. Strip those out
 * on the way to the database rather than making every caller remember.
 */
export const forFirestore = <T,>(value: T): T => {
    if (Array.isArray(value)) {
        return value.map((item) => forFirestore(item)) as unknown as T;
    }
    if (value && typeof value === 'object') {
        const out: Record<string, any> = {};
        for (const [key, item] of Object.entries(value as Record<string, any>)) {
            if (item === undefined) continue;
            out[key] = forFirestore(item);
        }
        return out as T;
    }
    return value;
};

export const nextVersionNumber = (existing: { version: number }[]): number =>
    existing.reduce((highest, v) => Math.max(highest, v.version), 0) + 1;

/**
 * Freeze a template into the record applications will be measured and
 * displayed against. The copy is deep so later edits to the draft cannot reach
 * back into a published version through a shared reference.
 */
export const createPublishedVersion = (
    template: FormTemplate,
    options: { publishedBy: string; publishedAt?: string; version?: number; changeNote?: string }
): PublishedVersion => {
    const version: PublishedVersion = {
        templateId: template.id,
        version: options.version ?? template.version,
        grantType: template.grantType,
        name: template.name,
        publishedAt: options.publishedAt ?? new Date().toISOString(),
        publishedBy: options.publishedBy,
        pages: JSON.parse(JSON.stringify(template.pages)),
    };
    // Firestore rejects `undefined`, so an absent note is an absent key.
    if (options.changeNote) version.changeNote = options.changeNote;
    return version;
};

export interface PublishCheck {
    ok: boolean;
    problems: TemplateProblem[];
    /** Set when publishing is allowed but deserves a warning first. */
    warning?: string;
}

/**
 * Whether a draft may be published. Structural problems block; publishing
 * into an open cycle that already has applications is allowed but warned
 * about, because rewording is safe while a new required question is not.
 */
export const checkPublishable = (
    template: FormTemplate,
    context: { cycleIsOpen?: boolean; applicationsInCycle?: number } = {}
): PublishCheck => {
    const problems = validateTemplate(template).filter((p) => p.level === 'error');
    if (problems.length > 0) {
        return { ok: false, problems };
    }

    const hasFieldPage = template.pages.some((p) => (p.kind ?? 'fields') === 'fields' && p.fields.length > 0);
    if (!hasFieldPage) {
        return {
            ok: false,
            problems: [{ level: 'error', message: 'A form needs at least one page with a question on it' }],
        };
    }

    if (context.cycleIsOpen && (context.applicationsInCycle ?? 0) > 0) {
        return {
            ok: true,
            problems: [],
            warning:
                `${context.applicationsInCycle} application(s) have already been started in the open cycle. ` +
                'Rewording a question is safe; adding a required one will block applicants who have already ' +
                'passed that page.',
        };
    }

    return { ok: true, problems: [] };
};

/**
 * Exactly one template is live per grant type. Returns the `isActive` value
 * every template of that type should end up with, so the caller can write the
 * whole set in a single batch.
 */
export const applyActivation = (
    templates: Pick<FormTemplate, 'id' | 'grantType' | 'isActive'>[],
    activateId: string
): Record<string, boolean> => {
    const target = templates.find((t) => t.id === activateId);
    if (!target) {
        throw new Error(`Cannot activate unknown template "${activateId}"`);
    }

    const result: Record<string, boolean> = {};
    for (const t of templates) {
        if (t.grantType !== target.grantType) continue;
        result[t.id] = t.id === activateId;
    }
    return result;
};

/** Only the working copy is editable; a published version is a record. */
export const canEdit = (template: Pick<FormTemplate, 'status'>): boolean =>
    template.status === 'draft';

/** The published version applicants are filling in, if there is one. */
export const liveVersionNumber = (
    template: Pick<FormTemplate, 'activeVersion' | 'version' | 'status'>
): number | null => {
    if (template.activeVersion) return template.activeVersion;
    // Templates published before activeVersion existed are their own live version.
    return template.status === 'published' ? template.version : null;
};

/** True when an admin has edits that applicants are not seeing yet. */
export const hasUnpublishedChanges = (
    template: Pick<FormTemplate, 'status' | 'activeVersion' | 'version'>
): boolean => template.status === 'draft' && liveVersionNumber(template) !== null;

/** Why a new draft cannot be started right now, or null. */
export const whyCannotStartDraft = (
    template: Pick<FormTemplate, 'status'>
): string | null =>
    template.status === 'draft' ? 'This form already has a draft in progress' : null;

/**
 * Open the next draft on a published form.
 *
 * The working copy moves to `draft` and takes the next version number, but
 * `isActive` and `activeVersion` stay exactly as they were — the live form is
 * the published version those point at, so an admin can edit for as long as
 * they like without changing what applicants see.
 */
export const startDraftFrom = (
    template: FormTemplate,
    existingVersions: { version: number }[]
): FormTemplate => {
    const reason = whyCannotStartDraft(template);
    if (reason) throw new Error(reason);

    return {
        ...template,
        pages: JSON.parse(JSON.stringify(template.pages)),
        version: nextVersionNumber(
            existingVersions.length ? existingVersions : [{ version: template.version }]
        ),
        status: 'draft',
        activeVersion: liveVersionNumber(template) ?? undefined,
    };
};

/**
 * Throw the draft away and put the working copy back to the live version —
 * the undo for "I have made a mess of this and want to start again".
 */
export const discardDraftInto = (
    template: FormTemplate,
    live: PublishedVersion
): FormTemplate => ({
    ...template,
    pages: JSON.parse(JSON.stringify(live.pages)),
    name: live.name,
    version: live.version,
    status: 'published',
    activeVersion: live.version,
});

/** A published version, shaped like the template the renderers expect. */
export const versionAsTemplate = (
    version: PublishedVersion,
    isActive = true
): FormTemplate => ({
    id: version.templateId,
    grantType: version.grantType,
    name: version.name,
    version: version.version,
    status: 'published',
    isActive,
    activeVersion: version.version,
    pages: version.pages,
});

/** Which grant types have no live form — applicants would be stuck. */
export const grantTypesWithoutActiveTemplate = (
    templates: Pick<FormTemplate, 'grantType' | 'isActive' | 'status' | 'activeVersion' | 'version'>[]
): GrantType[] => {
    const all: GrantType[] = ['research', 'nextgen', 'nonresearch'];
    return all.filter(
        (type) => !templates.some(
            (t) => t.grantType === type && t.isActive && liveVersionNumber(t) !== null
        )
    );
};
