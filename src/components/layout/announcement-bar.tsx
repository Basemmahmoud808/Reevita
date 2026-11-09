"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

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
      className="relative z-[60] w-full border-b border-[#D4AF37]/75 bg-gradient-to-r from-[#4A1228] via-[#6D1D3A] to-[#4A1228] text-white shadow-[0_4px_20px_-6px_rgba(74,18,40,0.65)]"
    >
      <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-1.5 px-3 py-2 sm:px-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4 lg:py-2">
        {/* 1. Left Section (Promo Info - hidden on small screens) */}
        <div className="hidden items-center gap-2 text-[0.7rem] font-semibold tracking-[0.08em] text-white/95 lg:flex">
          <span className=" truncate">
            ✨ REEVITA WHITE FRIDAY <span className="mx-1 text-[#D4AF37]">|</span> FREE SHIPPING ON ALL OFFERS
          </span>
        </div>

        {/* 2. Center Section (Main Offer - Bold & Highlighted in Gold with shimmer/pulse) */}
        <div className="flex w-full items-center justify-center pr-6 text-center lg:w-auto lg:pr-0">
          <Link
            href="/collections"
            className="announcement-shimmer inline-flex items-center justify-center gap-1.5 text-[0.68rem] font-extrabold tracking-[0.05em] text-[#F3E5AB] transition-transform duration-200 hover:scale-[1.01] sm:text-xs md:text-[0.8rem]"
          >
            <span>✨ WHITE FRIDAY SPECIAL:</span>
            <span className="text-[#D4AF37] underline decoration-[#D4AF37]/60 underline-offset-4">
              BUY 2 GET 1 FREE
            </span>
            <span className="text-white/85">• OR •</span>
            <span className="text-[#D4AF37] underline decoration-[#D4AF37]/60 underline-offset-4">
              BUY 4 GET 2 FREE
            </span>
            <span aria-hidden>🛒</span>
          </Link>
        </div>

        {/* 3. Right Section (Live Countdown Timer + Close X Button) */}
        <div className="flex items-center justify-center gap-2.5 lg:justify-end">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-black/20 px-3 py-0.5 text-[0.65rem] font-bold tracking-[0.06em] text-white sm:py-1 sm:text-[0.7rem]"
          >
            <span className="text-[#F3E5AB]">ENDS IN:</span>
            <span className="font-mono tabular-nums text-white">
              {days}d : {hours}h : {minutes}m : {seconds}s
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcement bar"
            className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/15 hover:text-[#F3E5AB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] lg:static lg:translate-y-0"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
