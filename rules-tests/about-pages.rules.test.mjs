// Firestore rules tests for the AboutPages collection.
// The grant instructions are readable by anyone (they are shared as a public
// /grants/... link), while editing stays admin-only.
// Run inside the emulator:
//   npx -y firebase-tools@13 emulators:exec --only firestore --project demo-rules-test "node rules-tests/about-pages.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-rules-test',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

const anonDb = env.unauthenticatedContext().firestore();
const applicantDb = env.authenticatedContext('alice', { role: 'applicant' }).firestore();
const reviewerDb = env.authenticatedContext('rev', { role: 'reviewer' }).firestore();
const adminDb = env.authenticatedContext('adm', { role: 'admin' }).firestore();

await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'AboutPages/Research'), {
    title: 'About the CCF Research Award', content: '**Instructions**',
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

// 1. Signed-out visitor reads the instructions — allowed (the shared link).
await run('anonymous visitor reads about page', assertSucceeds(
  getDoc(doc(anonDb, 'AboutPages/Research'))
));

// 2. Signed-in roles still read them.
await run('applicant reads about page', assertSucceeds(
  getDoc(doc(applicantDb, 'AboutPages/Research'))
));
await run('reviewer reads about page', assertSucceeds(
  getDoc(doc(reviewerDb, 'AboutPages/Research'))
));

// 3. Public read must not become public write.
await run('anonymous visitor cannot edit about page', assertFails(
  setDoc(doc(anonDb, 'AboutPages/Research'), { content: 'defaced' })
));
await run('applicant cannot edit about page', assertFails(
  setDoc(doc(applicantDb, 'AboutPages/Research'), { content: 'defaced' })
));
await run('reviewer cannot edit about page', assertFails(
  setDoc(doc(reviewerDb, 'AboutPages/Research'), { content: 'defaced' })
));

// 4. Admin edits — allowed (unchanged behavior).
await run('admin edits about page', assertSucceeds(
  setDoc(doc(adminDb, 'AboutPages/Research'), {
    title: 'About the CCF Research Award', content: '**Updated**',
  })
));

// 5. Other collections must not have been loosened alongside AboutPages.
await run('anonymous visitor cannot read FAQs', assertFails(
  getDoc(doc(anonDb, 'FAQs/one'))
));
await run('anonymous visitor cannot read applications', assertFails(
  getDoc(doc(anonDb, 'applications/any'))
));

await env.cleanup();

if (failures > 0) {
  console.error(`${failures} rules test(s) failed`);
  process.exit(1);
}
console.log('ALL RULES TESTS PASSED');
