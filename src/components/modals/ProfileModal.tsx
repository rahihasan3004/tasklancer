"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Camera, Lock, ShieldCheck, Check } from "lucide-react";

function haptic() {
  (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
}

export function ProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [displayName, setDisplayName] = useState("Dev User");
  const [saved, setSaved] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSave = useCallback(() => {
    haptic();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleAvatarUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setAvatarSrc(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] sm:items-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-[430px] animate-slide-up rounded-t-2xl border border-b-0 border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-5 pb-8 pt-4 sm:rounded-2xl sm:border-b"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Account Profile</h2>
          <button
            type="button"
            onClick={() => {
              haptic();
              onClose();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 dark:text-zinc-500 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-500 dark:text-zinc-400">D</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-90"
            >
              <Camera size={13} strokeWidth={2} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Tap to update photo</span>
        </div>

        {/* Form Fields */}
        <div className="mb-6 space-y-4">
          {/* Editable: Display Name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-zinc-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-slate-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500"
            />
          </div>

          {/* Fixed: Telegram Username */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
              <Lock size={11} strokeWidth={2} />
              Telegram Username
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3.5 py-2.5">
              <input
                type="text"
                value="@localdev"
                readOnly
                className="flex-1 bg-transparent text-sm font-medium text-slate-500 dark:text-zinc-400 outline-none"
              />
              <span className="whitespace-nowrap text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                Linked to Telegram
              </span>
            </div>
          </div>

          {/* Fixed: Telegram ID */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
              <Lock size={11} strokeWidth={2} />
              Telegram ID
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3.5 py-2.5">
              <input
                type="text"
                value="8884403513"
                readOnly
                className="flex-1 bg-transparent font-mono text-sm font-medium text-slate-500 dark:text-zinc-400 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3.5 py-2.5">
          <ShieldCheck size={16} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Verified Member</span>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.99] ${
            saved
              ? "bg-emerald-500 dark:bg-emerald-600 text-white"
              : "bg-slate-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200"
          }`}
        >
          {saved && <Check size={16} strokeWidth={2.5} />}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}