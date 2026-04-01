import admin from './firebase-config.js';
import cors from 'cors';
import busboy from 'busboy';
import XLSX from 'xlsx';

const corsHandler = cors({ origin: '*' });

function findKey(obj, possibleKeys) {
  for (let key of possibleKeys) {
    if (key in obj) return key;
    for (let objKey in obj) {
      if (objKey.toLowerCase() === key.toLowerCase()) {
        return objKey;
      }
    }
  }
  return null;
}

function parseExcelData(jsonData) {
  const parsed = [];
  for (let row of jsonData) {
    const idKey = findKey(row, ['ID', 'الرقم', 'رقم الطالب', 'Student ID', 'id', 'username', 'Username', 'اسم المستخدم']);
    const nameKey = findKey(row, ['الاسم', 'Name', 'name']);
    const passwordKey = findKey(row, ['الرقم السري', 'Password', 'password', 'السر']);

    if (!idKey || !nameKey || !passwordKey) continue;

    const student = {
      id: String(row[idKey]).trim(),
      name: String(row[nameKey]).trim(),
      password: String(row[passwordKey]).trim()
    };

    for (let key in row) {
      if (key !== idKey && key !== nameKey && key !== passwordKey && row[key] !== '' && row[key] !== null) {
        const grade = parseFloat(row[key]);
        if (!isNaN(grade)) student[key] = grade;
      }
    }
    parsed.push(student);
  }
  return parsed;
}

export const config = {
  api: { bodyParser: false }, // Handle file upload manually
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // استخدام Promise لضمان عدم إغلاق Vercel للاتصال مبكراً
  return new Promise((resolve, reject) => {
    try {
      if (!admin.apps || admin.apps.length === 0) {
        res.status(500).json({ error: 'Firebase not initialized' });
        return resolve();
      }

      const bb = busboy({ headers: req.headers });
      let fileBuffer = Buffer.alloc(0);
      let fileName = '';

      bb.on('file', (fieldname, file, info) => {
        fileName = info.filename;
        file.on('data', (data) => {
          fileBuffer = Buffer.concat([fileBuffer, data]);
        });
      });

      bb.on('close', async () => {
        if (fileBuffer.length === 0) {
          res.status(400).json({ error: 'No file provided' });
          return resolve();
        }

        try {
          let studentsData = [];
          if (fileName.endsWith('.csv')) {
            const csvText = fileBuffer.toString('utf8');
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const jsonData = [];
            
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((header, index) => {
                  obj[header] = values[index] || '';
                });
                jsonData.push(obj);
              }
            }
            studentsData = parseExcelData(jsonData);
          } else {
            const data = new Uint8Array(fileBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            studentsData = parseExcelData(jsonData);
          }

          if (studentsData.length === 0) {
            res.status(400).json({ error: 'No valid data found in file' });
            return resolve();
          }

          // Save to Firebase
          const db = admin.database();
          const studentsRef = db.ref('students');
          
          const studentsMap = {};
          studentsData.forEach((student) => {
            studentsMap[student.id] = student;
          });

          await studentsRef.set(studentsMap);

          res.status(200).json({
            success: true,
            message: `تم رفع الملف بنجاح! (${studentsData.length} طالب)`,
            count: studentsData.length
          });
          return resolve(); // إبلاغ Vercel بانتهاء العملية

        } catch (error) {
          res.status(500).json({ error: 'Error processing file: ' + error.message });
          return resolve();
        }
      });

      bb.on('error', (error) => {
        res.status(500).json({ error: 'Error uploading file: ' + error.message });
        return resolve();
      });

      req.pipe(bb);
    } catch (error) {
      res.status(500).json({ error: error.message });
      return resolve();
    }
  });
}