"use client";

import {
  LayoutGrid,
  CheckSquare,
  PlayCircle,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type TabId = "home" | "tasks" | "ads" | "invite" | "wallet";

interface Tab {
  id: TabId;
  label: string;
  Icon: LucideIcon;
}

const TABS: Tab[] = [
  { id: "home", label: "Home", Icon: LayoutGrid },
  { id: "tasks", label: "Tasks", Icon: CheckSquare },
  { id: "ads", label: "Ads", Icon: PlayCircle },
  { id: "invite", label: "Invite", Icon: Users },
  { id: "wallet", label: "Wallet", Icon: Wallet },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  function handleClick(tabId: TabId) {
    const haptic = (window as any).Telegram?.WebApp?.HapticFeedback;
    if (haptic) {
      haptic.impactOccurred("light");
    }
    onTabChange(tabId);
  }

  return (
    <nav className="app-nav-inset fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090B]/95 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-around">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClick(id)}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-all"
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? "text-slate-900 dark:text-zinc-100" : "text-slate-400 dark:text-zinc-500"}
              />
              <span className={isActive ? "text-slate-900 dark:text-zinc-100" : "text-slate-400 dark:text-zinc-500"}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}