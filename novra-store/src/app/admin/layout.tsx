import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import AdminProviders from "@/components/AdminProviders";

export const metadata: Metadata = {
  title: "Admin | NOVRA",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminProviders>
  );
}
