/**
 * The form template model: what a grant application form *is*, expressed as
 * data rather than JSX.
 *
 * Field IDs are a permanent data contract. Every application already stored in
 * Firestore is keyed by these IDs (`title`, `principalInvestigator`,
 * `signaturePIAgreed`, ...), so the seeded templates reuse them exactly and
 * nothing about historic data needs migrating. An ID is never renamed or
 * reused for a different question; a question that is no longer asked is
 * removed from the template while its ID keeps meaning what it always meant.
 */

export type GrantType = 'research' | 'nextgen' | 'nonresearch';

export type FieldType =
    | 'text'
    | 'textarea'
    | 'email'
    | 'phone'
    | 'number'
    | 'currency'
    | 'date'
    | 'radio'
    | 'checkbox'
    | 'select'
    | 'file';

/** Bespoke pieces the template references rather than describes. */
export type FieldComponent = 'signatureBlock' | 'fileUpload';

export interface FieldValidation {
    minLength?: number;
    maxLength?: number;
    /** Numeric bounds, for `number` and `currency`. */
    min?: number;
    max?: number;
    /** Serialised regular expression, applied to the trimmed string value. */
    pattern?: string;
    /** Shown instead of the generic message when `pattern` fails. */
    patternMessage?: string;
}

/**
 * A single test against another field's answer. Exactly one comparison key
 * should be set; `answered` tests only for the presence of any value.
 */
export interface Condition {
    field: string;
    equals?: string | number | boolean;
    notEquals?: string | number | boolean;
    oneOf?: (string | number | boolean)[];
    answered?: boolean;
    greaterThan?: number;
    lessThan?: number;
}

/** Conditions combine with `all` (AND) or `any` (OR); both may be present. */
export interface VisibilityRule {
    all?: Condition[];
    any?: Condition[];
}

export interface FormField {
    id: string;
    type: FieldType;
    /**
     * The full, unambiguous name of the question. Validation messages use it,
     * so it has to stand alone: "Department Head Signature — Full Name", not
     * "Full Name".
     */
    label: string;
    /**
     * What the renderer puts next to the input when the surrounding component
     * already supplies the context (a signature block's own heading, say).
     * Falls back to `label`.
     */
    shortLabel?: string;
    placeholder?: string;
    helpText?: string;
    required: boolean;
    /**
     * Structural fields are read by name elsewhere in the app — Grant Awards,
     * the admin database, reviewer assignment, the CSV export, the cloud
     * function. They may be reworded and moved, but never deleted, hidden,
     * made optional, or placed behind a condition.
     */
    locked?: boolean;
    /** Layout hint for the renderer. */
    width?: 'full' | 'half';
    /** Choices for `radio`, `select`. */
    options?: string[];
    validation?: FieldValidation;
    /** Absent means always visible. */
    showWhen?: VisibilityRule;
    /** Renders a purpose-built component instead of a generic input. */
    component?: FieldComponent;
    /** Free-form settings for `component`; opaque to the engine. */
    componentProps?: Record<string, any>;
}

export interface FormPage {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
    /**
     * Pages the builder does not own: the About Grant markdown and the
     * generated Review page. They carry no fields.
     */
    kind?: 'fields' | 'about' | 'review';
    showWhen?: VisibilityRule;
}

export type TemplateStatus = 'draft' | 'published';

export interface FormTemplate {
    id: string;
    grantType: GrantType;
    /** Human-readable, e.g. "Research Grant Application". */
    name: string;
    /** Version number the working copy will become when published. */
    version: number;
    /**
     * The working copy's state: 'draft' while an admin has unpublished edits,
     * 'published' when it matches the live version.
     */
    status: TemplateStatus;
    /** True for the one template applicants currently fill in for this type. */
    isActive: boolean;
    /**
     * The published version applicants actually fill in. Editing a draft never
     * moves this, so an admin can work on the next form for as long as they
     * like without disturbing the one that is live.
     */
    activeVersion?: number;
    pages: FormPage[];
    /** ISO strings; set by the service, not the builder. */
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    lastModifiedBy?: string;
}

/**
 * An immutable copy of a template as it was when published. Applications point
 * at one of these, so they must never be edited or deleted — doing so makes
 * every application referencing it unreadable.
 */
export interface PublishedVersion {
    templateId: string;
    version: number;
    grantType: GrantType;
    name: string;
    publishedAt: string;
    publishedBy: string;
    changeNote?: string;
    pages: FormPage[];
}

/** What an application stores to identify the form it was submitted under. */
export interface FormReference {
    formTemplateId: string;
    formVersion: number;
}

/** Answers keyed by field ID. */
export type Answers = Record<string, any>;

/** Validation failures keyed by field ID. */
export type FieldErrors = Record<string, string>;

export interface TemplateProblem {
    level: 'error' | 'warning';
    /** Field or page ID the problem belongs to, when there is one. */
    target?: string;
    message: string;
}
