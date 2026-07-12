"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createAccountFromGuestOrder } from "@/lib/auth";
import type { Order } from "@/lib/orders";

type GuestAccountPromptProps = {
  order: Order;
  onAccountCreated?: () => void;
};

export default function GuestAccountPrompt({ order, onAccountCreated }: GuestAccountPromptProps) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await createAccountFromGuestOrder(order.id, password);
      setMessage(result.message);

      if (result.success) {
        setCompleted(true);
        onAccountCreated?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-8 text-left">
        <p className="text-sm text-emerald-300">{message}</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-novra-card/30 px-6 py-8 text-left">
      <p className="text-center text-lg font-medium tracking-tight text-white">
        Salvează aceste detalii pentru viitoarele comenzi?
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        Creează un cont rapid cu emailul <span className="text-purple-300">{order.userEmail}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 mx-auto max-w-sm space-y-4" noValidate>
        <div>
          <label htmlFor="guest-account-password" className="sr-only">
            Parolă
          </label>
          <input
            id="guest-account-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Alege o parolă"
            className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none transition focus:border-purple-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !password.trim()}
          className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Crează un cont cu o singură parolă
        </button>
      </form>

      {message && !completed && (
        <p className="mt-4 text-center text-sm text-red-300" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
