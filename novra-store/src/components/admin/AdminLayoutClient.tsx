"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ensureAdminUser,
  getCurrentUser,
  logoutUser,
  requireAdmin,
  type User,
} from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminSearch from "@/components/admin/AdminSearch";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [admin, setAdmin] = useState<User | null>(null);
  const [checking, setChecking] = useState(!isLoginPage);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ensureAdminUser();

      if (isLoginPage) {
        const user = getCurrentUser();
        if (user && requireAdmin()) {
          router.replace("/admin");
        }
        setChecking(false);
        return;
      }

      const user = requireAdmin();
      if (!user) {
        router.replace("/admin/login");
        setChecking(false);
        return;
      }

      setAdmin(user);
      setChecking(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-novra-bg text-gray-400">
        <p className="text-sm">Se verifică accesul...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-novra-bg px-4 text-center text-gray-400">
        <p className="text-sm">Autentificare necesară pentru panoul admin.</p>
        <Link
          href="/admin/login"
          className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Mergi la autentificare
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logoutUser();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <div className="flex min-h-screen">
        <AdminSidebar
          onLogout={handleLogout}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((open) => !open)}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="px-4 pb-24 pt-16 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="mb-6 hidden lg:block">
              <AdminSearch compact />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
