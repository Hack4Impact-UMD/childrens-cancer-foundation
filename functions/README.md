# CCF Cloud Functions

**The source of truth is `lib/index.js` — plain JavaScript, edited directly.**
This package was originally TypeScript; the `.ts` sources were lost and the
compiled output was adopted as the working source (2026-07). There is no build
step: `firebase deploy --only functions` ships `lib/index.js` as-is.

- Lint: `npm run lint` (must pass before deploying)
- Local run: `npm run serve` (Firebase emulators)
- Deploy: `npm run deploy` (operator-only)

Do not add a `tsc` build or `.ts` files here without migrating the whole
package back to TypeScript deliberately.
