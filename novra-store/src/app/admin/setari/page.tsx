"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, KeyRound, Rocket, CreditCard, Mail, Tag, CheckCircle2, XCircle, Shield, UserPlus } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CountdownPreview from "@/components/CountdownPreview";
import {
  dateToIsoWithOffset,
  isoToDatetimeLocal,
  parseDatetimeLocal,
} from "@/lib/datetime";
import { requireAdmin, changePassword, createAdminUser, loadAdminUsers, type SafeUser } from "@/lib/auth";
import {
  getSiteSettings,
  loadSiteSettings,
  saveSiteSettings,
  DEFAULT_MARKETING_TICKER_MESSAGES,
  DEFAULT_COMING_SOON,
  DEFAULT_LIMITED_OFFER,
  type SiteSettings,
} from "@/lib/site-settings";
import { subscribeToStoreUpdates } from "@/lib/store";
import { getApiHeaders } from "@/lib/api-client";

type IntegrationStatus = {
  stripe: { configured: boolean; enabled: boolean; available: boolean };
  email: { configured: boolean; enabled: boolean };
  newsletterDiscountPercent: number;
};

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  );
}

export default function AdminSetariPage() {
  const admin = requireAdmin();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings());
  const [tickerText, setTickerText] = useState(
    DEFAULT_MARKETING_TICKER_MESSAGES.join("\n")
  );
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdownInput, setCountdownInput] = useState(() =>
    isoToDatetimeLocal(
      getSiteSettings().comingSoon.countdownDate ?? getSiteSettings().campaignEndDate
    )
  );
  const [campaignEndInput, setCampaignEndInput] = useState(() =>
    isoToDatetimeLocal(getSiteSettings().campaignEndDate)
  );
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);
  const [adminUsers, setAdminUsers] = useState<SafeUser[]>([]);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const isDirtyRef = useRef(false);

  const markDirty = () => {
    isDirtyRef.current = true;
  };

  const applySettings = (current: SiteSettings, resetDirty = false) => {
    setSettings(current);
    setTickerText(current.marketingTickerMessages.join("\n"));
    setCountdownInput(
      isoToDatetimeLocal(current.comingSoon.countdownDate ?? current.campaignEndDate)
    );
    setCampaignEndInput(isoToDatetimeLocal(current.campaignEndDate));
    if (resetDirty) {
      isDirtyRef.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    void loadSiteSettings().then((current) => {
      if (cancelled) return;
      applySettings(current, true);
    });
    void fetch("/api/store/admin/integrations", { headers: getApiHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: IntegrationStatus | null) => {
        if (!cancelled && data) setIntegrations(data);
      })
      .catch(() => {});
    void loadAdminUsers().then((admins) => {
      if (!cancelled) setAdminUsers(admins);
    });
    const unsubscribe = subscribeToStoreUpdates(() => {
      if (isDirtyRef.current) return;
      void loadSiteSettings().then((current) => {
        if (cancelled || isDirtyRef.current) return;
        applySettings(current);
      });
    }, { scope: "settings" });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleSaveSettings = async (successMessage?: string) => {
    const messages = tickerText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedCountdown = parseDatetimeLocal(countdownInput);
    const parsedCampaignEnd = parseDatetimeLocal(campaignEndInput);

    const result = await saveSiteSettings({
      ...settings,
      campaignDiscountText: settings.limitedOffer.subtitle
        ? `${settings.limitedOffer.title} — ${settings.limitedOffer.subtitle}`
        : settings.limitedOffer.title,
      comingSoon: {
        ...settings.comingSoon,
        ...(parsedCountdown
          ? { countdownDate: dateToIsoWithOffset(parsedCountdown) }
          : {}),
      },
      ...(parsedCampaignEnd ? { campaignEndDate: dateToIsoWithOffset(parsedCampaignEnd) } : {}),
      marketingTickerMessages: messages.length ? messages : DEFAULT_MARKETING_TICKER_MESSAGES,
    });

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    applySettings(result.settings, true);
    void fetch("/api/store/admin/integrations", { headers: getApiHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: IntegrationStatus | null) => {
        if (data) setIntegrations(data);
      })
      .catch(() => {});
    router.refresh();
    showMessage(
      successMessage ??
        "Setările au fost salvate. Modificările sunt active imediat pe site."
    );
  };

  const previewCountdownDate = (() => {
    const parsed = parseDatetimeLocal(countdownInput);
    if (parsed) return dateToIsoWithOffset(parsed);
    return settings.comingSoon.countdownDate;
  })();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage("Parolele noi nu coincid.");
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (!result.success) {
      showMessage(result.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showMessage("Parola admin a fost schimbată cu succes.");
  };

  const handleCreateAdmin = async () => {
    setCreatingAdmin(true);
    const result = await createAdminUser(newAdminName, newAdminEmail, newAdminPassword);
    setCreatingAdmin(false);

    if (!result.success) {
      showMessage(result.message);
      return;
    }

    setNewAdminName("");
    setNewAdminEmail("");
    setNewAdminPassword("");
    const admins = await loadAdminUsers();
    setAdminUsers(admins);
    showMessage(result.message);
  };

  return (
    <div>
      <AdminHeader user={admin} title="Setări" subtitle="Configurează site-ul NOVRA" />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <section
        id="administratori"
        className="mb-6 scroll-mt-24 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-600/10 to-novra-card/40 p-5 sm:p-6"
      >
        <h2 className="mb-2 flex items-center gap-2 text-xl font-semibold text-white">
          <Shield size={22} className="text-purple-400" />
          Administratori
        </h2>
        <p className="mb-5 text-sm text-gray-300">
          Fiecare administrator se autentifică separat de pe telefon sau calculator la{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-purple-300">/admin/login</code>{" "}
          cu emailul și parola proprie.
        </p>

        {adminUsers.length > 0 && (
          <div className="mb-6 overflow-x-auto rounded-xl border border-white/10 bg-novra-bg/30">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-500">
                  <th className="px-4 py-3 font-medium">Nume</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((adminUser) => (
                  <tr key={adminUser.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-white">{adminUser.name}</td>
                    <td className="px-4 py-3 text-gray-400">{adminUser.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <UserPlus size={16} className="text-purple-400" />
          Adaugă administrator
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Nume complet"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none focus:border-purple-500/50"
          />
          <input
            type="email"
            placeholder="Email"
            autoComplete="off"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none focus:border-purple-500/50"
          />
          <input
            type="password"
            placeholder="Parolă (min. 6 caractere)"
            autoComplete="new-password"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-base sm:text-sm outline-none focus:border-purple-500/50"
          />
        </div>
        <button
          type="button"
          onClick={handleCreateAdmin}
          disabled={creatingAdmin}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          <UserPlus size={16} />
          {creatingAdmin ? "Se creează..." : "Adaugă administrator"}
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Rocket size={20} className="text-purple-400" />
            Coming Soon
          </h2>
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Ca admin ești conectat, deci vei vedea site-ul complet cu un banner galben. Vizitatorii
              neautentificați vor vedea pagina Coming Soon. Testează în fereastră incognito sau deschide{" "}
              <a href="/" target="_blank" rel="noreferrer" className="text-purple-300 hover:text-white underline">
                homepage în tab nou
              </a>{" "}
              fără sesiune admin.
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.comingSoon.enabled}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    comingSoon: { ...prev.comingSoon, enabled: e.target.checked },
                  }));
                }}
                className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-600 focus:ring-purple-500/50"
              />
              <span className="text-sm text-gray-300">Coming Soon activ (vizitatorii văd pagina de așteptare)</span>
            </label>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Titlu principal
              </label>
              <input
                type="text"
                value={settings.comingSoon.headline ?? DEFAULT_COMING_SOON.headline ?? ""}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    comingSoon: { ...prev.comingSoon, headline: e.target.value },
                  }));
                }}
                placeholder={DEFAULT_COMING_SOON.headline}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Subtitlu
              </label>
              <textarea
                rows={2}
                value={settings.comingSoon.subtitle ?? DEFAULT_COMING_SOON.subtitle ?? ""}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    comingSoon: { ...prev.comingSoon, subtitle: e.target.value },
                  }));
                }}
                placeholder={DEFAULT_COMING_SOON.subtitle}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Data și ora lansării
              </label>
              <input
                type="datetime-local"
                value={countdownInput}
                onChange={(e) => {
                  const value = e.target.value;
                  markDirty();
                  setCountdownInput(value);
                  const date = parseDatetimeLocal(value);
                  if (date) {
                    setSettings((prev) => ({
                      ...prev,
                      comingSoon: {
                        ...prev.comingSoon,
                        countdownDate: dateToIsoWithOffset(date),
                      },
                    }));
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <CountdownPreview countdownDate={previewCountdownDate} />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.comingSoon.showNewsletter !== false}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    comingSoon: { ...prev.comingSoon, showNewsletter: e.target.checked },
                  }));
                }}
                className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-600 focus:ring-purple-500/50"
              />
              <span className="text-sm text-gray-300">Afișează formular newsletter</span>
            </label>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-gray-400 leading-relaxed space-y-2">
              <p className="font-semibold text-purple-200">Flux reducere 10% prima comandă (Coming Soon)</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Vizitatorul introduce emailul pe pagina Coming Soon (sau homepage).</li>
                <li>Se salvează în Redis/newsletter și se generează cod <code className="text-purple-300">NOVRA10-XXXX</code> cu procentul din „Coduri reducere newsletter”.</li>
                <li>Dacă <code className="text-purple-300">RESEND_API_KEY</code> este configurat, codul se trimite automat pe email.</li>
                <li>La prima comandă, clientul aplică codul la checkout — validare single-use per email.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveSettings(
                  "Setările Coming Soon au fost salvate. Countdown-ul este actualizat pe site."
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Save size={16} />
              Salvează Coming Soon
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Campanie / Ofertă limitată</h2>
          <p className="mb-4 text-sm text-gray-400">
            Conținutul bannerului „Ofertă limitată” de pe site. Modificările apar imediat în CountdownBanner.
          </p>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.campaignActive}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({ ...prev, campaignActive: e.target.checked }));
                }}
                className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-600 focus:ring-purple-500/50"
              />
              <span className="text-sm text-gray-300">Campanie activă (CountdownBanner vizibil)</span>
            </label>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Data expirare countdown
              </label>
              <input
                type="datetime-local"
                value={campaignEndInput}
                onChange={(e) => {
                  const value = e.target.value;
                  markDirty();
                  setCampaignEndInput(value);
                  const date = parseDatetimeLocal(value);
                  if (date) {
                    setSettings((prev) => ({
                      ...prev,
                      campaignEndDate: dateToIsoWithOffset(date),
                    }));
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
              <div className="mt-3">
                <CountdownPreview countdownDate={settings.campaignEndDate} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Etichetă badge
              </label>
              <input
                type="text"
                value={settings.limitedOffer.badgeLabel}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    limitedOffer: { ...prev.limitedOffer, badgeLabel: e.target.value },
                  }));
                }}
                placeholder={DEFAULT_LIMITED_OFFER.badgeLabel}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Titlu promoție
              </label>
              <input
                type="text"
                value={settings.limitedOffer.title}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    limitedOffer: { ...prev.limitedOffer, title: e.target.value },
                  }));
                }}
                placeholder={DEFAULT_LIMITED_OFFER.title}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Subtitlu / descriere
              </label>
              <input
                type="text"
                value={settings.limitedOffer.subtitle}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    limitedOffer: { ...prev.limitedOffer, subtitle: e.target.value },
                  }));
                }}
                placeholder={DEFAULT_LIMITED_OFFER.subtitle}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Etichetă countdown
              </label>
              <input
                type="text"
                value={settings.limitedOffer.countdownLabel}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    limitedOffer: { ...prev.limitedOffer, countdownLabel: e.target.value },
                  }));
                }}
                placeholder={DEFAULT_LIMITED_OFFER.countdownLabel}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                  Text buton CTA
                </label>
                <input
                  type="text"
                  value={settings.limitedOffer.ctaText}
                  onChange={(e) => {
                    markDirty();
                    setSettings((prev) => ({
                      ...prev,
                      limitedOffer: { ...prev.limitedOffer, ctaText: e.target.value },
                    }));
                  }}
                  placeholder={DEFAULT_LIMITED_OFFER.ctaText}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                  Link CTA
                </label>
                <input
                  type="text"
                  value={settings.limitedOffer.ctaHref}
                  onChange={(e) => {
                    markDirty();
                    setSettings((prev) => ({
                      ...prev,
                      limitedOffer: { ...prev.limitedOffer, ctaHref: e.target.value },
                    }));
                  }}
                  placeholder={DEFAULT_LIMITED_OFFER.ctaHref}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSaveSettings("Oferta limitată a fost salvată. Bannerul este actualizat pe site.")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Save size={16} />
              Salvează oferta limitată
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Contact & livrare</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Număr WhatsApp (fără +)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    whatsappNumber: e.target.value.replace(/\D/g, ""),
                  }));
                }}
                placeholder="40743033323"
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Prag livrare gratuită (RON)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.freeShippingThreshold}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    freeShippingThreshold: Number(e.target.value),
                  }));
                }}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Cost livrare standard (RON)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.deliveryCost}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({ ...prev, deliveryCost: Number(e.target.value) }));
                }}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Mesaje MarketingTicker (câte unul pe linie)
              </label>
              <textarea
                rows={5}
                value={tickerText}
                onChange={(e) => {
                  markDirty();
                  setTickerText(e.target.value);
                }}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSaveSettings()}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Save size={16} />
              Salvează setările
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <CreditCard size={20} className="text-purple-400" />
            Plată cu cardul (Stripe)
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                ok={integrations?.stripe.configured ?? false}
                label={
                  integrations?.stripe.configured
                    ? "Chei Stripe configurate"
                    : "Chei Stripe lipsă"
                }
              />
              <StatusBadge
                ok={integrations?.stripe.available ?? false}
                label={
                  integrations?.stripe.available
                    ? "Plată card activă pe site"
                    : "Plată card indisponibilă"
                }
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cardPaymentEnabled}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({ ...prev, cardPaymentEnabled: e.target.checked }));
                }}
                className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-600 focus:ring-purple-500/50"
              />
              <span className="text-sm text-gray-300">Activează „Plată cu cardul” la checkout</span>
            </label>
            {!integrations?.stripe.configured && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 leading-relaxed">
                Adaugă cheile în Vercel Environment Variables (sau în <code className="text-amber-100">.env.local</code>{" "}
                local), apoi redeploy:
                <br />
                <code className="text-amber-100">STRIPE_SECRET_KEY</code> (secret, server) și{" "}
                <code className="text-amber-100">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> (publishable, client).
              </p>
            )}
            <p className="text-xs text-gray-500 leading-relaxed">
              Cheile se obțin din{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Stripe Dashboard → API keys
              </a>
              . Dacă lipsesc, opțiunea card rămâne indisponibilă; rambursul funcționează normal.
            </p>
            <p className="rounded-xl border border-white/8 bg-novra-bg/30 px-4 py-3 text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Webhook (recomandat):</strong> setați{" "}
              <code className="text-purple-300">STRIPE_WEBHOOK_SECRET</code> în Vercel și adăugați endpoint-ul{" "}
              <code className="text-purple-300">/api/store/stripe/webhook</code> în Stripe (eveniment{" "}
              <code className="text-purple-300">checkout.session.completed</code>) pentru confirmare idempotentă a plăților.
            </p>
            <button
              type="button"
              onClick={() => handleSaveSettings("Setările Stripe au fost salvate.")}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Save size={16} />
              Salvează Stripe
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Mail size={20} className="text-purple-400" />
            Email comenzi (Resend)
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                ok={integrations?.email.configured ?? false}
                label={
                  integrations?.email.configured
                    ? "Resend configurat"
                    : "Resend neconfigurat"
                }
              />
              <StatusBadge
                ok={(integrations?.email.configured && integrations?.email.enabled) ?? false}
                label={
                  integrations?.email.configured && integrations?.email.enabled
                    ? "Emailuri comenzi active"
                    : "Emailuri comenzi inactive"
                }
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.orderEmailsEnabled}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({ ...prev, orderEmailsEnabled: e.target.checked }));
                }}
                className="h-4 w-4 rounded border-white/20 bg-novra-bg/50 text-purple-600 focus:ring-purple-500/50"
              />
              <span className="text-sm text-gray-300">Trimite email confirmare la plasarea comenzii</span>
            </label>
            {!integrations?.email.configured && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90 leading-relaxed">
                Adaugă cheile în Vercel Environment Variables (sau în <code className="text-amber-100">.env.local</code>{" "}
                local), apoi redeploy:
                <br />
                <code className="text-amber-100">RESEND_API_KEY</code> (secret, server) și{" "}
                <code className="text-amber-100">RESEND_FROM_EMAIL</code> (ex.{" "}
                <code className="text-amber-100">NOVRA &lt;onboarding@resend.dev&gt;</code> pentru test, sau{" "}
                <code className="text-amber-100">NOVRA &lt;comenzi@novra.ro&gt;</code> după verificarea domeniului).
              </p>
            )}
            <p className="text-xs text-gray-500 leading-relaxed">
              Necesită <code className="text-purple-300">RESEND_API_KEY</code> și{" "}
              <code className="text-purple-300">RESEND_FROM_EMAIL</code> (domeniu verificat în Resend) în
              Vercel Environment Variables sau <code className="text-purple-300">.env.local</code>.
              Ramburs: email imediat la plasare. Card: email după confirmarea plății Stripe.
              La salvarea AWB în Comenzi se trimite automat email de tracking.
            </p>
            <button
              type="button"
              onClick={() => handleSaveSettings("Setările email au fost salvate.")}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Save size={16} />
              Salvează email
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Tag size={20} className="text-amber-400" />
            Coduri reducere newsletter
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Reducere implicită (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={settings.newsletterDiscountPercent}
                onChange={(e) => {
                  markDirty();
                  setSettings((prev) => ({
                    ...prev,
                    newsletterDiscountPercent: Math.min(100, Math.max(1, Number(e.target.value) || 10)),
                  }));
                }}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Procentul se aplică codurilor noi generate la abonare (format{" "}
              <code className="text-purple-300">NOVRA10-XXXX</code>). Codurile existente păstrează
              procentul cu care au fost create. Vezi lista în{" "}
              <a href="/admin/newsletter" className="text-purple-300 hover:text-white underline">
                Newsletter
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => handleSaveSettings("Procentul de reducere newsletter a fost salvat.")}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              <Save size={16} />
              Salvează reducere
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <KeyRound size={20} className="text-purple-400" />
            Schimbă parola admin
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              type="password"
              placeholder="Parola curentă"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
            <input
              type="password"
              placeholder="Parola nouă"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
            <input
              type="password"
              placeholder="Confirmă parola nouă"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/15 px-5 py-3 text-sm font-semibold text-purple-200 transition hover:bg-purple-600/25"
          >
            <KeyRound size={16} />
            Actualizează parola
          </button>
        </section>
      </div>
    </div>
  );
}
