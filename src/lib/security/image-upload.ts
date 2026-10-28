/**
 * Product image upload validation.
 *
 * The browser-supplied MIME type alone is attacker-controlled metadata, so an
 * "image/jpeg" upload can actually be HTML, SVG or a polyglot file. Every upload
 * is therefore checked against the file signature (magic bytes) of the only
 * formats the storefront supports. SVG is deliberately not accepted: it can
 * carry active content and the storage bucket is public.
 */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ProductImageType = (typeof PRODUCT_IMAGE_TYPES)[number];

export interface ProductImageValidation {
  ok: boolean;
  error?: string;
  /** Verified content type (matches both the declared type and the file signature). */
  contentType?: ProductImageType;
  extension?: "jpg" | "png" | "webp";
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function sniff(bytes: Uint8Array): ProductImageType | null {
  // JPEG: FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP: "RIFF" .... "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}

export async function validateProductImage(file: unknown): Promise<ProductImageValidation> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "صورة المنتج مطلوبة." };
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return { ok: false, error: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت." };
  }
  if (!PRODUCT_IMAGE_TYPES.includes(file.type as ProductImageType)) {
    return { ok: false, error: "الصورة يجب أن تكون JPG أو PNG أو WEBP." };
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = sniff(header);
  if (!detected) {
    return { ok: false, error: "محتوى الملف لا يطابق صيغة صورة مدعومة." };
  }
  if (detected !== file.type) {
    return { ok: false, error: "نوع الملف المعلن لا يطابق محتوى الصورة." };
  }

  const extension = detected === "image/png" ? "png" : detected === "image/webp" ? "webp" : "jpg";
  return { ok: true, contentType: detected, extension };
}
