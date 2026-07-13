import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Admin | NOVRA",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Providers>
  );
}
