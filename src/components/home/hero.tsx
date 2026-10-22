"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { blurForSlug } from "@/lib/images";
import { formatEGP } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export function Hero({ product }: { product: Product }) {
  const image = product.images[0];
  const { t, locale } = useI18n();

  return (
    <section className="relative overflow-hidden bg-ivory">
      <div
        className="pointer-events-none absolute -top-32 start-1/2 size-[520px] -translate-x-1/2 rounded-full bg-sand/40 blur-[110px] md:start-[62%]"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 end-0 size-[320px] rounded-full bg-blush/35 blur-[90px]" aria-hidden />

      <div className="container-luxe relative grid items-center gap-12 pb-14 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-8 md:pb-24 md:pt-16">
        <div className="relative z-10 order-2 text-center md:order-1 md:text-start">
          <p className="eyebrow justify-center md:justify-start">REEVITA · {t("craftedInEgypt")}</p>

          <h1 className="display-hero mt-5">
            Your daily beauty
            <br />
            <span className="relative inline-block">
              ritual starts here
              <svg
                className="absolute -bottom-2 start-0 h-3 w-full text-gold/70"
                viewBox="0 0 240 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M2 8c60-6 120-6 236-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="lead mx-auto mt-6 max-w-md md:mx-0">
            Gentle body and hair care, refined scents, and thoughtful formulas made in Egypt and
            delivered to your door.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
            <Link href="/shop" className="btn btn-primary w-full sm:w-auto">
              {t("shopNow")}
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <Link href="/collections" className="btn btn-outline w-full sm:w-auto">
              {t("collections")}
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start">
            <div className="flex items-center gap-2">
              <Rating rating={4.9} reviews={1200} />
              <span className="text-[0.7rem] text-muted">{t("rating")} 4.9/5</span>
            </div>
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
            <div className="flex items-center gap-4 text-[0.7rem] font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <Truck className="size-3.5 text-gold-deep" aria-hidden />
                {t("delivery")}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-gold-deep" aria-hidden />
                {t("cashOnDelivery")}
              </span>
            </div>
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[430px] md:order-2 md:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px]">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-t-[999px] rounded-b-[2rem] border border-gold/50" aria-hidden />
            <div className="arch-frame relative h-full w-full bg-cream shadow-luxe">
              {image && (
                <Image
                  src={image.url}
                  alt={`${locale === "en" ? product.nameEn : product.nameAr} — REEVITA`}
                  fill
                  priority
                  sizes="(max-width: 768px) 88vw, 40vw"
                  placeholder="blur"
                  blurDataURL={blurForSlug(product.slug)}
                  className="object-cover slow-zoom"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-plum/25 via-transparent to-transparent" aria-hidden />
            </div>

            <div className="absolute -bottom-5 -start-2 rounded-2xl border border-line bg-ivory/95 px-4 py-3 shadow-card backdrop-blur sm:-start-6">
              <p className="eyebrow-plain text-[0.52rem] text-gold-deep">BESTSELLER</p>
              <p className="mt-1 text-xs font-bold text-plum">{locale === "en" ? product.nameEn : product.nameAr}</p>
              <p className="text-[0.7rem] font-semibold text-berry">{formatEGP(product.price)}</p>
            </div>

            <div className="absolute -top-3 -end-2 flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/95 px-3.5 py-2 shadow-card sm:-end-5">
              <Sparkles className="size-3.5 text-gold-deep" aria-hidden />
              <span className="text-[0.62rem] font-bold text-plum">
                {t("freeShipping")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-line/70 bg-cream/50">
        <div className="container-luxe flex h-11 items-center justify-center gap-6 overflow-x-auto text-[0.62rem] font-bold tracking-[0.28em] text-plum/70 uppercase sm:gap-10">
          <span>Sulfate free</span>
          <span className="text-gold" aria-hidden><span className="sr-only">•</span></span>
          <span>Botanical formulas</span>
          <span className="text-gold" aria-hidden><span className="sr-only">•</span></span>
          <span>Made in Egypt</span>
          <span className="text-gold" aria-hidden><span className="sr-only">•</span></span>
          <span>Cruelty free</span>
        </div>
      </div>
    </section>
  );
}
