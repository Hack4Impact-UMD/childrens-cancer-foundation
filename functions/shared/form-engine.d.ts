/**
 * Types for the shared form engine. The implementation is plain CommonJS in
 * `form-engine.js` so the cloud function can `require` it without a build
 * step; these declarations give the React app the same safety it had when the
 * engine was TypeScript.
 */

import {
    Answers,
    Condition,
    FieldErrors,
    FormField,
    FormPage,
    FormTemplate,
    PublishedVersion,
    TemplateProblem,
    VisibilityRule,
} from '../../react-app/ccf/src/types/form-template-types';

/** Anything with pages: a draft template or a published version. */
export type FormLike = Pick<FormTemplate, 'pages'> | Pick<PublishedVersion, 'pages'>;

export declare const MAX_PATTERN_INPUT: number;

export declare function isBlank(value: any): boolean;

export declare function evaluateCondition(condition: Condition, answers: Answers): boolean;
export declare function evaluateVisibility(rule: VisibilityRule | undefined, answers: Answers): boolean;
export declare function isFieldVisible(field: FormField, answers: Answers): boolean;
export declare function isPageVisible(page: FormPage, answers: Answers): boolean;

export declare function getVisiblePages(form: FormLike, answers: Answers): FormPage[];
export declare function getVisibleFields(page: FormPage, answers: Answers): FormField[];
export declare function getAllVisibleFields(form: FormLike, answers: Answers): FormField[];

export declare function findField(form: FormLike, fieldId: string): FormField | undefined;
export declare function findPageForField(form: FormLike, fieldId: string): FormPage | undefined;

export declare function validateField(field: FormField, value: any): string | null;
export declare function validateAnswers(form: FormLike, answers: Answers, pageIds?: string[]): FieldErrors;
export declare function getProblemsByPage(form: FormLike, answers: Answers): Record<string, string[]>;
export declare function isComplete(form: FormLike, answers: Answers): boolean;

export declare function checkPatternSafety(pattern: string): string | null;
export declare function validateTemplate(template: FormTemplate): TemplateProblem[];
export declare function getLockedFieldIds(form: FormLike): string[];

/** True for the field types whose answer must be one of the field's `options`. */
export declare function isChoiceType(type: string): boolean;

/**
 * The answers with the uploaded PDF's object name standing in for every `file`
 * question, which the submission pipeline carries separately from the answers.
 */
export declare function withUploadedFile(
    form: FormLike,
    answers: Answers,
    storedFileName: string
): Answers;

/** A reference to one published version of a form. */
export interface VersionRef {
    templateId: string;
    version: number;
}

/**
 * Which rules judge a submission, given the version the client claims to have
 * rendered and the version actually live for the grant type (null if none).
 */
export declare function resolveSubmissionForm(
    claimed: Partial<VersionRef> | undefined,
    live: VersionRef | null
): { use: 'template' } | { use: 'legacy' } | { use: 'refuse'; reason: string };
