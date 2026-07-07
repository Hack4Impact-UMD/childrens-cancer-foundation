// One-off operator tool for auth custom claims (plan 013 follow-up).
//
// Setup (once):
//   Firebase console > Project settings > Service accounts > Generate new private key
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//
// Usage (from the functions/ directory, Node 22):
//   node scripts/admin-claims.js audit
//   node scripts/admin-claims.js make-admin someone@example.com
//   node scripts/admin-claims.js set-role someone@example.com applicant
//
// Note: a changed claim takes effect after the user's ID token refreshes
// (sign out/in, or within ~1 hour).
const admin = require("firebase-admin");

admin.initializeApp();

const [, , command, email, role] = process.argv;

const audit = async () => {
  const rows = [];
  let pageToken;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    for (const user of page.users) {
      if (user.customClaims && Object.keys(user.customClaims).length > 0) {
        rows.push({
          email: user.email,
          uid: user.uid,
          claims: user.customClaims,
          created: user.metadata.creationTime,
        });
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  const admins = rows.filter((r) => r.claims.role === "admin");
  console.log(`Users with custom claims: ${rows.length}`);
  for (const r of rows) {
    console.log(`  ${r.claims.role || JSON.stringify(r.claims)}  ${r.email}  (uid ${r.uid}, created ${r.created})`);
  }
  console.log(`\nADMINS (${admins.length}) — verify every one of these is legitimate:`);
  for (const r of admins) {
    console.log(`  ${r.email}  (uid ${r.uid}, created ${r.created})`);
  }
};

const setRole = async (targetEmail, targetRole) => {
  const user = await admin.auth().getUserByEmail(targetEmail);
  await admin.auth().setCustomUserClaims(user.uid, {role: targetRole});
  console.log(`Set role "${targetRole}" on ${targetEmail} (uid ${user.uid}).`);
  console.log("The change applies once their ID token refreshes (sign out/in).");
};

(async () => {
  if (command === "audit") {
    await audit();
  } else if (command === "make-admin" && email) {
    await setRole(email, "admin");
  } else if (command === "set-role" && email && role) {
    await setRole(email, role);
  } else {
    console.error("Usage: node scripts/admin-claims.js audit | make-admin <email> | set-role <email> <role>");
    process.exit(1);
  }
  process.exit(0);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
