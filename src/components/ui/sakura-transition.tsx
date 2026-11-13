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

const DESKTOP_PETALS = 260;
const MOBILE_PETALS = 175;
const ENTER_SWAP_MS = 400;
const EXIT_DURATION_MS = 700;
const SAFETY_TIMEOUT_MS = 6000;

// Sprite sheet dimensions (pre-rendered once for 60/120fps mobile performance)
const SPRITE_DRAW_RADIUS = 40;
const SHARP_SPRITE_SIZE = 96;
const BLUR_SPRITE_SIZE = 112;

interface SpriteSet {
  sharp: readonly [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement];
  blurred: readonly [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement];
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function getPetalCount(width: number): number {
  return width < 768 ? MOBILE_PETALS : DESKTOP_PETALS;
}

/**
 * Traces an authentic Sakura petal centered at (0, 0) within a 40x40 canonical box,
 * featuring smooth Bezier lobes and the characteristic notched V-cut at the top tip.
 */
function traceSakuraPetal(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(11, 15, 18, 2, 14, -11);
  ctx.bezierCurveTo(12, -17, 7, -20, 3.8, -19);
  ctx.quadraticCurveTo(1.6, -15, 0, -12);
  ctx.quadraticCurveTo(-1.6, -15, -3.8, -19);
  ctx.bezierCurveTo(-7, -20, -12, -17, -14, -11);
  ctx.bezierCurveTo(-18, 2, -11, 15, 0, 20);
  ctx.closePath();
}

function fillPetalGradient(ctx: CanvasRenderingContext2D, variant: 0 | 1 | 2) {
  const grad = ctx.createRadialGradient(0, 4, 1, 0, -2, 22);
  if (variant === 0) {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.36, "#ffc2d1");
    grad.addColorStop(0.76, "#ff7597");
    grad.addColorStop(1, "#ff5c85");
  } else if (variant === 1) {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, "#ffd6e0");
    grad.addColorStop(0.82, "#ffc2d1");
    grad.addColorStop(1, "#ff7597");
  } else {
    // Deep berry / burgundy accent (15% of petals)
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.32, "#ffc2d1");
    grad.addColorStop(0.7, "#b83b66");
    grad.addColorStop(1, "#6b1d3b");
  }
  ctx.fillStyle = grad;
}

function renderPetalSprite(variant: 0 | 1 | 2, blurred: boolean): HTMLCanvasElement {
  const canvasSize = blurred ? BLUR_SPRITE_SIZE : SHARP_SPRITE_SIZE;
  const sprite = document.createElement("canvas");
  sprite.width = canvasSize;
  sprite.height = canvasSize;

  const sctx = sprite.getContext("2d");
  if (!sctx) return sprite;

  const scale = (canvasSize * 0.72) / SPRITE_DRAW_RADIUS;
  sctx.translate(canvasSize / 2, canvasSize / 2);
  sctx.scale(scale, scale);

  if (blurred) {
    if (typeof (sctx as CanvasRenderingContext2D & { filter?: string }).filter === "string") {
      sctx.filter = "blur(3px)";
      fillPetalGradient(sctx, variant);
      traceSakuraPetal(sctx);
      sctx.fill();
    } else {
      // Fallback soft bokeh for older mobile WebViews without ctx.filter
      fillPetalGradient(sctx, variant);
      const offsets = [
        [0, 0, 0.45],
        [-1.4, -1.4, 0.22],
        [1.4, -1.4, 0.22],
        [-1.4, 1.4, 0.22],
        [1.4, 1.4, 0.22],
      ] as const;
      for (const [ox, oy, alpha] of offsets) {
        sctx.save();
        sctx.translate(ox, oy);
        sctx.globalAlpha = alpha;
        traceSakuraPetal(sctx);
        sctx.fill();
        sctx.restore();
      }
    }
  } else {
    fillPetalGradient(sctx, variant);
    traceSakuraPetal(sctx);
    sctx.fill();
  }

  return sprite;
}

