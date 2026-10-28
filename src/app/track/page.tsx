import type { Metadata } from "next";
import { TrackForm } from "@/components/orders/track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your REEVITA order using your order number and phone number.",
};

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const params = await searchParams;
  const order = Array.isArray(params.order) ? params.order[0] : params.order;
  return (
    <main className="container-luxe py-10 md:py-14">
      <div className="mb-9 max-w-2xl">
        <p className="eyebrow">ORDER SUPPORT</p>
        <h1 className="display-xl mt-3">Track your order</h1>
        <p className="lead mt-3">Enter the order number and phone number used at checkout to see the latest delivery status.</p>
      </div>
      <TrackForm initialOrder={order ?? ""} />
    </main>
  );
}
