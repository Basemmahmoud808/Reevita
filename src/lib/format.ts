import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const egpFormatter = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Prices are stored in EGP; Egyptian storefronts commonly use Latin digits. */
export function formatEGP(value: number): string {
  return `EGP ${egpFormatter.format(Math.round(value))}`;
}

export function formatNumber(value: number): string {
  return egpFormatter.format(value);
}

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "long",
  day: "numeric",
  numberingSystem: "latn",
});

export function formatDateAr(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

const timeFormatter = new Intl.DateTimeFormat("ar-EG", {
  hour: "2-digit",
  minute: "2-digit",
  numberingSystem: "latn",
});

export function formatDateTimeAr(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

export function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function whatsappLink(phone: string, message?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
