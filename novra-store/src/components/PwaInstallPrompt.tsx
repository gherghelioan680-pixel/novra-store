"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIsClient } from "@/hooks/useIsClient";

const DISMISS_KEY = "novra-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallPrompt() {
  const t = useTranslations("pwa");
  const mounted = useIsClient();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone);

    if (isStandalone) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [mounted]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!mounted || !visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9970] sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-purple-500/25 bg-novra-surface/95 backdrop-blur-md p-4 shadow-2xl shadow-purple-950/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30">
          <Download size={18} className="text-purple-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{t("installTitle")}</p>
          <p className="mt-1 text-xs text-gray-400">{t("installDescription")}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void install()}
              className="min-h-9 rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              {t("installAction")}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              {t("installDismiss")}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-gray-500 hover:text-white transition-colors"
          aria-label={t("installDismiss")}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
