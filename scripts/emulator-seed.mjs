// Creates a test admin in the local Firebase emulators (never the real project).
// Run after `npm run emulators`:  node scripts/emulator-seed.mjs
// Then sign in at /login (with `npm run dev:emulated`) using the values below.

export const TEST_ADMIN = { email: "admin@test.local", password: "etqan-test-123" };

const PROJECT = "ibn-taymayh";
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = "http://127.0.0.1:8080";

async function main() {
  // Reuse the account if it already exists, otherwise create it.
  let res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...TEST_ADMIN, returnSecureToken: true }),
  });
  if (!res.ok) {
    res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...TEST_ADMIN, returnSecureToken: true }),
    });
  }
  const { localId } = await res.json();
  if (!localId) throw new Error("Could not create the test user. Are the emulators running?");

  // "Bearer owner" bypasses security rules in the emulator, the same way the console does in production.
  const doc = await fetch(`${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/admins?documentId=${localId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: { note: { stringValue: "emulator test admin" } } }),
  });
  if (!doc.ok && doc.status !== 409) throw new Error(`admins doc: ${doc.status} ${await doc.text()}`);
  console.log(`Test admin ready (uid ${localId}).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
