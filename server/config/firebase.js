const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../src/serviceAccount.json');
    const serviceAccount = require(serviceAccountPath);
    
    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
      throw new Error('Invalid service account file: missing required fields (private_key, client_email, or project_id)');
    }
    
    if (!serviceAccount.private_key.includes('BEGIN PRIVATE KEY') || !serviceAccount.private_key.includes('END PRIVATE KEY')) {
      throw new Error('Invalid service account file: private_key is not properly formatted');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('Firebase Admin initialized successfully');
    console.log(`Project ID: ${serviceAccount.project_id}`);
    console.log(`Service Account: ${serviceAccount.client_email}`);
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
    console.error('Please check:');
    console.error('  1. serviceAccount.json file exists and is valid');
    console.error('  2. Download a new service account key from Firebase Console');
    console.error('  3. Ensure Firestore is enabled in your Firebase project');
    console.error('  4. Verify the service account has proper permissions');
    throw error;
  }
}

const db = admin.firestore();

module.exports = db;
