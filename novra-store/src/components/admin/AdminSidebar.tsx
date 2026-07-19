"use client";

import {
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Mail,
  Tag,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Search,
  Coins,
  Link2,
  Megaphone,
  FileText,
  UserPlus,
  Bell,
  UserX,
  Inbox,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/statistici", label: "Statistici", icon: BarChart3 },
  { href: "/admin/produse", label: "Produse", icon: Package },
  { href: "/admin/comenzi", label: "Comenzi", icon: ShoppingBag },
  { href: "/admin/returnari", label: "Returnări", icon: Package },
  { href: "/admin/cautare", label: "Căutare", icon: Search },
  { href: "/admin/clienti", label: "Clienți", icon: Users },
  { href: "/admin/utilizatori", label: "Utilizatori", icon: UserX },
  { href: "/admin/credite", label: "Gift Cards & Credite", icon: Coins },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/email-center", label: "Email Center", icon: Inbox },
  { href: "/admin/coduri-reducere", label: "Coduri reducere", icon: Tag },
  { href: "/admin/afiliati", label: "Program Afiliere", icon: Link2 },
  { href: "/admin/campanii", label: "Campanii", icon: Megaphone },
  { href: "/admin/blog", label: "Blog & Ghiduri", icon: FileText },
  { href: "/admin/recomandari", label: "Recomandări", icon: UserPlus },
  { href: "/admin/notificari", label: "Notificări Push", icon: Bell },
  { href: "/admin/recenzii", label: "Recenzii", icon: Star },
  { href: "/admin/autenticitate", label: "Autenticitate", icon: ShieldCheck },
  { href: "/admin/harta-livrari", label: "Harta livrări", icon: MapPin },
  { href: "/admin/setari", label: "Setări", icon: Settings },
];

type AdminSidebarProps = {
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onMobileClose: () => void;
};

export default function AdminSidebar({
  onLogout,
  mobileOpen,
  onMobileToggle,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <Link href="/admin" className="inline-flex items-center group">
          <Image
            src="/logo.png"
            alt="NOVRA Admin"
            width={160}
            height={48}
            className="h-8 w-auto transition-opacity group-hover:opacity-90"
            priority
          />
        </Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400">
          Panou Admin
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-purple-600/20 text-white border-l-2 border-purple-500"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={active ? "text-purple-400" : ""} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} />
          Înapoi pe site
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-red-300"
        >
          <LogOut size={18} />
          Deconectare
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={onMobileToggle}
        className="fixed left-4 top-4 z-50 flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-novra-card lg:hidden"
        aria-label="Meniu admin"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-novra-bg-alt lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-white/10 bg-novra-bg-alt shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
