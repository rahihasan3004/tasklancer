"use client";

import { useState } from "react";
import {
  CheckCircle,
  PlayCircle,
  Users,
  ArrowUpRight,
  Gift,
  Check,
  Sparkles,
  Eye,
  Clock,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const DAY_LABELS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
const DAY_REWARDS = [10, 20, 30, 50, 75, 100, 150];

function haptic() {
  (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
}

interface ViewProps {
  onNavigate?: (tab: "home" | "tasks" | "ads" | "invite" | "wallet" | string) => void;
}

export function HomeView({
  onNavigate,
}: ViewProps) {
  const { user, transactions, claimDailyReward, loading } = useApp();
  const [claiming, setClaiming] = useState(false);

  const balance = user?.balance ?? 0;
  const dailyStreak = user?.dailyStreak ?? 0;
  const lastClaimDate = user?.lastClaimDate ? new Date(user.lastClaimDate) : null;
  const lastClaimTime = lastClaimDate ? lastClaimDate.getTime() : 0;

  const canClaimToday =
    !lastClaimDate || (Date.now() - lastClaimTime) >= 24 * 60 * 60 * 1000;

  const nextUnclaimed = canClaimToday ? Math.min(dailyStreak, 6) : -1;
  const nextReward = nextUnclaimed !== -1 ? DAY_REWARDS[nextUnclaimed] : null;

  async function handleClaim() {
    if (!canClaimToday || claiming) return;
    haptic();
    setClaiming(true);
    await claimDailyReward();
    setClaiming(false);
  }

  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="flex flex-1 flex-col space-y-5 px-4 py-5 pb-28">
      {/* Hero Balance Card */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#121215] p-5">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-400 uppercase">
            TOTAL AVAILABLE BALANCE
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-4xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {balance.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">PTS</span>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-400 dark:text-zinc-500">
            ≈ ${(balance / 1000).toFixed(2)} USD
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              haptic();
              onNavigate?.("wallet");
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-50 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-[0.99]"
          >
            <ArrowUpRight size={16} strokeWidth={2} />
            Withdraw
          </button>
          <button
            type="button"
            onClick={() => {
              haptic();
              onNavigate?.("tasks");
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.99]"
          >
            <Gift size={16} strokeWidth={2} />
            Earn Tasks
          </button>
        </div>
      </section>

      {/* Daily Streak Card */}
      <section className="space-y-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Daily Reward</span>
          </div>
          <span className="rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            Day {dailyStreak} of 7
          </span>
        </div>

        <div className="flex gap-2">
          {DAY_REWARDS.map((reward, i) => {
            const claimed = i < dailyStreak;
            const isToday = i === nextUnclaimed;
            return (
              <div
                key={i}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl px-2 py-3 transition-all ${
                  claimed
                    ? "border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30"
                    : isToday
                      ? "border-2 border-slate-900 dark:border-zinc-100 bg-white dark:bg-[#121215]"
                      : "border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
                }`}
              >
                <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400">{DAY_LABELS[i]}</span>
                {claimed ? (
                  <Check size={14} strokeWidth={2.5} className="text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <span className="font-mono text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                    +{reward}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {nextReward !== null && (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-50 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50"
          >
            {claiming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Claiming...
              </>
            ) : (
              `Claim ${DAY_LABELS[nextUnclaimed]} (+${nextReward} PTS)`
            )}
          </button>
        )}
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: "Tasks Done", value: user?.completedTasks?.length ?? 0, icon: CheckCircle },
          { label: "Ads Watched", value: user?.adsWatchedToday ?? 0, icon: PlayCircle },
          { label: "Referrals", value: user?.referredBy ? 1 : 0, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-3 text-center"
          >
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800">
              <Icon size={14} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
            </div>
            <span className="block font-mono text-xl font-bold text-slate-900 dark:text-zinc-50">{value}</span>
            <span className="text-[10px] font-medium tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
              {label}
            </span>
          </div>
        ))}
      </section>

      {/* Recent Activity Ledger */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={14} strokeWidth={1.5} className="text-slate-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Recent Activity</span>
        </div>
        <div className="flex flex-col gap-1">
          {recentTransactions.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">No activity yet</p>
          ) : (
            recentTransactions.map((tx) => {
              const Icon = tx.type === "daily_claim" ? CheckCircle : tx.type === "ad_reward" ? Eye : PlayCircle;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800">
                      <Icon size={14} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">{tx.title}</span>
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    +{tx.amount} PTS
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}