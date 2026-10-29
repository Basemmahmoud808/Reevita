import catalogJson from "@/data/catalog.json";
import type { Brand, Category, Collection, Faq, Fragrance, Product, StockStatus, Testimonial } from "@/lib/types";
import { canonicalProductNames } from "@/lib/product-names";

/**
 * The static brand catalogue is the single source of truth for merchandising
 * metadata (names, copy, fragrance families) and powers demo mode.
 * Prices, stock and availability are re-read from Supabase when configured.
 */
const catalog = catalogJson;

const suppliedProductImages: Record<string, string> = {
  "shampoo-dove": "/images/supplied/Gemini_Generated_Image_ozjt9ozjt9ozjt9o.jfif",
  "shampoo-blueberry": "/images/supplied/Gemini_Generated_Image_echqdaechqdaechq.jfif",
  "body-lotion-queen": "/images/supplied/Gemini_Generated_Image_gyp61agyp61agyp6.jfif",
  "body-lotion-ruby-musk": "/images/supplied/Gemini_Generated_Image_odogaoodogaoodog.jfif",
  "body-lotion-sexy": "/images/supplied/s.jfif",
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

export function getSuppliedProductImage(slug: string, name: string) {
  const image = suppliedProductImages[slug] ?? suppliedProductImages[slug.replace(/-\d+$/, "")];
  return image ? { url: image, alt: `${name} — ${brand.name}` } : undefined;
}

export const brand = catalog.brand as Brand;
export const categories = [...(catalog.categories as Category[])].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);
export const fragrances = [...(catalog.fragrances as Fragrance[])].sort(
  (a, b) => a.displayOrder - b.displayOrder,
);
export const testimonials = catalog.testimonials as Testimonial[];
export const faqs = catalog.faqs as Faq[];

/** Neutral category copy avoids unverified ingredient or performance claims. */
export const categoryDescriptionsAr: Record<string, string> = {
  "body-butter": "بادي باتر REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.",
  "body-lotion": "لوشن جسم REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.",
  "shower-gel": "شاور جل REEVITA للاستخدام أثناء الاستحمام. الرائحة والحجم موضحان على العبوة.",
  shampoo: "شامبو REEVITA للعناية بالشعر. راجعي بيانات العبوة للاطلاع على المكونات وطريقة الاستخدام.",
  "body-splash": "بادي سبلاش REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.",
  "hair-mist": "هير ميست REEVITA. الرائحة والحجم موضحان على صفحة المنتج والعبوة.",
};

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
  isActive?: boolean;
  isInCollection?: boolean;
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
  const names = canonicalProductNames({
    slug: raw.slug,
    categorySlug: raw.category,
    size: raw.size,
    variantLabelAr: raw.variantLabelAr,
    nameEn: raw.nameEn,
    nameAr: raw.nameAr,
  });
  return {
    id: raw.id,
    slug: raw.slug,
    sku: raw.sku,
    nameAr: names.nameAr,
    nameEn: names.nameEn,
    shortAr: raw.shortAr,
    descriptionAr: categoryDescriptionsAr[raw.category] ?? raw.descriptionAr,
    price: raw.price,
    compareAtPrice: raw.compareAtPrice,
    size: raw.size,
    sizeOptions: [],
    isPrimarySizeOption: true,
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
    images: [getSuppliedProductImage(raw.slug, raw.nameEn) ?? {
      url: `/images/products/${raw.slug}.webp`,
      alt: `${raw.nameEn} — ${brand.name}`,
    }],
    rating: raw.rating,
    reviews: raw.reviews,
    stockStatus: stockStatus(raw.stock),
    isFeatured: raw.isFeatured,
    isInCollection: raw.isInCollection ?? false,
    isNew: raw.isNew,
    badge: raw.badge,
    initialStock: raw.stock,
  };
}

export function attachProductSizeOptions(products: Product[]): Product[] {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = [product.categorySlug, product.fragranceSlug, product.variantLabelAr ?? product.slug].join("|");
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }

  const defaultIds = new Set<string>();
  const optionsByProductId = new Map<string, Product["sizeOptions"]>();
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => {
      const amountA = Number(a.size.match(/[\d.]+/)?.[0] ?? 0);
      const amountB = Number(b.size.match(/[\d.]+/)?.[0] ?? 0);
      return amountB - amountA || a.id.localeCompare(b.id);
    });
    const options = sorted.map((product) => ({
      productId: product.id,
      slug: product.slug,
      size: product.size,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stockStatus: product.stockStatus,
    }));
    if (sorted[0]) defaultIds.add(sorted[0].id);
    for (const product of group) optionsByProductId.set(product.id, options);
  }

  return products.map((product) => ({
    ...product,
    sizeOptions: optionsByProductId.get(product.id) ?? [],
    isPrimarySizeOption: defaultIds.has(product.id),
  }));
}

