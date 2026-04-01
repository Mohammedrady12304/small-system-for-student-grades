# ⚡ خطوات النشر على Vercel (5 دقائق)

## الخطوة 1: Firebase (2 دقيقة)

```
1. اذهب إلى firebase.google.com
2. انقر "Start" ثم انشئ project
3. اختر Realtime Database (us-central1)
4. اذهب إلى Project Settings > Service Accounts
5. انقر "Generate New Private Key"
6. احفظ ملف JSON - ستحتاجه قريباً
```

## الخطوة 2: GitHub (1 دقيقة)

```bash
git push origin main
```

## الخطوة 3: Vercel (2 دقيقة)

```
1. اذهب إلى vercel.com
2. انقر "Import" > اختر repository
3. في الإعدادات، أضف Environment Variables:
   - FIREBASE_PROJECT_ID
   - FIREBASE_PRIVATE_KEY  
   - FIREBASE_CLIENT_EMAIL
4. انقر "Deploy"
```

## النتيجة ✅

الموقع حي على: `https://your-project.vercel.app`

---

**ملاحظة:** استبدل `your-project` باسم مشروعك على Vercel
