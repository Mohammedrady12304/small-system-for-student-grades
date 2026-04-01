# نظام درجات الطلاب - Student Grades System

## 🎯 الميزات

✅ **رفع ملفات Excel/CSV** - رفع درجات الطلاب دفعة واحدة
✅ **البحث عن الدرجات** - الطلاب يدخلون برقمهم وكلمة مرورهم  
✅ **لوحة إدارية** - إدارة الطلاب والبيانات
✅ **قاعدة بيانات سحابية** - Firebase Realtime Database
✅ **استضافة مجانية** - Vercel + GitHub Pages

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 14+
- حساب GitHub
- حساب Firebase (مجاني)
- حساب Vercel (مجاني)

### التثبيت المحلي

```bash
# استنساخ المستودع
git clone https://github.com/username/student-grades.git
cd student-grades

# تثبيت الحزم
npm install

# تشغيل الخادم محلياً
npm run dev
```

افتح المتصفح: `http://localhost:3000`

---

## 📋 خطوات الإعداد على Vercel

### 1️⃣ إنشاء Firebase Project

1. اذهب إلى [firebase.google.com](https://firebase.google.com)
2. انقر على **Go to console**
3. انشئ project جديد باسم `student-grades`
4. الق إلى **Realtime Database** ✓

### 2️⃣ الحصول على بيانات الاعتماد

1. في Firebase Console: ⚙️ **Project Settings**
2. اختر **Service Accounts**
3. انقر **Generate New Private Key**
4. انسخ البيانات:
   - `project_id`
   - `private_key`  
   - `client_email`

### 3️⃣ دفع على GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/student-grades.git
git push -u origin main
```

### 4️⃣ الربط مع Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. انقر **Import Project**
3. اختر repository من GitHub
4. في التكوين، أضف **Environment Variables**:

```
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

5. انقر **Deploy** ✅

### 5️⃣ تكوين Firebase Security

في Firebase Console > Realtime Database > **Rules**:

```json
{
  "rules": {
    "students": {
      ".read": true,
      ".write": true
    }
  }
}
```

⚠️ **ملاحظة أمنية:** هذا للتطوير فقط. للإنتاج، استخدم قواعد أمان مناسبة.

---

## 📱 كيفية الاستخدام

### للطالب 👨‍🎓

1. افتح الموقع
2. أدخل رقم الطالب وكلمة المرور
3. سيظهر جدول بالدرجات

### للمسؤول 👨‍💼

1. اختر تبويب "المسؤول"
2. أدخل كلمة المرور (الافتراضية: `112233` - غيّرها!)
3. يمكنك:
   - رفع ملف Excel/CSV
   - عرض جميع البيانات
   - حذف البيانات

### تنسيق ملف Excel

جدول بالأعمدة التالية:

| الرقم | الاسم | الرقم السري | الرياضيات | العربية | العلوم |
|------|------|---------|---------|-------|------|
| 001 | أحمد علي | 1234 | 95 | 88 | 92 |
| 002 | فاطمة محمد | 5678 | 87 | 94 | 89 |

---

## 🔧 API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/api/get-students` | الحصول على جميع الطلاب |
| GET | `/api/student?id=xxx` | الحصول على طالب واحد |
| POST | `/api/upload` | رفع ملف Excel/CSV |
| POST | `/api/students` | إضافة/تحديث طالب |
| DELETE | `/api/students?id=xxx` | حذف طالب |
| DELETE | `/api/delete-all` | حذف جميع البيانات |

---

## 📁 هيكل المشروع

```
.
├── index.html           # الصفحة الرئيسية
├── script.js            # كود JavaScript
├── styles.css           # تنسيقات CSS
├── package.json         # إدارة الحزم
├── vercel.json          # تكوين Vercel
├── api/                 # Serverless Functions
│   ├── firebase-config.js
│   ├── get-students.js
│   ├── upload.js
│   ├── student.js
│   ├── students.js
│   └── ...
└── data/               # قاعدة البيانات المحلية (git-ignored)
```

---

## 🛡️ الأمان

⚠️ **تحذيرات أمنية:**

1. غيّر كلمة مرور المسؤول الافتراضية!
2. استخدم HTTPS في الإنتاج
3. لا تشارك بيانات Firebase مع أحد  
4. استخدم قواعد Firebase أمان صارمة

---

## 🐛 استكشاف الأخطاء

### الخطأ: "JSON invalid"

- امسح cache المتصفح: `Ctrl+Shift+Delete`
- تحقق من استجابة API في DevTools (F12)

### الخطأ: "Firebase not initialized"

- تحقق من متغيرات البيئة في Vercel
- أعد النشر: `vercel redeploy`

### الملف لا يُرفع

- تحقق من تنسيق ملف Excel
- تأكد من عمود "الرقم"، "الاسم"، "الرقم السري"

---

## 📞 الدعم

للمشاكل والأسئلة:
- استفسر على GitHub Issues
- تحقق من [Firebase Docs](https://firebase.google.com/docs)
- تحقق من [Vercel Docs](https://vercel.com/docs)

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.

---

**آخر تحديث:** 1 أبريل 2026
