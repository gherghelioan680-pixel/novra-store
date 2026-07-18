"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, PackageX } from "lucide-react";
import { getApiHeaders } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth";
import { RETURN_REASONS, RETURN_STATUS_LABELS, type ReturnRequest } from "@/lib/returns-types";

export default function MyReturnsView() {
  const t = useTranslations("returns");
  const tc = useTranslations("common");
  const user = getCurrentUser();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [form, setForm] = useState<{ orderCode: string; reason: string; description: string }>({
    orderCode: "",
    reason: RETURN_REASONS[0],
    description: "",
  });

  useEffect(() => {
    void fetch("/api/store/returns", { headers: getApiHeaders() })
      .then((res) => (res.ok ? res.json() : { returns: [] }))
      .then((data: { returns?: ReturnRequest[] }) => setReturns(data.returns ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/store/returns", {
        method: "POST",
        headers: getApiHeaders(),
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        returnRequest?: ReturnRequest;
      };

      if (!response.ok || !data.success || !data.returnRequest) {
        setMessageOk(false);
        setMessage(data.message ?? tc("error"));
        return;
      }

      setReturns((prev) => [data.returnRequest!, ...prev]);
      setForm({ orderCode: "", reason: RETURN_REASONS[0], description: "" });
      setMessageOk(true);
      setMessage(t("submitSuccess"));
    } catch {
      setMessageOk(false);
      setMessage(tc("networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-white">{t("title")}</h2>
      <p className="mb-6 text-sm text-gray-400">{t("subtitle")}</p>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500">{t("newRequest")}</h3>

        <div>
          <label htmlFor="return-order-code" className="mb-2 block text-sm text-gray-400">
            {t("orderCode")} *
          </label>
          <input
            id="return-order-code"
            required
            value={form.orderCode}
            onChange={(e) => setForm((f) => ({ ...f, orderCode: e.target.value.toUpperCase() }))}
            placeholder={t("orderCodePlaceholder")}
            className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
          />
        </div>

        <div>
          <label htmlFor="return-reason" className="mb-2 block text-sm text-gray-400">
            {t("reason")} *
          </label>
          <select
            id="return-reason"
            required
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
          >
            {RETURN_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="return-description" className="mb-2 block text-sm text-gray-400">
            {t("description")} *
          </label>
          <textarea
            id="return-description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("descriptionPlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !user}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {t("submit")}
        </button>

        {message && (
          <p className={`text-sm ${messageOk ? "text-green-400" : "text-red-400"}`} role="status">
            {message}
          </p>
        )}
      </form>

      <div className="rounded-xl border border-white/10 bg-novra-card/30">
        <h3 className="border-b border-white/10 px-5 py-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
          {t("history")}
        </h3>

        {loading ? (
          <p className="px-5 py-8 text-sm text-gray-500">{tc("loading")}</p>
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <PackageX size={32} className="text-gray-600" />
            <p className="text-sm text-gray-400">{t("empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {returns.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-purple-300">{item.orderCode}</p>
                    <p className="mt-1 text-sm text-gray-300">{item.reason}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {RETURN_STATUS_LABELS[item.status]}
                  </span>
                </div>
                {item.adminNote && (
                  <p className="mt-2 text-xs text-purple-300/80">
                    {t("adminNote")}: {item.adminNote}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString("ro-RO")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
