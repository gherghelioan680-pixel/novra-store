import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ROOT_METADATA } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#13111c" },
  ],
};

export const metadata: Metadata = {
  ...ROOT_METADATA,
  metadataBase: new URL("https://novra.ro"),
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
