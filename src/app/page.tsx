"use client";

import { TelegramProvider } from "@/components/TelegramProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
export type TabId = "home" | "tasks" | "ads" | "invite" | "wallet";
import { useState } from "react";
import { HomeView } from "@/components/views/HomeView";
import { TasksView } from "@/components/views/TasksView";
import { AdsView } from "@/components/views/AdsView";
import { InviteView } from "@/components/views/InviteView";
import { WalletView } from "@/components/views/WalletView";
import { ProfileModal } from "@/components/modals/ProfileModal";

function PageContent() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const handleNavigate = (tab: string | TabId) => { setActiveTab(tab as TabId); };

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onOpenProfile={() => setIsProfileOpen(true)} />
      <main className="flex flex-1 flex-col">
        {activeTab === "home" && (
          <HomeView onNavigate={handleNavigate} />
        )}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "ads" && <AdsView />}
        {activeTab === "invite" && <InviteView />}
        {activeTab === "wallet" && <WalletView onNavigate={handleNavigate} />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <TelegramProvider>
      <AppProvider>
        <ThemeProvider>
          <PageContent />
        </ThemeProvider>
      </AppProvider>
    </TelegramProvider>
  );
}