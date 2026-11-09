"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const INITIAL_SECONDS = 21 * 86400; // 21 days
const STORAGE_TARGET_KEY = "rv_wf_countdown_21d_v2";

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
      className="relative z-[60] w-full border-b border-white/12 bg-[#561432] text-white"
    >
      <div className="reference-container relative flex min-h-9 flex-col items-center justify-center gap-1 py-1.5 pr-8 text-center lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4 lg:py-2 lg:pr-4">
        {/* Left Section (Desktop) */}
        <div className="hidden items-center justify-start text-[0.66rem] font-medium tracking-[0.15em] text-white/80 uppercase xl:flex">
          <span>WHITE FRIDAY</span>
          <span className="mx-2.5 text-white/30">|</span>
          <span>FREE SHIPPING ON ALL OFFERS</span>
        </div>

        {/* Center Section (Main Offer) */}
        <div className="flex items-center justify-center xl:col-start-2">
          <Link
            href="/collections"
            className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.66rem] font-semibold tracking-[0.12em] text-white uppercase transition-opacity hover:opacity-85 sm:text-[0.7rem]"
          >
            <span className="text-[#f7dce6]">WHITE FRIDAY:</span>
            <span className="whitespace-nowrap font-bold text-white underline decoration-white/40 underline-offset-4">
              BUY 2 GET 1 FREE
            </span>
            <span className="text-white/45">·</span>
            <span className="whitespace-nowrap font-bold text-white underline decoration-white/40 underline-offset-4">
              BUY 4 GET 2 FREE
            </span>
          </Link>
        </div>

        {/* Right Section (Countdown + Dismiss) */}
        <div className="flex items-center justify-center gap-3 lg:justify-end">
          <div
            aria-live="polite"
            aria-atomic="true"
            className="inline-flex items-center gap-1.5 text-[0.64rem] font-medium tracking-[0.12em] text-[#f7dce6] uppercase sm:text-[0.68rem]"
          >
            <span>ENDS IN</span>
            <span className="font-mono font-semibold tracking-[0.06em] text-white tabular-nums">
              {days}d : {hours}h : {minutes}m : {seconds}s
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss announcement bar"
            className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center text-white/65 transition-colors hover:text-white focus-visible:outline-none lg:static lg:translate-y-0"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
