"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Sparkles, Truck, X } from "lucide-react";

const INITIAL_SECONDS = 2 * 86400 + 14 * 3600 + 45 * 60 + 18; // 02d : 14h : 45m : 18s
const STORAGE_TARGET_KEY = "rv_wf_countdown_target_v1";

function formatTimeParts(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
  };
}

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);

  useEffect(() => {
    let targetTime: number;
    try {
      const saved = sessionStorage.getItem(STORAGE_TARGET_KEY);
      const parsed = saved ? Number(saved) : NaN;
      if (!Number.isNaN(parsed) && parsed > Date.now()) {
        targetTime = parsed;
      } else {
        targetTime = Date.now() + INITIAL_SECONDS * 1000;
        sessionStorage.setItem(STORAGE_TARGET_KEY, String(targetTime));
      }
    } catch {
      targetTime = Date.now() + INITIAL_SECONDS * 1000;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (dismissed) return null;

  const { days, hours, minutes, seconds } = formatTimeParts(secondsLeft);

  return (
    <div
      dir="ltr"
      role="region"
      aria-label="Promotional announcement"
      className="announcement-bar relative z-[60] w-full border-b border-[#D4AF37]/55 bg-gradient-to-r from-[#3D0E22] via-[#631837] to-[#3D0E22] text-white shadow-[0_6px_22px_-8px_rgba(61,14,34,0.75)]"
    >
      <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-1.5 px-3 py-1.5 sm:px-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-3 lg:py-2">
        {/* 1. Left Section (Promo Info - Desktop only) */}
        <div className="hidden items-center gap-2 text-[0.68rem] font-semibold tracking-[0.09em] text-white/95 xl:flex">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="size-3.5 shrink-0 text-[#D4AF37]" aria-hidden />
            <span>REEVITA WHITE FRIDAY</span>
          </span>
          <span className="h-3 w-px bg-[#D4AF37]/45" aria-hidden />
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#F3E5AB]">
            <Truck className="size-3.5 shrink-0 text-[#D4AF37]" aria-hidden />
            <span>FREE SHIPPING ON ALL OFFERS</span>
          </span>
        </div>

        {/* 2. Center Section (Main Offer - Luxury Gold Badge & Pills) */}
        <div className="flex w-full items-center justify-center pr-6 lg:w-auto lg:pr-0 xl:col-start-2">
          <Link
            href="/collections"
            className="group inline-flex flex-wrap items-center justify-center gap-1.5 text-center transition-opacity duration-200 hover:opacity-95 sm:gap-2"
          >
            <span className="announcement-shimmer inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] px-2.5 py-0.5 text-[0.6rem] font-extrabold tracking-[0.1em] text-[#3D0E22] uppercase shadow-sm sm:text-[0.65rem]">
              <Sparkles className="size-3 shrink-0 text-[#3D0E22]" aria-hidden />
              <span>WHITE FRIDAY SPECIAL</span>
            </span>{" "}
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="rounded-full border border-[#D4AF37]/50 bg-white/10 px-2.5 py-0.5 text-[0.66rem] font-extrabold tracking-[0.04em] text-[#F3E5AB] backdrop-blur-xs sm:text-[0.73rem]">
                BUY 2 GET 1 FREE
              </span>{" "}
              <span className="text-[0.58rem] font-bold tracking-[0.12em] text-white/75 uppercase">
                OR
              </span>{" "}
              <span className="rounded-full border border-[#D4AF37]/50 bg-white/10 px-2.5 py-0.5 text-[0.66rem] font-extrabold tracking-[0.04em] text-[#F3E5AB] backdrop-blur-xs sm:text-[0.73rem]">
                BUY 4 GET 2 FREE
              </span>
            </span>
            <ArrowRight
              className="hidden size-3.5 text-[#F3E5AB] transition-transform duration-200 group-hover:translate-x-0.5 sm:inline-block"
              aria-hidden
            />
          </Link>
        </div>

        {/* 3. Right Section (Segmented Live Countdown Timer + Close X Button) */}
        <div className="flex items-center justify-center gap-2 lg:justify-end">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-black/25 px-2.5 py-0.5 text-[0.62rem] font-bold tracking-[0.06em] text-white backdrop-blur-xs sm:px-3 sm:py-1 sm:text-[0.68rem]"
          >
            <Clock className="size-3 shrink-0 text-[#D4AF37]" aria-hidden />
            <span className="whitespace-nowrap text-[#F3E5AB]">ENDS IN:</span>{" "}
            <div className="inline-flex items-center gap-1 font-mono tabular-nums">
              <span className="rounded bg-white/12 px-1.5 py-0.5 text-white">{days}d</span>
              <span className="text-[#D4AF37]">:</span>
              <span className="rounded bg-white/12 px-1.5 py-0.5 text-white">{hours}h</span>
              <span className="text-[#D4AF37]">:</span>
              <span className="rounded bg-white/12 px-1.5 py-0.5 text-white">{minutes}m</span>
              <span className="text-[#D4AF37]">:</span>
              <span className="rounded bg-[#D4AF37]/25 px-1.5 py-0.5 text-[#F3E5AB]">{seconds}s</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcement bar"
            className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/15 hover:text-[#F3E5AB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] lg:static lg:translate-y-0"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
