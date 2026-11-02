"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { deleteOrderAction, type AdminActionState } from "@/lib/actions/admin";

export function AdminDeleteOrderForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    deleteOrderAction,
    null,
  );

  if (state?.ok) return <p role="status" className="text-[0.65rem] font-semibold text-success">{state.message}</p>;

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      {state?.error && (
        <p role="alert" className="mb-2 flex items-start gap-1.5 text-[0.65rem] font-semibold text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-[0.65rem] font-bold text-danger transition-colors hover:bg-danger/5 disabled:opacity-60">
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />}
        حذف
      </button>
    </form>
  );
}
