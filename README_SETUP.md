# منصة الأستاذ - دليل التشغيل

## 1. إنشاء مشروع Supabase
1. اذهب إلى https://supabase.com → New Project
2. بعد الإنشاء → Project Settings → API → انسخ URL و anon key و service_role key
3. أنشئ ملف `.env.local` من `.env.example` وضع القيم

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 2. تشغيل SQL
في Supabase → SQL Editor → الصق محتوى `supabase.sql` وشغّله بالكامل
سيُنشئ: profiles, courses, units, lessons, enrollments + RLS + Trigger

## 3. إنشاء Storage Buckets
Storage → Create Bucket (كلهم Private ما عدا covers)
- `videos`  → private
- `pdfs`    → private
- `proofs`  → private
- `covers`  → public

بعدها شغّل policies للـ storage (موجودة كـ comment أسفل ملف supabase.sql) إذا أردت RLS أدق، لكن Signed URL عبر service_role يعمل بدونها.

## 4. تشغيل المشروع
```
npm install
npm run dev
```
افتح http://localhost:3000

## 5. تسجيل أول Admin
1. سجل حساب عادي من /register (مثلاً username: admin1)
2. في Supabase → Table Editor → profiles → غيّر role إلى `admin`
3. سجل خروج ودخول → ستظهر لوحة الإدارة /admin

لإضافة admins متعددين: كرر نفس الخطوة.

## 6. تدفق العمل الحالي
- Home: يعرض نبذة المدرس + الكورسات (مقفلة)
- /courses/[id]: يعرض Units والـ Video/PDF كأسماء فقط مع قفل
- الطالب يسجل → يطلب الاشتراك → يرفع Screenshot فودافون كاش → pending
- الأدمن في /admin يوافق → approved → الطالب يشاهد في /dashboard → /dashboard/watch/[lessonId] (Signed URL + watermark باسم المستخدم + منع تحميل)

## 7. تغيير رقم فودافون كاش
عدّل النص في `src/app/courses/[id]/SubscribeButton.tsx:43`

## 8. للانتقال لـ Bunny/Mux لاحقاً
فقط غيّر upload في CourseManager و SecurePlayer ليستخدم HLS URL بدلاً من Supabase signedUrl. الـ RLS يبقى كما هو.

## الهيكل المطلوب
Year (اولي/تانية/تالتة ثانوي) → Course → Unit → Lesson (Video/PDF)
كل Lesson مخزن كـ path في storage، يُعرض عبر Signed URL صالح 1 ساعة.
