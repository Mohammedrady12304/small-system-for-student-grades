import admin from 'firebase-admin';

// Initialize Firebase
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

console.log('Firebase Config:', {
  project_id: serviceAccount.project_id ? '✓' : '✗',
  private_key: serviceAccount.private_key ? '✓' : '✗',
  client_email: serviceAccount.client_email ? '✓' : '✗'
});

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
}

export default admin;
