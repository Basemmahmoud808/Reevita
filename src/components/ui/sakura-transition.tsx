"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LayerKind = "bg" | "mid" | "fg";
type TransitionPhase = "idle" | "entering" | "sustaining" | "exiting";

interface Petal {
  layer: LayerKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  flip: number;
  flipSpeed: number;
  turbAmp: number;
  turbFreq: number;
  turbPhase: number;
  gradientIndex: 0 | 1 | 2;
}

interface SakuraTransitionContextValue {
  navigate: (href: string) => void;
}

const SakuraTransitionContext = createContext<SakuraTransitionContextValue | null>(null);

export function useSakuraTransition(): SakuraTransitionContextValue {
  const ctx = useContext(SakuraTransitionContext);
  if (!ctx) {
    throw new Error("useSakuraTransition must be used within SakuraTransitionProvider");
  }
  return ctx;
}

const TOTAL_PETALS = 260;
const ENTER_SWAP_MS = 350;
const EXIT_DURATION_MS = 600;
const SAFETY_TIMEOUT_MS = 6000;
const CANONICAL_SIZE = 40;

type GradientPalette = readonly [CanvasGradient, CanvasGradient, CanvasGradient];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Traces an authentic Sakura petal centered at (0, 0) within a 40x40 canonical box,
 * featuring smooth Bezier lobes and the characteristic notched V-cut at the top tip.
 */
function traceSakuraPetal(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(11, 15, 18, 2, 14, -11);
  ctx.bezierCurveTo(12, -17, 7, -20, 3.8, -19);
  // Notched V-cut at the top tip
  ctx.quadraticCurveTo(1.6, -15, 0, -12);
  ctx.quadraticCurveTo(-1.6, -15, -3.8, -19);
  ctx.bezierCurveTo(-7, -20, -12, -17, -14, -11);
  ctx.bezierCurveTo(-18, 2, -11, 15, 0, 20);
  ctx.closePath();
}

function createPetalGradients(ctx: CanvasRenderingContext2D): GradientPalette {
  const classicA = ctx.createRadialGradient(0, 4, 1, 0, -2, 22);
  classicA.addColorStop(0, "#ffffff");
  classicA.addColorStop(0.36, "#ffc2d1");
  classicA.addColorStop(0.76, "#ff7597");
  classicA.addColorStop(1, "#ff5c85");

  const classicB = ctx.createRadialGradient(0, 5, 1, 0, -2, 22);
  classicB.addColorStop(0, "#ffffff");
  classicB.addColorStop(0.45, "#ffd6e0");
  classicB.addColorStop(0.82, "#ffc2d1");
  classicB.addColorStop(1, "#ff7597");

  // 15% deep berry / burgundy accents
  const berryAccent = ctx.createRadialGradient(0, 4, 1, 0, -2, 22);
  berryAccent.addColorStop(0, "#ffffff");
  berryAccent.addColorStop(0.32, "#ffc2d1");
  berryAccent.addColorStop(0.7, "#b83b66");
  berryAccent.addColorStop(1, "#6b1d3b");

  return [classicA, classicB, berryAccent];
}

function createPetal(
  layer: LayerKind,
  width: number,
  height: number,
  spawnMode: "enter" | "recycle" | "across",
): Petal {
  let size: number;
  let speedFactor: number;
  let alpha: number;

  if (layer === "fg") {
    size = rand(22, 40);
    speedFactor = rand(1.38, 1.68);
    alpha = rand(0.9, 1.0);
  } else if (layer === "mid") {
    size = rand(11, 19);
    speedFactor = rand(1.0, 1.28);
    alpha = rand(0.88, 1.0);
  } else {
    size = rand(5, 9);
    speedFactor = rand(0.82, 0.98);
    alpha = 0.75;
  }

  // Diagonal wind vector from top-right to bottom-left
  const baseSpeedX = -Math.max(width * 1.15, 900) * speedFactor * rand(0.9, 1.1);
  const baseSpeedY = Math.max(height * 0.85, 650) * speedFactor * rand(0.9, 1.1);

  let x: number;
  let y: number;

  if (spawnMode === "enter") {
    // Back-project from a dense viewport distribution at ~350ms so the gust
    // arrives immediately from top-right and blankets the screen by 350ms
    const enterSec = ENTER_SWAP_MS / 1000;
    const spreadBias = (Math.random() + Math.random()) * 0.5;
    const targetX = (spreadBias * 1.2 - 0.1) * width;
    const targetY = rand(-0.1, 1.08) * height;
    x = targetX - baseSpeedX * enterSec;
    y = targetY - baseSpeedY * enterSec;
  } else if (spawnMode === "recycle") {
    // Respawn along top or right edges during Phase 2 sustained swirl
    if (Math.random() < 0.62) {
      x = width + rand(10, 140);
      y = rand(-height * 0.25, height * 0.75);
    } else {
      x = rand(width * 0.25, width * 1.15);
      y = -rand(15, 110);
    }
  } else {
    // Across viewport (used for browser back/forward instant sweep)
    x = rand(-0.05, 1.05) * width;
    y = rand(-0.05, 1.05) * height;
  }

  const gradientIndex: 0 | 1 | 2 = Math.random() < 0.15 ? 2 : Math.random() < 0.55 ? 0 : 1;

  return {
    layer,
    x,
    y,
    vx: baseSpeedX,
    vy: baseSpeedY,
    size,
    alpha,
    rotation: rand(0, Math.PI * 2),
    rotSpeed: rand(-4.6, 4.6),
    flip: rand(0, Math.PI * 2),
    flipSpeed: rand(4.2, 9.2),
    turbAmp: layer === "fg" ? rand(26, 48) : layer === "mid" ? rand(16, 32) : rand(8, 18),
    turbFreq: rand(4.2, 8.5),
    turbPhase: rand(0, Math.PI * 2),
    gradientIndex,
  };
}

