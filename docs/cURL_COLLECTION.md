# مجموعة أوامر cURL للتجربة اليدوية (cURL Collection)

استبدل `$SUPABASE_URL` و `$ANON_KEY` و `$SERVICE_KEY` بالقيم المناسبة من مشروعك.

---

## 1. قراءة المنتجات والتصنيفات (Public Catalog)
```bash
# جلب كافة المنتجات النشطة مع الصور والتصنيف
curl -X GET "$SUPABASE_URL/rest/v1/products?select=id,slug,name,name_ar,price,compare_at_price,is_featured,category:categories(name,name_ar),images:product_images(image_url,is_primary)&is_active=eq.true" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
```

---

## 2. قراءة المحافظات ورسوم الشحن (Governorates & Shipping)
```bash
# جلب الـ 27 محافظة مصرية مع رسوم الشحن
curl -X GET "$SUPABASE_URL/rest/v1/governorates?select=id,code,name_ar,name_en,zone,shipping_rates(shipping_cost,free_shipping_threshold,estimated_days_min,estimated_days_max)&is_active=eq.true" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
```

---

## 3. إنشاء طلب جديد (Place COD Order)
```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/place_order" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_customer_name": "سارة أحمد",
    "p_customer_phone": "01012345678",
    "p_customer_email": "sara@example.com",
    "p_governorate_id": "11111111-0000-0000-0000-000000000001",
    "p_city": "مدينة نصر",
    "p_address_line": "شارع مكرم عبيد عمارة 15 شقة 4",
    "p_landmark": "أمام سيتي ستارز",
    "p_order_notes": "برجاء الاتصال قبل الموعد بساعة",
    "p_items": [
      {
        "product_id": "33333333-0000-0000-0000-000000000001",
        "quantity": 1
      }
    ]
  }'
```

---

## 4. تتبع الشحنة برقم الطلب والهاتف (Public Track Order)
```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/track_order" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_order_number": "RV-2026-10001",
    "p_phone": "01012345678"
  }'
```

---

## 5. عمليات الأدمن (Admin Protected APIs)

### أ. جلب قائمة الطلبات مع الفلترة:
```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/admin_get_orders" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_status": "new",
    "p_limit": 20,
    "p_offset": 0
  }'
```

### ب. جلب إحصائيات المتجر ونسبة الرفض (KPIs):
```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/admin_get_metrics" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### ج. تحديث حالة الطلب وإدخال بوليصة الشحن:
```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/admin_update_order_status" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_order_id": "YOUR_ORDER_UUID",
    "p_new_status": "shipped",
    "p_reason": "تم تسليم الشحنة لشركة بوسطة",
    "p_shipping_carrier": "Bosta",
    "p_tracking_number": "TRK-BOSTA-998877"
  }'
```
