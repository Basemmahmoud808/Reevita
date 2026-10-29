import catalogJson from "@/data/catalog.json";
import type { Brand, Category, Collection, Faq, Fragrance, Product, StockStatus, Testimonial } from "@/lib/types";
import { canonicalProductNames } from "@/lib/product-names";
import { curatedCollectionDefinitions } from "@/lib/curated-collections";

/**
 * The static brand catalogue is the single source of truth for merchandising
 * metadata (names, copy, fragrance families) and powers demo mode.
 * Prices, stock and availability are re-read from Supabase when configured.
 */
const catalog = catalogJson;

const suppliedProductImages: Record<string, string> = {
  "shampoo-dove": "/images/supplied/Gemini_Generated_Image_ozjt9ozjt9ozjt9o.jpg",
  "shampoo-blueberry": "/images/supplied/Gemini_Generated_Image_echqdaechqdaechq.jpg",
  "body-lotion-queen": "/images/supplied/Gemini_Generated_Image_gyp61agyp61agyp6.jpg",
  "body-lotion-ruby-musk": "/images/supplied/Gemini_Generated_Image_odogaoodogaoodog.jpg",
  "body-lotion-sexy": "/images/supplied/s.jpg",
  "body-butter-sexy": "/images/supplied/Gemini_Generated_Image_yow1joyow1joyow1.jpg",
  "body-butter-queen": "/images/supplied/Gemini_Generated_Image_bp52xsbp52xsbp52.jpg",
  "body-butter-ruby-musk": "/images/supplied/Gemini_Generated_Image_x8eg2wx8eg2wx8eg.jpg",
  "body-splash-sexy": "/images/supplied/Gemini_Generated_Image_z6nj55z6nj55z6nj.jpg",
  "body-splash-queen": "/images/supplied/Gemini_Generated_Image_ko6hg2ko6hg2ko6h.jpg",
  "body-splash-ruby-musk": "/images/supplied/Gemini_Generated_Image_rsfpt0rsfpt0rsfp.jpg",
  "hair-mist-sexy": "/images/supplied/Gemini_Generated_Image_kj1ed5kj1ed5kj1e.jpg",
  "hair-mist-queen": "/images/supplied/Gemini_Generated_Image_6q61gp6q61gp6q61.jpg",
  "hair-mist-ruby-musk": "/images/supplied/Gemini_Generated_Image_b2l3jab2l3jab2l3.jpg",
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

/** Arabic product descriptions supplied for the corresponding category pages. */
export const categoryDescriptionsAr: Record<string, string> = {
  "body-butter": "زبدة جسم غنية بقوام كريمي ناعم يذوب على بشرتك ليمنحها ترطيبًا مكثفًا ونعومة تدوم طويلًا. بتركيبة غنية بزبدة الشيا والكاكاو وزيت اللوز الحلو، مع البانثينول والجلسرين وفيتامين E، للمساعدة على تغذية البشرة وحمايتها من الجفاف، وتركها ناعمة وحريرية بلمسة من عطرك المفضل.",
  "body-lotion": "لوشن جسم بتركيبة غنية وناعمة تمنح بشرتك ترطيبًا عميقًا ونعومة تدوم طويلًا. مدعوم بزبدة الشيا وزيوت اللوز الحلو والسمسم والبرافين لتغذية البشرة وتقليل فقدان الرطوبة، مع اليوريا والجلسرين ومونو بروبيلين جلايكول لترطيب مكثف دون تقشير، والبانثينول لتهدئة البشرة، والـ IPM لتحسين ملمسها، لتنعمي ببشرة ناعمة وحريرية ولمسة من عطرك المفضل.",
  "shower-gel": "شاور جل بتركيبة منعشة تنظف بشرتك بلطف وتمنحها إحساسًا بالنظافة والانتعاش. غني بالجلسرين الذي يساعد على ترطيب البشرة وتقليل الجفاف، والـ PQ7 الذي يمنحها ملمسًا ناعمًا وحريريًا، مع عطر مميز يحوّل روتين الاستحمام اليومي إلى لحظات من الانتعاش والدلال، لبشرة نظيفة وناعمة ومعطرة برائحتك المفضلة.",
  shampoo: "شامبو خالي من السلفات بتركيبة غنية بالهيدروجار والـ PQ10 والجلسرين والبانثينول وخلاصة الألوفيرا، لتنظيف الشعر بلطف والمساعدة على ترطيبه وتقليل الهيشان والتشابك، لشعر أنعم وأسهل في التصفيف وأكثر حيوية ولمعانًا.",
  "body-splash": "بادي سبلاش بعطر غني ومميز يمنح بشرتك إحساسًا بالانتعاش ولمسة من الأنوثة والجاذبية. بتركيبة مدعومة بالجلسرين الذي يساعد على ترطيب البشرة والحفاظ على نعومتها، وفيتامين E المعروف بخصائصه المضادة للأكسدة، ليمنحك تجربة عطرية منعشة وبشرة ناعمة ومعطرة برائحتك المفضلة طوال يومك.",
  "hair-mist": "هير ميست بعطر مميز يمنح شعرك انتعاشًا ورائحة جذابة، بتركيبة خالية من الكحول الإيثيلي ومدعومة بالجلسرين والـ PQ7 للمساعدة على ترطيب الشعر وتنعيمه وتقليل الهيشان، لشعر ناعم ومعطر بلمسة من الأنوثة والجمال.",
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

const curatedStaticCollections: Collection[] = curatedCollectionDefinitions.map((definition, index) => ({
  id: `static-${definition.slug}`,
  slug: definition.slug,
  nameEn: definition.name,
  nameAr: definition.name,
  descriptionAr: "",
  image: definition.sets[0]!.image,
  coverAspectRatio: definition.sets[0]!.aspectRatio,
  displayOrder: index + 1,
  isPublished: true,
  purchaseReady: true,
  setCount: definition.sets.length,
  productIds: [...new Set(definition.sets.flatMap((set) => set.productSlugs))]
    .map((slug) => staticProducts.find((product) => product.slug === slug)?.id)
    .filter((id): id is string => Boolean(id)),
}));

export const staticCollections: Collection[] = curatedStaticCollections;
export const featuredCollections: Collection[] = curatedStaticCollections;
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
