"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/components/cart/cart-provider";
import { SakuraTransitionProvider } from "@/components/ui/sakura-transition";
import { I18nProvider, type Locale } from "@/lib/i18n";

export function Providers({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <ToastProvider>
        <CartProvider>
          <SakuraTransitionProvider>{children}</SakuraTransitionProvider>
        </CartProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
