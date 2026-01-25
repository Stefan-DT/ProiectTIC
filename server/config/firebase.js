const admin = require('firebase-admin');

let credential;
try {
  const serviceAccount = require('../src/serviceAccount.json');
  credential = admin.credential.cert(serviceAccount);
} catch (e) {
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
