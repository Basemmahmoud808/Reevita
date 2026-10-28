# دليل التشغيل والدعم الفني (Operational Runbook) — REEVITA Backend

دليل عملي لإدارة ونشر وتشغيل البنية التحتية لمتجر REEVITA.

---

## 1. تطبيق الـ Migrations ونشر قاعدة البيانات
عند النشر على بيئة Staging أو Production في Supabase:
```bash
# 1. ربط المشروع بالسيرفر السحابي
npx supabase link --project-ref <your-project-ref>

# 2. تطبيق الـ Migrations من الصفر
npx supabase db push

# 3. إدخال البيانات الأولية (المحافظات ورسوم الشحن والكتالوج)
npx supabase db seed
```

---

## 2. النسخ الاحتياطي والاسترجاع (Backups & Disaster Recovery)
1. **النسخ الآلي اليومي في Supabase:**
   - مفعل تلقائياً على مشاريع Pro (مع PITR - Point In Time Recovery لمدة 7 أيام).
2. **النسخ اليدوي قبل التحديثات الكبرى:**
   ```bash
   npx supabase db dump -f reevita_backup_$(date +%Y%m%d).sql
   ```
3. **الاسترجاع في حالة الطوارئ:**
   ```bash
   psql -h db.<project-ref>.supabase.co -U postgres -d postgres -f reevita_backup.sql
   ```

---

## 3. دورة معالجة طلبات الدفع عند الاستلام (COD Workflow)
1. **طلب جديد (`new`):**
   - يدخل من متجر الويب عبر `place_order`.
   - يقوم فريق خدمة العملاء بالاتصال برقم الهاتف المسجل لتأكيد الجدية والعنوان.
2. **تأكيد الطلب (`confirmed`):**
   - يضغط الأدمن "تأكيد الطلب" عبر `admin_update_order_status`.
3. **التجهيز والتغليف (`packed`):**
   - يُطبع بيان الطلب وتُجهز العبوات في المخزن.
4. **تسليم لشركة الشحن (`shipped`):**
   - يُدخل الأدمن اسم شركة الشحن (Bosta / J&T / Aramex) ورقم البوليصة Tracking Number.
   - يمكن للعميل الآن تتبع شحنته مباشرة برقم الهاتف ورقم الطلب.
5. **حالات إنهاء الطلب:**
   - **`delivered`:** قام المندوب بتحصيل المبلغ وتسليم الشحنة.
   - **`refused`:** رفض العميل الاستلام عند الباب -> يُعاد المخزون تلقائياً، ويُوسم رقم العميل في قائمة الحظر التلقائي.
   - **`cancelled`:** ألغى العميل أو خدمة العملاء الطلب قبل الشحن -> يُعاد المخزون تلقائياً.

---

## 4. المراقبة واستكشاف الأخطاء (Monitoring & Incident Response)
- **مراقبة السجلات (Logs):** من خلال Supabase Dashboard -> Database -> Logs & Advisors.
- **مراقبة محاولات الاختراق أو التلاعب:**
  - مراجعة جدول `audit_log` دورياً لمتابعة تعديلات المخزون وتغييرات الرسوم الإدارية.
- **في حالة الشك بوجود سبام على الـ COD:**
  - فحص أرقام الهواتف المتكررة وعناوين الـ IP.
  - تفعيل حماية Cloudflare Turnstile CAPTCHA.

---

## 5. ضوابط ما قبل الإنتاج (Rate limiting, idempotency, checks)

### 5.1 تحديد المعدل (Rate limiting)
- الحد الافتراضي يعمل داخل عملية Node واحدة فقط (in-memory). على استضافة متعددة النسخ
  (Vercel/serverless) **يجب** ضبط `UPSTASH_REDIS_REST_URL` و`UPSTASH_REDIS_REST_TOKEN`
  لتصبح العدادات مشتركة بين كل النسخ.
- إذا كنت خلف بروكسي خاص بك يضيف ترويسة IP موثوقة (مثل `cf-connecting-ip`)، اضبط
  `TRUSTED_IP_HEADER` باسم الترويسة. بدون ذلك يُستخدم آخر عنوان في `X-Forwarded-For`
  (الذي يضيفه البروكسي)، ولا يُوثق بترويسة `x-real-ip` القادمة من العميل.
- الحدود المفعّلة: الدفع 5 محاولات/10 دقائق لكل IP ولكل رقم هاتف (مُشفّر)، تسجيل الدخول
  10/15 دقيقة، دخول الإدارة 5/15 دقيقة، إنشاء حساب 5/ساعة، الاشتراك البريدي 5/10 دقائق،
  تتبّع الطلب 12/دقيقة، عمليات الإدارة 60/دقيقة.

### 5.2 مفاتيح منع تكرار الطلب (Idempotency)
- كل محاولة دفع تحمل مفتاحًا فريدًا (`orders.idempotency_key` + جدول `order_idempotency`).
- إعادة إرسال نفس المفتاح تُعيد نفس رقم الطلب دون خصم مخزون إضافي.
- عند فشل المحاولة (مخزون/بيانات) يُلغى الحجز ويُسمح بإعادة المحاولة بنفس المفتاح.
- جدول `order_idempotency` لا تُقرأ منه أي بيانات من المتصفح (RLS بلا سياسات).
- يُنصح بأرشفة/حذف السجلات الأقدم من 30 يومًا بمهمة مجدولة:
  `DELETE FROM public.order_idempotency WHERE created_at < now() - interval '30 days';`

### 5.3 فحوص ما قبل النشر
```bash
npm run verify                                   # typecheck + lint + unit + backend + build
node scripts/http-security-check.mjs --base-url https://<staging-host>   # 26 فحصًا
node scripts/load-test.mjs --base-url http://127.0.0.1:3200 --levels 5,10,25,50
```
- `http-security-check` يجب أن ينجح 26/26 قبل أي نشر.
- نفّذ فحوص الحمل فقط على بيئة تملكها (staging/local)، وليس على نطاق الإنتاج المشترك.
