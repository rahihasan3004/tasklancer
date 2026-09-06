"use client";

import { useState, useCallback } from "react";
import {
  Info,
  Send,
  CheckCircle,
  Loader2,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

type FilterTab = "All" | "Social Tasks" | "Torox Offers" | "Surveys";
type TaskState = "ready" | "verifying" | "completed";

interface SocialTask {
  id: string;
  label: string;
  reward: number;
  actionLabel: string;
  state: TaskState;
  channelUsername?: string;
}

interface ToroxOffer {
  id: string;
  title: string;
  reward: number;
  usdValue: string;
  difficulty: "Easy" | "Medium" | "Hard";
  icon: string;
}

const FILTER_TABS: FilterTab[] = ["All", "Social Tasks", "Torox Offers", "Surveys"];

const SOCIAL_TASKS_INITIAL: SocialTask[] = [
  { id: "tg-channel", label: "Join Official Telegram Channel", reward: 50, actionLabel: "Join Channel", state: "ready", channelUsername: "@TasklancerChannel" },
  { id: "tg-group", label: "Join Global Community Group", reward: 35, actionLabel: "Join Group", state: "ready" },
  { id: "x-follow", label: "Follow Tasklancer on X / Twitter", reward: 25, actionLabel: "Follow", state: "ready" },
  { id: "yt-sub", label: "Subscribe YouTube Channel", reward: 40, actionLabel: "Subscribe", state: "ready" },
];

const TOROX_OFFERS: ToroxOffer[] = [
  { id: "sos", title: "Play State of Survival (Reach Lvl 10)", reward: 1200, usdValue: "$1.20", difficulty: "Medium", icon: "🎮" },
  { id: "crypto", title: "Crypto.com App Registration", reward: 850, usdValue: "$0.85", difficulty: "Easy", icon: "🏦" },
  { id: "bitlabs", title: "Complete BitLabs Daily Survey", reward: 320, usdValue: "$0.32", difficulty: "Easy", icon: "📋" },
];

function haptic(style: "light" | "medium" | "heavy" = "medium") {
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

function DifficultyBadge({ level }: { level: ToroxOffer["difficulty"] }) {
  const colors: Record<ToroxOffer["difficulty"], string> = {
    Easy: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    Medium: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    Hard: "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colors[level]}`}
    >
      {level}
    </span>
  );
}

export function TasksView() {
  const { user, verifyTask } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [socialTasks, setSocialTasks] = useState<SocialTask[]>(SOCIAL_TASKS_INITIAL);
  const [error, setError] = useState<string | null>(null);

  const completedTasks = user?.completedTasks ?? [];

  const handleSocialTask = useCallback(
    async (taskId: string) => {
      const task = socialTasks.find((t) => t.id === taskId);
      if (!task || task.state !== "ready") return;
      if (completedTasks.includes(taskId)) return;

      setSocialTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, state: "verifying" as const } : t)),
      );
      haptic("medium");
      setError(null);

      const tgLinks: Record<string, string> = {
        "tg-channel": "https://t.me/tasklancer",
        "tg-group": "https://t.me/tasklancer_community",
        "x-follow": "https://x.com/tasklancer",
        "yt-sub": "https://youtube.com/@tasklancer",
      };

      if (tgLinks[taskId]) {
        openLink(tgLinks[taskId]);
      }

      const result = await verifyTask(taskId, task.channelUsername);

      if (result.success) {
        setSocialTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, state: "completed" as const } : t)),
        );
        haptic("medium");
      } else {
        setSocialTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, state: "ready" as const } : t)),
        );
        setError(result.error ?? "Verification failed");
      }
    },
    [socialTasks, completedTasks, verifyTask],
  );

  const handleToroxStart = useCallback((offer: ToroxOffer) => {
    haptic("medium");
    const urls: Record<string, string> = {
      sos: "https://torox.com/offer/state-of-survival",
      crypto: "https://torox.com/offer/crypto-register",
      bitlabs: "https://torox.com/offer/bitlabs-survey",
    };
    if (urls[offer.id]) {
      openLink(urls[offer.id]);
    }
  }, []);

  const showSection = (section: "social" | "torox" | "surveys") => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Social Tasks" && section === "social") return true;
    if (activeFilter === "Torox Offers" && section === "torox") return true;
    if (activeFilter === "Surveys" && section === "surveys") return true;
    return false;
  };

  const isTaskCompleted = (taskId: string) => completedTasks.includes(taskId);

  return (
    <div className="flex flex-1 flex-col space-y-5 px-4 py-5 pb-28">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-slate-50 dark:bg-zinc-900 p-1">
        {FILTER_TABS.map((tab) => {
          const isActive = tab === activeFilter;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                haptic("light");
                setActiveFilter(tab);
              }}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-slate-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Anti-Fraud Callout */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-zinc-800">
          <Info size={14} strokeWidth={2} className="text-slate-500 dark:text-zinc-400" />
        </div>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
          Complete tasks honestly. VPN/Proxy will lead to instant account ban.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3.5 py-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Social Tasks Section */}
      {showSection("social") && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">In-House / Telegram</h2>
          <div className="space-y-2">
            {socialTasks.map((task) => {
              const completed = isTaskCompleted(task.id);
              const state = completed ? "completed" : task.state;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-3.5 transition-all"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">{task.label}</span>
                    <span className="font-mono text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      +{task.reward} PTS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {state === "ready" && (
                      <button
                        type="button"
                        onClick={() => handleSocialTask(task.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-95"
                      >
                        <Send size={12} strokeWidth={2} />
                        {task.actionLabel}
                      </button>
                    )}
                    {state === "verifying" && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                        Verifying
                      </div>
                    )}
                    {state === "completed" && (
                      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle size={12} strokeWidth={2} />
                        +{task.reward} PTS
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Torox Offers Section */}
      {showSection("torox") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Torox Partner Offers</h2>
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Powered by Torox</span>
          </div>
          <div className="space-y-2">
            {TOROX_OFFERS.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-lg">
                      {offer.icon}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium leading-snug text-slate-900 dark:text-zinc-100">
                        {offer.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100">
                          +{offer.reward.toLocaleString()} PTS
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">(~{offer.usdValue})</span>
                      </div>
                      <div className="mt-1">
                        <DifficultyBadge level={offer.difficulty} />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToroxStart(offer)}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 dark:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-95"
                  >
                    <ExternalLink size={12} strokeWidth={2} />
                    Start Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Surveys Section (placeholder) */}
      {showSection("surveys") && (
        <section className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <Smartphone size={20} strokeWidth={1.5} className="text-slate-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">No surveys available right now</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Check back later for new survey opportunities</p>
        </section>
      )}
    </div>
  );
}