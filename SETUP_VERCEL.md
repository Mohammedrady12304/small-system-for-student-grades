# 🚀 إعداد الموقع على Vercel

## الخطوة 1: إنشاء حساب Firebase

1. اذهب إلى [firebase.google.com](https://firebase.google.com)
2. انقر على "Go to console"
3. انشئ project جديد باسم "student-grades"
4. اختر "Realtime Database" وأنشئ واحدة في منطقة `us-central1`

## الخطوة 2: الحصول على بيانات اعتماد Firebase

1. في Firebase Console، اذهب إلى ⚙️ **Project Settings**
2. اختر تبويب **Service Accounts**
3. انقر على **Generate New Private Key**
4. سيحمل ملف JSON يحتوي على:
   - `project_id`
   - `private_key`
   - `client_email`

## الخطوة 3: رفع على Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. انقر **Import Project**
3. اختر **GitHub** وربط مستودع المشروع
4. في التكوين، أضف **Environment Variables**:
   ```
   FIREBASE_PROJECT_ID = (من ملف JSON)
   FIREBASE_PRIVATE_KEY = (من ملف JSON)
   FIREBASE_CLIENT_EMAIL = (من ملف JSON)
   ```
5. انقر **Deploy**

## الخطوة 4: تكوين قاعدة بيانات Firebase

في Firebase Console > Realtime Database، أضف هذه القواعد في **Rules**:

```json
{
  "rules": {
    "students": {
      ".read": true,
      ".write": true,
      ".validate": "newChildPath.parent().key === 'students'"
    }
  }
}
```

## ملاحظات

⚠️ **هام:** هذه القواعد مفتوحة للقراءة والكتابة. للإنتاج، استخدم مصادقة Firebase مناسبة.

✅ بعد الانتشار، سيتمكن الموقع من:
- رفع ملفات Excel/CSV
- عرض درجات الطلاب
- حفظ البيانات في Firebase

---

**للاستخدام المحلي:**
```bash
npm install
vercel dev
```

ثم افتح `http://localhost:3000`
