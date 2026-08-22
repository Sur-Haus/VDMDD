// One-off script: append 10 real prior donations to campaigns/vdmdd-2026.
// Run only via the "one-time-add-donors" GitHub Actions workflow, which
// supplies GOOGLE_APPLICATION_CREDENTIALS from the repo's existing
// FIREBASE_SERVICE_ACCOUNT_VDMDD_C7404 secret.

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

const newDonors = [
  { firstName: 'Sarah', city: 'Austin, TX', amount: 10, recurring: false },
  { firstName: 'Maya', city: 'Los Angeles, CA', amount: 5, recurring: false },
  { firstName: 'Liam', city: 'San Diego, CA', amount: 5, recurring: false },
  { firstName: 'Priya', city: 'Sacramento, CA', amount: 5, recurring: false },
  { firstName: 'Noah', city: 'San Francisco, CA', amount: 15, recurring: true },
  { firstName: 'Sofia', city: 'Oakland, CA', amount: 10, recurring: false },
  { firstName: 'Ethan', city: 'Fresno, CA', amount: 10, recurring: false },
  { firstName: 'Aria', city: 'San Jose, CA', amount: 10, recurring: false },
  { firstName: 'Jaxon', city: 'Denver, CO', amount: 15, recurring: true },
  { firstName: 'Zoe', city: 'Chicago, IL', amount: 15, recurring: false },
];

async function main() {
  const ref = db.collection('campaigns').doc('vdmdd-2026');
  const snap = await ref.get();
  const existing = snap.exists ? snap.data().donors || [] : [];

  console.log(`Existing donors: ${existing.length}`);
  console.log(`Adding: ${newDonors.length}`);

  await ref.set(
    { donors: admin.firestore.FieldValue.arrayUnion(...newDonors) },
    { merge: true }
  );

  const after = await ref.get();
  console.log(`Donors after write: ${(after.data().donors || []).length}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
