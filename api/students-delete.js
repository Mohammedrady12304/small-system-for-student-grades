import admin from './firebase-config.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  try {
    const db = admin.database();
    const studentRef = db.ref(`students/${id}`);
    
    const snapshot = await studentRef.get();
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await studentRef.remove();

    res.status(200).json({
      success: true,
      message: 'تم حذف الطالب بنجاح'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
