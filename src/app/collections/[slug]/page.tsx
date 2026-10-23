import { notFound, redirect } from "next/navigation";
import { fragrances } from "@/lib/catalog";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fragrance = fragrances.find((item) => item.slug === slug);
  if (!fragrance) notFound();
  redirect(`/shop?search=${encodeURIComponent(fragrance.nameEn)}`);
}