export const staticProducts: Product[] = attachProductSizeOptions(
  (catalog.products as RawProduct[]).filter((product) => product.isActive !== false).map(toProduct),
);

export const staticCollections: Collection[] = [
  ...fragrances.map((fragrance) => ({
    id: `static-${fragrance.slug}`,
    slug: fragrance.slug,
    nameEn: fragrance.nameEn,
    nameAr: fragrance.nameAr,
    descriptionAr: fragrance.descriptionAr || fragrance.taglineAr,
    image: fragrance.image,
    displayOrder: fragrance.displayOrder,
    isPublished: true,
    productIds: staticProducts.filter((product) => product.fragranceSlug === fragrance.slug).map((product) => product.id),
  })),
  {
    id: "static-soft-glow-bundle",
    slug: "soft-glow-bundle",
    nameEn: "Soft & Glow Bundle",
    nameAr: "باقة النعومة والإشراقة",
    descriptionAr: "A coordinated hair care set with shampoo and hair mist in three signature scents.",
    image: "/images/collections/soft-glow-bundle.jpg",
    displayOrder: 50,
    isPublished: true,
    purchaseReady: true,
    missingProducts: [],
    productIds: featuredCollectionProductIds([
      "shampoo-blueberry", "hair-mist-ruby-musk",
      "shampoo-dove", "hair-mist-queen",
      "shampoo-bubble-gum", "hair-mist-sexy",
    ]),
  },
  {
    id: "static-fresh-all-day-bundle",
    slug: "fresh-all-day-bundle",
    nameEn: "Fresh All Day Bundle",
    nameAr: "باقة الانتعاش طوال اليوم",
    descriptionAr: "A complete body care routine with lotion, body splash, and body butter.",
    image: "/images/collections/fresh-all-day-bundle.jpg",
    displayOrder: 51,
    isPublished: true,
    purchaseReady: true,
    productIds: staticProducts
      .filter((product) => [
        "body-lotion-queen", "body-splash-queen", "body-butter-queen",
        "body-lotion-ruby-musk", "body-splash-ruby-musk", "body-butter-ruby-musk",
        "body-lotion-sexy", "body-splash-sexy", "body-butter-sexy",
      ].includes(product.slug))
      .map((product) => product.id),
  },
];

function featuredCollectionProductIds(slugs: string[]) {
  return slugs
    .map((slug) => staticProducts.find((product) => product.slug === slug)?.id)
    .filter((id): id is string => Boolean(id));
}

