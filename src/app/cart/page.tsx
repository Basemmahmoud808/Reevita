import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/cart-page-content";

export const metadata: Metadata = {
  title: "سلة المشتريات",
  description: "راجعي مشترياتك من ريفيتا وأكملي الطلب بالدفع عند الاستلام.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="bg-ivory">
      <CartPageContent />
    </div>
  );
}
