"use client";

import { useTelegram } from "./TelegramProvider";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export function Header({ onOpenProfile }: { onOpenProfile?: () => void }) {
  const { user, isReady } = useTelegram();
  const { theme, toggleTheme } = useTheme();
  const [rotating, setRotating] = useState(false);

  if (!isReady || !user) {
    return null;
  }

  const initial = user.first_name.charAt(0).toUpperCase();
  const username = user.username ?? "user";

  const handleToggle = () => {
    setRotating(true);
    toggleTheme();
    setTimeout(() => setRotating(false), 500);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090B]/95 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-3 rounded-full p-1 -ml-1 transition-all hover:bg-slate-50 dark:hover:bg-zinc-900 active:scale-95"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-xs font-semibold text-slate-800 dark:text-zinc-200">
            {initial}
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
            @{username}
          </span>
        </button>
        <button
          type="button"
          onClick={handleToggle}
          className="p-2 rounded-full border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-slate-700 dark:text-zinc-300 active:scale-90"
          aria-label="Toggle theme"
        >
          <span className={rotating ? "animate-rotate-icon block" : "block"}>
            {theme === "light" ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
          </span>
        </button>
      </div>
    </header>
  );
}