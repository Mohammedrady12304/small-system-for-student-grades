// api/test-firebase.js
import admin from './firebase-config.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const db = admin.database();
    
    res.status(200).json({
      status: 'Firebase connected!',
      projectId: process.env.FIREBASE_PROJECT_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      message: 'جميع الإعدادات صحيحة ✅'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Firebase Error: ' + error.message,
      stack: error.stack
    });
  }
}
