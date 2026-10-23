import type { Metadata } from "next";
import { brand } from "@/lib/catalog";

export const metadata: Metadata = { title: "قصتنا", description: brand.descriptionAr };

export default function AboutPage() {
  return (
    <div className="container-luxe max-w-2xl py-10 md:py-14">
      <h1 className="display-xl mb-6">قصة {brand.nameAr}</h1>
      <p className="lead">{brand.descriptionAr}</p>
    </div>
  );
}
