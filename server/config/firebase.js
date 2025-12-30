const admin = require('firebase-admin');

const serviceAccount = require('../src/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'proiecttic-6d0c4.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
