"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Mail,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import CopyButton from "@/components/CopyButton";
import { requireAdmin, getStoredUsers } from "@/lib/auth";
import {
  adminAddNewsletterSubscriber,
  deleteNewsletterCampaign,
  deleteNewsletterSubscriber,
  exportNewsletterSubscribersCsv,
  formatNewsletterWelcomePreview,
  loadNewsletterCampaigns,
  loadNewsletterSubscribers,
  saveNewsletterCampaign,
  sendNewsletterCampaign,
  updateNewsletterSubscriber,
  type NewsletterCampaign,
  type NewsletterSubscriber,
} from "@/lib/newsletter";
import {
  createNewsletterDiscountCodeForSubscriber,
  deleteDiscountCode,
  formatDiscountValue,
  generateNewsletterDiscountCode,
  loadDiscountCodes,
  updateDiscountCode,
  type DiscountCode,
} from "@/lib/discount-codes";
import {
  DEFAULT_NEWSLETTER_WELCOME_MESSAGE,
  loadSiteSettings,
  saveSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";
import { subscribeToStoreUpdates } from "@/lib/store";

type SubscriberRow = {
  email: string;
  name: string;
  notes?: string;
  date: string;
  source: string;
  discountCode?: string;
  fromStorage: boolean;
};

type AdminTab = "subscribers" | "codes" | "settings" | "campaigns";

type SubscriberForm = {
  email: string;
  name: string;
  notes: string;
  discountCode: string;
};

type CodeEditForm = {
  value: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
};

type CampaignForm = {
  id?: string;
  title: string;
  subject: string;
  body: string;
};

const defaultSubscriberForm = (): SubscriberForm => ({
  email: "",
  name: "",
  notes: "",
  discountCode: "",
});

const defaultCampaignForm = (): CampaignForm => ({
  title: "",
  subject: "",
  body: "",
});

export default function AdminNewsletterPage() {
  const admin = requireAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("subscribers");
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [showAddSubscriber, setShowAddSubscriber] = useState(false);
  const [subscriberForm, setSubscriberForm] = useState<SubscriberForm>(defaultSubscriberForm);
  const [codeEditForm, setCodeEditForm] = useState<CodeEditForm>({
    value: "",
    maxUses: "",
    expiresAt: "",
    active: true,
  });
  const [campaignForm, setCampaignForm] = useState<CampaignForm | null>(null);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [addCodeForEmail, setAddCodeForEmail] = useState<string | null>(null);

  const mergeSubscribers = (fromStorage: NewsletterSubscriber[]): SubscriberRow[] => {
    const fromUsers = getStoredUsers()
      .filter((u) => u.role !== "admin" && u.subscribedToNewsletter)
      .map((u) => ({
        email: u.email,
        name: u.name,
        date: u.createdAt,
        source: "account" as const,
        fromStorage: false,
      }));

    const merged = new Map<string, SubscriberRow>();

    for (const sub of fromStorage) {
      merged.set(sub.email, {
        email: sub.email,
        name: sub.name ?? "—",
        notes: sub.notes,
        date: sub.subscribedAt,
        source: sub.source,
        discountCode: sub.discountCode,
        fromStorage: true,
      });
    }

    for (const sub of fromUsers) {
      if (!merged.has(sub.email)) {
        merged.set(sub.email, {
          email: sub.email,
          name: sub.name,
          date: sub.date,
          source: sub.source,
          fromStorage: false,
        });
      }
    }

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const refresh = async () => {
    const [fromStorage, codes, siteSettings, loadedCampaigns] = await Promise.all([
      loadNewsletterSubscribers(),
      loadDiscountCodes(),
      loadSiteSettings(),
      loadNewsletterCampaigns(),
    ]);
    setSubscribers(mergeSubscribers(fromStorage));
    setDiscountCodes(codes.filter((c) => c.source === "newsletter"));
    setSettings(siteSettings);
    setCampaigns(loadedCampaigns);
  };

  useEffect(() => {
    let cancelled = false;
    void refresh().then(() => {
      if (cancelled) return;
    });
    const unsubscribe = subscribeToStoreUpdates(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const filteredSubscribers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        (sub.discountCode?.toLowerCase().includes(q) ?? false) ||
        (sub.notes?.toLowerCase().includes(q) ?? false)
    );
  }, [subscribers, search]);

  if (!admin) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const sourceLabel = (source: string) => {
    if (source === "homepage") return "Homepage";
    if (source === "account") return "Cont utilizator";
    if (source === "admin") return "Admin";
    return "Altele";
  };

  const handleDeleteSubscriber = async (email: string) => {
    if (!window.confirm(`Ștergi abonatul ${email}?`)) return;
    setDeletingEmail(email);
    const result = await deleteNewsletterSubscriber(email);
    setDeletingEmail(null);
    showMessage(result.ok ? "Abonat șters." : result.message);
    if (result.ok) await refresh();
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriberForm.email.trim()) {
      showMessage("Introdu un email valid.");
      return;
    }
    setLoading(true);
    const result = await adminAddNewsletterSubscriber(subscriberForm.email, {
      name: subscriberForm.name || undefined,
      notes: subscriberForm.notes || undefined,
      generateCode: settings?.newsletterAutoGenerateCodes !== false,
      sendWelcomeEmail: false,
    });
    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    if (subscriberForm.discountCode.trim()) {
      await updateNewsletterSubscriber(result.subscriber.email, {
        discountCode: subscriberForm.discountCode.trim().toUpperCase(),
      });
    }

    setShowAddSubscriber(false);
    setSubscriberForm(defaultSubscriberForm());
    await refresh();
    showMessage("Abonat adăugat.");
  };

  const startEditSubscriber = (sub: SubscriberRow) => {
    setEditingEmail(sub.email);
    setSubscriberForm({
      email: sub.email,
      name: sub.name === "—" ? "" : sub.name,
      notes: sub.notes ?? "",
      discountCode: sub.discountCode ?? "",
    });
    setShowAddSubscriber(false);
  };

  const handleUpdateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmail) return;
    setLoading(true);
    const result = await updateNewsletterSubscriber(editingEmail, {
      email: subscriberForm.email !== editingEmail ? subscriberForm.email : undefined,
      name: subscriberForm.name,
      notes: subscriberForm.notes,
      discountCode: subscriberForm.discountCode.trim()
        ? subscriberForm.discountCode.trim().toUpperCase()
        : null,
    });
    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setEditingEmail(null);
    setSubscriberForm(defaultSubscriberForm());
    await refresh();
    showMessage("Abonat actualizat.");
  };

  const handleExportCsv = () => {
    const storageSubs: NewsletterSubscriber[] = subscribers
      .filter((s) => s.fromStorage)
      .map((s) => ({
        email: s.email,
        name: s.name === "—" ? undefined : s.name,
        notes: s.notes,
        subscribedAt: s.date,
        source: s.source as NewsletterSubscriber["source"],
        discountCode: s.discountCode,
      }));
    const csv = exportNewsletterSubscribersCsv(storageSubs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-abonati-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage("Export CSV descărcat.");
  };

  const startEditCode = (code: DiscountCode) => {
    setEditingCode(code.code);
    setCodeEditForm({
      value: String(code.value),
      maxUses: code.maxUses !== undefined ? String(code.maxUses) : "",
      expiresAt: code.expiresAt ? code.expiresAt.slice(0, 16) : "",
      active: code.active,
    });
  };

  const handleUpdateCode = async (code: string) => {
    setLoading(true);
    const result = await updateDiscountCode({
      code,
      value: Number(codeEditForm.value),
      maxUses: codeEditForm.maxUses.trim() ? Number(codeEditForm.maxUses) : null,
      expiresAt: codeEditForm.expiresAt ? new Date(codeEditForm.expiresAt).toISOString() : null,
      active: codeEditForm.active,
    });
    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setEditingCode(null);
    await refresh();
    showMessage("Cod actualizat.");
  };

  const handleDeleteCode = async (code: string) => {
    if (!window.confirm(`Ștergi codul ${code}?`)) return;
    setDeletingCode(code);
    const result = await deleteDiscountCode(code);
    setDeletingCode(null);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }
    await refresh();
    showMessage("Cod șters.");
  };

  const handleCreateCodeForSubscriber = async (email: string) => {
    setLoading(true);
    const result = await createNewsletterDiscountCodeForSubscriber(email, {
      value: settings?.newsletterDiscountPercent ?? 10,
    });
    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    await updateNewsletterSubscriber(email, { discountCode: result.code.code });
    setAddCodeForEmail(null);
    await refresh();
    showMessage(`Cod ${result.code.code} creat și legat.`);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setLoading(true);
    const result = await saveSiteSettings({
      newsletterDiscountPercent: settings.newsletterDiscountPercent,
      newsletterAutoGenerateCodes: settings.newsletterAutoGenerateCodes,
      newsletterWelcomeMessage: settings.newsletterWelcomeMessage,
    });
    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setSettings(result.settings);
    showMessage("Setări newsletter salvate.");
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm?.title.trim() || !campaignForm.subject.trim() || !campaignForm.body.trim()) {
      showMessage("Completează titlul, subiectul și conținutul.");
      return;
    }
    setLoading(true);
    const result = await saveNewsletterCampaign(campaignForm);
    setLoading(false);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    setCampaignForm(null);
    await refresh();
    showMessage(campaignForm.id ? "Campanie actualizată." : "Campanie creată.");
  };

  const handleSendCampaign = async (id: string) => {
    if (!window.confirm("Trimiți această campanie tuturor abonaților?")) return;
    setSendingCampaignId(id);
    const result = await sendNewsletterCampaign(id);
    setSendingCampaignId(null);

    if (!result.ok) {
      showMessage(result.message);
      return;
    }

    await refresh();
    showMessage(`Campanie trimisă: ${result.sentCount} reușite, ${result.failedCount} eșuate.`);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("Ștergi această campanie?")) return;
    const result = await deleteNewsletterCampaign(id);
    if (!result.ok) {
      showMessage(result.message);
      return;
    }
    await refresh();
    showMessage("Campanie ștearsă.");
  };

  const discountPercent = settings?.newsletterDiscountPercent ?? 10;
  const welcomeTemplate = settings?.newsletterWelcomeMessage ?? DEFAULT_NEWSLETTER_WELCOME_MESSAGE;

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: "subscribers", label: "Abonați", icon: Users },
    { id: "codes", label: "Coduri reducere", icon: Tag },
    { id: "settings", label: "Setări", icon: Settings },
    { id: "campaigns", label: "Campanii", icon: Megaphone },
  ];

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Newsletter"
        subtitle={`${subscribers.length} abonați · ${discountCodes.length} coduri · ${campaigns.length} campanii`}
      />

      {message && (
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "border border-white/10 bg-novra-card/30 text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "subscribers" && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                placeholder="Caută email, nume, cod..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubscriber(true);
                  setEditingEmail(null);
                  setSubscriberForm(defaultSubscriberForm());
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                <Plus size={16} />
                Adaugă abonat
              </button>
            </div>
          </div>

          {(showAddSubscriber || editingEmail) && (
            <form
              onSubmit={editingEmail ? handleUpdateSubscriber : handleAddSubscriber}
              className="mb-6 rounded-2xl border border-purple-500/20 bg-novra-card/40 p-5 sm:p-6"
            >
              <h3 className="mb-4 text-lg font-semibold text-white">
                {editingEmail ? "Editează abonat" : "Abonat nou"}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Email</label>
                  <input
                    type="email"
                    required
                    value={subscriberForm.email}
                    onChange={(e) => setSubscriberForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Nume</label>
                  <input
                    type="text"
                    value={subscriberForm.name}
                    onChange={(e) => setSubscriberForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Cod reducere</label>
                  <input
                    type="text"
                    placeholder="NOVRA10-XXXX (opțional)"
                    value={subscriberForm.discountCode}
                    onChange={(e) => setSubscriberForm((p) => ({ ...p, discountCode: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm font-mono outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Note</label>
                  <input
                    type="text"
                    value={subscriberForm.notes}
                    onChange={(e) => setSubscriberForm((p) => ({ ...p, notes: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save size={16} />
                  {editingEmail ? "Salvează" : "Adaugă"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubscriber(false);
                    setEditingEmail(null);
                    setSubscriberForm(defaultSubscriberForm());
                  }}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400"
                >
                  Anulează
                </button>
              </div>
            </form>
          )}

          {filteredSubscribers.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
              <Mail size={32} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">
                {search ? "Niciun rezultat pentru căutare." : "Niciun abonat la newsletter încă."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-4 sm:px-6">Nume</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Cod reducere</th>
                    <th className="px-4 py-4">Note</th>
                    <th className="px-4 py-4">Sursă</th>
                    <th className="px-4 py-4 sm:px-6">Data</th>
                    <th className="px-4 py-4">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.email} className="text-gray-300">
                      <td className="px-4 py-4 sm:px-6 font-medium text-white">{sub.name}</td>
                      <td className="px-4 py-4">{sub.email}</td>
                      <td className="px-4 py-4 font-mono text-xs text-purple-300">
                        {sub.discountCode ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 max-w-[140px] truncate">
                        {sub.notes ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-purple-300">{sourceLabel(sub.source)}</td>
                      <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">{formatDate(sub.date)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {sub.fromStorage && (
                            <button
                              type="button"
                              onClick={() => startEditSubscriber(sub)}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
                            >
                              <Pencil size={12} />
                              Editează
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deletingEmail === sub.email}
                            onClick={() => void handleDeleteSubscriber(sub.email)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Șterge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "codes" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
          <div className="border-b border-white/10 px-4 py-3 sm:px-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Tag size={16} className="text-amber-400" />
              Coduri reducere newsletter (NOVRA10)
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Reducere implicită: {discountPercent}% · gestionează toate codurile în{" "}
              <a href="/admin/coduri-reducere" className="text-purple-300 hover:text-white underline">
                Coduri reducere
              </a>
            </p>
          </div>
          {discountCodes.length > 0 ? (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="px-4 py-3 sm:px-6">Cod</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Reducere</th>
                  <th className="px-4 py-3">Limită</th>
                  <th className="px-4 py-3">Expiră</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 sm:px-6">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {discountCodes.map((code) => {
                  const isEditing = editingCode === code.code;
                  return (
                    <tr key={code.code} className="text-gray-300">
                      <td className="px-4 py-3 sm:px-6">
                        <span className="inline-flex items-center gap-2 font-mono text-purple-300">
                          {code.code}
                          <CopyButton text={code.code} label="Copiază" />
                        </span>
                      </td>
                      <td className="px-4 py-3">{code.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={codeEditForm.value}
                            onChange={(e) => setCodeEditForm((p) => ({ ...p, value: e.target.value }))}
                            className="w-20 rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-sm"
                          />
                        ) : (
                          formatDiscountValue(code.type, code.value)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            placeholder="∞"
                            value={codeEditForm.maxUses}
                            onChange={(e) => setCodeEditForm((p) => ({ ...p, maxUses: e.target.value }))}
                            className="w-16 rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-sm"
                          />
                        ) : (
                          (code.maxUses ?? "∞")
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={codeEditForm.expiresAt}
                            onChange={(e) => setCodeEditForm((p) => ({ ...p, expiresAt: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-novra-bg/50 px-2 py-1 text-xs"
                          />
                        ) : code.expiresAt ? (
                          formatDate(code.expiresAt)
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={codeEditForm.active}
                              onChange={(e) => setCodeEditForm((p) => ({ ...p, active: e.target.checked }))}
                              className="h-4 w-4 rounded"
                            />
                            Activ
                          </label>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              !code.active
                                ? "bg-gray-500/15 text-gray-400"
                                : code.used
                                  ? "bg-gray-500/15 text-gray-400"
                                  : "bg-emerald-500/15 text-emerald-300"
                            }`}
                          >
                            {!code.active ? "Inactiv" : code.used ? "Folosit" : "Activ"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex flex-wrap gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => void handleUpdateCode(code.code)}
                                className="rounded-lg bg-purple-600 px-2 py-1 text-xs text-white"
                              >
                                Salvează
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCode(null)}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditCode(code)}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={deletingCode === code.code}
                                onClick={() => void handleDeleteCode(code.code)}
                                className="rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center sm:px-6">
              <Tag size={28} className="mx-auto mb-3 text-gray-600" />
              <p className="text-sm text-gray-500">Niciun cod de reducere generat încă.</p>
            </div>
          )}

          {subscribers.filter((s) => s.fromStorage && !s.discountCode).length > 0 && (
            <div className="border-t border-white/10 px-4 py-4 sm:px-6">
              <p className="mb-3 text-xs text-gray-500">Abonați fără cod reducere:</p>
              <div className="flex flex-wrap gap-2">
                {subscribers
                  .filter((s) => s.fromStorage && !s.discountCode)
                  .map((sub) => (
                    <button
                      key={sub.email}
                      type="button"
                      disabled={loading && addCodeForEmail === sub.email}
                      onClick={() => {
                        setAddCodeForEmail(sub.email);
                        void handleCreateCodeForSubscriber(sub.email);
                      }}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      + Cod pentru {sub.email}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && settings && (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6 space-y-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Settings size={20} className="text-purple-400" />
            Setări newsletter
          </h3>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Reducere implicită (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.newsletterDiscountPercent}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          newsletterDiscountPercent: Math.min(
                            100,
                            Math.max(1, Number(e.target.value) || 10)
                          ),
                        }
                      : prev
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="autoGenerate"
                checked={settings.newsletterAutoGenerateCodes !== false}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, newsletterAutoGenerateCodes: e.target.checked } : prev
                  )
                }
                className="h-4 w-4 rounded"
              />
              <label htmlFor="autoGenerate" className="text-sm text-gray-300">
                Generează automat cod NOVRA10 la abonare
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Șablon mesaj bun-venit ({`{code}`}, {`{percent}`})
            </label>
            <textarea
              rows={3}
              value={settings.newsletterWelcomeMessage ?? DEFAULT_NEWSLETTER_WELCOME_MESSAGE}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, newsletterWelcomeMessage: e.target.value } : prev
                )
              }
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
            <div className="mt-3 rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Previzualizare</p>
              <p className="text-sm text-gray-300">
                {formatNewsletterWelcomePreview(
                  settings.newsletterWelcomeMessage ?? DEFAULT_NEWSLETTER_WELCOME_MESSAGE,
                  generateNewsletterDiscountCode(),
                  settings.newsletterDiscountPercent
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSaveSettings()}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Save size={16} />
            Salvează setări
          </button>
        </div>
      )}

      {activeTab === "campaigns" && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setCampaignForm(defaultCampaignForm())}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              <Plus size={16} />
              Campanie nouă
            </button>
          </div>

          {campaignForm && (
            <form
              onSubmit={handleSaveCampaign}
              className="mb-6 rounded-2xl border border-purple-500/20 bg-novra-card/40 p-5 sm:p-6"
            >
              <h3 className="mb-4 text-lg font-semibold text-white">
                {campaignForm.id ? "Editează campanie" : "Campanie nouă"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Titlu intern</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, title: e.target.value } : p))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Subiect email</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, subject: e.target.value } : p))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Conținut</label>
                  <textarea
                    required
                    rows={8}
                    value={campaignForm.body}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, body: e.target.value } : p))}
                    placeholder="Scrie mesajul newsletter-ului. Paragrafele separate de linie goală."
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save size={16} />
                  Salvează
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignForm(null)}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400"
                >
                  Anulează
                </button>
              </div>
            </form>
          )}

          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
              <Megaphone size={32} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">Nicio campanie newsletter încă.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{campaign.title}</h4>
                      <p className="mt-1 text-sm text-gray-400">Subiect: {campaign.subject}</p>
                      <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap line-clamp-3">
                        {campaign.body}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            campaign.status === "sent"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {campaign.status === "sent" ? "Trimisă" : "Ciornă"}
                        </span>
                        {campaign.sentAt && (
                          <span className="text-gray-500">
                            {formatDate(campaign.sentAt)} · {campaign.sentCount ?? 0} trimise
                            {(campaign.failedCount ?? 0) > 0 && ` · ${campaign.failedCount} eșuate`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {campaign.status === "draft" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCampaignForm({
                                id: campaign.id,
                                title: campaign.title,
                                subject: campaign.subject,
                                body: campaign.body,
                              })
                            }
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300"
                          >
                            <Pencil size={12} className="inline mr-1" />
                            Editează
                          </button>
                          <button
                            type="button"
                            disabled={sendingCampaignId === campaign.id || loading}
                            onClick={() => void handleSendCampaign(campaign.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-xs text-white disabled:opacity-50"
                          >
                            <Send size={12} />
                            {sendingCampaignId === campaign.id ? "Se trimite..." : "Trimite"}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDeleteCampaign(campaign.id)}
                        className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300"
                      >
                        <Trash2 size={12} className="inline mr-1" />
                        Șterge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
