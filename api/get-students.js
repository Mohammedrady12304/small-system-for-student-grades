import admin from './firebase-config.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!admin.apps || admin.apps.length === 0) {
      console.error('Firebase not initialized');
      return res.status(500).json({ error: 'Firebase not initialized' });
    }

    const db = admin.database();
    const studentsRef = db.ref('students');
    
    const snapshot = await studentsRef.get();
    const students = snapshot.val() || {};
    
    // Convert object to array if needed
    const studentArray = Array.isArray(students) ? students : Object.values(students);
    
    res.status(200).json(studentArray);
  } catch (error) {
    console.error('Error loading students:', error);
    res.status(500).json({ error: error.message });
  }
}
