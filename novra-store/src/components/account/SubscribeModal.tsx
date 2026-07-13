"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { X, Mail, Send } from "lucide-react";
import { subscribeUserToNewsletter } from "@/lib/auth";

type SubscribeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  onSuccess?: (message: string) => void;
};

export default function SubscribeModal({ isOpen, onClose, defaultEmail = "", onSuccess }: SubscribeModalProps) {
  const t = useTranslations("subscribeModal");
  const [email, setEmail] = useState(defaultEmail);
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!agreed) {
      setMessage(t("mustAgree"));
      return;
    }

    const result = await subscribeUserToNewsletter(email);
    setMessage(result.message);

    if (result.success) {
      onSuccess?.(result.message);
      setTimeout(() => {
        onClose();
        setMessage("");
        setAgreed(false);
      }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-novra-card p-6 shadow-2xl shadow-purple-900/30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
              aria-label={t("closeAria")}
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-semibold text-white">{t("title")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{t("description")}</p>

            <div className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/60 py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <button
                type="button"
                onClick={handleSubscribe}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                aria-label={t("subscribeAria")}
              >
                <Send size={18} />
              </button>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs text-gray-400">
              <button
                type="button"
                onClick={() => setAgreed((v) => !v)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                  agreed ? "border-blue-500 bg-blue-600" : "border-white/30 bg-transparent"
                }`}
                aria-pressed={agreed}
              >
                {agreed && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </button>
              <span>
                {t("agreePrefix")}{" "}
                <Link href="/termeni-si-conditii" className="text-blue-400 hover:underline" onClick={onClose}>
                  {t("termsLink")}
                </Link>{" "}
                {t("and")}{" "}
                <Link href="/politica-confidentialitate" className="text-blue-400 hover:underline" onClick={onClose}>
                  {t("privacyLink")}
                </Link>
                .
              </span>
            </label>

            {message && <p className="mt-3 text-sm text-purple-300">{message}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
