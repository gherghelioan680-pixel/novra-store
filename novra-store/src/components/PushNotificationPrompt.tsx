"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { hasCookieConsentDecision } from "@/lib/cookie-consent";
import {
  getPushConfig,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  urlBase64ToUint8Array,
} from "@/lib/push";

const DISMISS_KEY = "novra-push-dismissed";

export default function PushNotificationPrompt() {
  const mounted = useIsClient();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    if (!isPushSupported()) return;
    if (!hasCookieConsentDecision()) return;

    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    void getPushConfig().then((config) => {
      if (config.supported) {
        setSupported(true);
        const timer = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(timer);
      }
    });
  }, [mounted]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const enable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        dismiss();
        return;
      }

      const config = await getPushConfig();
      if (!config.publicKey) {
        dismiss();
        return;
      }

      const registration = await registerServiceWorker();
      if (!registration) {
        dismiss();
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey) as BufferSource,
      });

      const result = await subscribeToPush(subscription.toJSON());
      if (result.ok) {
        setVisible(false);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !visible || !supported) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[48] sm:left-auto sm:right-6 sm:max-w-sm animate-[slideUp_0.35s_ease-out]">
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-novra-card/95 to-purple-950/90 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Închide"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30">
            <Bell size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Primește oferte NOVRA</p>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              Fii primul care află despre reduceri, lansări și campanii exclusive.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={enable}
            disabled={loading}
            className="flex-1 min-h-10 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? "Se activează..." : "Activează"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-10 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Nu acum
          </button>
        </div>
      </div>
    </div>
  );
}
