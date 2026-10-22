import catalogJson from "@/data/catalog.json";
import type { Brand, Category, Faq, Fragrance, Product, StockStatus, Testimonial } from "@/lib/types";

/**
 * The static brand catalogue is the single source of truth for merchandising
 * metadata (names, copy, fragrance families, ratings) and powers the demo mode.
 * Prices, stock and availability are re-read from Supabase when configured.
 */
const catalog = catalogJson;

const suppliedProductImages: Record<string, string> = {
  "shampoo-aloe-vera": "/images/supplied/Gemini_Generated_Image_ozjt9ozjt9ozjt9o.jfif",
  "shampoo-blueberry": "/images/supplied/Gemini_Generated_Image_echqdaechqdaechq.jfif",
  "body-lotion-queen": "/images/supplied/Gemini_Generated_Image_gyp61agyp61agyp6.jfif",
  "body-lotion-ruby-musk": "/images/supplied/Gemini_Generated_Image_odogaoodogaoodog.jfif",
  "body-butter-sexy": "/images/supplied/Gemini_Generated_Image_yow1joyow1joyow1.jfif",
  "body-butter-queen": "/images/supplied/Gemini_Generated_Image_bp52xsbp52xsbp52.jfif",
  "body-butter-ruby-musk": "/images/supplied/Gemini_Generated_Image_x8eg2wx8eg2wx8eg.jfif",
  "body-splash-sexy": "/images/supplied/Gemini_Generated_Image_z6nj55z6nj55z6nj.jfif",
  "body-splash-queen": "/images/supplied/Gemini_Generated_Image_ko6hg2ko6hg2ko6h.jfif",
  "body-splash-ruby-musk": "/images/supplied/Gemini_Generated_Image_rsfpt0rsfpt0rsfp.jfif",
  "hair-mist-sexy": "/images/supplied/Gemini_Generated_Image_kj1ed5kj1ed5kj1e.jfif",
  "hair-mist-queen": "/images/supplied/Gemini_Generated_Image_6q61gp6q61gp6q61.jfif",
  "hair-mist-ruby-musk": "/images/supplied/Gemini_Generated_Image_b2l3jab2l3jab2l3.jfif",
};

export const brand = catalog.brand as Brand;
export const categories = [...(catalog.categories as Category[])].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);
export const fragrances = [...(catalog.fragrances as Fragrance[])].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);
export const testimonials = catalog.testimonials as Testimonial[];
export const faqs = catalog.faqs as Faq[];

interface RawProduct {
  id: string;
  slug: string;
  sku: string;
  category: string;
  fragrance: string;
  variantLabelAr: string | null;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  descriptionAr: string;
  price: number;
  compareAtPrice: number | null;
  size: string;
  benefits: string[];
  ingredientsAr: string;
  howToUseAr: string;
  stock: number;
  rating: number;
  reviews: number;
  isFeatured: boolean;
  isNew: boolean;
  badge: string | null;
}

function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "in_stock";
}

function toProduct(raw: RawProduct): Product {
  const category = categories.find((item) => item.slug === raw.category);
  const fragrance = fragrances.find((item) => item.slug === raw.fragrance);
  return {
    id: raw.id,
    slug: raw.slug,
    sku: raw.sku,
    nameAr: raw.nameAr,
    nameEn: raw.nameEn,
    shortAr: raw.shortAr,
    descriptionAr: raw.descriptionAr,
    price: raw.price,
    compareAtPrice: raw.compareAtPrice,
    size: raw.size,
    categorySlug: raw.category,
    categoryNameAr: category?.nameAr ?? "",
    categoryNameEn: category?.nameEn ?? "",
    fragranceSlug: raw.fragrance,
    fragranceNameAr: fragrance?.nameAr ?? "",
    fragranceNameEn: fragrance?.nameEn ?? "",
    variantLabelAr: raw.variantLabelAr,
    benefits: raw.benefits,
    ingredientsAr: raw.ingredientsAr,
    howToUseAr: raw.howToUseAr,
    images: [
      {
        url: suppliedProductImages[raw.slug] ?? `/images/products/${raw.slug}.webp`,
        alt: `${raw.nameEn} — ${brand.name}`,
      },
    ],
    rating: raw.rating,
    reviews: raw.reviews,
    stockStatus: stockStatus(raw.stock),
    isFeatured: raw.isFeatured,
    isNew: raw.isNew,
    badge: raw.badge,
    initialStock: raw.stock,
  };
}

export const staticProducts: Product[] = (catalog.products as RawProduct[]).map(toProduct);

export function getStaticProduct(slug: string): Product | undefined {
  return staticProducts.find((product) => product.slug === slug);
}

export function getStaticCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getFragrance(slug: string): Fragrance | undefined {
  return fragrances.find((fragrance) => fragrance.slug === slug);
}

export function countByCategory(slug: string): number {
  return staticProducts.filter((product) => product.categorySlug === slug).length;
}

export function countByFragrance(slug: string): number {
  return staticProducts.filter((product) => product.fragranceSlug === slug).length;
}

export function featuredProducts(limit = 4): Product[] {
  return staticProducts.filter((product) => product.isFeatured).slice(0, limit);
}

export function bestSellers(limit = 4): Product[] {
  return [...staticProducts].sort((a, b) => b.reviews - a.reviews).slice(0, limit);
}

export function newArrivals(limit = 4): Product[] {
  return staticProducts.filter((product) => product.isNew).slice(0, limit);
}

/** Related products: same fragrance family first, then the same product line. */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const seen = new Set<string>([product.slug]);
  const result: Product[] = [];
  const push = (candidate: Product) => {
    if (seen.has(candidate.slug) || result.length >= limit) return;
    seen.add(candidate.slug);
    result.push(candidate);
  };
  staticProducts
    .filter((item) => item.fragranceSlug === product.fragranceSlug)
    .forEach(push);
  staticProducts
    .filter((item) => item.categorySlug === product.categorySlug)
    .forEach(push);
  staticProducts.slice(0, limit).forEach(push);
  return result;
}

export function productsByCategory(slug: string): Product[] {
  return staticProducts.filter((product) => product.categorySlug === slug);
}

export function productsByFragrance(slug: string): Product[] {
  return staticProducts.filter((product) => product.fragranceSlug === slug);
}

export const catalogSource = catalog;