function buildPetalPool(
  width: number,
  height: number,
  spawnMode: "enter" | "across",
): Petal[] {
  const petals: Petal[] = [];
  const bgCount = Math.round(TOTAL_PETALS * 0.35);
  const midCount = Math.round(TOTAL_PETALS * 0.45);

  for (let i = 0; i < TOTAL_PETALS; i++) {
    const layer: LayerKind =
      i < bgCount ? "bg" : i < bgCount + midCount ? "mid" : "fg";
    petals.push(createPetal(layer, width, height, spawnMode));
  }
  return petals;
}

/**
 * Isolated watcher so useSearchParams() stays safely inside a Suspense boundary
 * without affecting static page pre-rendering.
 */
function RouteChangeWatcher({
  onRouteChange,
}: {
  onRouteChange: (routeKey: string) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    onRouteChange(routeKey);
  }, [routeKey, onRouteChange]);

  return null;
}

export function SakuraTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pushTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const phaseRef = useRef<TransitionPhase>("idle");
  const petalsRef = useRef<Petal[]>([]);
  const gradientsRef = useRef<GradientPalette | null>(null);

  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const exitStartTimeRef = useRef<number>(0);
  const pendingDestinationRef = useRef<string | null>(null);
  const lastRouteKeyRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const stopAndClear = useCallback(() => {
    clearTimers();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    phaseRef.current = "idle";
    petalsRef.current = [];
    pendingDestinationRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [clearTimers]);

  const beginExitSweep = useCallback(() => {
    if (phaseRef.current === "idle" || phaseRef.current === "exiting") return;
    clearTimers();
    phaseRef.current = "exiting";
    exitStartTimeRef.current = performance.now();
  }, [clearTimers]);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;

    const frame = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || phaseRef.current === "idle") {
        stopAndClear();
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      if (!gradientsRef.current) {
        gradientsRef.current = createPetalGradients(ctx);
      }
      const gradients = gradientsRef.current;

      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.05);
      lastFrameTimeRef.current = now;
      const elapsedSec = (now - startTimeRef.current) / 1000;

      const phase = phaseRef.current;
      let exitProgress = 0;
      let velocityScale = 1;
      let exitAlphaFactor = 1;

      if (phase === "sustaining") {
        // Gentle sustained swirl while waiting for Next.js route load
        velocityScale = 0.72;
      } else if (phase === "exiting") {
        const exitElapsedMs = now - exitStartTimeRef.current;
        exitProgress = Math.min(1, exitElapsedMs / EXIT_DURATION_MS);
        // Accelerate smoothly off the bottom-left edge over ~600ms
        velocityScale = 1.15 + 1.9 * exitProgress;
        if (exitProgress > 0.72) {
          exitAlphaFactor = Math.max(0, 1 - (exitProgress - 0.72) / 0.28);
        }
        if (exitElapsedMs >= EXIT_DURATION_MS) {
          stopAndClear();
          return;
        }
      }

      const petals = petalsRef.current;
      const recycleMargin = 130;

      // Update positions
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        if (!p) continue;

        p.x += p.vx * velocityScale * dt;
        p.y += p.vy * velocityScale * dt;

        // Recycle petals during Phase 2 so coverage stays lush until route is ready
        if (
          phase === "sustaining" &&
          (p.x < -recycleMargin || p.y > height + recycleMargin)
        ) {
          petals[i] = createPetal(p.layer, width, height, "recycle");
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const drawLayer = (targetLayer: LayerKind, blurPx: number) => {
        ctx.save();
        if (blurPx > 0 && "filter" in ctx) {
          ctx.filter = `blur(${blurPx}px)`;
        }

        for (const p of petals) {
          if (p.layer !== targetLayer) continue;

          const margin = p.size * 2.5;
          if (
            p.x < -margin ||
            p.x > width + margin * 3 ||
            p.y < -margin * 3 ||
            p.y > height + margin
          ) {
            continue;
          }

          const speed = Math.hypot(p.vx, p.vy) || 1;
          const nx = -p.vy / speed;
          const ny = p.vx / speed;
          const turb = Math.sin(elapsedSec * p.turbFreq + p.turbPhase) * p.turbAmp;

          const drawX = p.x + nx * turb;
          const drawY = p.y + ny * turb;
          const angle = p.rotation + p.rotSpeed * elapsedSec;
          const flipScale = Math.cos(p.flip + p.flipSpeed * elapsedSec);
          const scale = p.size / CANONICAL_SIZE;
          const baseAlpha = flipScale < 0 ? p.alpha * 0.85 : p.alpha;

          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(angle);
          ctx.scale(scale, scale * flipScale);
          ctx.globalAlpha = baseAlpha * exitAlphaFactor;
          ctx.fillStyle = gradients[p.gradientIndex];
          traceSakuraPetal(ctx);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      };

      // Back -> Mid -> Fore for authentic 3D depth of field
      drawLayer("bg", 0);
      drawLayer("mid", 0);
      drawLayer("fg", 3);

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [stopAndClear]);

  const navigate = useCallback(
    (href: string) => {
      if (!href) return;

      if (
        typeof window === "undefined" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        router.push(href);
        return;
      }

      clearTimers();
      router.prefetch(href);
      pendingDestinationRef.current = href;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const now = performance.now();

      // If already sustaining/exiting from a rapid click, keep existing petals and
      // just refresh the entry/swap timer; otherwise spawn a fresh gust
      if (phaseRef.current === "idle") {
        petalsRef.current = buildPetalPool(width, height, "enter");
        startTimeRef.current = now;
        lastFrameTimeRef.current = now;
      }

      phaseRef.current = "entering";
      startLoop();

      // Phase 1 -> Phase 2: once screen is covered (~350ms), trigger Next.js navigation
      pushTimerRef.current = window.setTimeout(() => {
        pushTimerRef.current = null;
        if (phaseRef.current === "entering") {
          phaseRef.current = "sustaining";
        }
        const dest = pendingDestinationRef.current;
        if (dest) {
          router.push(dest);
        }
      }, ENTER_SWAP_MS);

      // Safety timeout: auto-clear after 6s if navigation is aborted or fails
      safetyTimerRef.current = window.setTimeout(() => {
        safetyTimerRef.current = null;
        beginExitSweep();
      }, SAFETY_TIMEOUT_MS);
    },
    [beginExitSweep, clearTimers, router, startLoop],
  );

  // Phase 3: Clear smoothly once Next.js mounts & renders the new route
  const handleRouteChange = useCallback(
    (routeKey: string) => {
      if (lastRouteKeyRef.current === null) {
        lastRouteKeyRef.current = routeKey;
        return;
      }
      if (routeKey === lastRouteKeyRef.current) return;
      lastRouteKeyRef.current = routeKey;

      if (phaseRef.current === "entering" || phaseRef.current === "sustaining") {
        beginExitSweep();
      } else if (
        phaseRef.current === "idle" &&
        typeof window !== "undefined" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        // Browser back/forward or external router.push: run a quick exit sweep
        const now = performance.now();
        petalsRef.current = buildPetalPool(window.innerWidth, window.innerHeight, "across");
        startTimeRef.current = now;
        lastFrameTimeRef.current = now;
        exitStartTimeRef.current = now;
        phaseRef.current = "exiting";
        startLoop();
      }
    },
    [beginExitSweep, startLoop],
  );

  // Phase 1: Intercept internal <a> / Next.js <Link> clicks globally
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      if (
        anchor.hasAttribute("download") ||
        anchor.hasAttribute("data-no-transition") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      // Ignore same-page hash/anchor navigation
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();
      const destination = `${url.pathname}${url.search}${url.hash}`;
      navigate(destination);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [navigate]);

  useEffect(() => stopAndClear, [stopAndClear]);

  return (
    <SakuraTransitionContext.Provider value={{ navigate }}>
      <Suspense fallback={null}>
        <RouteChangeWatcher onRouteChange={handleRouteChange} />
      </Suspense>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999] h-dvh w-screen"
      />
    </SakuraTransitionContext.Provider>
  );
}
