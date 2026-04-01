import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import admin from './api/firebase-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Multer setup for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

// Get Firebase Realtime Database reference
const db = admin.database();
const STUDENTS_REF = 'students';

// Load students data from Firebase
async function loadStudentsData() {
    try {
        const snapshot = await db.ref(STUDENTS_REF).once('value');
        const data = snapshot.val();
        
        if (!data) return [];
        
        // If Firebase returns an object, convert to array
        if (typeof data === 'object' && !Array.isArray(data)) {
            return Object.values(data);
        }
        return data;
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
        return [];
    }
}

// Save students data to Firebase
async function saveStudentsData(data) {
    try {
        await db.ref(STUDENTS_REF).set(data);
        return true;
    } catch (error) {
        console.error('Error saving data to Firebase:', error);
        return false;
    }
}

// Find key in object (case insensitive)
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

// Parse Excel data
function parseExcelData(jsonData) {
    const parsed = [];

    for (let row of jsonData) {
        const idKey = findKey(row, ['ID', 'الرقم', 'رقم الطالب', 'Student ID', 'id', 'username', 'Username', 'اسم المستخدم']);
        const nameKey = findKey(row, ['الاسم', 'Name', 'name']);
        const passwordKey = findKey(row, ['الرقم السري', 'Password', 'password', 'السر']);

        if (!idKey || !nameKey || !passwordKey) {
            continue;
        }

        const student = {
            id: String(row[idKey]).trim(),
            name: String(row[nameKey]).trim(),
            password: String(row[passwordKey]).trim()
        };

        for (let key in row) {
            if (key !== idKey && key !== nameKey && key !== passwordKey && row[key] !== '' && row[key] !== null) {
                const grade = parseFloat(row[key]);
                if (!isNaN(grade)) {
                    student[key] = grade;
                }
            }
        }

        parsed.push(student);
    }

    return parsed;
}

// Parse CSV data
function parseCSVData(csvText) {
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

    return parseExcelData(jsonData);
}

// ===== API Routes =====

// GET - Load all students
app.get('/api/get-students', async (req, res) => {
    const studentsData = await loadStudentsData();
    res.json(studentsData);
});

// GET - Get student by ID
app.get('/api/students/:id', async (req, res) => {
    const studentsData = await loadStudentsData();
    const student = studentsData.find(s => s.id === req.params.id);

    if (student) {
        res.json(student);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

// POST - Upload Excel/CSV file
app.post('/api/upload', (req, res, next) => {
    console.log('Upload request received:', {
        contentType: req.headers['content-type'],
        method: req.method,
        path: req.path
    });
    
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            console.log('File received:', {
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            });

            let studentsData = [];

            if (req.file.originalname.endsWith('.csv')) {
                const csvText = req.file.buffer.toString('utf8');
                studentsData = parseCSVData(csvText);
            } else {
                const data = new Uint8Array(req.file.buffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                studentsData = parseExcelData(jsonData);
            }

            if (studentsData.length === 0) {
                return res.status(400).json({ error: 'No valid data found in file' });
            }

            const success = await saveStudentsData(studentsData);

            if (success) {
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: true,
                    message: `تم رفع الملف بنجاح! (${studentsData.length} طالب)`,
                    count: studentsData.length
                });
            } else {
                res.status(500).json({ error: 'Failed to save data' });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Error processing file: ' + error.message });
        }
    });
});

// POST - Add or update single student
app.post('/api/students', async (req, res) => {
    try {
        const { id, name, password, ...grades } = req.body;

        if (!id || !name || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let studentsData = await loadStudentsData();
        
        const existingIndex = studentsData.findIndex(s => s.id === id);
        
        const studentData = {
            id,
            name,
            password,
            ...grades
        };

        if (existingIndex !== -1) {
            studentsData[existingIndex] = studentData;
        } else {
            studentsData.push(studentData);
        }

        const success = await saveStudentsData(studentsData);

        if (success) {
            res.json({
                success: true,
                message: existingIndex !== -1 ? 'تم تحديث بيانات الطالب' : 'تم إضافة الطالب بنجاح',
                student: studentData
            });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// DELETE - Delete all data
app.delete('/api/deleteAll', async (req, res) => {
    try {
        const success = await saveStudentsData([]);

        if (success) {
            res.json({
                success: true,
                message: 'تم حذف جميع البيانات بنجاح'
            });
        } else {
            res.status(500).json({ error: 'Failed to delete data' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// DELETE - Delete specific student
app.delete('/api/students/:id', async (req, res) => {
    try {
        let studentsData = await loadStudentsData();
        const initialLength = studentsData.length;

        studentsData = studentsData.filter(s => s.id !== req.params.id);

        if (studentsData.length < initialLength) {
            const success = await saveStudentsData(studentsData);

            if (success) {
                res.json({
                    success: true,
                    message: 'تم حذف الطالب بنجاح'
                });
            } else {
                res.status(500).json({ error: 'Failed to delete student' });
            }
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// GET - Export data as backup
app.get('/api/export', async (req, res) => {
    try {
        const studentsData = await loadStudentsData();

        if (studentsData.length === 0) {
            return res.status(400).json({ error: 'No data to export' });
        }

        const worksheet = XLSX.utils.json_to_sheet(studentsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');

        const date = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename="backup_students_${date}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        XLSX.write(workbook, { bookType: 'xlsx', type: 'stream' }).pipe(res);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error: ' + error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static(path.join(__dirname), { 
    skip: (req) => req.path.startsWith('/api'),
    setHeaders: (res, path) => {
        if (path.endsWith('index.html')) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Serve the frontend as fallback
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Data stored in: Firebase Realtime Database`);
    console.log(`🔥 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
});
