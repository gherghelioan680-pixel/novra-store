"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, logoutUser, refreshCurrentUserFromServer, type User } from "@/lib/auth";
import { createStoreRefreshEffect } from "@/lib/store";
import type { AccountSection } from "./types";
import AuthPanel from "./AuthPanel";
import AccountSidebar from "./AccountSidebar";
import AccountHeader from "./AccountHeader";
import OverviewView from "./views/OverviewView";
import MyProfileView from "./views/MyProfileView";
import MyOrdersView from "./views/MyOrdersView";
import MyReturnsView from "./views/MyReturnsView";
import ManageAccountView from "./views/ManageAccountView";
import ShippingAddressView from "./views/ShippingAddressView";
import CouponsView from "./views/CouponsView";
import NovraCreditsView from "./views/NovraCreditsView";
import GiftCardsView from "./views/GiftCardsView";
import EmailPreferencesView from "./views/EmailPreferencesView";
import SupportCenterView from "./views/SupportCenterView";

const VALID_SECTIONS: AccountSection[] = [
  "overview",
  "my-profile",
  "my-orders",
  "my-returns",
  "manage-account",
  "shipping-address",
  "my-coupons",
  "my-novra-credits",
  "gift-cards",
  "email-preferences",
  "support-center",
];

function isAccountSection(value: string | null): value is AccountSection {
  return Boolean(value && VALID_SECTIONS.includes(value as AccountSection));
}

function AccountDashboardContent() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<AccountSection>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (isAccountSection(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const init = async () => {
      const user = getCurrentUser();
      if (user) {
        const refreshed = await refreshCurrentUserFromServer();
        setCurrentUser(refreshed ?? user);
        setIsLoggedIn(true);
      }
    };
    init();
    return createStoreRefreshEffect(async () => {
      const refreshed = await refreshCurrentUserFromServer();
      if (refreshed) setCurrentUser(refreshed);
    }, { scopes: ["users", "credits"] });
  }, []);

  const handleAuthSuccess = (user: User, message: string) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setToast(message);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveSection("overview");
    setToast("Ai ieșit din cont.");
  };

  const handleUserUpdate = (user: User, message?: string) => {
    setCurrentUser(user);
    if (message) setToast(message);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  };

  if (!isLoggedIn) {
    return <AuthPanel onAuthSuccess={handleAuthSuccess} />;
  }

  if (!currentUser) return null;

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <OverviewView
            user={currentUser}
            onNavigate={setActiveSection}
            onUserUpdate={(user) => handleUserUpdate(user)}
          />
        );
      case "my-profile":
        return (
          <MyProfileView
            user={currentUser}
            onSave={(user, message) => {
              handleUserUpdate(user, message);
              showToast(message);
            }}
            onCancel={() => setActiveSection("overview")}
          />
        );
      case "my-orders":
        return <MyOrdersView userEmail={currentUser.email} />;
      case "my-returns":
        return <MyReturnsView />;
      case "manage-account":
        return (
          <ManageAccountView
            user={currentUser}
            onPasswordChanged={(user, message) => {
              handleUserUpdate(user, message);
              showToast(message);
            }}
          />
        );
      case "shipping-address":
        return (
          <ShippingAddressView
            user={currentUser}
            onSave={(user, message) => {
              handleUserUpdate(user, message);
              showToast(message);
            }}
            onCancel={() => setActiveSection("overview")}
          />
        );
      case "my-coupons":
        return <CouponsView />;
      case "my-novra-credits":
        return <NovraCreditsView user={currentUser} />;
      case "gift-cards":
        return <GiftCardsView />;
      case "email-preferences":
        return (
          <EmailPreferencesView
            user={currentUser}
            onSave={(user) => {
              handleUserUpdate(user);
              showToast("Preferințele au fost salvate.");
            }}
          />
        );
      case "support-center":
        return <SupportCenterView />;
      default:
        return null;
    }
  };

  const showHeader = activeSection === "overview";

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <div className="flex min-h-screen">
        <AccountSidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          onLogout={handleLogout}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((o) => !o)}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-14 sm:pt-16 lg:pb-8 lg:pt-0">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
            {showHeader && (
              <AccountHeader
                user={currentUser}
                onEditProfile={() => setActiveSection("my-profile")}
                onUserUpdate={(user) => setCurrentUser(user)}
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-2rem)] rounded-xl border border-purple-500/30 bg-novra-card px-5 py-3 text-sm text-purple-200 shadow-xl lg:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AccountDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-novra-bg" />}>
      <AccountDashboardContent />
    </Suspense>
  );
}
