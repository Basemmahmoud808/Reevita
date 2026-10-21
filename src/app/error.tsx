"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[reevita] unhandled error", error);
  }, [error]);

  return (
    <div className="container-luxe flex flex-col items-center py-24 text-center md:py-32">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle className="size-7 text-danger" aria-hidden />
      </span>
      <h1 className="display-xl mt-6">حدث خطأ غير متوقع</h1>
      <p className="lead mt-3 max-w-md">
        نعتذر عن ذلك. يمكنك المحاولة مرة أخرى، أو العودة إلى الصفحة الرئيسية.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          إعادة المحاولة
        </button>
        <Link href="/" className="btn btn-outline">
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
