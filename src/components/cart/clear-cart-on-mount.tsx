"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/cart-provider";

/** Empties the local cart once the order has been confirmed server-side. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clear();
  }, [clear]);

  return null;
}
