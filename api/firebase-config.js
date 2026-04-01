import admin from 'firebase-admin';

// Initialize Firebase
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

console.log('Firebase Config Check:', {
  project_id: serviceAccount.project_id ? 'Set ✓' : 'Missing ✗',
  private_key: serviceAccount.private_key ? `Set ✓ (${serviceAccount.private_key.length} chars)` : 'Missing ✗',
  client_email: serviceAccount.client_email ? 'Set ✓' : 'Missing ✗'
});

// Debug
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.warn('⚠️ Firebase environment variables not fully set');
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('Service Account:', {
      project_id: serviceAccount.project_id?.substring(0, 10),
      private_key: serviceAccount.private_key?.substring(0, 20) + '...',
      client_email: serviceAccount.client_email?.substring(0, 20) + '...'
    });
  }
}

export default admin;
