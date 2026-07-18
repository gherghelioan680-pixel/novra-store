"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AccountLogo from "./AccountLogo";

function ResetPasswordForm() {
  const t = useTranslations("account");
  const tm = useTranslations("accountManage");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage(t("resetMissingToken"));
      setMessageIsSuccess(false);
    }
  }, [token, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMessageIsSuccess(false);

    if (!token) {
      setMessage(t("resetMissingToken"));
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMessage(t("fillAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(tm("passwordsMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/store/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          token,
          newPassword,
        }),
      });
      const data = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !data.success) {
        setMessage(data.message ?? t("resetInvalidLink"));
        return;
      }

      setMessageIsSuccess(true);
      setMessage(data.message ?? t("resetPasswordSuccess"));
      setTimeout(() => {
        router.push("/contul-meu");
      }, 2000);
    } catch {
      setMessage(tc("networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 flex justify-center">
          <AccountLogo />
        </div>

        <div className="rounded-3xl border border-white/10 bg-novra-card/40 p-6 shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t("resetPasswordTitle")}</h1>
            <p className="mt-2 text-sm text-gray-400">
              {messageIsSuccess ? t("resetRedirectLogin") : t("resetPageSubtitle")}
            </p>
          </div>

          {!messageIsSuccess && token && (
            <form action="#" method="post" onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reset-new-password" className="mb-2 block text-sm text-gray-400">
                  {tm("newPassword")}
                </label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  enterKeyHint="next"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50 touch-manipulation"
                  placeholder={t("passwordPlaceholder")}
                />
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="mb-2 block text-sm text-gray-400">
                  {tm("confirmPassword")}
                </label>
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  enterKeyHint="go"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50 touch-manipulation"
                  placeholder={t("passwordPlaceholder")}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 touch-manipulation cursor-pointer"
              >
                {isSubmitting ? t("processing") : t("resetPasswordButton")}
              </button>
            </form>
          )}

          {!messageIsSuccess && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => router.push("/contul-meu")}
                className="min-h-11 text-left text-sm text-purple-400 hover:text-purple-300 active:text-purple-200 touch-manipulation py-1"
              >
                {t("backToLogin")}
              </button>
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm ${messageIsSuccess ? "text-green-400" : "text-purple-300"}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPanel() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-novra-bg" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
