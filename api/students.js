import admin from './firebase-config.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Health check
    return res.status(200).json({ status: 'Server is running', timestamp: new Date().toISOString() });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, name, password, ...grades } = req.body;

    if (!id || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = admin.database();
    const studentsRef = db.ref('students');
    
    const studentSnapshot = await studentsRef.child(id).get();
    const isExisting = studentSnapshot.exists();

    const studentData = {
      id,
      name,
      password,
      ...grades
    };

    await studentsRef.child(id).set(studentData);

    res.status(200).json({
      success: true,
      message: isExisting ? 'تم تحديث بيانات الطالب' : 'تم إضافة الطالب بنجاح',
      student: studentData
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
