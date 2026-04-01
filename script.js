// Global variables
let studentsData = [];
const ADMIN_PASSWORD = "112233"; // تغيير كلمة المرور الآمنة
const API_URL = `${window.location.protocol}//${window.location.host}/api`;

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

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatus(data.message, 'success', statusDiv);
            document.getElementById('excelFile').value = '';
            loadStudentsData().then(() => {
                displayAdminData();
            });
        } else {
            showStatus('خطأ: ' + (data.error || 'فشل رفع الملف'), 'error', statusDiv);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showStatus('خطأ في الاتصال: ' + error.message, 'error', statusDiv);
    });
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

// Load students data from backend
function loadStudentsData() {
    return fetch(`${API_URL}/getStudents`)
        .then(response => response.json())
        .then(data => {
            studentsData = data;
            return data;
        })
        .catch(error => {
            console.error('Error loading data:', error);
            return [];
        });
}

// Export data as backup
function exportData() {
    if (studentsData.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
    }

    window.location.href = `${API_URL}/export`;
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

    const confirmed = confirm('⚠️ تحذير! هذا الإجراء سيحذف جميع البيانات نهائياً.\n\nهل أنت متأكد من الحذف؟');
    
    if (confirmed) {
        fetch(`${API_URL}/deleteAll`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                studentsData = [];
                document.getElementById('excelFile').value = '';
                displayAdminData();
                const statusDiv = document.getElementById('uploadStatus');
                showStatus('✓ تم حذف جميع البيانات بنجاح', 'success', statusDiv);
            } else {
                alert('خطأ: ' + (data.error || 'فشل حذف البيانات'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('خطأ في الاتصال بالسيرفر: ' + error.message);
        });
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
