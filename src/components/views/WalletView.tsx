"use client";

import { useState, useCallback } from "react";
import { ArrowUpRight, Wallet, Clock, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

type PayoutMethod = "bKash" | "Nagad" | "USDT (BSC)";

const PAYOUT_METHODS: { id: PayoutMethod; label: string }[] = [
  { id: "bKash", label: "bKash" },
  { id: "Nagad", label: "Nagad" },
  { id: "USDT (BSC)", label: "USDT (BSC)" },
];

const MIN_PAYOUT = 3000;

function haptic() {
  (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
}

function getAddressPlaceholder(method: PayoutMethod): string {
  switch (method) {
    case "bKash":
      return "Enter 11-digit bKash Number";
    case "Nagad":
      return "Enter 11-digit Nagad Number";
    case "USDT (BSC)":
      return "Enter USDT BEP20 Wallet Address";
  }
}

function validateAddress(method: PayoutMethod, value: string): boolean {
  if (!value.trim()) return false;
  switch (method) {
    case "bKash":
    case "Nagad":
      return /^\d{11}$/.test(value.trim());
    case "USDT (BSC)":
      return value.trim().length >= 32;
  }
}

function mapMethodToApi(method: PayoutMethod): string {
  switch (method) {
    case "bKash": return "bkash";
    case "Nagad": return "nagad";
    case "USDT (BSC)": return "usdt_bsc";
  }
}

export function WalletView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, withdrawals, requestWithdrawal } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod>("bKash");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const balance = user?.balance ?? 0;
  const progressPct = Math.round((balance / MIN_PAYOUT) * 100);
  const remainingPts = Math.max(0, MIN_PAYOUT - balance);

  const numericAmount = Number(amount);
  const isValidAmount = numericAmount >= MIN_PAYOUT && numericAmount <= balance;
  const isValidAddress = validateAddress(selectedMethod, address);
  const referralsCount = user?.referralsCount ?? 0;
  const referralsMet = referralsCount >= 3;
  const canSubmit = isValidAmount && isValidAddress && !submitting && referralsMet;

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  function handleMax() {
    haptic();
    setAmount(String(balance));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    haptic();
    setSubmitting(true);

    const result = await requestWithdrawal(numericAmount, mapMethodToApi(selectedMethod), address.trim());

    setSubmitting(false);
    if (result.success) {
      const usdValue = (numericAmount / 1000).toFixed(2);
      setAmount("");
      setAddress("");
      showToast("success", `Payout of $${usdValue} requested via ${selectedMethod}`);
    } else {
      showToast("error", result.error ?? "Withdrawal failed");
    }
  }

  function dismissToast() {
    setToast(null);
  }

  return (
    <div className="flex flex-1 flex-col space-y-5 px-4 py-5 pb-28">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-sm ${
            toast.type === "success"
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
              : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} strokeWidth={2} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={16} strokeWidth={2} className="shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={dismissToast} className="shrink-0 text-inherit">
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Hero Payout Balance Card */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#121215] p-5">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-400 uppercase">
            WITHDRAWABLE BALANCE
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

        {/* Min. Payout Threshold */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Min. Payout: {MIN_PAYOUT.toLocaleString()} PTS ($3.00)
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              {Math.min(progressPct, 100)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-slate-900 dark:bg-zinc-50 transition-all"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          {remainingPts > 0 && (
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              {remainingPts.toLocaleString()} PTS remaining until minimum payout
            </p>
          )}
        </div>
      </section>

      {/* Withdrawal Eligibility Card */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 p-4 space-y-3">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-400 uppercase">
          Withdrawal Eligibility
        </p>
        <div className="flex items-center gap-3">
          {balance >= 3000 ? (
            <CheckCircle size={16} strokeWidth={2} className="shrink-0 text-emerald-500" />
          ) : (
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-zinc-600">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
            </div>
          )}
          <div className="flex-1">
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Balance $3.00 (3,000 PTS)</span>
            {balance < 3000 && (
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                ${(balance / 1000).toFixed(2)} / $3.00
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {referralsMet ? (
            <CheckCircle size={16} strokeWidth={2} className="shrink-0 text-emerald-500" />
          ) : (
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 dark:border-zinc-600">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Referrals — 3 Friends Required</span>
            {!referralsMet && (
              <>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-slate-900 dark:bg-zinc-50 transition-all"
                    style={{ width: `${Math.min((referralsCount / 3) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">{referralsCount}/3 Friends</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Payout Method Selector */}
      <section>
        <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-400 uppercase">
          Payout Method
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAYOUT_METHODS.map(({ id, label }) => {
            const active = id === selectedMethod;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptic();
                  setSelectedMethod(id);
                  setAddress("");
                }}
                className={`rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold transition-all ${
                  active
                    ? "bg-slate-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-sm"
                    : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Withdrawal Form */}
      <section className="space-y-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <div className="flex items-center gap-2">
          <Wallet size={14} strokeWidth={1.5} className="text-slate-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Request Payout</span>
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Amount (PTS)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 3000"
              min={MIN_PAYOUT}
              max={balance}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 pr-14 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-zinc-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={handleMax}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 transition-all hover:bg-slate-100 dark:hover:bg-zinc-700"
            >
              Max
            </button>
          </div>
          {amount && (
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              ≈ ${(numericAmount / 1000).toFixed(2)} USD
              {numericAmount < MIN_PAYOUT && <span className="text-red-500 dark:text-red-400"> · Min {MIN_PAYOUT} PTS</span>}
              {numericAmount > balance && (
                <span className="text-red-500 dark:text-red-400"> · Exceeds balance</span>
              )}
            </p>
          )}
        </div>

        {/* Address Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            {selectedMethod} {selectedMethod === "bKash" || selectedMethod === "Nagad" ? "Number" : "Address"}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={getAddressPlaceholder(selectedMethod)}
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-zinc-50"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-50 py-3 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Processing…
            </span>
          ) : (
            <>
              <ArrowUpRight size={16} strokeWidth={2} />
              Request Payout
            </>
          )}
        </button>

        {!referralsMet && onNavigate && (
          <button
            type="button"
            onClick={() => { haptic(); onNavigate("invite"); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 text-sm font-medium text-slate-700 dark:text-zinc-300 transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.99]"
          >
            <ArrowUpRight size={16} strokeWidth={2} />
            Invite Friends to Unlock Payout ({referralsCount}/3)
          </button>
        )}
      </section>

      {/* Payout Rules Callout */}
      <section className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-slate-400 dark:text-zinc-500" />
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Payouts are processed daily within 12–24 hours. Zero processing fees.
          </p>
        </div>
      </section>

      {/* Withdrawal History Ledger */}
      <section className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={14} strokeWidth={1.5} className="text-slate-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">Recent Payouts</span>
        </div>
        {withdrawals.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-slate-400 dark:text-zinc-500">No payouts yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            {withdrawals.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800">
                    <ArrowUpRight size={14} strokeWidth={1.5} className="text-slate-500 dark:text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                      ${(entry.amount / 1000).toFixed(2)} via {entry.method}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    entry.status === "approved"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : entry.status === "rejected"
                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}