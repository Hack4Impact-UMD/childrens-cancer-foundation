/**
 * The form engine, re-exported with types.
 *
 * The implementation lives in `functions/shared/form-engine.js` — plain
 * CommonJS, so the cloud function can require it without a build step — and
 * reaches the app through the `@ccf/form-engine` alias in craco.config.js.
 * This module exists so app code keeps importing a normal TypeScript path and
 * gets full types, while there is still only one implementation of "is this
 * answer valid" in the codebase.
 */

export * from '@ccf/form-engine';
export type { FormLike } from '@ccf/form-engine';
