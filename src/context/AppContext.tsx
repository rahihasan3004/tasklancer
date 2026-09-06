"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useTelegram } from "@/components/TelegramProvider";

interface UserData {
  telegramId: string;
  firstName: string;
  username?: string;
  balance: number;
  dailyStreak: number;
  lastClaimDate: string | null;
  adsWatchedToday: number;
  completedTasks: string[];
  referredBy: string | null;
  referralsCount: number;
  createdAt: string;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  title: string;
  createdAt: string;
}

interface WithdrawalData {
  id: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  createdAt: string;
}

interface AppContextValue {
  user: UserData | null;
  transactions: TransactionData[];
  withdrawals: WithdrawalData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  claimDailyReward: () => Promise<{ success: boolean; rewardAmount?: number; error?: string }>;
  watchAd: () => Promise<{ success: boolean; error?: string; adsRemaining?: number }>;
  verifyTask: (taskId: string, channelUsername?: string) => Promise<{ success: boolean; error?: string; rewardAmount?: number }>;
  requestWithdrawal: (amount: number, method: string, accountNumber: string) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextValue>({
  user: null,
  transactions: [],
  withdrawals: [],
  loading: true,
  error: null,
  refreshData: async () => {},
  claimDailyReward: async () => ({ success: false }),
  watchAd: async () => ({ success: false }),
  verifyTask: async () => ({ success: false }),
  requestWithdrawal: async () => ({ success: false }),
});

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: tgUser, initData } = useTelegram();
  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authInitData = initData || "mock_init_data";

  const refreshData = useCallback(async () => {
    if (!tgUser || !initData) return;
    try {
      setError(null);
      const res = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: authInitData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to sync");
        return;
      }
      setUser(data.user);
      setTransactions(data.transactions ?? []);
      setWithdrawals(data.withdrawals ?? []);
    } catch (err) {
      setError("Network error during sync");
    }
  }, [tgUser, initData, authInitData]);

  useEffect(() => {
    if (tgUser && initData) {
      refreshData().finally(() => setLoading(false));
    }
  }, [tgUser, initData, refreshData]);

  const claimDailyReward = useCallback(async (): Promise<{
    success: boolean;
    rewardAmount?: number;
    error?: string;
  }> => {
    try {
      const res = await fetch("/api/rewards/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: authInitData }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      setUser((prev) =>
        prev ? { ...prev, balance: data.balance, dailyStreak: data.dailyStreak, lastClaimDate: new Date().toISOString() } : prev
      );
      setTransactions((prev) => [
        {
          id: crypto.randomUUID(),
          type: "daily_claim",
          amount: data.rewardAmount,
          title: `Day ${data.dailyStreak} streak reward`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      return { success: true, rewardAmount: data.rewardAmount };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, [authInitData]);

  const watchAd = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
    adsRemaining?: number;
  }> => {
    try {
      const res = await fetch("/api/rewards/ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: authInitData }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      setUser((prev) =>
        prev ? { ...prev, balance: data.balance, adsWatchedToday: data.adsWatchedToday } : prev
      );
      setTransactions((prev) => [
        {
          id: crypto.randomUUID(),
          type: "ad_reward",
          amount: 15,
          title: "Rewarded ad watch",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      return { success: true, adsRemaining: data.adsRemaining };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, [authInitData]);

  const verifyTask = useCallback(
    async (taskId: string, channelUsername?: string): Promise<{
      success: boolean;
      error?: string;
      rewardAmount?: number;
    }> => {
      try {
        const res = await fetch("/api/tasks/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: authInitData, taskId, channelUsername }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error };
        setUser((prev) =>
          prev ? { ...prev, balance: data.balance, completedTasks: [...prev.completedTasks, taskId] } : prev
        );
        setTransactions((prev) => [
          {
            id: crypto.randomUUID(),
            type: "task",
            amount: data.rewardAmount,
            title: `Task completed: ${taskId}`,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        return { success: true, rewardAmount: data.rewardAmount };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [authInitData]
  );

  const requestWithdrawal = useCallback(
    async (amount: number, method: string, accountNumber: string): Promise<{
      success: boolean;
      error?: string;
    }> => {
      try {
        const res = await fetch("/api/wallet/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: authInitData, amount, method, accountNumber }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error };
        setUser((prev) => (prev ? { ...prev, balance: data.balance } : prev));
        setWithdrawals((prev) => [data.withdrawal, ...prev]);
        setTransactions((prev) => [
          {
            id: crypto.randomUUID(),
            type: "withdrawal",
            amount: -amount,
            title: `Withdrawal of ${amount} PTS via ${method}`,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        return { success: true };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [authInitData]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        transactions,
        withdrawals,
        loading,
        error,
        refreshData,
        claimDailyReward,
        watchAd,
        verifyTask,
        requestWithdrawal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}