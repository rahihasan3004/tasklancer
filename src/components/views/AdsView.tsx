"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlayCircle,
  Clock,
  Zap,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useTelegram } from "@/components/TelegramProvider";

declare global {
  interface Window {
    Adsgram?: {
      init: (config: { blockId: string; debug?: boolean }) => {
        show: () => Promise<{ done: boolean }>;
      };
    };
  }
}

function haptic(style: "light" | "medium" | "heavy" = "light") {
  (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
}

export function AdsView() {
  const { user, watchAd } = useApp();
  const { initData } = useTelegram();
  const [watching, setWatching] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [devCountdown, setDevCountdown] = useState(0);

  const adsWatched = user?.adsWatchedToday ?? 0;
  const isOnCooldown = cooldown > 0;
  const hasReachedLimit = adsWatched >= 20;
  const blockId = process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID || "46428";

  useEffect(() => {
    if (!isOnCooldown) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [isOnCooldown, cooldown]);

  const handleWatch = useCallback(async () => {
    if (watching || isOnCooldown || hasReachedLimit) return;
    haptic("light");
    setError(null);
    setWatching(true);

    if (!window.Adsgram) {
      setDevCountdown(3);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await watchAd();
      if (!result.success) {
        setError(result.error ?? "Failed to credit reward");
      } else {
        haptic("medium");
        setCooldown(30);
      }
      setWatching(false);
      setDevCountdown(0);
      return;
    }

    try {
      const AdController = window.Adsgram.init({ blockId, debug: false });
      const result = await AdController.show();
      if (result.done) {
        await watchAd();
        haptic("medium");
        setCooldown(30);
      }
    } catch (err) {
      console.warn("Adsgram playback error:", err);
      setError("No ad available right now. Please try again later.");
    } finally {
      setWatching(false);
    }
  }, [watching, isOnCooldown, hasReachedLimit, blockId, watchAd]);

  const formatCooldown = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}s`;
  };

  const progressPercent = Math.min((adsWatched / 20) * 100, 100);

  return (
    <div className="flex flex-1 flex-col space-y-5 px-4 py-5 pb-28">
      {/* Hero Rewarded Ad Card */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#121215] p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-400 uppercase">
            SPONSORED REWARD
          </span>
        </div>

        {/* Video Icon Box */}
        <div className="flex h-32 flex-col items-center justify-center space-y-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
            <PlayCircle size={24} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Watch 15s Video</span>
        </div>

        {/* Reward Info */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-mono text-lg font-bold text-slate-900 dark:text-zinc-50">+15 PTS</span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">(~$0.015 USD)</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Action Button */}
        {watching ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 py-2.5">
            <Loader2 size={14} strokeWidth={2} className="animate-spin text-slate-400 dark:text-zinc-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              {devCountdown > 0 ? `Simulating Ad in Dev Mode... ${devCountdown}s` : "Loading sponsor video..."}
            </span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isOnCooldown || hasReachedLimit}
            onClick={handleWatch}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.99] ${
              isOnCooldown || hasReachedLimit
                ? "cursor-not-allowed bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500"
                : "bg-slate-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200"
            }`}
          >
            {isOnCooldown ? (
              <>
                <Clock size={16} strokeWidth={2} />
                Next ad available in {formatCooldown(cooldown)}
              </>
            ) : hasReachedLimit ? (
              <>
                <Clock size={16} strokeWidth={2} />
                Daily limit reached
              </>
            ) : (
              <>
                <PlayCircle size={16} strokeWidth={2} />
                Watch Video Ad (+15 PTS)
              </>
            )}
          </button>
        )}
      </section>

      {/* Daily Cap & Progress Tracker Card */}
      <section className="space-y-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Daily Watch Limit</span>
          <span className="rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            {adsWatched} / 20 Watched
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-slate-900 dark:bg-zinc-50 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">Resets daily at 00:00 UTC</p>
      </section>

      {/* Streak Boost Card */}
      <section className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#121215] p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-zinc-800">
          <Zap size={15} strokeWidth={2} className="text-slate-500 dark:text-zinc-400" />
        </div>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
          Complete 10 ads today to unlock a{" "}
          <span className="font-semibold text-slate-900 dark:text-zinc-100">+20 PTS</span> bonus booster.
        </p>
      </section>

      {/* Advertiser Disclosure */}
      <p className="text-center text-[11px] text-slate-400 dark:text-zinc-500">
        Ads powered by Adsgram.ai Network. Clean & verified sponsors only.
      </p>
    </div>
  );
}