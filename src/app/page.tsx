"use client";

import { TelegramProvider } from "@/components/TelegramProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { BottomNav, type TabId } from "@/components/BottomNav";
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

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onOpenProfile={() => setIsProfileOpen(true)} />
      <main className="flex flex-1 flex-col">
        {activeTab === "home" && (
          <HomeView onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "ads" && <AdsView />}
        {activeTab === "invite" && <InviteView />}
        {activeTab === "wallet" && <WalletView onNavigate={(tab) => setActiveTab(tab)} />}
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