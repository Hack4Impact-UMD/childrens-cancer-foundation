// One-off migration: move internal award comments off the applicant-readable
// decision doc.
//
// Applicants can read their own /decision-data/{applicationId} document
// (firestore.rules), so a `comments` field stored there was visible to them
// even though no applicant page rendered it. Comments now live in the
// admin-only /decision-comments/{applicationId} collection. This script copies
// each existing comment across and deletes the field from decision-data.
//
// Run this once, right after deploying the new rules. Until it runs, historical
// comments remain readable by the applicants they belong to.
//
// Setup: same GOOGLE_APPLICATION_CREDENTIALS as scripts/admin-claims.js.
//
// Usage (from the functions/ directory, Node 22):
//   node scripts/migrate-decision-comments.js            (dry run)
//   node scripts/migrate-decision-comments.js --apply    (write)
const admin = require("firebase-admin");

const apply = process.argv.slice(2).includes("--apply");

admin.initializeApp();

(async () => {
  const db = admin.firestore();
  const snapshot = await db.collection("decision-data").get();
  console.log(`${snapshot.size} decision-data docs (mode: ${apply ? "APPLY" : "dry run"})\n`);

  let moved = 0;
  let skipped = 0;
  let conflicts = 0;
  let empties = 0;

  for (const docSnap of snapshot.docs) {
    const comments = docSnap.data().comments;
    if (comments === undefined) {
      skipped += 1;
      continue;
    }

    // Present but empty (or not a string): nothing worth carrying over, but the
    // field still has to go so that "no decision-data doc has a comments field"
    // holds without exception.
    if (typeof comments !== "string" || comments.trim() === "") {
      empties += 1;
      console.log(`${apply ? "CLEAR " : "WOULD "} ${docSnap.id} — empty comment, removing the field only`);
      if (apply) {
        await docSnap.ref.update({comments: admin.firestore.FieldValue.delete()});
      }
      continue;
    }

    const targetRef = db.collection("decision-comments").doc(docSnap.id);

    // Never clobber a comment already written through the new path — an admin
    // may have edited comments between the deploy and this migration.
    const target = await targetRef.get();
    if (target.exists && typeof target.data().comments === "string" && target.data().comments.trim() !== "") {
      conflicts += 1;
      console.log(`SKIP   ${docSnap.id} — newer comment already in decision-comments; clearing the stale copy only`);
      if (apply) {
        await docSnap.ref.update({comments: admin.firestore.FieldValue.delete()});
      }
      continue;
    }

    moved += 1;
    console.log(`${apply ? "MOVE  " : "WOULD "} ${docSnap.id} — ${comments.length} chars`);
    if (apply) {
      await targetRef.set({
        applicationId: docSnap.data().applicationId || docSnap.id,
        comments,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      await docSnap.ref.update({comments: admin.firestore.FieldValue.delete()});
    }
  }

  console.log(`\n${apply ? "Moved" : "To move"}: ${moved}. Already elsewhere/stale cleared: ${conflicts}. Empty field removed: ${empties}. No comments field: ${skipped}.`);
  if (!apply && (moved > 0 || conflicts > 0 || empties > 0)) {
    console.log("Re-run with --apply to write.");
  }
  process.exit(0);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
