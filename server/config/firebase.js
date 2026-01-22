const admin = require('firebase-admin');

let credential;
try {
  // Local dev (file is gitignored). Keep this path for your current setup.
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const serviceAccount = require('../src/serviceAccount.json');
  credential = admin.credential.cert(serviceAccount);
} catch (e) {
  // Production (App Hosting / Cloud Run): use Application Default Credentials.
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({
  credential,
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || 'proiecttic-6d0c4.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
