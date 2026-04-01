// Global variables
let studentsData = [];
const ADMIN_PASSWORD = "admin123"; // Change this to a secure password

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadStudentsData();
    // Check if XLSX is loaded
    if (typeof XLSX === 'undefined') {
        console.warn('تحذير: مكتبة XLSX لم تحمّل بعد. جاري إعادة محاولة...');
        setTimeout(function() {
            if (typeof XLSX === 'undefined') {
                console.error('خطأ: تعذر تحميل مكتبة XLSX');
            }
        }, 2000);
    }
});

// Switch between student and admin tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    if (tab === 'student') {
        document.getElementById('studentTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');        
        document.getElementById('headerTitle').textContent = 'سجل الدخول لمعرفة درجتك';
    } else {
        document.getElementById('adminTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('headerTitle').textContent = 'تسجيل الدخول للمسؤول';
    }
}

// Student login
function studentLogin(event) {
    event.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const studentPassword = document.getElementById('studentPassword').value;
    const errorDiv = document.getElementById('loginError');

    const student = studentsData.find(s => s.id === studentId && s.password === studentPassword);

    if (student) {
        errorDiv.style.display = 'none';
        showStudentDashboard(student);
    } else {
        errorDiv.textContent = 'خطأ: رقم الطالب أو الرقم السري غير صحيح';
        errorDiv.style.display = 'block';
    }
}

// Admin login
function adminLogin(event) {
    event.preventDefault();
    const adminPassword = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('adminLoginError');

    if (adminPassword === ADMIN_PASSWORD) {
        errorDiv.style.display = 'none';
        showAdminDashboard();
    } else {
        errorDiv.textContent = 'خطأ: كلمة المرور غير صحيحة';
        errorDiv.style.display = 'block';
    }
}

// Show student dashboard
function showStudentDashboard(student) {
    hideAllDashboards();
    document.getElementById('studentDashboard').classList.add('active');

    // Display student info
    const infoDiv = document.getElementById('studentInfo');
    infoDiv.innerHTML = `
        <p><strong>اسم الطالب:</strong> ${student.name}</p>
        <p><strong>رقم الطالب:</strong> ${student.id}</p>
    `;

    // Display grades
    const gradesDiv = document.getElementById('gradesDisplay');
    let gradesHTML = '<table><thead><tr>';
    
    // Get all subjects
    const subjects = getSubjects();
    gradesHTML += '<th>المادة</th>';
    for (let subject of subjects) {
        gradesHTML += `<th>${subject}</th>`;
    }
    gradesHTML += '</tr></thead><tbody><tr><td>الدرجة</td>';

    for (let subject of subjects) {
        const grade = student[subject] || '-';
        const gradeClass = grade !== '-' ? getGradeClass(parseFloat(grade)) : '';
        gradesHTML += `<td class="grade ${gradeClass}">${grade}</td>`;
    }
    gradesHTML += '</tr></tbody></table>';
    gradesDiv.innerHTML = gradesHTML;
}

// Show admin dashboard
function showAdminDashboard() {
    hideAllDashboards();
    document.getElementById('adminDashboard').classList.add('active');
    displayAdminData();
}

// Hide all dashboards
function hideAllDashboards() {
    document.getElementById('loginContainer').classList.remove('active');
    document.getElementById('studentDashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
}

// Upload Excel file
function uploadExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const statusDiv = document.getElementById('uploadStatus');

    if (!fileInput.files.length) {
        showStatus('الرجاء اختيار ملف', 'error', statusDiv);
        return;
    }

    // Check if XLSX is available
    if (typeof XLSX === 'undefined') {
        showStatus('خطأ: مكتبة Excel لم تحمّل بعد. الرجاء تحديث الصفحة والمحاولة مجددًا', 'error', statusDiv);
        setTimeout(() => location.reload(), 2000);
        return;
    }

    const file = fileInput.files[0];
    
    // Support both XLSX and CSV files
    if (file.name.endsWith('.csv')) {
        parseCSVFile(file, statusDiv);
    } else {
        parseXLSXFile(file, statusDiv);
    }
}

// Parse XLSX file
function parseXLSXFile(file, statusDiv) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Validate and parse data
            studentsData = parseExcelData(jsonData);
            saveStudentsData();
            
            showStatus('تم رفع الملف بنجاح! (' + studentsData.length + ' طالب)', 'success', statusDiv);
            document.getElementById('excelFile').value = '';
            displayAdminData();
        } catch (error) {
            showStatus('خطأ في قراءة الملف: ' + error.message, 'error', statusDiv);
            console.error('Error:', error);
        }
    };

    reader.onerror = function() {
        showStatus('خطأ: تعذر قراءة الملف', 'error', statusDiv);
    };

    reader.readAsArrayBuffer(file);
}

// Parse CSV file as fallback
function parseCSVFile(file, statusDiv) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
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
            saveStudentsData();
            
            showStatus('تم رفع الملف بنجاح! (' + studentsData.length + ' طالب)', 'success', statusDiv);
            document.getElementById('excelFile').value = '';
            displayAdminData();
        } catch (error) {
            showStatus('خطأ في قراءة الملف: ' + error.message, 'error', statusDiv);
        }
    };

    reader.readAsText(file);
}

