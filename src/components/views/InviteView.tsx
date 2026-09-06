"use client";

import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Send,
  Users,
  Gift,
  Share2,
  UserPlus,
  Zap,
  Clock,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const HOW_IT_WORKS = [
  { icon: Share2, label: "Share Link", desc: "Send your referral link to friends" },
  { icon: UserPlus, label: "Friend Joins", desc: "They start the bot with your link" },
  { icon: Gift, label: "Get Rewards", desc: "Instant 100 PTS + 10% lifetime commission" },
];

function haptic(style: "light" | "medium" | "heavy" = "light") {
  (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
}

function openLink(url: string) {
  haptic("light");
  if ((window as any).Telegram?.WebApp?.openLink) {
    (window as any).Telegram.WebApp.openLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function InviteView() {
  const { user, transactions } = useApp();
  const [copied, setCopied] = useState(false);

  const telegramId = user?.telegramId ?? "123456789";
  const REFERRAL_LINK = `https://t.me/Tasklancer_app_bot?start=ref_${telegramId}`;
  const TELEGRAM_SHARE_URL = `https://t.me/share/url?url=${encodeURIComponent(REFERRAL_LINK)}&text=${encodeURIComponent("Join Tasklancer and start earning crypto rewards!")}`;

  const referralTransactions = transactions.filter((t) => t.type === "referral");
  const referralEarnings = referralTransactions.reduce((sum, t) => sum + t.amount, 0);
  const referralCount = referralTransactions.length;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      setCopied(true);
      haptic("medium");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = REFERRAL_LINK;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      haptic("medium");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [REFERRAL_LINK]);

  const handleShareTelegram = useCallback(() => {
    haptic("medium");
    openLink(TELEGRAM_SHARE_URL);
  }, [TELEGRAM_SHARE_URL]);

  return (
    <div className="flex flex-1 flex-col space-y-5 px-4 py-5 pb-28">
      {/* Hero Invite Card */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#121215] p-5">
        <div className="space-y-1.5">
          <h1 className="text-base font-bold text-slate-900 dark:text-zinc-100">Invite & Earn 10% Lifetime</h1>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
            Share Tasklancer with friends. Get 100 PTS instantly when they join + 10% commission on
            every task they complete.
          </p>
        </div>

        {/* Referral Link Box */}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
          <div className="px-3 py-2.5">
            <span className="block truncate font-mono text-xs text-slate-900 dark:text-zinc-100">
              {REFERRAL_LINK}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.99]"
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={2} className="text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2} />
                Copy Link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleShareTelegram}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-50 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-[0.99]"
          >
            <Send size={16} strokeWidth={2} />
            Share to Telegram
          </button>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800">
            <Users size={16} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
          </div>
          <span className="block font-mono text-2xl font-bold text-slate-900 dark:text-zinc-50">{referralCount}</span>
          <span className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
            Total Friends Invited
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800">
            <Zap size={16} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
          </div>
          <span className="block font-mono text-2xl font-bold text-slate-900 dark:text-zinc-50">+{referralEarnings} PTS</span>
          <span className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
            Total Referral Earnings
          </span>
        </div>
      </section>

      {/* How It Works */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-900 dark:text-zinc-100">How It Works</h2>
        <div className="flex gap-3">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
                <step.icon size={16} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{step.label}</span>
                <span className="text-[10px] leading-relaxed text-slate-400 dark:text-zinc-500">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Referrals Ledger */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users size={14} strokeWidth={1.5} className="text-slate-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Invited Friends ({referralCount})</span>
        </div>
        <div className="flex flex-col gap-1">
          {referralTransactions.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">No referrals yet</p>
          ) : (
            referralTransactions.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    {ref.title.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{ref.title}</span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      <Clock size={10} strokeWidth={1.5} className="mr-0.5 inline-block" />
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  +{ref.amount} PTS
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}