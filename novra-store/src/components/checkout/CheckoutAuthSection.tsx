"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { getCurrentUser, loginUser, registerUser, type User } from "@/lib/auth";

export type CheckoutAuthMode = "login" | "register" | "guest";

type CheckoutAuthSectionProps = {
  mode: CheckoutAuthMode;
  onModeChange: (mode: CheckoutAuthMode) => void;
  onAuthSuccess: (user: User) => void;
};

export default function CheckoutAuthSection({
  mode,
  onModeChange,
  onAuthSuccess,
}: CheckoutAuthSectionProps) {
  const currentUser = getCurrentUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentUser) {
    return (
      <div className="mb-8 rounded-2xl border border-purple-500/20 bg-purple-600/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <UserRound size={20} className="text-purple-300 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Autentificat ca {currentUser.name}</p>
            <p className="text-xs text-gray-400">{currentUser.email}</p>
          </div>
        </div>
      </div>
    );
  }

  const switchMode = (next: CheckoutAuthMode) => {
    onModeChange(next);
    setMessage("");
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const result = await registerUser(name, email, password);
        setMessage(result.message);
        if (result.success && result.user) {
          onAuthSuccess(result.user);
        }
        return;
      }

      const result = await loginUser(email, password);
      setMessage(result.message);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
      <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">Cont</p>

      <div className="mb-5 flex rounded-xl border border-white/10 bg-novra-bg/40 p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 min-h-11 rounded-lg py-2.5 text-sm font-semibold transition touch-manipulation ${
            mode === "login" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 min-h-11 rounded-lg py-2.5 text-sm font-semibold transition touch-manipulation ${
            mode === "register" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => switchMode("guest")}
          className={`flex-1 min-h-11 rounded-lg py-2.5 text-sm font-semibold transition touch-manipulation ${
            mode === "guest" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          Continuă fără cont
        </button>
      </div>

      {mode === "guest" ? (
        <p className="text-sm text-gray-400 leading-relaxed">
          Plasează comanda cu datele de livrare — fără parolă. Poți crea un cont după finalizare, din pagina de confirmare.
        </p>
      ) : (
        <>
          <div className="mb-4 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-white">
              {mode === "login" ? "Bine ai revenit" : "Creează cont"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {mode === "login"
                ? "Intră în contul tău NOVRA"
                : "Înregistrează-te și primești 50 NovraCredits"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4" noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="checkout-auth-name" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                  Nume
                </label>
                <input
                  id="checkout-auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none transition focus:border-purple-500/50"
                  placeholder="Numele tău"
                />
              </div>
            )}

            <div>
              <label htmlFor="checkout-auth-email" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Email
              </label>
              <input
                id="checkout-auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none transition focus:border-purple-500/50"
                placeholder="exemplu@email.com"
              />
            </div>

            <div>
              <label htmlFor="checkout-auth-password" className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Parolă
              </label>
              <input
                id="checkout-auth-password"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none transition focus:border-purple-500/50"
                placeholder="Parola ta"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-11 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmitting
                ? "Se procesează..."
                : mode === "login"
                  ? "Autentifică-te"
                  : "Creează cont"}
            </button>
          </form>

          <div className="mt-3 flex flex-col gap-1 text-sm">
            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="min-h-11 text-left text-purple-400 hover:text-purple-300 touch-manipulation py-1"
              >
                Nu ai cont? Creează-l
              </button>
            )}
            {mode === "register" && (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="min-h-11 text-left text-purple-400 hover:text-purple-300 touch-manipulation py-1"
              >
                Ai deja cont? Intră în cont
              </button>
            )}
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${
                message.includes("reușit") || message.includes("succes") ? "text-green-400" : "text-purple-300"
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