// Parse Excel data
function parseExcelData(jsonData) {
    const parsed = [];
    
    for (let row of jsonData) {
        // Find the ID column (could be 'ID', 'الرقم', 'رقم الطالب', etc.)
        const idKey = findKey(row, ['ID', 'الرقم', 'رقم الطالب', 'Student ID', 'id','username' , 'Username','اسم المستخدم']);
        const nameKey = findKey(row, ['الاسم', 'Name', 'name']);
        const passwordKey = findKey(row, ['الرقم السري', 'Password', 'password', 'السر']);

        if (!idKey || !nameKey || !passwordKey) {
            continue; // Skip if required fields not found
        }

        const student = {
            id: String(row[idKey]).trim(),
            name: String(row[nameKey]).trim(),
            password: String(row[passwordKey]).trim()
        };

        // Add all other columns as subjects/grades
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

// Find key in object (case insensitive)
function findKey(obj, possibleKeys) {
    for (let key of possibleKeys) {
        if (key in obj) return key;
        // Try case insensitive search
        for (let objKey in obj) {
            if (objKey.toLowerCase() === key.toLowerCase()) {
                return objKey;
            }
        }
    }
    return null;
}

// Get all subjects
function getSubjects() {
    const subjects = new Set();
    const excludeKeys = ['id', 'name', 'password'];
    
    for (let student of studentsData) {
        for (let key in student) {
            if (!excludeKeys.includes(key.toLowerCase()) && typeof student[key] === 'number') {
                subjects.add(key);
            }
        }
    }

    return Array.from(subjects).sort();
}

// Display admin data
function displayAdminData() {
    const displayDiv = document.getElementById('adminDataDisplay');
    
    if (studentsData.length === 0) {
        displayDiv.innerHTML = '<p style="color: #999; text-align: center;">لم يتم رفع أي ملفات بعد</p>';
        return;
    }

    const subjects = getSubjects();
    let tableHTML = '<table><thead><tr><th>الرقم</th><th>الاسم</th>';
    
    for (let subject of subjects) {
        tableHTML += `<th>${subject}</th>`;
    }
    
    tableHTML += '</tr></thead><tbody>';

    for (let student of studentsData) {
        tableHTML += '<tr>';
        tableHTML += `<td>${student.id}</td>`;
        tableHTML += `<td>${student.name}</td>`;
        
        for (let subject of subjects) {
            const grade = student[subject] || '-';
            const gradeClass = grade !== '-' ? getGradeClass(grade) : '';
            tableHTML += `<td class="grade ${gradeClass}">${grade}</td>`;
        }
        
        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table>';
    displayDiv.innerHTML = tableHTML;
}

// Get grade class for styling
function getGradeClass(grade) {
    if (grade >= 80) return 'high';
    if (grade >= 60) return 'medium';
    return 'low';
}

// Save students data to localStorage
function saveStudentsData() {
    localStorage.setItem('studentsData', JSON.stringify(studentsData));
}

// Load students data from localStorage
function loadStudentsData() {
    const saved = localStorage.getItem('studentsData');
    if (saved) {
        studentsData = JSON.parse(saved);
    }
}

// Export data as backup
function exportData() {
    if (studentsData.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }

    const subjects = getSubjects();
    const exportData = [];

    for (let student of studentsData) {
        const row = {
            'الرقم': student.id,
            'الاسم': student.name,
            'الرقم السري': student.password
        };

        for (let subject of subjects) {
            row[subject] = student[subject] || '';
        }

        exportData.push(row);
    }

    // Try to export as Excel, fallback to CSV
    if (typeof XLSX !== 'undefined') {
        // Create Excel file
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
        
        // Download file
        const date = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `backup_students_${date}.xlsx`);
    } else {
        // Fallback to CSV export
        exportAsCSV(exportData);
    }
}

// Export data as CSV
function exportAsCSV(data) {
    if (!data || data.length === 0) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    for (let row of data) {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return String(value).includes(',') ? `"${String(value).replace(/"/g, '""')}"` : value;
        });
        csvContent += values.join(',') + '\n';
    }

    // Download CSV file
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_students_${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show status message
function showStatus(message, type, element) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

// Delete all students data
function deleteAllData() {
    if (studentsData.length === 0) {
        alert('لا توجد بيانات لحذفها');
        return;
    }

    // Show confirmation dialog
    const confirmed = confirm('⚠️ تحذير! هذا الإجراء سيحذف جميع البيانات نهائياً.\n\nهل أنت متأكد من الحذف؟');
    
    if (confirmed) {
        // Clear data from memory
        studentsData = [];
        
        // Clear data from localStorage
        localStorage.removeItem('studentsData');
        
        // Clear file input
        document.getElementById('excelFile').value = '';
        
        // Update UI
        displayAdminData();
        
        // Show success message
        const statusDiv = document.getElementById('uploadStatus');
        showStatus('✓ تم حذف جميع البيانات بنجاح', 'success', statusDiv);
    }
}

// Logout
function logout() {
    // Clear inputs
    document.getElementById('studentId').value = '';
    document.getElementById('studentPassword').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('adminLoginError').style.display = 'none';
    
    // Show login
    hideAllDashboards();
    document.getElementById('loginContainer').classList.add('active');
    switchTab('student');
}
