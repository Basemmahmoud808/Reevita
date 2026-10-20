# دليل تسليم الباك إند للواجهة الأمامية (Frontend Handoff) — REEVITA

وثيقة تفصيلية لمطور الفرونت إند لربط الواجهة مع Supabase وخدمات الـ Backend الخاصة بالسوق المصري (COD).

---

## 1. متغيرات البيئة للفرونت إند (.env)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS=false
```
> [!IMPORTANT]
> **ممنوع نهائياً** تمرير أو استخدام مفتاح `service_role` في الفرونت إند تحت أي ظرف. استخدم الـ `anon` key فقط.

---

## 2. استرجاع كتالوج المنتجات (Public Catalog)

### أ. قراءة المنتجات النشطة
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select(`
    id,
    slug,
    name,
    name_ar,
    short_description,
    short_description_ar,
    description,
    price,
    compare_at_price,
    benefits,
    ingredients,
    how_to_use,
    size,
    is_featured,
    category:categories (id, slug, name, name_ar),
    images:product_images (id, image_url, alt_text, is_primary)
  `)
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### ب. قراءة المحافظات الـ 27 ورسوم الشحن
```typescript
const { data: governorates, error } = await supabase
  .from('governorates')
  .select(`
    id,
    code,
    name_ar,
    name_en,
    zone,
    shipping_rate:shipping_rates (
      shipping_cost,
      free_shipping_threshold,
      estimated_days_min,
      estimated_days_max
    )
  `)
  .eq('is_active', true);
```

---

## 3. إتمام الطلب بالدفع عند الاستلام (Checkout via `place_order` RPC)
> [!NOTE]
> لا يُسمح بعمل `INSERT` مباشر على جدول `orders`. يجب استدعاء الدالة المعاملاتية `place_order`. السعر الحقيقي ورسوم الشحن والإجمالي تُحسب داخل Postgres لمنع التلاعب.

### كود الاستدعاء:
```typescript
const { data, error } = await supabase.rpc('place_order', {
  p_customer_name: "سارة أحمد",
  p_customer_phone: "01012345678",        // يدعم أي صيغة مصرية (010, 011, 012, 015)
  p_customer_email: "sara@example.com",   // اختياري
  p_governorate_id: selectedGovernorateId,
  p_city: "مدينة نصر",
  p_address_line: "شارع عباس العقاد، عمارة 12، شقة 4",
  p_landmark: "بجوار بنك مصر",            // اختياري
  p_order_notes: "يرجى الاتصال قبل الوصول",// اختياري
  p_items: [
    {
      product_id: "33333333-0000-0000-0000-000000000001",
      quantity: 2
    }
  ]
});

if (error) {
  // تعامل مع الأخطاء
  console.error("خطأ في الطلب:", error.message);
} else {
  console.log("تم إنشاء الطلب بنجاح! رقم الطلب:", data.order_number);
}
```

### معالجة الأخطاء المحتملة في الواجهة:
| كود / نص الخطأ | السبب | الرسالة المقترحة للمستخدم في الواجهة |
|---|---|---|
| `INVALID_PHONE` | رقم الهاتف غير مصري أو غير صحيح | "يرجى إدخال رقم هاتف محمول مصري صحيح مكون من 11 رقم (010, 011, 012, 015)." |
| `INSUFFICIENT_STOCK` | نفاد كمية المنتج أو شرائه بالتزامن | "عذراً، الكمية المطلوبة غير متوفرة حالياً في المخزون." |
| `INVALID_INPUT` | الاسم أقل من حرفين أو العنوان أقل من 5 أحرف | "يرجى استكمال الاسم والعنوان بالتفصيل لضمان سرعة التوصيل." |
| `ORDER_REJECTED` | الهاتف أو الحساب محظور لسوابق رفض استلام | "عذراً، لا يمكن إتمام الطلب. يرجى التواصل مع خدمة العملاء للمساعدة." |
| `EMPTY_CART` | السلة فارغة | "سلة مشترياتك فارغة." |

---

## 4. استجابة نجاح الطلب
```json
{
  "success": true,
  "order_id": "99b9a6d8-...",
  "order_number": "RV-2026-10001",
  "status": "new",
  "customer_name": "سارة أحمد",
  "customer_phone": "+201012345678",
  "subtotal": 700.00,
  "shipping_fee": 50.00,
  "cod_fee": 0.00,
  "total": 750.00,
  "currency": "EGP",
  "created_at": "2026-10-20T01:50:00Z"
}
```
*(يتم توجيه العميل فوراً إلى صفحة تأكيد الطلب وعرض `order_number`)*.
