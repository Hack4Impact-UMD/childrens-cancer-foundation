// Firestore rules tests for form templates (P1 of the form builder).
//
// The rule that matters most: a published version is create-only. Applications
// are rendered and validated against the version they were submitted under, so
// an edited or deleted version silently rewrites — or destroys — history.
//
// Run inside the emulator:
//   npx -y firebase-tools@13 emulators:exec --only firestore --project demo-rules-test "node rules-tests/form-templates.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-rules-test',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

const anonDb = env.unauthenticatedContext().firestore();
const applicantDb = env.authenticatedContext('alice', { role: 'applicant' }).firestore();
const reviewerDb = env.authenticatedContext('rev', { role: 'reviewer' }).firestore();
const adminDb = env.authenticatedContext('adm', { role: 'admin' }).firestore();

const TEMPLATE = 'formTemplates/seed-research';
const VERSION = `${TEMPLATE}/versions/1`;

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, TEMPLATE), {
    grantType: 'research', name: 'Research Grant Application',
    version: 1, status: 'published', isActive: true, pages: [],
  });
  await setDoc(doc(db, VERSION), {
    templateId: 'seed-research', version: 1, grantType: 'research',
    name: 'Research Grant Application', publishedAt: '2027-01-01T00:00:00.000Z',
    publishedBy: 'admin@ccf.org', pages: [],
  });
});

let failures = 0;
const run = async (name, promise) => {
  try {
    await promise;
    console.log(`PASS: ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`FAIL: ${name}\n  ${e.message}`);
  }
};

// --- Reading -------------------------------------------------------------

// 1. Applicants must read the live form to fill it in.
await run('applicant reads a template', assertSucceeds(getDoc(doc(applicantDb, TEMPLATE))));
await run('applicant reads a published version', assertSucceeds(getDoc(doc(applicantDb, VERSION))));

// 2. Reviewers and admins read them to display submitted applications.
await run('reviewer reads a template', assertSucceeds(getDoc(doc(reviewerDb, TEMPLATE))));
await run('reviewer reads a published version', assertSucceeds(getDoc(doc(reviewerDb, VERSION))));
await run('admin reads a template', assertSucceeds(getDoc(doc(adminDb, TEMPLATE))));

// 3. Templates are not public. Unlike the grant instructions, these are
//    internal structure and stay behind a login.
await run('anonymous visitor cannot read a template', assertFails(getDoc(doc(anonDb, TEMPLATE))));
await run('anonymous visitor cannot read a version', assertFails(getDoc(doc(anonDb, VERSION))));

// --- Editing templates ---------------------------------------------------

// 4. Only admins build forms.
await run('applicant cannot edit a template', assertFails(
  updateDoc(doc(applicantDb, TEMPLATE), { name: 'Free money application' })
));
await run('reviewer cannot edit a template', assertFails(
  updateDoc(doc(reviewerDb, TEMPLATE), { name: 'Reviewer edit' })
));
await run('anonymous visitor cannot create a template', assertFails(
  setDoc(doc(anonDb, 'formTemplates/injected'), { grantType: 'research', pages: [] })
));
await run('admin edits a template', assertSucceeds(
  updateDoc(doc(adminDb, TEMPLATE), { name: 'Research Grant Application 2027' })
));
await run('admin creates a template', assertSucceeds(
  setDoc(doc(adminDb, 'formTemplates/tpl-new'), {
    grantType: 'nextgen', name: 'Draft', version: 1, status: 'draft', isActive: false, pages: [],
  })
));

// --- Published versions are immutable ------------------------------------

// 5. Publishing writes a new version.
await run('admin creates a new version', assertSucceeds(
  setDoc(doc(adminDb, `${TEMPLATE}/versions/2`), {
    templateId: 'seed-research', version: 2, grantType: 'research', name: 'v2',
    publishedAt: '2027-02-01T00:00:00.000Z', publishedBy: 'admin@ccf.org', pages: [],
  })
));

// 6. Nobody rewrites history — not even the admin who published it.
await run('admin cannot edit a published version', assertFails(
  updateDoc(doc(adminDb, VERSION), { name: 'Rewritten after the fact' })
));
await run('admin cannot overwrite a published version', assertFails(
  setDoc(doc(adminDb, VERSION), {
    templateId: 'seed-research', version: 1, grantType: 'research', name: 'Replaced',
    publishedAt: '2027-01-01T00:00:00.000Z', publishedBy: 'admin@ccf.org', pages: [],
  })
));
await run('admin cannot delete a published version', assertFails(deleteDoc(doc(adminDb, VERSION))));
await run('applicant cannot create a version', assertFails(
  setDoc(doc(applicantDb, `${TEMPLATE}/versions/99`), { version: 99, pages: [] })
));
await run('reviewer cannot delete a version', assertFails(deleteDoc(doc(reviewerDb, VERSION))));

// --- Nothing else moved --------------------------------------------------

// 7. Adding these collections must not have loosened anything nearby.
await run('applicant still cannot read another applicant\'s application', assertFails(
  getDoc(doc(applicantDb, 'applications/someoneElse'))
));
await run('anonymous visitor still cannot read FAQs', assertFails(getDoc(doc(anonDb, 'FAQs/one'))));

await env.cleanup();

if (failures > 0) {
  console.error(`${failures} rules test(s) failed`);
  process.exit(1);
}
console.log('ALL RULES TESTS PASSED');
