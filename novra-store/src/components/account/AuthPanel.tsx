"use client";

import { useState } from "react";
import { getStoredUsers, loginUser, registerUser } from "@/lib/auth";
import type { User } from "@/lib/auth";
import AccountLogo from "./AccountLogo";

type AuthPanelProps = {
  onAuthSuccess: (user: User, message: string) => void;
};

export default function AuthPanel({ onAuthSuccess }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "forgot-password") {
        const users = getStoredUsers();
        const userExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

        if (!userExists) {
          setMessage("Nu am găsit niciun cont cu acest email.");
          return;
        }

        setMessage(`Un link de resetare a parolei a fost trimis la ${email}. Verifică-ți inbox-ul și junk folder.`);
        setTimeout(() => {
          setMode("login");
          setEmail("");
          setMessage("");
        }, 3000);
        return;
      }

      if (mode === "register") {
        const result = registerUser(name, email, password);
        setMessage(result.message);
        if (result.success && result.user) {
          onAuthSuccess(result.user, result.message);
        }
        return;
      }

      const result = loginUser(email, password);
      setMessage(result.message);
      if (result.success && result.user) {
        onAuthSuccess(result.user, result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (next: "login" | "register" | "forgot-password") => {
    setMode(next);
    setMessage("");
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <div className="min-h-screen bg-novra-bg text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
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
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex-1 min-h-11 rounded-lg py-2.5 text-sm font-semibold transition touch-manipulation ${
                mode === "register" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white active:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Bine ai revenit" : mode === "register" ? "Creează cont" : "Resetare parolă"}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {mode === "login"
                ? "Intră în contul tău NOVRA"
                : mode === "register"
                  ? "Înregistrează-te și primești 50 NovraCredits"
                  : "Introdu emailul pentru resetare"}
            </p>
          </div>

          <form action="#" method="post" onSubmit={handleAuth} className="space-y-4" noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="mb-2 block text-sm text-gray-400">
                  Nume
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
                  placeholder="Numele tău"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-2 block text-sm text-gray-400">
                Email
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
                placeholder="exemplu@email.com"
              />
            </div>

            {mode !== "forgot-password" && (
              <div>
                <label htmlFor="auth-password" className="mb-2 block text-sm text-gray-400">
                  Parolă
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
                  placeholder="Parola ta"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-11 rounded-xl bg-purple-600 py-3 text-sm font-semibold transition hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 touch-manipulation cursor-pointer"
            >
              {isSubmitting
                ? "Se procesează..."
                : mode === "login"
                  ? "Autentifică-te"
                  : mode === "register"
                    ? "Creează cont"
                    : "Trimite link"}
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
                  Nu ai cont? Creează-l
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("forgot-password")}
                  className="min-h-11 text-left text-gray-400 hover:text-white active:text-white touch-manipulation py-1"
                >
                  Ai uitat parola?
                </button>
              </>
            )}
            {mode === "register" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="min-h-11 text-left text-purple-400 hover:text-purple-300 active:text-purple-200 touch-manipulation py-1"
              >
                Ai deja cont? Intră în cont
              </button>
            )}
            {mode === "forgot-password" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="min-h-11 text-left text-purple-400 hover:text-purple-300 active:text-purple-200 touch-manipulation py-1"
              >
                Înapoi la autentificare
              </button>
            )}
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${message.includes("reușit") || message.includes("succes") ? "text-green-400" : "text-purple-300"}`}
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
