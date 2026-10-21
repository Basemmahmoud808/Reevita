# عقد الـ API والمواصفات التقنية (API Contract) — REEVITA Backend

يوثق هذا المستند كافة الدوال البرمجية (RPC Functions) المتاحة عبر Supabase لمتجر REEVITA، بما يشمل المدخلات، المخرجات، القيود، وأكواد ورسائل الأخطاء بالعربية والإنجليزية.

---

## 1. الدوال الموجهة للجمهور (Storefront & Customer APIs)

### 1.1 إنشاء طلب جديد (الدفع عند الاستلام داخل مصر): `place_order`
- **نوع الدالة:** `RPC (POST /rest/v1/rpc/place_order)`
- **الصلاحية:** الزائر (Anon) أو العميل المسجل (Authenticated).
- **الأمان:** `SECURITY DEFINER` (مع قفل صفوف المخزون `FOR UPDATE` وحساب السعر بالكامل من قاعدة البيانات).

#### المدخلات (Parameters):
| المعامل | النوع | إلزامي؟ | القيود والشروط |
|---|---|---|---|
| `p_customer_name` | `TEXT` | نعم | حرفان على الأقل |
| `p_customer_phone` | `TEXT` | نعم | رقم محمول مصري صحيح (010, 011, 012, 015) |
| `p_customer_email` | `TEXT` | لا | بريد إلكتروني اختياري |
| `p_governorate_id` | `UUID` | نعم | معرف محافظة مصرية نشطة من جدول `governorates` |
| `p_city` | `TEXT` | نعم | اسم المدينة/المركز/الحي |
| `p_address_line` | `TEXT` | نعم | تفاصيل الشارع والعمارة ورقم الشقة (5 أحرف على الأقل) |
| `p_landmark` | `TEXT` | لا | علامة مميزة لتسهيل الوصول |
| `p_order_notes` | `TEXT` | لا | ملاحظات خاصة للطلب |
| `p_items` | `JSONB` | نعم | مصفوفة عناصر `[{"product_id": "UUID", "quantity": 1}]` |

#### مثال الطلب (Request Example):
```json
{
  "p_customer_name": "نورهان محمد",
  "p_customer_phone": "01012345678",
  "p_customer_email": "nourhan@example.com",
  "p_governorate_id": "11111111-0000-0000-0000-000000000001",
  "p_city": "مصر الجديدة",
  "p_address_line": "شارع النزهة عمارة 44 شقة 10",
  "p_landmark": "خلف مدرسة الأورمان",
  "p_order_notes": "يرجى التسليم بعد الساعة 5 مساء",
  "p_items": [
    {
      "product_id": "33333333-0000-0000-0000-000000000001",
      "quantity": 1
    }
  ]
}
```

#### مثال الاستجابة الناجحة (Success Response):
```json
{
  "success": true,
  "order_id": "7bca532a-7f61-45bc-8a3d-49528d223835",
  "order_number": "RV-2026-10001",
  "status": "new",
  "customer_name": "نورهان محمد",
  "customer_phone": "+201012345678",
  "subtotal": 350.00,
  "shipping_fee": 50.00,
  "cod_fee": 0.00,
  "total": 400.00,
  "currency": "EGP",
  "created_at": "2026-10-20T04:45:00Z"
}
```

#### مصفوفة الأخطاء المحتملة (Error Matrix):
| كود الخطأ | الرسالة الإنجليزية | الرسالة المقترحة بالعربية للواجهة |
|---|---|---|
| `INVALID_PHONE` | `Invalid Egyptian phone number format` | يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقم). |
| `INSUFFICIENT_STOCK` | `Product only has X item(s) in stock` | الكمية المطلوبة غير متوفرة حالياً في المخزون. |
| `INVALID_INPUT` | `Customer name / address too short` | يرجى التأكد من استكمال الاسم والعنوان التفصيلي. |
| `ORDER_REJECTED` | `Account or phone number is restricted` | عذراً، لا يمكن إتمام الطلب، يرجى مراجعة خدمة العملاء. |
| `EMPTY_CART` | `Order must contain at least one item` | سلة المشتريات فارغة. |

---

### 1.2 تتبع الشحنة للجمهور: `track_order`
- **نوع الدالة:** `RPC (POST /rest/v1/rpc/track_order)`
- **الصلاحية:** الزائر (Anon).
- **الأمان:** يتطلب كلاً من رقم الطلب ورقم الهاتف المسجل للحماية من التخمين واستخراج البيانات (Anti-IDOR).

#### المدخلات:
| المعامل | النوع | إلزامي؟ |
|---|---|---|
| `p_order_number` | `TEXT` | نعم |
| `p_phone` | `TEXT` | نعم |

