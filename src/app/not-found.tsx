import Link from "next/link";
import { CrownIcon } from "@/components/brand/marks";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="container-luxe flex flex-col items-center py-24 text-center md:py-32">
      <CrownIcon className="h-8 w-11 text-gold" />
      <p className="latin mt-6 text-7xl font-light text-gold/60">404</p>
      <h1 className="display-xl mt-3">الصفحة غير موجودة</h1>
      <p className="lead mt-3 max-w-md">
        ربما تم نقل الصفحة أو أن الرابط غير صحيح. دعينا نعيدك إلى عالم ريفيتا.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          الصفحة الرئيسية
        </Link>
        <Link href="/shop" className="btn btn-outline">
          تسوّقي الآن
        </Link>
      </div>
      <div className="mt-12 opacity-70">
        <Logo size="sm" withTagline={false} />
      </div>
    </div>
  );
}
