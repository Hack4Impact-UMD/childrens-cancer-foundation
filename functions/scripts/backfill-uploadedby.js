// One-off backfill for plan 011: stamp uploadedBy metadata on legacy PDFs so
// their applicant owners can still read them under the tightened storage rules.
// Application PDFs were always stamped by the cloud function; this mainly
// affects post-grant report PDFs uploaded by the client before the fix.
//
// Setup: same GOOGLE_APPLICATION_CREDENTIALS as scripts/admin-claims.js.
// The bucket name is the storageBucket value in your FireConfig.ts.
//
// Usage (from the functions/ directory, Node 22):
//   node scripts/backfill-uploadedby.js --bucket <name>            (dry run)
//   node scripts/backfill-uploadedby.js --bucket <name> --apply    (write)
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const bucketIdx = args.indexOf("--bucket");
const bucketName = bucketIdx >= 0 ? args[bucketIdx + 1] : null;

if (!bucketName) {
  console.error("Usage: node scripts/backfill-uploadedby.js --bucket <name> [--apply]");
  process.exit(1);
}

admin.initializeApp({storageBucket: bucketName});

const findOwner = async (objectName) => {
  const db = admin.firestore();

  const apps = await db.collection("applications")
    .where("file", "==", objectName).limit(1).get();
  if (!apps.empty) {
    return {uid: apps.docs[0].data().creatorId, source: `applications/${apps.docs[0].id}`};
  }

  for (const field of ["pdf", "file"]) {
    const reports = await db.collection("post-grant-reports")
      .where(field, "==", objectName).limit(1).get();
    if (!reports.empty) {
      return {uid: reports.docs[0].data().userId, source: `post-grant-reports/${reports.docs[0].id}`};
    }
  }

  return null;
};

(async () => {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({prefix: "pdfs/"});
  console.log(`${files.length} objects under pdfs/ (mode: ${apply ? "APPLY" : "dry run"})\n`);

  let stamped = 0;
  let missing = 0;
  let orphans = 0;

  for (const file of files) {
    const [meta] = await file.getMetadata();
    if (meta.metadata && meta.metadata.uploadedBy) {
      stamped += 1;
      continue;
    }

    const objectName = file.name.replace(/^pdfs\//, "");
    const owner = await findOwner(objectName);
    if (!owner || !owner.uid) {
      orphans += 1;
      console.log(`ORPHAN  ${file.name} — no owning application or report found`);
      continue;
    }

    missing += 1;
    console.log(`${apply ? "STAMP " : "WOULD "} ${file.name} -> uploadedBy=${owner.uid} (via ${owner.source})`);
    if (apply) {
      await file.setMetadata({metadata: {uploadedBy: owner.uid}});
    }
  }

  console.log(`\nAlready stamped: ${stamped}. ${apply ? "Backfilled" : "Needing backfill"}: ${missing}. Orphans: ${orphans}.`);
  if (orphans > 0) {
    console.log("Orphans are unreferenced uploads (e.g. abandoned before submit); safe to review and delete separately.");
  }
  process.exit(0);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
