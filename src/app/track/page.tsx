import type { Metadata } from "next";
import { TrackForm } from "@/components/orders/track-form";

export const metadata: Metadata = {
  title: "تتبّع الطلب",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.order) ? params.order[0] : params.order;
  const initialOrder = (raw ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 32);
  return (
    <div className="container-luxe py-10 md:py-14">
      <h1 className="display-xl mb-8">تتبّع طلبك</h1>
      <TrackForm initialOrder={initialOrder} />
    </div>
  );
}