#### الاستجابة في حالة العثور على الطلب:
```json
{
  "found": true,
  "order_number": "RV-2026-10001",
  "status": "shipped",
  "status_ar": "الشحنة مع مندوب شركة الشحن في طريقها إليك",
  "shipping_carrier": "Bosta",
  "tracking_number": "TRK-BOSTA-12345",
  "destination_governorate": "القاهرة",
  "total": 400.00,
  "currency": "EGP",
  "created_at": "2026-10-20T04:45:00Z"
}
```

#### الاستجابة في حالة عدم التطابق:
```json
{
  "found": false,
  "message_ar": "لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.",
  "message_en": "No order found matching the provided order number and phone."
}
```

---


### 1.3 التحقق الآمن من توفر المنتجات: `product_availability` (View)
- **النوع:** `PostgREST View (GET /rest/v1/product_availability)`
- **الصلاحية:** الزائر (Anon) والعميل المسجل (Authenticated).
- **الأمان:** حماية المنافسة والخصوصية — تعرض فقط حالة التوفر (`in_stock`, `low_stock`, `out_of_stock`) دون كشف كميات المخزون الحقيقية نهائياً.
- **الأعمدة:** `product_id (UUID)`, `in_stock (BOOLEAN)`, `stock_status (TEXT)`.

### 1.4 الاشتراك في القائمة البريدية: `newsletter_subscribers`
- **النوع:** `PostgREST Table (POST /rest/v1/newsletter_subscribers)`
- **الصلاحية:** الزائر والعميل المسجل (Insert-Only عبر RLS). القراءة محجوبة تماماً على غير الأدمن.
- **الحقول:** `email (TEXT UNIQUE)`, `source (TEXT DEFAULT 'storefront')`.

---

## 2. دوال الإدارة والتحكم (Admin APIs)

> [!IMPORTANT]
> كافة دوال الأدمن تتطلب توثيق مستخدم بصلاحية `role = 'admin'` في جدول `profiles`. استدعاؤها من مستخدم عادي أو زائر يُرجع خطأ `FORBIDDEN: Admin access required`.

### 2.1 جلب الطلبات مع الفلترة والترقيم: `admin_get_orders`
- **المدخلات:**
  - `p_status` (اختياري: `new`, `confirmed`, `packed`, `shipped`, `delivered`, `refused`, `cancelled`).
  - `p_governorate_id` (اختياري: UUID المحافظة).
  - `p_from_date` / `p_to_date` (اختياري: نطاق زمني).
  - `p_search` (اختياري: بحث في رقم الطلب أو اسم العميل أو الهاتف).
  - `p_limit` (الافتراضي 20).
  - `p_offset` (الافتراضي 0).
- **المخرجات:**
```json
{
  "total_count": 42,
  "limit": 20,
  "offset": 0,
  "orders": [...]
}
```

### 2.2 تحديث حالة الطلب وبيانات الشحن: `admin_update_order_status`
- **المدخلات:**
  - `p_order_id`: UUID
  - `p_new_status`: الحالة الجديدة (يتم التحقق الصارم من مسار الانتقال المسموح).
  - `p_reason`: سبب التغيير (يُسجل في سجل تدقيق تاريخ الطلب `order_status_history`).
  - `p_shipping_carrier`: شركة الشحن (مثل Bosta, Aramex, مندوب REEVITA).
  - `p_tracking_number`: رقم البوليصة / التتبع.

### 2.3 مؤشرات الأداء والتقارير: `admin_get_metrics`
- **المخرجات:**
```json
{
  "total_orders": 128,
  "total_sales_egp": 86400.00,
  "orders_by_status": {
    "new": 12,
    "confirmed": 18,
    "packed": 8,
    "shipped": 22,
    "delivered": 60,
    "refused": 4,
    "cancelled": 4
  },
  "delivered_count": 60,
  "refused_count": 4,
  "refusal_rate_percentage": 6.25,
  "low_stock_count": 2,
  "low_stock_items": [
    {
      "product_id": "33333333-0000-0000-0000-000000000009",
      "name": "Anti-Aging Renewal Serum",
      "name_ar": "سيروم تجديد ومكافحة التجاعيد",
      "quantity_available": 3,
      "low_stock_threshold": 5
    }
  ]
}
```

### 2.4 تعديل المخزون مع الرقابة: `admin_update_inventory`
- **المدخلات:** `p_product_id`, `p_quantity_available`, `p_low_stock_threshold`
- يسجل العملية تلقائياً في `audit_log` مع المستخدم والقيمة السابقة والجديدة.

### 2.5 تعديل تسعير شحن المحافظات: `admin_update_shipping_rate`
- **المدخلات:** `p_governorate_id`, `p_shipping_cost`, `p_free_shipping_threshold`
- يسجل العملية تلقائياً في `audit_log`.
