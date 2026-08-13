// Firestore rules tests for the decision collections.
// decision-data is readable by the owning applicant, so internal award comments
// live in the admin-only decision-comments collection instead.
// Run inside the emulator:
//   npx -y firebase-tools@13 emulators:exec --only firestore --project demo-rules-test "node rules-tests/decisions.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-rules-test',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});

// Grab each context's Firestore handle once — calling .firestore() repeatedly
// on the same context throws "Firestore has already been started".
const applicantDb = env.authenticatedContext('alice', { role: 'applicant' }).firestore();
const otherApplicantDb = env.authenticatedContext('bob', { role: 'applicant' }).firestore();
const reviewerDb = env.authenticatedContext('rev', { role: 'reviewer' }).firestore();
const adminDb = env.authenticatedContext('adm', { role: 'admin' }).firestore();

// Seed: one application owned by alice, its decision doc, and its internal
// comments doc.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'applications/aliceApp'), {
    creatorId: 'alice', status: 'submitted', decision: 'accepted', grantType: 'research', title: 'T',
  });
  await setDoc(doc(db, 'decision-data/aliceApp'), {
    applicationId: 'aliceApp', decision: 'accepted', isAccepted: true, fundingAmount: 5000,
  });
  await setDoc(doc(db, 'decision-comments/aliceApp'), {
    applicationId: 'aliceApp', comments: 'Committee had reservations about the budget.',
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

// decision-data: unchanged behavior — the owning applicant may read their own
// decision, which is why nothing internal may be stored on it.
await run('applicant reads own decision', assertSucceeds(
  getDoc(doc(applicantDb, 'decision-data/aliceApp'))
));
await run('other applicant cannot read alice decision', assertFails(
  getDoc(doc(otherApplicantDb, 'decision-data/aliceApp'))
));
await run('applicant cannot write their own decision', assertFails(
  setDoc(doc(applicantDb, 'decision-data/aliceApp'), { isAccepted: true, fundingAmount: 999999 })
));

// decision-comments: admin-only. These are the cases that make hiding the
// comments in React actually mean something.
await run('applicant cannot read own award comments', assertFails(
  getDoc(doc(applicantDb, 'decision-comments/aliceApp'))
));
await run('applicant cannot list award comments', assertFails(
  getDocs(collection(applicantDb, 'decision-comments'))
));
await run('other applicant cannot read award comments', assertFails(
  getDoc(doc(otherApplicantDb, 'decision-comments/aliceApp'))
));
await run('reviewer cannot read award comments', assertFails(
  getDoc(doc(reviewerDb, 'decision-comments/aliceApp'))
));
await run('applicant cannot write award comments', assertFails(
  setDoc(doc(applicantDb, 'decision-comments/aliceApp'), { comments: 'flattering self-review' })
));
await run('admin reads award comments', assertSucceeds(
  getDoc(doc(adminDb, 'decision-comments/aliceApp'))
));
await run('admin lists award comments', assertSucceeds(
  getDocs(collection(adminDb, 'decision-comments'))
));
await run('admin writes award comments', assertSucceeds(
  setDoc(doc(adminDb, 'decision-comments/aliceApp'), {
    applicationId: 'aliceApp', comments: 'Updated committee note.',
  })
));

await env.cleanup();

if (failures > 0) {
  console.error(`${failures} rules test(s) failed`);
  process.exit(1);
}
console.log('ALL RULES TESTS PASSED');
