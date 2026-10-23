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

## 5. مراجع التشغيل المضافة (Release references)

* `docs/STAGING_MIGRATION_PLAN.md` — خطة تطبيق migrations 000008→000011 على بيئة staging،
  استعلامات التحقق، خطة الرجوع (rollback)، وقائمة الفحص.
* `docs/MONITORING.md` — حالة المراقبة (غير مُفعّلة حاليًا) وخطوات تفعيل Sentry/Vercel Log Drain.
* `docs/POLICY_REVIEW.md` — ما تدعمه البيانات الفعلية في صفحات السياسات وما يحتاج موافقة المالك.

> **مهم:** طبّق الـ migrations **قبل** نشر الواجهة التي ترسل `p_idempotency_key`، وإلا سيفشل الطلب
> برسالة `function place_order(...) does not exist`.
