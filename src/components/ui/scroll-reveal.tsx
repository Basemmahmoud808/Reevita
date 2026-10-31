"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      element.dataset.scrollReveal = "visible";
      return;
    }

    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
      element.dataset.scrollReveal = "visible";
      element.inert = false;
      return;
    }

    element.inert = true;
    element.dataset.scrollReveal = "pending";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      element.dataset.scrollReveal = "visible";
      element.inert = false;
      observer.unobserve(element);
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style = { "--scroll-reveal-delay": `${Math.max(0, delayMs)}ms` } as CSSProperties;

  return <div ref={elementRef} className={`scroll-reveal ${className}`} style={style}>{children}</div>;
}
