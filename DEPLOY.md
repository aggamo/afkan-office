# دليل نشر منصة أفكان على استضافة cPanel

> هذا الملف مُوجَّه للشخص التقني الذي سينشر المشروع. المشروع من جزأين:
> **`api/`** خلفية Laravel (PHP 8.3+)، و**`web/`** واجهة Next.js 16 (تحتاج Node.js 20+ وSSR).
>
> **ملاحظة مهمة للمالك:** واجهة Next.js تتطلب ميزة **"Setup Node.js App"** في cPanel.
> إن لم تكن متوفرة في خطة الاستضافة، انشر الواجهة على **Vercel** مجاناً واترك الخلفية على cPanel.

الافتراض في هذا الدليل:
- الدومين: `afkanagent.com` → الواجهة (Next.js)
- سب-دومين: `api.afkanagent.com` → الخلفية (Laravel)
- استبدل `USER` باسم مستخدم حساب cPanel.

---

## الجزء الأول: الخلفية Laravel (`api.afkanagent.com`)

### 1) إنشاء السب-دومين
`cPanel → Domains → Create A New Domain`
- Domain: `api.afkanagent.com`
- **Document Root:** `/home/USER/afkan-api/public`  ← مهم: يشير إلى `public` وليس المجلد الأساسي.

### 2) رفع ملفات الخلفية (خارج public_html للأمان)
عبر `cPanel → Terminal`:
```bash
cd ~
git clone https://github.com/aggamo/afkan-office.git temp
mv temp/api afkan-api
rm -rf temp
```

### 3) قاعدة بيانات MySQL
`cPanel → MySQL Databases`: أنشئ قاعدة + مستخدماً، وامنح المستخدم All Privileges.
(المشروع يستخدم SQLite في التطوير فقط؛ الإنتاج على MySQL.)

### 4) ملف البيئة `.env`
```bash
cd ~/afkan-api
cp .env.example .env
nano .env
```
عدّل القيم التالية:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.afkanagent.com
FRONTEND_URL=https://afkanagent.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=USER_afkan
DB_USERNAME=USER_afkan
DB_PASSWORD=********

# لتفعيل رسائل استعادة كلمة المرور فعلياً (بيانات SMTP من cPanel → Email Accounts)
MAIL_MAILER=smtp
MAIL_HOST=mail.afkanagent.com
MAIL_PORT=465
MAIL_USERNAME=no-reply@afkanagent.com
MAIL_PASSWORD=********
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=no-reply@afkanagent.com
MAIL_FROM_NAME="AFKAN"
```

### 5) التثبيت والتهيئة
```bash
cd ~/afkan-api
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force      # بيانات البداية والحسابات التجريبية
php artisan storage:link
php artisan config:cache
php artisan route:cache
```
> إن كان إصدار PHP الافتراضي أقل من 8.3، غيّره من `cPanel → MultiPHP Manager` للسب-دومين.

### 6) جدولة المهام التلقائية (انتهاء الحجوزات + صيانة سير العمل)
`cPanel → Cron Jobs` → أضف مهمة كل دقيقة:
```
* * * * * cd /home/USER/afkan-api && php artisan schedule:run >> /dev/null 2>&1
```

---

## الجزء الثاني: الواجهة Next.js (`afkanagent.com`)

### 1) إنشاء تطبيق Node
`cPanel → Setup Node.js App → Create Application`
- Node.js version: **20** أو أحدث
- Application mode: **Production**
- Application root: `afkan-web`
- Application URL: `afkanagent.com`
- Application startup file: `node_modules/.bin/next` (أو اتركه ويُشغَّل عبر `npm start`)

### 2) رفع ملفات الواجهة
```bash
cd ~
git clone https://github.com/aggamo/afkan-office.git temp
mv temp/web afkan-web
rm -rf temp
```

### 3) متغيّر البيئة للتطبيق
من صفحة Node.js App → قسم Environment Variables، أضف:
```
NEXT_PUBLIC_API_URL = https://api.afkanagent.com/api/v1
```

### 4) التثبيت والبناء
من صفحة Node.js App اضغط **Run NPM Install**، ثم عبر Terminal (فعّل بيئة Node التي يظهر أمرها أعلى صفحة التطبيق):
```bash
cd ~/afkan-web
npm run build
```
ثم من صفحة Node.js App اضغط **Restart**.

---

## الجزء الثالث: SSL والدومين

1. **توجيه الدومين (إن كان مسجّلاً خارج هذه الاستضافة):** من لوحة مزوّد الدومين، أنشئ سجلّي A:
   - `@` (الجذر) → IP السيرفر
   - `api` → IP السيرفر
2. **HTTPS:** `cPanel → SSL/TLS Status → Run AutoSSL` (يفعّل الشهادة للدومين والسب-دومين).

---

## التحقق بعد النشر

- افتح `https://api.afkanagent.com/api/v1/workers` → يجب أن تظهر بيانات JSON.
- افتح `https://afkanagent.com` → يجب أن يظهر الموقع.
- الحسابات التجريبية بعد `db:seed`:
  - مدير: `admin@afkanagent.com` / `password`
  - مكتب: `agency@demo.test` / `password`
  - عميل: `customer@demo.test` / `password`
- **مهم بعد التأكد:** غيّر كلمات المرور التجريبية أو احذف هذه الحسابات.

---

## التحديثات المستقبلية
```bash
# الخلفية
cd ~/afkan-api && git pull && composer install --no-dev -o && php artisan migrate --force && php artisan config:cache && php artisan route:cache

# الواجهة
cd ~/afkan-web && git pull && npm install && npm run build
# ثم Restart من صفحة Node.js App
```
