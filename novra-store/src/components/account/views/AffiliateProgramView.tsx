"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle,
  Clock,
  Link2,
  MousePointerClick,
  RefreshCw,
  ShoppingBag,
  Wallet,
  XCircle,
  Banknote,
  History,
} from "lucide-react";
import type { User } from "@/lib/auth";
import {
  AFFILIATE_REQUIREMENT_KEYS,
  buildAffiliateLink,
  DEFAULT_AFFILIATE_COMMISSION_RATE,
  formatCommissionLabel,
  MIN_AFFILIATE_PAYOUT_AMOUNT,
  type AffiliatePayout,
  type AffiliateRequirements,
} from "@/lib/affiliates-types";
import {
  loadAffiliateDashboard,
  submitAffiliateApplication,
  submitAffiliatePayout,
  type AffiliateDashboardData,
} from "@/lib/affiliates";
import { createStoreRefreshEffect } from "@/lib/store";
import CopyButton from "@/components/CopyButton";

type AffiliateProgramViewProps = {
  user: User;
  onToast: (message: string) => void;
};

const defaultRequirements = (): AffiliateRequirements =>
  AFFILIATE_REQUIREMENT_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: false }),
    {} as AffiliateRequirements
  );

export default function AffiliateProgramView({ user, onToast }: AffiliateProgramViewProps) {
  const t = useTranslations("accountAffiliate");
  const locale = useLocale();
  const [data, setData] = useState<AffiliateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<AffiliateRequirements>(defaultRequirements);
  const [withdrawing, setWithdrawing] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    beneficiaryName: "",
    iban: "",
    cardNumber: "",
    bankName: "",
    amount: "",
    confirmed: false,
  });
  const [payoutMethod, setPayoutMethod] = useState<"iban" | "card">("iban");

  const refresh = async () => {
    const result = await loadAffiliateDashboard();
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["affiliates"] });
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ro" ? "ro-RO" : locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatMoney = (value: number) => `${value.toFixed(2)} RON`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitAffiliateApplication({
      name: user.name || user.email,
      requirements,
    });
    setSubmitting(false);

    if (!result.ok) {
      onToast(result.message);
      return;
    }

    onToast(t("applicationSent"));
    await refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <RefreshCw size={20} className="mr-2 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  const affiliate = data?.affiliate ?? null;
  const application = data?.application ?? null;
  const referrals = data?.referrals ?? [];
  const payouts = data?.payouts ?? [];
  const availableBalance = data?.availableBalance ?? 0;

  const payoutStatusLabel = (status: AffiliatePayout["status"]) => {
    if (status === "paid") return t("statusPaid");
    if (status === "rejected") return t("statusRejected");
    return t("statusPending");
  };

  const payoutStatusClass = (status: AffiliatePayout["status"]) => {
    if (status === "paid") return "bg-emerald-500/15 text-emerald-300";
    if (status === "rejected") return "bg-red-500/15 text-red-300";
    return "bg-amber-500/15 text-amber-300";
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;

    setWithdrawing(true);
    const amount = Number(payoutForm.amount);
    const result = await submitAffiliatePayout({
      beneficiaryName: payoutForm.beneficiaryName,
      iban: payoutMethod === "iban" ? payoutForm.iban : undefined,
      cardNumber: payoutMethod === "card" ? payoutForm.cardNumber : undefined,
      bankName: payoutForm.bankName || undefined,
      amount,
      confirmed: payoutForm.confirmed,
    });
    setWithdrawing(false);

    if (!result.ok) {
      onToast(result.message);
      return;
    }

    onToast(t("withdrawalSent"));
    setPayoutForm({
      beneficiaryName: "",
      iban: "",
      cardNumber: "",
      bankName: "",
      amount: "",
      confirmed: false,
    });
    await refresh();
  };

  if (affiliate) {
    const affiliateLink = buildAffiliateLink(affiliate.code);
    const conversionRate =
      affiliate.totalClicks > 0
        ? ((affiliate.totalOrders / affiliate.totalClicks) * 100).toFixed(1)
        : "0.0";

    return (
      <div className="space-y-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
            <Link2 size={12} />
            {t("program")}
          </div>
          <h2 className="text-2xl font-bold text-white">{t("dashboardTitle")}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {t("dashboardDesc", { commission: formatCommissionLabel(affiliate) })}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-600/5 p-5">
          <p className="text-xs uppercase tracking-widest text-purple-300">{t("yourLink")}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-purple-200">
              {affiliateLink}
            </code>
            <CopyButton text={affiliateLink} label={t("copyLink")} className="shrink-0 px-4 py-2" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t("codeAttribution", { code: affiliate.code })}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("clicks"), value: affiliate.totalClicks, icon: MousePointerClick },
            { label: t("orders"), value: affiliate.totalOrders, icon: ShoppingBag },
            { label: t("conversionRate"), value: `${conversionRate}%`, icon: CheckCircle },
            { label: t("totalCommission"), value: formatMoney(affiliate.totalCommission), icon: Wallet },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-novra-card/40 p-4"
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <Icon size={16} />
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs uppercase tracking-widest text-amber-300">{t("pendingCommission")}</p>
            <p className="mt-2 text-2xl font-bold text-amber-200">
              {formatMoney(affiliate.pendingCommission)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t("availableWithdrawal", { amount: formatMoney(availableBalance) })}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-300">{t("paidCommission")}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-200">
              {formatMoney(affiliate.paidCommission)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Banknote size={18} className="text-purple-300" />
            <h3 className="text-lg font-semibold text-white">{t("withdrawTitle")}</h3>
          </div>
          {availableBalance < MIN_AFFILIATE_PAYOUT_AMOUNT ? (
            <p className="text-sm text-gray-400">
              {t("minWithdrawal", {
                min: MIN_AFFILIATE_PAYOUT_AMOUNT,
                balance: formatMoney(availableBalance),
              })}
            </p>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">{t("beneficiaryName")}</label>
                  <input
                    type="text"
                    required
                    value={payoutForm.beneficiaryName}
                    onChange={(e) =>
                      setPayoutForm((p) => ({ ...p, beneficiaryName: e.target.value }))
                    }
                    placeholder={t("beneficiaryPlaceholder")}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">{t("bankOptional")}</label>
                  <input
                    type="text"
                    value={payoutForm.bankName}
                    onChange={(e) => setPayoutForm((p) => ({ ...p, bankName: e.target.value }))}
                    placeholder={t("bankPlaceholder")}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod("iban")}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    payoutMethod === "iban"
                      ? "bg-purple-600/30 text-purple-200"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  {t("ibanRecommended")}
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod("card")}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    payoutMethod === "card"
                      ? "bg-purple-600/30 text-purple-200"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  {t("bankCard")}
                </button>
              </div>

              {payoutMethod === "iban" ? (
                <div>
                  <label className="mb-1 block text-xs text-gray-400">{t("iban")}</label>
                  <input
                    type="text"
                    required
                    value={payoutForm.iban}
                    onChange={(e) => setPayoutForm((p) => ({ ...p, iban: e.target.value.toUpperCase() }))}
                    placeholder="RO49AAAA1B31007593840000"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 font-mono text-sm text-white placeholder:text-gray-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs text-gray-400">{t("cardNumber")}</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={payoutForm.cardNumber}
                    onChange={(e) =>
                      setPayoutForm((p) => ({ ...p, cardNumber: e.target.value.replace(/\D/g, "") }))
                    }
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 font-mono text-sm text-white placeholder:text-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  {t("withdrawAmount", { max: formatMoney(availableBalance) })}
                </label>
                <input
                  type="number"
                  required
                  min={MIN_AFFILIATE_PAYOUT_AMOUNT}
                  max={availableBalance}
                  step={0.01}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder={t("minAmount", { min: MIN_AFFILIATE_PAYOUT_AMOUNT })}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="checkbox"
                  checked={payoutForm.confirmed}
                  onChange={(e) =>
                    setPayoutForm((p) => ({ ...p, confirmed: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">{t("confirmPayment")}</span>
              </label>

              <button
                type="submit"
                disabled={withdrawing || !payoutForm.confirmed}
                className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
              >
                {withdrawing ? t("submitting") : t("submitWithdrawal")}
              </button>
            </form>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">{t("withdrawalHistory")}</h3>
          </div>
          {payouts.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center text-sm text-gray-400">
              {t("noWithdrawals")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">{t("amount")}</th>
                    <th className="px-4 py-3">{t("beneficiary")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium text-white">{formatMoney(payout.amount)}</td>
                      <td className="px-4 py-3 text-gray-400">{payout.beneficiaryName}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${payoutStatusClass(payout.status)}`}>
                          {payoutStatusLabel(payout.status)}
                        </span>
                        {payout.status === "rejected" && payout.adminNote && (
                          <p className="mt-1 text-xs text-red-400/80">{payout.adminNote}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(payout.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">{t("attributedOrders")}</h3>
          {referrals.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-novra-card/30 px-4 py-8 text-center text-sm text-gray-400">
              {t("noAttributedOrders")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-3">{t("order")}</th>
                    <th className="px-4 py-3">{t("total")}</th>
                    <th className="px-4 py-3">{t("commission")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="px-4 py-3">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-purple-200">
                        {ref.orderPurchaseCode ?? ref.orderId}
                      </td>
                      <td className="px-4 py-3">{formatMoney(ref.orderTotal)}</td>
                      <td className="px-4 py-3 text-emerald-300">{formatMoney(ref.commission)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            ref.status === "paid"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {ref.status === "paid" ? t("statusPaid") : t("statusPending")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(ref.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (application?.status === "pending") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t("program")}</h2>
          <p className="mt-1 text-sm text-gray-400">{t("evaluating")}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
          <Clock size={40} className="mx-auto text-amber-300" />
          <h3 className="mt-4 text-lg font-semibold text-white">{t("pendingTitle")}</h3>
          <p className="mt-2 text-sm text-gray-400">
            {t("pendingDesc", { date: formatDate(application.createdAt) })}
          </p>
        </div>
      </div>
    );
  }

  if (application?.status === "rejected") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{t("program")}</h2>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <XCircle size={40} className="mx-auto text-red-300" />
          <h3 className="mt-4 text-lg font-semibold text-white">{t("rejectedTitle")}</h3>
          <p className="mt-2 text-sm text-gray-400">
            {application.adminNote || t("rejectedDefault")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300">
          <Link2 size={12} />
          {t("program")}
        </div>
        <h2 className="text-2xl font-bold text-white">{t("becomeAffiliate")}</h2>
        <p className="text-sm text-gray-400">
          {t("earnCommission", { rate: DEFAULT_AFFILIATE_COMMISSION_RATE })}{" "}
          <a href="/termeni-program-afiliere" className="text-purple-400 hover:underline">
            {t("programTerms")}
          </a>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="font-semibold text-white">{t("howItWorks")}</h3>
        <ol className="mt-3 space-y-2 text-sm text-gray-400">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-novra-card/30 p-5">
        <h3 className="font-semibold text-white">{t("eligibilityTitle")}</h3>
        <p className="text-sm text-gray-400">{t("eligibilityDesc")}</p>

        <div className="space-y-3">
          {AFFILIATE_REQUIREMENT_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-purple-500/30"
            >
              <input
                type="checkbox"
                checked={requirements[key]}
                onChange={(e) =>
                  setRequirements((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">{t(`requirement_${key}`)}</span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submitApplication")}
        </button>
      </form>
    </div>
  );
}
