import admin from 'firebase-admin';

// Get environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

console.log('🔍 Firebase Environment Check:', {
  FIREBASE_PROJECT_ID: projectId ? '✓' : '✗ MISSING',
  FIREBASE_PRIVATE_KEY: privateKey ? `✓ (${privateKey.length} chars)` : '✗ MISSING',
  FIREBASE_CLIENT_EMAIL: clientEmail ? '✓' : '✗ MISSING'
});

// Validate environment variables
if (!projectId || !privateKey || !clientEmail) {
  console.error('❌ CRITICAL: Missing Firebase environment variables!');
  console.error('Set these in Vercel Project Settings:');
  console.error('  - FIREBASE_PROJECT_ID');
  console.error('  - FIREBASE_PRIVATE_KEY');
  console.error('  - FIREBASE_CLIENT_EMAIL');
}

// Initialize Firebase
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: projectId,
      private_key_id: 'key-id',
      private_key: (privateKey || '').replace(/\\n/g, '\n'),
      client_email: clientEmail,
      client_id: 'client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${projectId}.firebaseio.com`
    });
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization ERROR:', error.message);
    throw new Error(`Firebase Init Failed: ${error.message}`);
  }
}

export default admin;
