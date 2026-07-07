// Storage rules tests for the pdfs/ bucket path (plan 011).
// Run inside the emulator:
//   npx -y firebase-tools@13 emulators:exec --only storage --project demo-rules-test "node rules-tests/storage.rules.test.mjs"
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { ref, uploadBytes, getBytes } from 'firebase/storage';

const env = await initializeTestEnvironment({
  projectId: 'demo-rules-test',
  storage: { rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8') },
});

// Grab each context's Storage handle once — calling .storage() repeatedly
// on the same context can re-initialize the instance.
const aliceStorage = env.authenticatedContext('alice', { role: 'applicant' }).storage();
const bobStorage = env.authenticatedContext('bob', { role: 'applicant' }).storage();
const reviewerStorage = env.authenticatedContext('rev', { role: 'reviewer' }).storage();
const adminStorage = env.authenticatedContext('adm', { role: 'admin' }).storage();
const anonStorage = env.unauthenticatedContext().storage();

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"

// Seed: alice's stamped PDF, a legacy PDF with no metadata, and a non-pdfs object.
await env.withSecurityRulesDisabled(async (ctx) => {
  const s = ctx.storage();
  await uploadBytes(ref(s, 'pdfs/alice.pdf'), pdfBytes, {
    contentType: 'application/pdf',
    customMetadata: { uploadedBy: 'alice' },
  });
  await uploadBytes(ref(s, 'pdfs/legacy.pdf'), pdfBytes, {
    contentType: 'application/pdf',
  });
  await uploadBytes(ref(s, 'misc/x.txt'), new Uint8Array([0x68, 0x69]), {
    contentType: 'text/plain',
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

// 1. Owner reads their own stamped PDF — allowed.
await run('applicant reads own pdf', assertSucceeds(
  getBytes(ref(aliceStorage, 'pdfs/alice.pdf'))
));

// 2. Another applicant reads alice's PDF — DENIED (the exposure this plan closes).
await run('other applicant cannot read alice pdf', assertFails(
  getBytes(ref(bobStorage, 'pdfs/alice.pdf'))
));

// 3. Reviewer reads alice's PDF — allowed.
await run('reviewer reads alice pdf', assertSucceeds(
  getBytes(ref(reviewerStorage, 'pdfs/alice.pdf'))
));

// 4. Legacy object (no uploadedBy metadata): admin allowed, owner-applicant denied.
await run('admin reads legacy pdf', assertSucceeds(
  getBytes(ref(adminStorage, 'pdfs/legacy.pdf'))
));
await run('applicant cannot read legacy pdf (documented trade-off)', assertFails(
  getBytes(ref(aliceStorage, 'pdfs/legacy.pdf'))
));

// 5. Unauthenticated read — denied.
await run('unauthenticated cannot read pdf', assertFails(
  getBytes(ref(anonStorage, 'pdfs/alice.pdf'))
));

// 6. Applicant uploads a PDF with truthful uploadedBy — allowed.
await run('applicant uploads own-stamped pdf', assertSucceeds(
  uploadBytes(ref(aliceStorage, 'pdfs/alice-new.pdf'), pdfBytes, {
    contentType: 'application/pdf',
    customMetadata: { uploadedBy: 'alice' },
  })
));

// 7. Uploads with forged or missing uploadedBy — denied.
await run('applicant cannot upload with forged uploadedBy', assertFails(
  uploadBytes(ref(aliceStorage, 'pdfs/forged.pdf'), pdfBytes, {
    contentType: 'application/pdf',
    customMetadata: { uploadedBy: 'bob' },
  })
));
await run('applicant cannot upload without uploadedBy metadata', assertFails(
  uploadBytes(ref(aliceStorage, 'pdfs/unstamped.pdf'), pdfBytes, {
    contentType: 'application/pdf',
  })
));

// 8. Outside pdfs/: applicant denied, admin allowed.
await run('applicant cannot read outside pdfs/', assertFails(
  getBytes(ref(aliceStorage, 'misc/x.txt'))
));
await run('admin reads outside pdfs/', assertSucceeds(
  getBytes(ref(adminStorage, 'misc/x.txt'))
));

await env.cleanup();

if (failures > 0) {
  console.error(`${failures} storage rules test(s) failed`);
  process.exit(1);
}
console.log('ALL STORAGE RULES TESTS PASSED');
