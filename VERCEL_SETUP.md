# تعيين المتغيرات البيئية على Vercel

## الخطوات:

### 1. اذهب إلى Vercel Dashboard
- https://vercel.com/dashboard

### 2. اختر المشروع
- اختر `small-system-for-student-grades`

### 3. اذهب إلى Settings → Environment Variables
```
الخطوات:
1. Click on "Settings" tab
2. في القائمة اليسار، اختر "Environment Variables"
3. أضف كل متغير كالتالي:
```

### 4. أضف المتغيرات الثلاثة:

**المتغير الأول:**
- Name: `FIREBASE_PROJECT_ID`
- Value: `student-grades-a8598`
- Systems: Production, Preview, Development (اختر الكل)
- Click "Save"

**المتغير الثاني:**
- Name: `FIREBASE_PRIVATE_KEY`
- Value: انسخ الكود كاملاً من `.env.local` (الـ private key)
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAFyYH/DTu9+OY
... (كل السطور)
-----END PRIVATE KEY-----
```
- Important: **تأكد من أن الـ newlines محفوظة بشكل صحيح**
- Systems: Production, Preview, Development
- Click "Save"

**المتغير الثالث:**
- Name: `FIREBASE_CLIENT_EMAIL`
- Value: `firebase-adminsdk-fbsvc@student-grades-a8598.iam.gserviceaccount.com`
- Systems: Production, Preview, Development
- Click "Save"

### 5. Deploy مرة جديدة
بعد تعيين المتغيرات:
```bash
git add .
git commit -m "Fix Vercel Firebase setup"
git push
```

أو من Vercel Dashboard:
- اذهب إلى "Deployments"
- اختر الـ deployment القديم
- اضغط "Redeploy"

---

## ✅ التحقق من نجاح الإعدادات:

بعد الـ deploy، افتح:
```
https://your-vercel-url.vercel.app/api/get-students
```

يجب أن ترى:
```json
[
  {"id":"101","name":"أحمد محمد علي","password":"1234",...},
  ...
]
```

إذا رأيت `Firebase not initialized` أو `text/plain` error، فالمتغيرات لم تُعيّن بشكل صحيح.

---

## ⚠️ ملاحظات مهمة:

1. **الـ Private Key يجب أن يكون بسطر واحد مع `\n`:**
   - ✅ صحيح: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAFyYH/DTu9+OY\n...`
   - ❌ خطأ: `-----BEGIN PRIVATE KEY-----` (بدون `\n`)

2. **تأكد من حفظ المتغيرات:**
   - عندما تبدأ في الكتابة، يظهر زر "Save"
   - اضغط عليه لكل متغير

3. **يمكنك اختبار محلياً أولاً:**
   ```bash
   npm install
   npm start
   # ثم افتح http://localhost:5000
   ```
