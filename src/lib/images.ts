import { productBlurData } from "@/lib/image-placeholders";

const FALLBACK_BLUR =
  "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoKAAoAAUAmJQBOgCHwAP7/9Q==";

export function blurForSlug(slug: string | undefined | null): string {
  if (!slug) return FALLBACK_BLUR;
  return productBlurData[slug] ?? FALLBACK_BLUR;
}
