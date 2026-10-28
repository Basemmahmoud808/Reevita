"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/cart-provider";

/** Empties the local cart and rotates the checkout idempotency key after a confirmed order. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
    try {
      // The order is persisted, so the next checkout must use a fresh key —
      // otherwise an identical later purchase would be treated as a retry.
      window.sessionStorage.removeItem("rv_checkout_idempotency_key");
    } catch {
      // Storage may be unavailable (private mode); the server-side fallback key
      // still protects against duplicate submissions.
    }
  }, [clear]);

  return null;
}
