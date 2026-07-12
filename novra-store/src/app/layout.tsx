import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import ComingSoonGate from "@/components/ComingSoonGate";

// Aceasta este metoda oficială în Next.js pentru a defini tag-ul viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#13111c",
};

export const metadata: Metadata = {
  title: "NOVRA | Precision. Performance. Power.",
  description: "Cabluri premium create pentru viteză, siguranță și performanță fără compromis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className="bg-novra-bg text-white antialiased">
        <ComingSoonGate>
          <Providers>{children}</Providers>
        </ComingSoonGate>
      </body>
    </html>
  );
}