/** Supplied-image collections and verified bundle compositions used in demo mode. */
export const featuredCollections: Collection[] = [
  {
    id: "static-sweet-mood",
    slug: "sweet-mood",
    nameEn: "Sweet Mood",
    nameAr: "Sweet Mood",
    descriptionAr: "A shampoo and hair mist duo for a sweet, scented hair ritual.",
    image: "/images/collections/soft-glow-bubblegum.jpg",
    displayOrder: 5,
    isPublished: true,
    productIds: featuredCollectionProductIds(["shampoo-bubble-gum", "hair-mist-sexy"]),
  },
  {
    id: "static-clean-mood",
    slug: "clean-mood",
    nameEn: "Clean Mood",
    nameAr: "Clean Mood",
    descriptionAr: "A shampoo and hair mist duo for a soft, fresh hair ritual.",
    image: "/images/collections/soft-glow-dove.jpg",
    displayOrder: 6,
    isPublished: true,
    productIds: featuredCollectionProductIds(["shampoo-dove", "hair-mist-queen"]),
  },
  {
    id: "static-ruby-musk-collection",
    slug: "ruby-musk-collection",
    nameEn: "Ruby Musk Collection",
    nameAr: "Ruby Musk Collection",
    descriptionAr: "A warm, luminous musk ritual for soft, scented skin.",
    image: "/images/collections/ruby-musk-collection.jpg",
    displayOrder: 7,
    isPublished: true,
    productIds: featuredCollectionProductIds(["body-lotion-ruby-musk", "body-splash-ruby-musk", "body-butter-ruby-musk"]),
  },
  {
    id: "static-sexy-collection",
    slug: "sexy-collection",
    nameEn: "Sexy Collection",
    nameAr: "Sexy Collection",
    descriptionAr: "An elegant, expressive ritual with lasting fragrance.",
    image: "/images/collections/sexy-collection.jpg",
    displayOrder: 8,
    isPublished: true,
    productIds: featuredCollectionProductIds(["body-lotion-sexy", "body-splash-sexy", "body-butter-sexy"]),
  },
  {
    id: "static-fruity-mood",
    slug: "fruity-mood",
    nameEn: "Fruity Mood",
    nameAr: "Fruity Mood",
    descriptionAr: "A shampoo and hair mist duo with a bright, fruity feel.",
    image: "/images/collections/soft-glow-blueberry.jpg",
    displayOrder: 9,
    isPublished: true,
    productIds: featuredCollectionProductIds(["shampoo-blueberry", "hair-mist-ruby-musk"]),
  },
  {
    id: "static-soft-glow-bundle",
    slug: "soft-glow-bundle",
    nameEn: "Soft & Glow Bundle",
    nameAr: "باقة النعومة والإشراقة",
    descriptionAr: "روتين عناية بالشعر يجمع الشامبو ومعطر الشعر في اختيارات تناسب مزاجك.",
    image: "/images/collections/soft-glow-bundle.jpg",
    displayOrder: 2,
    isPublished: true,
    purchaseReady: true,
    missingProducts: [],
    productIds: featuredCollectionProductIds([
      "shampoo-blueberry", "hair-mist-ruby-musk",
      "shampoo-dove", "hair-mist-queen",
      "shampoo-bubble-gum", "hair-mist-sexy",
    ]),
  },
  {
    id: "static-fresh-all-day-bundle",
    slug: "fresh-all-day-bundle",
    nameEn: "Fresh All Day Bundle",
    nameAr: "باقة الانتعاش طوال اليوم",
    descriptionAr: "ثلاثة اختيارات عطرية تجمع لوشن الجسم وسبراي الجسم وزبدة الجسم.",
    image: "/images/collections/fresh-all-day-bundle.jpg",
    displayOrder: 4,
    isPublished: true,
    purchaseReady: true,
    missingProducts: [],
    productIds: featuredCollectionProductIds([
      "body-lotion-queen", "body-splash-queen", "body-butter-queen",
      "body-lotion-ruby-musk", "body-splash-ruby-musk", "body-butter-ruby-musk",
      "body-lotion-sexy", "body-splash-sexy", "body-butter-sexy",
    ]),
  },
  {
    id: "static-hair-care-duo-bundle",
    slug: "hair-care-duo-bundle",
    nameEn: "Hair Care Duo Bundle",
    nameAr: "Hair Care Duo Bundle",
    descriptionAr: "A coordinated shampoo and hair mist ritual for fresh, scented hair.",
    image: "/images/collections/hair-care-duo-products.jpg",
    displayOrder: 1,
    isPublished: true,
    purchaseReady: true,
    productIds: featuredCollectionProductIds(["shampoo-blueberry", "hair-mist-ruby-musk"]),
  },
  {
    id: "static-complete-care-bundle",
    slug: "complete-care-bundle",
    nameEn: "Complete Care Bundle",
    nameAr: "Complete Care Bundle",
    descriptionAr: "A full-body care ritual shown in the supplied bundle image.",
    image: "/images/collections/complete-care-bundle.jpg",
    displayOrder: 3,
    isPublished: true,
    purchaseReady: true,
    missingProducts: [],
    productIds: featuredCollectionProductIds([
      "body-lotion-sexy",
      "body-lotion-queen",
      "body-lotion-ruby-musk",
      "body-splash-sexy",
      "body-splash-queen",
      "body-splash-ruby-musk",
      "shower-gel-bubble-gum",
      "shower-gel-blueberry",
      "shower-gel-dove",
    ]),
  },
]
  .filter((collection) => [
    "hair-care-duo-bundle",
    "soft-glow-bundle",
    "complete-care-bundle",
    "fresh-all-day-bundle",
  ].includes(collection.slug))
  .sort((a, b) => a.displayOrder - b.displayOrder);

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

export function collectionProducts(limit = 8): Product[] {
  return staticProducts.filter((product) => product.isInCollection).slice(0, limit);
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