function createSpriteSet(): SpriteSet {
  return {
    sharp: [
      renderPetalSprite(0, false),
      renderPetalSprite(1, false),
      renderPetalSprite(2, false),
    ],
    blurred: [
      renderPetalSprite(0, true),
      renderPetalSprite(1, true),
      renderPetalSprite(2, true),
    ],
  };
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

  // Diagonal wind vector from top-right to bottom-left (cinematic, readable pace)
  const baseSpeedX = -Math.max(width * 0.95, 620) * speedFactor * rand(0.9, 1.1);
  const baseSpeedY = Math.max(height * 0.72, 480) * speedFactor * rand(0.9, 1.1);

  let x: number;
  let y: number;

  if (spawnMode === "enter") {
    const enterSec = ENTER_SWAP_MS / 1000;
    const spreadBias = (Math.random() + Math.random()) * 0.5;
    const targetX = (spreadBias * 1.15 - 0.1) * width;
    const targetY = rand(-0.08, 1.05) * height;
    x = targetX - baseSpeedX * enterSec;
    y = targetY - baseSpeedY * enterSec;
  } else if (spawnMode === "recycle") {
    if (Math.random() < 0.62) {
      x = width + rand(10, 140);
      y = rand(-height * 0.25, height * 0.75);
    } else {
      x = rand(width * 0.25, width * 1.15);
      y = -rand(15, 110);
    }
  } else {
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
    turbAmp: layer === "fg" ? rand(22, 42) : layer === "mid" ? rand(14, 28) : rand(8, 16),
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
  const count = getPetalCount(width);
  const petals: Petal[] = [];
  const bgCount = Math.round(count * 0.35);
  const midCount = Math.round(count * 0.45);

  for (let i = 0; i < count; i++) {
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
  const spritesRef = useRef<SpriteSet | null>(null);

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

      const width = window.innerWidth;
      const height = window.innerHeight;
      // Cap DPR on mobile to keep GPU fill-rate fast at 60fps
      const maxDpr = width < 768 ? 1.25 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      const targetW = Math.floor(width * dpr);
      const targetH = Math.floor(height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      if (!spritesRef.current) {
        spritesRef.current = createSpriteSet();
      }
      const sprites = spritesRef.current;

      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.05);
      lastFrameTimeRef.current = now;
      const elapsedSec = (now - startTimeRef.current) / 1000;

      const phase = phaseRef.current;
      let velocityScale = 1;
      let exitAlphaFactor = 1;

      if (phase === "sustaining") {
        velocityScale = 0.75;
      } else if (phase === "exiting") {
        const exitElapsedMs = now - exitStartTimeRef.current;
        const exitProgress = Math.min(1, exitElapsedMs / EXIT_DURATION_MS);
        // Gentle acceleration so petals glide naturally off the bottom-left edge
        velocityScale = 1.0 + 0.85 * exitProgress;
        if (exitProgress > 0.86) {
          exitAlphaFactor = Math.max(0, 1 - (exitProgress - 0.86) / 0.14);
        }
        if (exitElapsedMs >= EXIT_DURATION_MS) {
          stopAndClear();
          return;
        }
      }

      const petals = petalsRef.current;
      const recycleMargin = 120;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        if (!p) continue;

        p.x += p.vx * velocityScale * dt;
        p.y += p.vy * velocityScale * dt;

        if (
          phase === "sustaining" &&
          (p.x < -recycleMargin || p.y > height + recycleMargin)
        ) {
          petals[i] = createPetal(p.layer, width, height, "recycle");
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const drawLayer = (targetLayer: LayerKind, isFg: boolean) => {
        const list = isFg ? sprites.blurred : sprites.sharp;
        const spriteSize = isFg ? BLUR_SPRITE_SIZE : SHARP_SPRITE_SIZE;
        // Scale sprite so the petal inside (0.72 of spriteSize) matches p.size
        const drawScaleFactor = 1 / 0.72;

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

          const renderSize = p.size * drawScaleFactor;
          const half = renderSize * 0.5;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          ctx.setTransform(
            dpr * cosA,
            dpr * sinA,
            -dpr * flipScale * sinA,
            dpr * flipScale * cosA,
            dpr * drawX,
            dpr * drawY,
          );
          ctx.globalAlpha = (flipScale < 0 ? p.alpha * 0.85 : p.alpha) * exitAlphaFactor;
          ctx.drawImage(
            list[p.gradientIndex],
            0,
            0,
            spriteSize,
            spriteSize,
            -half,
            -half,
            renderSize,
            renderSize,
          );
        }
      };

      drawLayer("bg", false);
      drawLayer("mid", false);
      drawLayer("fg", true);

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

      if (phaseRef.current === "idle") {
        petalsRef.current = buildPetalPool(width, height, "enter");
        startTimeRef.current = now;
        lastFrameTimeRef.current = now;
      }

      phaseRef.current = "entering";
      startLoop();

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

      safetyTimerRef.current = window.setTimeout(() => {
        safetyTimerRef.current = null;
        beginExitSweep();
      }, SAFETY_TIMEOUT_MS);
    },
    [beginExitSweep, clearTimers, router, startLoop],
  );

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
