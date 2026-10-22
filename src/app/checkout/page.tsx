import type { Metadata } from "next";
import { getGovernorates } from "@/lib/data/catalog";
import { isDemoMode } from "@/lib/env";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout — Cash on delivery",
  description: "Complete your REEVITA order with cash on delivery across Egypt.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const governorates = await getGovernorates();
  return (
    <div className="bg-ivory">
      <CheckoutForm governorates={governorates} isDemo={isDemoMode} />
    </div>
  );
}
