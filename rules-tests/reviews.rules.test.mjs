// Firestore rules tests for reviewer write-scoping (plan 014):
// reviews tree, reviewer profiles, applicant docs.
// Run inside the emulator:
//   npx -y firebase-tools@13 emulators:exec --only firestore --project demo-rules-test "node rules-tests/reviews.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, addDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-rules-test',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

// Grab each context's Firestore handle once — calling .firestore() repeatedly
// on the same context throws "Firestore has already been started".
const reviewerADb = env.authenticatedContext('revA', { role: 'reviewer' }).firestore();
const reviewerBDb = env.authenticatedContext('revB', { role: 'reviewer' }).firestore();
const adminDb = env.authenticatedContext('adm', { role: 'admin' }).firestore();

// Seed: one application's review tree with a review doc per reviewer, two
// reviewer profiles, and one applicant doc.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'reviews/app1'), { applicationId: 'app1' });
  await setDoc(doc(db, 'reviews/app1/reviewers/rA'), {
    reviewerId: 'revA', reviewerType: 'primary', score: null, status: 'not-started',
  });
  await setDoc(doc(db, 'reviews/app1/reviewers/rB'), {
    reviewerId: 'revB', reviewerType: 'secondary', score: null, status: 'not-started',
  });
  await setDoc(doc(db, 'reviewers/revA'), { email: 'a@x.org', assignedApplications: ['app1'] });
  await setDoc(doc(db, 'reviewers/revB'), { email: 'b@x.org', assignedApplications: ['app1'] });
  await setDoc(doc(db, 'applicants/alice'), { email: 'alice@x.com' });
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

// Review docs: own vs someone else's.
await run('reviewer updates own review', assertSucceeds(
  updateDoc(doc(reviewerADb, 'reviews/app1/reviewers/rA'), { score: 4, status: 'completed' })
));
await run('reviewer cannot update another reviewer\'s review', assertFails(
  updateDoc(doc(reviewerADb, 'reviews/app1/reviewers/rB'), { score: 1 })
));

// Review doc create/delete: admin-only.
await run('reviewer cannot create a review doc', assertFails(
  addDoc(collection(reviewerADb, 'reviews/app1/reviewers'), { reviewerId: 'revA', score: 5 })
));
await run('reviewer cannot delete a review doc', assertFails(
  deleteDoc(doc(reviewerADb, 'reviews/app1/reviewers/rB'))
));
await run('admin creates a review doc', assertSucceeds(
  setDoc(doc(adminDb, 'reviews/app1/reviewers/rC'), { reviewerId: 'revC', reviewerType: 'primary' })
));
await run('admin deletes a review doc', assertSucceeds(
  deleteDoc(doc(adminDb, 'reviews/app1/reviewers/rC'))
));

// Parent reviews doc: assignment's setDoc-merge shape still works for admin,
// and reviewers keep read access.
await run('admin upserts parent review doc (assignment flow)', assertSucceeds(
  setDoc(doc(adminDb, 'reviews/app2'), { applicationId: 'app2' }, { merge: true })
));
await run('reviewer reads a review doc', assertSucceeds(
  getDoc(doc(reviewerBDb, 'reviews/app1/reviewers/rA'))
));

// Reviewer profiles: self or admin only.
await run('reviewer updates own profile', assertSucceeds(
  updateDoc(doc(reviewerADb, 'reviewers/revA'), { title: 'Dr.' })
));
await run('reviewer cannot update another reviewer\'s profile', assertFails(
  updateDoc(doc(reviewerADb, 'reviewers/revB'), { assignedApplications: [] })
));
await run('admin updates any reviewer profile', assertSucceeds(
  updateDoc(doc(adminDb, 'reviewers/revB'), { title: 'Prof.' })
));

// Applicant docs: reviewers read-only.
await run('reviewer reads an applicant doc', assertSucceeds(
  getDoc(doc(reviewerADb, 'applicants/alice'))
));
await run('reviewer cannot write an applicant doc', assertFails(
  updateDoc(doc(reviewerADb, 'applicants/alice'), { email: 'evil@x.com' })
));

await env.cleanup();

if (failures > 0) {
  console.error(`${failures} reviews rules test(s) failed`);
  process.exit(1);
}
console.log('ALL REVIEWS RULES TESTS PASSED');
