import "./globals.css";
import type { Metadata, Viewport } from "next";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#13111c",
};

export const metadata: Metadata = {
  title: "NOVRA | Precision. Performance. Power.",
  description: "Cabluri premium create pentru viteză, siguranță și performanță fără compromis.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className="bg-novra-bg text-white antialiased">{children}</body>
    </html>
  );
}
