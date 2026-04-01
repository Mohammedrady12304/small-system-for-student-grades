const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

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

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'students.json');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');
}

// Load students data from JSON file
function loadStudentsData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Save students data to JSON file
function saveStudentsData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
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
app.get('/api/getStudents', (req, res) => {
    const studentsData = loadStudentsData();
    res.json(studentsData);
});

// GET - Get student by ID
app.get('/api/students/:id', (req, res) => {
    const studentsData = loadStudentsData();
    const student = studentsData.find(s => s.id === req.params.id);

    if (student) {
        res.json(student);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

// POST - Upload Excel/CSV file
app.post('/api/upload', (req, res, next) => {
    // Add logging
    console.log('Upload request received:', {
        contentType: req.headers['content-type'],
        method: req.method,
        path: req.path
    });
    
    // Use multer middleware
    upload.single('file')(req, res, (err) => {
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
                // Parse CSV
                const csvText = req.file.buffer.toString('utf8');
                studentsData = parseCSVData(csvText);
            } else {
                // Parse Excel
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

            // Save to file
            const success = saveStudentsData(studentsData);

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
app.post('/api/students', (req, res) => {
    try {
        const { id, name, password, ...grades } = req.body;

        if (!id || !name || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let studentsData = loadStudentsData();
        
        // Check if student exists
        const existingIndex = studentsData.findIndex(s => s.id === id);
        
        const studentData = {
            id,
            name,
            password,
            ...grades
        };

        if (existingIndex !== -1) {
            // Update existing student
            studentsData[existingIndex] = studentData;
        } else {
            // Add new student
            studentsData.push(studentData);
        }

        const success = saveStudentsData(studentsData);

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
app.delete('/api/deleteAll', (req, res) => {
    try {
        const success = saveStudentsData([]);

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
app.delete('/api/students/:id', (req, res) => {
    try {
        let studentsData = loadStudentsData();
        const initialLength = studentsData.length;

        studentsData = studentsData.filter(s => s.id !== req.params.id);

        if (studentsData.length < initialLength) {
            const success = saveStudentsData(studentsData);

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
app.get('/api/export', (req, res) => {
    try {
        const studentsData = loadStudentsData();

        if (studentsData.length === 0) {
            return res.status(400).json({ error: 'No data to export' });
        }

        // Create Excel file
        const worksheet = XLSX.utils.json_to_sheet(studentsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');

        // Send file
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

// Serve static files (CSS, JS, images, etc.) - MUST come after API routes
app.use(express.static(path.join(__dirname), { 
    skip: (req) => req.path.startsWith('/api'),
    setHeaders: (res, path) => {
        // Prevent caching of index.html so api routes work properly
        if (path.endsWith('index.html')) {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Serve the frontend as fallback for single page app
app.get('*', (req, res) => {
    // If path starts with /api, it's a 404
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        // Otherwise serve index.html for SPA routing
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Data stored in: ${DATA_FILE}`);
});
