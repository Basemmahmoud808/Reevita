# هياكل البيانات المتوقعة (Expected Data Shapes) — REEVITA

تم إعداد هذا المستند بناءً على مواصفات متجر REEVITA لضمان توافق مخطط قاعدة البيانات (Schema) والـ RPC Functions مع ما تحتاجه الواجهة الأمامية دون الحاجة إلى أي تعديل مستقبلي في بنية الجداول.

---

## 1. المنتجات والتصنيفات (Catalog)

### جدول `categories`
```json
{
  "id": "uuid",
  "slug": "hair-care",
  "name": "Hair Care",
  "name_ar": "العناية بالشعر",
  "description": "Premium hair care products for stronger, shinier hair",
  "image_url": "https://.../categories/hair-care.jpg",
  "display_order": 1,
  "is_active": true
}
```

### جدول `products`
```json
{
  "id": "uuid",
  "slug": "revitalizing-shampoo",
  "name": "Revitalizing Shampoo",
  "name_ar": "شامبو تجديد وحيوية الشعر",
  "category_id": "uuid",
  "short_description": "For strong, shiny, and revitalized hair",
  "short_description_ar": "لقوة ولمعان وتجديد حيوية الشعر",
  "description": "Full editorial description of product features and botanicals...",
  "price": 350.00,
  "compare_at_price": 420.00,
  "benefits": ["Strengthens roots", "Restores shine", "Sulfate-free"],
  "ingredients": "Aqua, Rosemary Extract, Argan Oil...",
  "how_to_use": "Apply to wet hair, massage gently, rinse thoroughly.",
  "size": "250ml",
  "is_featured": true,
  "is_active": true,
  "created_at": "timestamp"
}
```

### جدول `product_images`
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "image_url": "https://.../products/shampoo-front.jpg",
  "alt_text": "REEVITA Revitalizing Shampoo Bottle",
  "display_order": 1,
  "is_primary": true
}
```

### جدول `inventory`
```json
{
  "product_id": "uuid",
  "quantity_available": 50,
  "quantity_reserved": 0,
  "low_stock_threshold": 5,
  "updated_at": "timestamp"
}
```

---

## 2. الشحن والمحافظات (Shipping & Locations)

### جدول `governorates`
```json
{
  "id": "uuid",
  "code": "CAI",
  "name_ar": "القاهرة",
  "name_en": "Cairo",
  "is_active": true
}
```

### جدول `shipping_rates`
```json
{
  "id": "uuid",
  "governorate_id": "uuid",
  "cost": 50.00,
  "free_shipping_threshold": 1000.00,
  "estimated_delivery_days_min": 1,
  "estimated_delivery_days_max": 2,
  "is_active": true
}
```

---

## 3. الطلبات (Orders & Checkout)

### مدخلات إنشاء طلب COD: `place_order` Payload
```json
{
  "customer_name": "سارة أحمد",
  "customer_phone": "01012345678",
  "customer_email": "sara@example.com",
  "governorate_id": "uuid-for-cairo",
  "city": "مدينة نصر",
  "address_line": "شارع عباس العقاد، عمارة 12، شقة 4",
  "postal_code": null,
  "order_notes": "يرجى الاتصال قبل الوصول",
  "items": [
    {
      "product_id": "uuid-for-shampoo",
      "quantity": 2
    },
    {
      "product_id": "uuid-for-serum",
      "quantity": 1
    }
  ]
}
```

### استجابة إنشاء الطلب الناجحة
```json
{
  "success": true,
  "order_id": "uuid",
  "order_number": "RV-2026-10492",
  "status": "new",
  "subtotal": 1180.00,
  "shipping_cost": 0.00,
  "cod_fee": 0.00,
  "total": 1180.00,
  "currency": "EGP",
  "created_at": "2026-10-20T01:30:00Z"
}
```

### تتبع الطلب للجمهور: `track_order`
- **المدخلات:** `order_number` + `customer_phone`
- **المخرجات:**
```json
{
  "order_number": "RV-2026-10492",
  "status": "shipped",
  "status_text_ar": "تم الشحن مع مندوب التوصيل",
  "status_text_en": "Out for delivery",
  "shipping_carrier": "REEVITA Express",
  "tracking_number": "TRK-98214",
  "total": 1180.00,
  "created_at": "2026-10-20T01:30:00Z",
  "estimated_delivery": "2026-10-22"
}
```
*(ملاحظة: لا يتم إرجاع العنوان التفصيلي أو إيميل العميل لحماية الخصوصية).*
