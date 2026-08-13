// Firestore rules tests for the applications collection (plan 002).
// Run inside the emulator:
//   npx -y firebase-tools@13 emulators:exec --only firestore --project demo-rules-test "node rules-tests/applications.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

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

const seedAliceDraft = () =>
  env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'applications/aliceDraft'), {
      creatorId: 'alice', status: 'draft', grantType: 'research', title: 'T',
    });
  });
await seedAliceDraft();

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

// 1. Applicant creates their own draft — allowed.
await run('applicant creates own draft', assertSucceeds(
  setDoc(doc(applicantDb, 'applications/newDraft'), {
    creatorId: 'alice', status: 'draft', title: 'x',
  })
));

// 2. Applicant creates a doc pre-marked submitted — DENIED (the forgery).
await run('applicant cannot forge a submitted application', assertFails(
  setDoc(doc(applicantDb, 'applications/forged'), {
    creatorId: 'alice', status: 'submitted', decision: 'accepted',
  })
));

// 3. Applicant creates a doc owned by someone else — DENIED.
await run('applicant cannot create a doc for another creator', assertFails(
  setDoc(doc(applicantDb, 'applications/spoofed'), {
    creatorId: 'bob', status: 'draft',
  })
));

// 4. Applicant updates their own draft, keeping status draft — allowed (saveDraft).
await run('applicant updates own draft (saveDraft shape)', assertSucceeds(
  updateDoc(doc(applicantDb, 'applications/aliceDraft'), {
    title: 'new', status: 'draft',
  })
));

// 5. Applicant flips their draft to submitted — DENIED (the flip).
await run('applicant cannot flip draft to submitted', assertFails(
  updateDoc(doc(applicantDb, 'applications/aliceDraft'), {
    status: 'submitted',
  })
));

// 6. Another applicant updates alice's draft — DENIED.
await run('other applicant cannot update alice draft', assertFails(
  updateDoc(doc(otherApplicantDb, 'applications/aliceDraft'), {
    title: 'hijack', status: 'draft',
  })
));

// 7. Applicant transfers ownership — DENIED.
await run('applicant cannot transfer ownership', assertFails(
  updateDoc(doc(applicantDb, 'applications/aliceDraft'), {
    creatorId: 'bob', status: 'draft',
  })
));

// 9. Reviewer reads the draft — allowed (unchanged behavior). (Before case 8 so the doc still exists.)
await run('reviewer reads application', assertSucceeds(
  getDoc(doc(reviewerDb, 'applications/aliceDraft'))
));

// 10. Another applicant reads alice's draft — DENIED (unchanged behavior).
await run('other applicant cannot read alice draft', assertFails(
  getDoc(doc(otherApplicantDb, 'applications/aliceDraft'))
));

// 8. Applicant deletes their own draft — allowed (post-submit cleanup). Ordered last among aliceDraft cases.
await run('applicant deletes own draft', assertSucceeds(
  deleteDoc(doc(applicantDb, 'applications/aliceDraft'))
));

// 11. Admin creates a submitted doc for anyone — allowed (admin branch unchanged).
await run('admin can create submitted docs', assertSucceeds(
  setDoc(doc(adminDb, 'applications/adminMade'), {
    creatorId: 'anyone', status: 'submitted',
  })
));

await env.cleanup();

if (failures > 0) {
  console.error(`${failures} rules test(s) failed`);
  process.exit(1);
}
console.log('ALL RULES TESTS PASSED');
