import { z } from "zod";
import { isValidEgyptianPhone } from "@/lib/phone";

const phoneSchema = z
  .string()
  .trim()
  .min(1, { message: "رقم الهاتف مطلوب" })
  .refine(isValidEgyptianPhone, {
    message: "أدخلي رقم هاتف محمول مصري صحيح (010 / 011 / 012 / 015)",
  });

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, { message: "الاسم مطلوب (حرفان على الأقل)" })
    .max(80, { message: "الاسم طويل جدًا" }),
  customerPhone: phoneSchema,
  customerEmail: z
    .union([z.literal(""), z.string().trim().email({ message: "البريد الإلكتروني غير صحيح" })])
    .optional()
    .transform((value) => (value ? value : null)),
  governorateId: z.string().uuid({ message: "اختاري المحافظة" }),
  city: z.string().trim().min(2, { message: "المدينة / الحي مطلوب" }).max(80),
  addressLine: z
    .string()
    .trim()
    .min(5, { message: "العنوان التفصيلي مطلوب (الشارع، رقم العمارة، الشقة)" })
    .max(240),
  landmark: z.string().trim().max(120).optional().transform((value) => value || null),
  orderNotes: z.string().trim().max(500).optional().transform((value) => value || null),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, { message: "سلة المشتريات فارغة" })
    .max(20),
  terms: z.literal(true, { error: "يجب الموافقة على الشروط وسياسة الاسترجاع." }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(6, { message: "رقم الطلب مطلوب" })
    .max(32)
    .regex(/^RV-\d{4}-\d{5}$/i, { message: "صيغة رقم الطلب غير صحيحة (مثال: RV-2026-10001)" }),
  phone: phoneSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(8, { message: "كلمة المرور 8 أحرف على الأقل" }),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, { message: "الاسم مطلوب" }).max(80),
  phone: phoneSchema,
});

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  governorateId: z.string().uuid(),
  city: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(5).max(240),
  landmark: z.string().trim().max(120).optional().nullable(),
});

export const adminStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum([
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "refused",
    "returned",
    "cancelled",
  ]),
  reason: z.string().trim().max(240).optional(),
  carrier: z.string().trim().max(80).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
});

export const adminInventorySchema = z.object({
  productId: z.string().uuid(),
  quantityAvailable: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(1000).optional(),
});

export const adminShippingSchema = z.object({
  governorateId: z.string().uuid(),
  shippingCost: z.number().min(0).max(10000),
  freeShippingThreshold: z.number().min(0).max(100000),
});

export const adminProductSchema = z.object({
  name: z.string().trim().min(2, "اسم المنتج مطلوب").max(120),
  nameAr: z.string().trim().min(2, "اسم المنتج بالعربية مطلوب").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "الرابط المختصر مطلوب")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الرابط المختصر يجب أن يكون بالإنجليزية وبشرطات فقط"),
  categorySlug: z.string().trim().min(1, "التصنيف مطلوب").max(80),
  shortDescriptionAr: z.string().trim().max(240).optional(),
  description: z.string().trim().min(10, "وصف المنتج مطلوب").max(4000),
  price: z.number().finite().min(0).max(1000000),
  compareAtPrice: z.number().finite().min(0).max(1000000).nullable().optional(),
  size: z.string().trim().max(80).optional(),
  quantityAvailable: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(1000),
  isFeatured: z.boolean().default(false),
  publish: z.boolean().default(false),
});

export const adminProductUpdateSchema = adminProductSchema
  .omit({ publish: true, quantityAvailable: true, lowStockThreshold: true, isFeatured: true })
  .extend({
    productId: z.string().uuid(),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
  });

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(2000),
});
