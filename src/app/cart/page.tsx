import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata: Metadata = {
  title: "Your REEVITA Shopping Bag",
  description: "Review the REEVITA products in your private shopping bag before checkout.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <main><CartPageContent /></main>;
}
