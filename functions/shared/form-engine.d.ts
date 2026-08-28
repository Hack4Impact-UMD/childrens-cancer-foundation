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
