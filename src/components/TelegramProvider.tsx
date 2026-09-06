"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}

interface TelegramContextValue {
  user: TelegramUser | null;
  initData: string;
  isReady: boolean;
  isTelegram: boolean;
}

const MOCK_USER: TelegramUser = {
  id: 123456789,
  first_name: "Dev",
  username: "localdev",
};

const TelegramContext = createContext<TelegramContextValue>({
  user: null,
  initData: "",
  isReady: false,
  isTelegram: false,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramContextValue>({
    user: null,
    initData: "",
    isReady: false,
    isTelegram: false,
  });

  useEffect(() => {
    const isTelegram = typeof window !== "undefined" && !!window.Telegram?.WebApp;

    if (isTelegram) {
      const WebApp = window.Telegram!.WebApp;
      WebApp.ready();
      WebApp.expand();

      const u = WebApp.initDataUnsafe?.user;
      const user: TelegramUser | null = u
        ? {
            id: u.id,
            first_name: u.first_name,
            username: u.username,
            photo_url: u.photo_url,
          }
        : null;

      setState({
        user,
        initData: WebApp.initData ?? "",
        isReady: true,
        isTelegram: true,
      });
    } else {
      setState({
        user: MOCK_USER,
        initData: "mock_init_data",
        isReady: true,
        isTelegram: false,
      });
    }
  }, []);

  if (!state.isReady) {
    return null;
  }

  return <TelegramContext.Provider value={state}>{children}</TelegramContext.Provider>;
}