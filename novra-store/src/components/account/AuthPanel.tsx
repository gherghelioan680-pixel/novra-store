"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { loginUser, registerUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import AccountLogo from "./AccountLogo";
import { accountMobileBottomPaddingClass } from "./AccountMobileBottomNav";

type AuthPanelProps = {
  onAuthSuccess: (user: User, message: string) => void;
};

export default function AuthPanel({ onAuthSuccess }: AuthPanelProps) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMessageIsSuccess(false);
    setIsSubmitting(true);

    try {
      if (mode === "forgot-password") {
        try {
          const response = await fetch("/api/store/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "forgot-password", email }),
          });
          const data = (await response.json()) as { success?: boolean; message?: string };

          if (!response.ok || !data.success) {
            setMessage(data.message ?? t("emailNotFound"));
            return;
          }

          setMessageIsSuccess(true);
          setMessage(data.message ?? t("resetSent", { email }));
        } catch {
          setMessage(tc("networkError"));
        }
        return;
      }

      if (mode === "register") {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setMessage(t("fillAllFields"));
          return;
        }

        const result = await registerUser(name, email, password);
        if (result.success && result.user) {
          const successMessage = t("registerSuccess");
          setMessage(successMessage);
          setMessageIsSuccess(true);
          onAuthSuccess(result.user, successMessage);
        } else {
          setMessage(tc("error"));
        }
        return;
      }

      if (!email.trim() || !password.trim()) {
        setMessage(t("fillEmailPassword"));
        return;
      }

      const result = await loginUser(email, password);
      if (result.success && result.user) {
        const successMessage = t("loginSuccess");
        setMessage(successMessage);
        setMessageIsSuccess(true);
        onAuthSuccess(result.user, successMessage);
      } else {
        setMessage(t("invalidCredentials"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (next: "login" | "register" | "forgot-password") => {
    setMode(next);
    setMessage("");
    setMessageIsSuccess(false);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto bg-novra-bg text-white md:min-h-screen ${accountMobileBottomPaddingClass("1.5rem")}`}
    >
      <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12 sm:min-h-screen sm:px-6">
        <div className="mb-8 flex justify-center">
          <AccountLogo />
        </div>

        <div className="rounded-3xl border border-white/10 bg-novra-card/40 p-6 shadow-2xl shadow-purple-900/20 sm:p-8">
          <div className="mb-6 flex rounded-xl border border-white/10 bg-novra-bg/40 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 min-h-11 rounded-lg py-2.5 text-sm font-semibold transition touch-manipulation ${
                mode === "login" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white active:text-white"
              }`}
            >
              {t("login")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 min-h-11 rounded-lg py-2.5 text-sm font-semibold transition touch-manipulation ${
                mode === "register" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white active:text-white"
              }`}
            >
              {t("register")}
            </button>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login"
                ? t("welcomeBack")
                : mode === "register"
                  ? t("createAccountTitle")
                  : t("resetPasswordTitle")}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {mode === "login"
                ? t("loginSubtitle")
                : mode === "register"
                  ? t("registerSubtitle")
                  : t("resetSubtitle")}
            </p>
          </div>

          <form action="#" method="post" onSubmit={handleAuth} className="space-y-4" noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="mb-2 block text-sm text-gray-400">
                  {t("name")}
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  enterKeyHint="next"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50 touch-manipulation"
                  placeholder={t("namePlaceholder")}
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm text-gray-400">
                {t("email")}
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                enterKeyHint={mode === "forgot-password" ? "go" : "next"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50 touch-manipulation"
                  placeholder={t("emailPlaceholder")}
              />
            </div>

            {mode !== "forgot-password" && (
              <div>
                <label htmlFor="auth-password" className="mb-2 block text-sm text-gray-400">
                  {t("password")}
                </label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  enterKeyHint="go"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-purple-500/50 touch-manipulation"
                  placeholder={t("passwordPlaceholder")}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-11 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 touch-manipulation cursor-pointer"
            >
              {isSubmitting
                ? t("processing")
                : mode === "login"
                  ? t("loginButton")
                  : mode === "register"
                    ? t("createAccount")
                    : t("sendLink")}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="min-h-11 text-left text-purple-400 hover:text-purple-300 active:text-purple-200 touch-manipulation py-1"
                >
                  {t("noAccountCreate")}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("forgot-password")}
                  className="min-h-11 text-left text-gray-400 hover:text-white active:text-white touch-manipulation py-1"
                >
                  {t("forgotPassword")}
                </button>
              </>
            )}
            {mode === "register" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="min-h-11 text-left text-purple-400 hover:text-purple-300 active:text-purple-200 touch-manipulation py-1"
              >
                {t("hasAccountLogin")}
              </button>
            )}
            {mode === "forgot-password" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="min-h-11 text-left text-purple-400 hover:text-purple-300 active:text-purple-200 touch-manipulation py-1"
              >
                {t("backToLogin")}
              </button>
            )}
          </div>

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
