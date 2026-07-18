"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Download,
  Eye,
  LayoutDashboard,
  Mail,
  Megaphone,
  Monitor,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Server,
  Smartphone,
  Trash2,
  Users,
  Zap,
  FileText,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import MetricCard from "@/components/admin/MetricCard";
import { requireAdmin, getStoredUsers } from "@/lib/auth";
import { getApiHeaders } from "@/lib/api-client";
import {
  deleteNewsletterCampaign,
  deleteNewsletterSubscriber,
  exportNewsletterSubscribersCsv,
  loadNewsletterCampaigns,
  loadNewsletterSubscribers,
  saveNewsletterCampaign,
  sendNewsletterCampaign,
  type NewsletterCampaign,
  type NewsletterSubscriber,
} from "@/lib/newsletter";
import { subscribeToStoreUpdates } from "@/lib/store";
import type { EmailAutomations, EmailAutomationKey, EmailAutomationMeta } from "@/lib/email-automations";

type AdminTab = "dashboard" | "subscribers" | "templates" | "campaigns" | "automations" | "smtp";

type SubscriberRow = {
  email: string;
  name: string;
  notes?: string;
  date: string;
  source: string;
  discountCode?: string;
  fromStorage: boolean;
};

type EmailLogEntry = {
  id: string;
  to: string;
  subject: string;
  type: string;
  status: "sent" | "failed";
  sentAt: string;
  messageId?: string;
  error?: string;
};

type EmailChartDay = {
  date: string;
  sent: number;
  failed: number;
};

type DashboardStats = {
  subscriberCount: number;
  stats: {
    sentToday: number;
    sentThisMonth: number;
    deliveryRate: number;
    lastSent: EmailLogEntry | null;
    totalSent: number;
    totalFailed: number;
    delivered: number;
  };
  lastCampaign: NewsletterCampaign | null;
  recentLogs: EmailLogEntry[];
  chartData: EmailChartDay[];
};

type SmtpInfo = {
  host: string;
  port: number;
  email: string;
  from: string;
  configured: boolean;
  emailsEnabled: boolean;
  connectionStatus: "connected" | "error" | "not_configured";
  lastTest: { ok: boolean; testedAt: string; message: string; error?: string } | null;
  lastError: string | null;
  lastEmailSent: { to: string; subject: string; sentAt: string } | null;
  configCheck: {
    host: boolean;
    port: boolean;
    user: boolean;
    pass: boolean;
    from: boolean;
    emailsEnabled: boolean;
    allPresent: boolean;
  };
};

type EmailTemplateConfig = {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  footer: string;
  colors: { primary: string; background: string; accent: string };
  logoUrl: string;
};

type EmailTemplateDef = {
  id: string;
  name: string;
};

const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  { id: "welcome", name: "Bun venit" },
  { id: "newsletter", name: "Newsletter" },
  { id: "subscription_confirmation", name: "Confirmare abonare" },
  { id: "order_confirmation", name: "Confirmare comandă" },
  { id: "order_processing", name: "Comandă în procesare" },
  { id: "order_shipped", name: "Comandă expediată" },
  { id: "order_delivered", name: "Comandă livrată" },
  { id: "order_cancelled", name: "Comandă anulată" },
  { id: "password_reset", name: "Resetare parolă" },
  { id: "contact", name: "Contact" },
  { id: "contact_confirmation", name: "Confirmare contact" },
  { id: "gift_card", name: "Gift Card" },
  { id: "store_credit", name: "NovraCredits" },
  { id: "review_request", name: "Cerere recenzie" },
  { id: "review_approved", name: "Recenzie aprobată" },
  { id: "return_approved", name: "Retur aprobat" },
  { id: "refund", name: "Rambursare" },
  { id: "account_confirmation", name: "Confirmare cont" },
  { id: "email_verification", name: "Verificare email" },
];

const AUTOMATION_LABELS: { key: EmailAutomationKey; label: string }[] = [
  { key: "welcome", label: "Bun venit" },
  { key: "orderConfirmation", label: "Confirmare comandă" },
  { key: "orderProcessing", label: "Comandă în procesare" },
  { key: "orderShipped", label: "Comandă expediată" },
  { key: "orderDelivered", label: "Comandă livrată" },
  { key: "orderCancelled", label: "Comandă anulată" },
  { key: "adminNewOrder", label: "Comandă nouă (admin)" },
  { key: "passwordReset", label: "Resetare parolă" },
  { key: "newsletter", label: "Newsletter" },
  { key: "reviewRequest", label: "Cerere recenzie" },
  { key: "reviewApproved", label: "Recenzie aprobată (client)" },
  { key: "contactConfirmation", label: "Confirmare contact" },
  { key: "contactAdmin", label: "Notificare contact (admin)" },
  { key: "giftCard", label: "Gift Card" },
  { key: "storeCredit", label: "NovraCredits" },
  { key: "adminOrderCancelled", label: "Comandă anulată (admin)" },
  { key: "returnApproved", label: "Retur aprobat" },
  { key: "refund", label: "Rambursare" },
  { key: "returnRequestAdmin", label: "Cerere retur (admin)" },
  { key: "accountConfirmation", label: "Confirmare cont" },
  { key: "emailVerification", label: "Verificare email" },
  { key: "subscriptionConfirmation", label: "Confirmare abonare" },
];

type CampaignForm = {
  id?: string;
  title: string;
  subject: string;
  previewText: string;
  body: string;
  templateId: string;
  recipients: string;
  sendToAll: boolean;
  scheduledAt: string;
};

const defaultCampaignForm = (): CampaignForm => ({
  title: "",
  subject: "",
  previewText: "",
  body: "",
  templateId: "newsletter",
  recipients: "",
  sendToAll: true,
  scheduledAt: "",
});

type BroadcastForm = {
  templateId: string;
  subject: string;
  previewText: string;
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  sendToAll: boolean;
  selectedEmails: string[];
  isSpecial: boolean;
};

const emptySpecialBroadcastForm = (subscribers: SubscriberRow[]): BroadcastForm => ({
  templateId: "special_subscribers",
  subject: "",
  previewText: "",
  title: "",
  subtitle: "",
  content: "",
  buttonText: "",
  buttonLink: "",
  sendToAll: true,
  selectedEmails: subscribers.map((s) => s.email),
  isSpecial: true,
});

export default function AdminEmailCenterPage() {
  const admin = requireAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [automations, setAutomations] = useState<EmailAutomations | null>(null);
  const [smtpInfo, setSmtpInfo] = useState<SmtpInfo | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const [campaignForm, setCampaignForm] = useState<CampaignForm | null>(null);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [testEmail, setTestEmail] = useState("");
  const [smtpTestEmail, setSmtpTestEmail] = useState("");

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateConfig | null>(null);
  const [editorPreviewDesktop, setEditorPreviewDesktop] = useState("");
  const [editorPreviewMobile, setEditorPreviewMobile] = useState("");
  const [broadcastForm, setBroadcastForm] = useState<BroadcastForm | null>(null);
  const [broadcastSending, setBroadcastSending] = useState(false);

  const [logSearch, setLogSearch] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logDateFrom, setLogDateFrom] = useState("");
  const [logDateTo, setLogDateTo] = useState("");
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsInitialized, setLogsInitialized] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logEditForm, setLogEditForm] = useState({ to: "", subject: "", type: "", status: "sent" as "sent" | "failed" });
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [bulkLogsWorking, setBulkLogsWorking] = useState(false);

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

  const fetchDashboard = async () => {
    const res = await fetch("/api/admin/email/stats", { headers: getApiHeaders(), cache: "no-store" });
    if (res.ok) {
      setDashboard((await res.json()) as DashboardStats);
    }
  };

  const fetchLogs = async (filters?: {
    search?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setLogsLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    const search = filters?.search ?? logSearch;
    const type = filters?.type ?? logTypeFilter;
    const status = filters?.status ?? logStatusFilter;
    const dateFrom = filters?.dateFrom ?? logDateFrom;
    const dateTo = filters?.dateTo ?? logDateTo;
    if (search.trim()) params.set("search", search.trim());
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/admin/email/logs?${params.toString()}`, {
      headers: getApiHeaders(),
      cache: "no-store",
    });
    setLogsLoading(false);
    if (res.ok) {
      const data = (await res.json()) as { logs: EmailLogEntry[] };
      setEmailLogs(data.logs);
      setLogsInitialized(true);
      setSelectedLogIds((current) =>
        current.filter((id) => data.logs.some((log) => log.id === id))
      );
    }
  };

  const fetchAutomations = async () => {
    const res = await fetch("/api/admin/email/automations", { headers: getApiHeaders(), cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { automations: EmailAutomations };
      setAutomations(data.automations);
    }
  };

  const fetchSmtp = async () => {
    const res = await fetch("/api/admin/email/smtp", { headers: getApiHeaders(), cache: "no-store" });
    if (res.ok) {
      setSmtpInfo((await res.json()) as SmtpInfo);
    }
  };

  const refresh = async () => {
    const [fromStorage, loadedCampaigns] = await Promise.all([
      loadNewsletterSubscribers(),
      loadNewsletterCampaigns(),
    ]);
    setSubscribers(mergeSubscribers(fromStorage));
    setCampaigns(loadedCampaigns);
    await Promise.all([fetchDashboard(), fetchLogs(), fetchAutomations(), fetchSmtp()]);
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
    return subscribers.filter((sub) => {
      if (sourceFilter !== "all" && sub.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        sub.email.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        (sub.discountCode?.toLowerCase().includes(q) ?? false) ||
        (sub.notes?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [subscribers, search, sourceFilter]);

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
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatShortDate = (iso: string) =>
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

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      welcome: "Bun venit",
      newsletter: "Newsletter",
      order_confirmation: "Confirmare comandă",
      order_processing: "Comandă în procesare",
      order_shipped: "Comandă expediată",
      order_delivered: "Comandă livrată",
      order_cancelled: "Comandă anulată",
      order_status: "Status comandă",
      admin_new_order: "Comandă nouă (admin)",
      contact_confirmation: "Confirmare contact",
      contact_admin: "Notificare contact",
      contact: "Contact",
      gift_card: "Gift Card",
      store_credit: "NovraCredits",
      review_request: "Cerere recenzie",
      review_approved: "Recenzie aprobată",
      password_reset: "Resetare parolă",
      smtp_test: "Test SMTP",
      general: "General",
      abandoned_cart: "Coș abandonat",
      subscription_confirmation: "Confirmare abonare",
      return_approved: "Retur aprobat",
      refund: "Rambursare",
      return_request_admin: "Cerere retur (admin)",
      account_confirmation: "Confirmare cont",
      email_verification: "Verificare email",
      admin_order_cancelled: "Comandă anulată (admin)",
      template_broadcast: "Broadcast șablon",
    };
    return map[type] ?? type;
  };

  const handleDeleteSubscriber = async (email: string) => {
    if (!window.confirm(`Ștergi abonatul ${email}?`)) return;
    setDeletingEmail(email);
    const result = await deleteNewsletterSubscriber(email);
    setDeletingEmail(null);
    showMessage(result.ok ? "Abonat șters." : result.message);
    if (result.ok) await refresh();
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
    link.download = `email-center-abonati-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage("Export CSV descărcat.");
  };

  const campaignStatusLabel = (status: NewsletterCampaign["status"]) => {
    if (status === "draft") return "Ciornă";
    if (status === "scheduled") return "Programată";
    if (status === "sending") return "În desfășurare";
    if (status === "sent") return "Finalizată";
    if (status === "failed") return "Eșuată";
    return status;
  };

  const campaignStatusClass = (status: NewsletterCampaign["status"]) => {
    if (status === "sent") return "bg-emerald-500/15 text-emerald-300";
    if (status === "failed") return "bg-red-500/15 text-red-300";
    if (status === "scheduled") return "bg-sky-500/15 text-sky-300";
    if (status === "sending") return "bg-purple-500/15 text-purple-300";
    return "bg-amber-500/15 text-amber-300";
  };

  const handleSaveCampaign = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    if (!campaignForm?.title.trim() || !campaignForm.subject.trim() || !campaignForm.body.trim()) {
      showMessage("Completează titlul, subiectul și conținutul.");
      return;
    }
    setLoading(true);
    const recipients = campaignForm.recipients
      .split(/[\n,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const result = await saveNewsletterCampaign({
      id: campaignForm.id,
      title: campaignForm.title,
      subject: campaignForm.subject,
      previewText: campaignForm.previewText,
      body: campaignForm.body,
      templateId: campaignForm.templateId,
      recipients: campaignForm.sendToAll ? undefined : recipients,
      sendToAll: campaignForm.sendToAll,
      scheduledAt: saveAsDraft ? undefined : campaignForm.scheduledAt || undefined,
      saveAsDraft,
    });
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

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm("Ștergi această intrare din istoric?")) return;
    setDeletingLogId(id);
    const res = await fetch("/api/admin/email/logs", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify({ id }),
    });
    setDeletingLogId(null);
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      showMessage(data.message ?? "Ștergere eșuată.");
      return;
    }
    await refresh();
    showMessage("Intrare ștearsă.");
  };

  const handleSaveLogEdit = async (id: string) => {
    setLogsLoading(true);
    const res = await fetch("/api/admin/email/logs", {
      method: "PATCH",
      headers: getApiHeaders(),
      body: JSON.stringify({ id, ...logEditForm }),
    });
    setLogsLoading(false);
    const data = (await res.json()) as { ok?: boolean; message?: string };
    if (!res.ok || !data.ok) {
      showMessage(data.message ?? "Actualizare eșuată.");
      return;
    }
    setEditingLogId(null);
    await refresh();
    showMessage("Intrare actualizată.");
  };

  const handleToggleAutomation = async (key: EmailAutomationKey, value: boolean) => {
    if (!automations) return;
    setLoading(true);
    const res = await fetch("/api/admin/email/automations", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ automations: { [key]: { enabled: value } } }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; automations?: EmailAutomations; message?: string };
    if (!res.ok || !data.ok || !data.automations) {
      showMessage(data.message ?? "Nu s-a putut salva.");
      return;
    }
    setAutomations(data.automations);
    showMessage("Automatizare actualizată.");
  };

  const handleAutomationDelay = async (key: EmailAutomationKey, delayMinutes: number) => {
    if (!automations) return;
    setLoading(true);
    const res = await fetch("/api/admin/email/automations", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ automations: { [key]: { delayMinutes } } }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; automations?: EmailAutomations; message?: string };
    if (!res.ok || !data.ok || !data.automations) {
      showMessage(data.message ?? "Nu s-a putut salva.");
      return;
    }
    setAutomations(data.automations);
    showMessage("Întârziere actualizată.");
  };

  const handleSmtpVerify = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/email/smtp", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "verify" }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; message?: string };
    showMessage(data.message ?? "Verificare finalizată.");
    await refresh();
  };

  const handleSmtpTest = async () => {
    if (!smtpTestEmail.trim()) {
      showMessage("Introdu adresa de email pentru test.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/email/smtp", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "send_test", to: smtpTestEmail.trim() }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; message?: string };
    showMessage(data.message ?? (data.ok ? "Email trimis." : "Eroare la trimitere."));
    if (data.ok) await refresh();
  };

  const refreshTemplatePreview = async (config: EmailTemplateConfig) => {
    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "preview_live", template: config.id, config }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { html: string };
    setEditorPreviewDesktop(data.html);
    setEditorPreviewMobile(data.html);
  };

  const handleOpenTemplateEditor = async (templateId: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/email/templates?template=${encodeURIComponent(templateId)}`, {
      headers: getApiHeaders(),
    });
    setLoading(false);
    if (!res.ok) {
      showMessage("Nu s-a putut încărca șablonul.");
      return;
    }
    const data = (await res.json()) as { config: EmailTemplateConfig; html: string };
    setEditingTemplate(data.config);
    setEditorPreviewDesktop(data.html);
    setEditorPreviewMobile(data.html);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setLoading(true);
    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "save", template: editingTemplate.id, config: editingTemplate }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; message?: string; config?: EmailTemplateConfig; html?: string };
    if (!res.ok || !data.ok || !data.config) {
      showMessage(data.message ?? "Nu s-a putut salva.");
      return;
    }
    setEditingTemplate(data.config);
    if (data.html) {
      setEditorPreviewDesktop(data.html);
      setEditorPreviewMobile(data.html);
    }
    showMessage("Șablon salvat.");
  };

  const handleEditorSendTest = async () => {
    if (!editingTemplate) return;
    const to = testEmail.trim() || admin.email;
    setLoading(true);
    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "send_test", template: editingTemplate.id, to }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; message?: string };
    showMessage(data.message ?? "Eroare.");
    if (data.ok) await refresh();
  };

  const handleTemplatePreview = async (templateId: string, mode: "desktop" | "mobile") => {
    setPreviewMode(mode);
    const res = await fetch(`/api/admin/email/templates?template=${encodeURIComponent(templateId)}`, {
      headers: getApiHeaders(),
    });
    if (!res.ok) {
      showMessage("Nu s-a putut încărca previzualizarea.");
      return;
    }
    const data = (await res.json()) as { html: string; label: string };
    setPreviewTitle(data.label);
    setPreviewHtml(data.html);
  };

  const handleTemplateSendTest = async (templateId: string) => {
    const to = testEmail.trim() || admin.email;
    setLoading(true);
    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ action: "send_test", template: templateId, to }),
    });
    setLoading(false);
    const data = (await res.json()) as { ok?: boolean; message?: string };
    showMessage(data.message ?? "Eroare.");
    if (data.ok) await refresh();
  };

  const openBroadcastForm = async (templateId: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/email/templates?template=${encodeURIComponent(templateId)}`, {
      headers: getApiHeaders(),
    });
    setLoading(false);
    if (!res.ok) {
      showMessage("Nu s-a putut încărca șablonul.");
      return;
    }
    const data = (await res.json()) as { config: EmailTemplateConfig };
    setBroadcastForm({
      templateId,
      subject: data.config.subject,
      previewText: data.config.previewText,
      title: data.config.title,
      subtitle: data.config.subtitle,
      content: data.config.content,
      buttonText: data.config.buttonText,
      buttonLink: data.config.buttonLink,
      sendToAll: true,
      selectedEmails: subscribers.map((s) => s.email),
      isSpecial: false,
    });
  };

  const openSpecialBroadcastForm = () => {
    setBroadcastForm(emptySpecialBroadcastForm(subscribers));
  };

  const handleBroadcastTemplateChange = async (templateId: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/email/templates?template=${encodeURIComponent(templateId)}`, {
      headers: getApiHeaders(),
    });
    setLoading(false);
    if (!res.ok) {
      showMessage("Nu s-a putut încărca șablonul.");
      return;
    }
    const data = (await res.json()) as { config: EmailTemplateConfig };
    setBroadcastForm((prev) =>
      prev
        ? {
            ...prev,
            templateId,
            subject: data.config.subject,
            previewText: data.config.previewText,
            title: data.config.title,
            subtitle: data.config.subtitle,
            content: data.config.content,
            buttonText: data.config.buttonText,
            buttonLink: data.config.buttonLink,
          }
        : prev
    );
  };

  const handleBroadcastPreview = async (mode: "desktop" | "mobile") => {
    if (!broadcastForm) return;
    setPreviewMode(mode);
    const res = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        action: "preview_live",
        template: broadcastForm.templateId,
        config: {
          subject: broadcastForm.subject,
          previewText: broadcastForm.previewText,
          title: broadcastForm.title,
          subtitle: broadcastForm.subtitle,
          content: broadcastForm.content,
          buttonText: broadcastForm.buttonText,
          buttonLink: broadcastForm.buttonLink,
        },
      }),
    });
    if (!res.ok) {
      showMessage("Nu s-a putut genera previzualizarea.");
      return;
    }
    const data = (await res.json()) as { html: string; label?: string };
    setPreviewTitle(broadcastForm.isSpecial ? "Spune Special Abonaților" : (data.label ?? "Broadcast"));
    setPreviewHtml(data.html);
  };

  const toggleBroadcastRecipient = (email: string) => {
    setBroadcastForm((prev) => {
      if (!prev || prev.sendToAll) return prev;
      const selected = prev.selectedEmails.includes(email)
        ? prev.selectedEmails.filter((e) => e !== email)
        : [...prev.selectedEmails, email];
      return { ...prev, selectedEmails: selected };
    });
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm) return;
    if (!broadcastForm.subject.trim() || !broadcastForm.content.trim()) {
      showMessage("Subiectul și conținutul sunt obligatorii.");
      return;
    }

    const recipientCount = broadcastForm.sendToAll
      ? subscribers.length
      : broadcastForm.selectedEmails.length;

    if (recipientCount === 0) {
      showMessage("Selectează cel puțin un abonat.");
      return;
    }

    if (!window.confirm(`Trimiți emailul către ${recipientCount} abonați?`)) return;

    setBroadcastSending(true);
    const res = await fetch("/api/admin/email/broadcast", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        templateId: broadcastForm.templateId,
        subject: broadcastForm.subject,
        previewText: broadcastForm.previewText,
        title: broadcastForm.title,
        subtitle: broadcastForm.subtitle,
        content: broadcastForm.content,
        buttonText: broadcastForm.buttonText,
        buttonLink: broadcastForm.buttonLink,
        sendToAll: broadcastForm.sendToAll,
        recipients: broadcastForm.sendToAll ? undefined : broadcastForm.selectedEmails,
      }),
    });
    setBroadcastSending(false);
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      sentCount?: number;
      failedCount?: number;
    };

    if (!res.ok || !data.ok) {
      showMessage(data.error ?? "Trimiterea a eșuat.");
      return;
    }

    const sent = data.sentCount ?? 0;
    const failed = data.failedCount ?? 0;
    showMessage(
      failed > 0
        ? `Trimis către ${sent} abonați. ${failed} eșuate.`
        : `Email trimis cu succes către ${sent} abonați.`
    );
    setBroadcastForm(null);
    await refresh();
  };

  const connectionLabel = (status: SmtpInfo["connectionStatus"]) => {
    if (status === "connected") return "Conectat";
    if (status === "error") return "Eroare conexiune";
    return "Neconfigurat";
  };

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "subscribers", label: "Abonați", icon: Users },
    { id: "templates", label: "Template-uri", icon: FileText },
    { id: "campaigns", label: "Campanii", icon: Megaphone },
    { id: "automations", label: "Automatizări", icon: Zap },
    { id: "smtp", label: "SMTP", icon: Server },
  ];

  const displayLogs = logsInitialized ? emailLogs : (dashboard?.recentLogs ?? []);

  const clearLogsFromDashboard = () => {
    setEmailLogs([]);
    setSelectedLogIds([]);
    setDashboard((current) =>
      current
        ? {
            ...current,
            stats: {
              sentToday: 0,
              sentThisMonth: 0,
              deliveryRate: 0,
              lastSent: null,
              totalSent: 0,
              totalFailed: 0,
              delivered: 0,
            },
            recentLogs: [],
            chartData: current.chartData.map((day) => ({ ...day, sent: 0, failed: 0 })),
          }
        : current
    );
  };
  const chartData = dashboard?.chartData ?? [];
  const chartMax = Math.max(1, ...chartData.map((day) => day.sent + day.failed));
  const allLogsSelected =
    displayLogs.length > 0 && selectedLogIds.length === displayLogs.length;

  const toggleLogSelected = (id: string) => {
    setSelectedLogIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectAllLogs = () => {
    setSelectedLogIds(allLogsSelected ? [] : displayLogs.map((log) => log.id));
  };

  const handleBulkDeleteLogs = async (deleteAll = false) => {
    const count = deleteAll ? displayLogs.length : selectedLogIds.length;
    if (count === 0) return;

    const confirmMessage = deleteAll
      ? "Ștergi tot istoricul emailurilor?"
      : `Ștergi ${count} intrări selectate din istoric?`;
    if (!window.confirm(confirmMessage)) return;

    setBulkLogsWorking(true);
    const res = await fetch("/api/admin/email/logs", {
      method: "DELETE",
      headers: getApiHeaders(),
      body: JSON.stringify(
        deleteAll ? { deleteAll: true } : { ids: selectedLogIds }
      ),
    });
    setBulkLogsWorking(false);

    const data = (await res.json()) as {
      ok?: boolean;
      message?: string;
      deletedCount?: number;
      logs?: EmailLogEntry[];
    };
    if (!res.ok || !data.ok) {
      showMessage(data.message ?? "Ștergere eșuată.");
      return;
    }

    if (deleteAll) {
      clearLogsFromDashboard();
      setLogsInitialized(true);
    } else {
      setEmailLogs(
        data.logs ?? emailLogs.filter((log) => !selectedLogIds.includes(log.id))
      );
      setSelectedLogIds([]);
      setLogsInitialized(true);
    }

    await Promise.all([fetchDashboard(), fetchLogs()]);
    showMessage(
      deleteAll
        ? `Istoric șters (${data.deletedCount ?? count} intrări).`
        : `${data.deletedCount ?? count} intrări șterse.`
    );
  };

  return (
    <div>
      <AdminHeader
        user={admin}
        title="Email Center"
        subtitle={`${subscribers.length} abonați · ${dashboard?.stats.totalSent ?? 0} emailuri trimise`}
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

      {activeTab === "dashboard" && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard emoji="📨" label="Total emailuri trimise" value={dashboard?.stats.totalSent ?? 0} />
            <MetricCard emoji="📬" label="Emailuri trimise azi" value={dashboard?.stats.sentToday ?? 0} accent="text-emerald-300" />
            <MetricCard emoji="📅" label="Emailuri trimise luna aceasta" value={dashboard?.stats.sentThisMonth ?? 0} accent="text-sky-300" />
            <MetricCard emoji="✅" label="Livrate" value={dashboard?.stats.delivered ?? dashboard?.stats.totalSent ?? 0} accent="text-emerald-300" />
            <MetricCard emoji="❌" label="Eșuate" value={dashboard?.stats.totalFailed ?? 0} accent="text-red-300" />
            <MetricCard emoji="📊" label="Rata de livrare" value={`${dashboard?.stats.deliveryRate ?? 0}%`} accent="text-amber-300" />
            <MetricCard
              emoji="🕐"
              label="Ultimul email trimis"
              value={dashboard?.stats.lastSent ? formatShortDate(dashboard.stats.lastSent.sentAt) : "—"}
              hint={dashboard?.stats.lastSent?.subject ?? undefined}
            />
            <MetricCard
              emoji="📣"
              label="Ultima campanie"
              value={dashboard?.lastCampaign?.title ?? "—"}
              hint={
                dashboard?.lastCampaign
                  ? `${campaignStatusLabel(dashboard.lastCampaign.status)}${
                      dashboard.lastCampaign.sentAt
                        ? ` · ${formatShortDate(dashboard.lastCampaign.sentAt)}`
                        : ""
                    }`
                  : undefined
              }
            />
            <MetricCard emoji="👥" label="Total abonați" value={dashboard?.subscriberCount ?? subscribers.length} />
          </div>

          {chartData.length > 0 && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Emailuri trimise — ultimele 30 zile</h3>
              <div className="flex h-40 items-end gap-1 overflow-x-auto pb-2">
                {chartData.map((day) => {
                  const total = day.sent + day.failed;
                  const height = Math.max(4, Math.round((total / chartMax) * 100));
                  const sentHeight = total > 0 ? Math.round((day.sent / total) * height) : 0;
                  const failedHeight = height - sentHeight;
                  return (
                    <div key={day.date} className="flex min-w-[10px] flex-1 flex-col items-center justify-end gap-1">
                      <div className="flex w-full flex-col justify-end" style={{ height: `${height}%` }}>
                        {failedHeight > 0 && (
                          <div
                            className="w-full rounded-t bg-red-500/60"
                            style={{ height: `${failedHeight}%` }}
                            title={`${day.failed} eșuate`}
                          />
                        )}
                        {sentHeight > 0 && (
                          <div
                            className="w-full rounded-t bg-purple-500"
                            style={{ height: `${sentHeight}%` }}
                            title={`${day.sent} trimise`}
                          />
                        )}
                      </div>
                      <span className="text-[9px] text-gray-600">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                placeholder="Caută destinatar, subiect, message ID..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-500/50"
              />
            </div>
            <select
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500/50"
            >
              <option value="all">Toate tipurile</option>
              {Object.entries({
                welcome: "Bun venit",
                newsletter: "Newsletter",
                order_confirmation: "Confirmare comandă",
                order_processing: "Comandă în procesare",
                order_shipped: "Comandă expediată",
                order_delivered: "Comandă livrată",
                order_cancelled: "Comandă anulată",
                admin_new_order: "Comandă nouă (admin)",
                contact_confirmation: "Confirmare contact",
                contact_admin: "Notificare contact",
                gift_card: "Gift Card",
                store_credit: "NovraCredits",
                review_request: "Cerere recenzie",
                review_approved: "Recenzie aprobată",
                password_reset: "Resetare parolă",
                smtp_test: "Test SMTP",
                general: "General",
              }).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500/50"
            >
              <option value="all">Toate statusurile</option>
              <option value="sent">Trimis</option>
              <option value="failed">Eșuat</option>
            </select>
            <input
              type="date"
              value={logDateFrom}
              onChange={(e) => setLogDateFrom(e.target.value)}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500/50"
            />
            <input
              type="date"
              value={logDateTo}
              onChange={(e) => setLogDateTo(e.target.value)}
              className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500/50"
            />
            <button
              type="button"
              disabled={logsLoading}
              onClick={() => void fetchLogs()}
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Filtrează
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-novra-card/30">
            <div className="border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Mail size={16} className="text-purple-400" />
                  Istoric emailuri
                </h3>
                {displayLogs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={allLogsSelected}
                        onChange={toggleSelectAllLogs}
                        className="rounded border-white/20"
                      />
                      Selectează toate ({selectedLogIds.length}/{displayLogs.length})
                    </label>
                    {selectedLogIds.length > 0 && (
                      <button
                        type="button"
                        disabled={bulkLogsWorking}
                        onClick={() => void handleBulkDeleteLogs(false)}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Șterge selectate
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={bulkLogsWorking}
                      onClick={() => void handleBulkDeleteLogs(true)}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Șterge toate
                    </button>
                  </div>
                )}
              </div>
            </div>
            {displayLogs.length === 0 ? (
              <div className="px-4 py-12 text-center sm:px-6">
                <Mail size={28} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-500">Niciun email înregistrat încă.</p>
              </div>
            ) : (
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-4 sm:px-6 w-10">
                      <input
                        type="checkbox"
                        checked={allLogsSelected}
                        onChange={toggleSelectAllLogs}
                        className="rounded border-white/20"
                        aria-label="Selectează toate intrările"
                      />
                    </th>
                    <th className="px-4 py-4 sm:px-6">Data</th>
                    <th className="px-4 py-4">Email destinatar</th>
                    <th className="px-4 py-4">Tip email</th>
                    <th className="px-4 py-4">Subject</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Message ID</th>
                    <th className="px-4 py-4 sm:px-6">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayLogs.map((log) => (
                    <tr key={log.id} className="text-gray-300">
                      <td className="px-4 py-4 sm:px-6">
                        <input
                          type="checkbox"
                          checked={selectedLogIds.includes(log.id)}
                          onChange={() => toggleLogSelected(log.id)}
                          className="rounded border-white/20"
                          aria-label={`Selectează intrarea ${log.subject}`}
                        />
                      </td>
                      <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">{formatDate(log.sentAt)}</td>
                      <td className="px-4 py-4 font-medium text-white truncate max-w-[180px]">{log.to}</td>
                      <td className="px-4 py-4 text-xs text-purple-300">{typeLabel(log.type)}</td>
                      <td className="px-4 py-4 text-xs text-gray-400 truncate max-w-[200px]">{log.subject}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            log.status === "sent"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                          title={log.error}
                        >
                          {log.status === "sent" ? "Trimis" : "Eșuat"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-[10px] text-gray-500 truncate max-w-[140px]">
                        {log.messageId ?? "—"}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        {editingLogId === log.id ? (
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            <input
                              value={logEditForm.subject}
                              onChange={(e) => setLogEditForm((p) => ({ ...p, subject: e.target.value }))}
                              className="rounded border border-white/10 bg-novra-bg/50 px-2 py-1 text-xs"
                              placeholder="Subject"
                            />
                            <select
                              value={logEditForm.status}
                              onChange={(e) =>
                                setLogEditForm((p) => ({
                                  ...p,
                                  status: e.target.value as "sent" | "failed",
                                }))
                              }
                              className="rounded border border-white/10 bg-novra-bg/50 px-2 py-1 text-xs"
                            >
                              <option value="sent">Trimis</option>
                              <option value="failed">Eșuat</option>
                            </select>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={logsLoading}
                                onClick={() => void handleSaveLogEdit(log.id)}
                                className="rounded bg-purple-600 px-2 py-1 text-xs text-white"
                              >
                                Salvează
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLogId(null)}
                                className="rounded border border-white/10 px-2 py-1 text-xs text-gray-400"
                              >
                                Anulează
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLogId(log.id);
                                setLogEditForm({
                                  to: log.to,
                                  subject: log.subject,
                                  type: log.type,
                                  status: log.status,
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
                            >
                              <Pencil size={12} />
                              Editează
                            </button>
                            <button
                              type="button"
                              disabled={deletingLogId === log.id}
                              onClick={() => void handleDeleteLog(log.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                              Șterge
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === "subscribers" && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
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
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500/50"
              >
                <option value="all">Toate sursele</option>
                <option value="homepage">Homepage</option>
                <option value="account">Cont utilizator</option>
                <option value="admin">Admin</option>
                <option value="other">Altele</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {filteredSubscribers.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-novra-card/30 py-16 text-center">
              <Mail size={32} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">
                {search || sourceFilter !== "all" ? "Niciun rezultat." : "Niciun abonat încă."}
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
                    <th className="px-4 py-4">Sursă</th>
                    <th className="px-4 py-4 sm:px-6">Data abonare</th>
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
                      <td className="px-4 py-4 text-xs text-purple-300">{sourceLabel(sub.source)}</td>
                      <td className="px-4 py-4 sm:px-6 text-xs text-gray-500">{formatShortDate(sub.date)}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          disabled={deletingEmail === sub.email}
                          onClick={() => void handleDeleteSubscriber(sub.email)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          Șterge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "templates" && (
        <>
          <div className="mb-6 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-novra-card/40 to-novra-bg/30 p-5 shadow-lg shadow-purple-900/20 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 text-2xl">
                  📧
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Spune Special Abonaților</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Trimite un mesaj personalizat abonaților newsletter
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={loading || subscribers.length === 0}
                onClick={openSpecialBroadcastForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Megaphone size={16} />
                Compune și trimite
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md flex-1">
              <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                Email pentru teste
              </label>
              <input
                type="email"
                placeholder={admin.email}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="space-y-4">
            {EMAIL_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-white">{template.name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleOpenTemplateEditor(template.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                    >
                      <Pencil size={12} />
                      Editare
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTemplatePreview(template.id, "desktop")}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                    >
                      <Monitor size={12} />
                      Preview Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleTemplatePreview(template.id, "mobile")}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                    >
                      <Smartphone size={12} />
                      Preview Mobile
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleTemplateSendTest(template.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Send size={12} />
                      Trimite email de test
                    </button>
                    <button
                      type="button"
                      disabled={loading || subscribers.length === 0}
                      onClick={() => void openBroadcastForm(template.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
                    >
                      <Megaphone size={12} />
                      Trimite către abonați
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editingTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditingTemplate(null)} />
              <div className="relative z-10 flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-novra-bg-alt shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
                  <h3 className="text-lg font-semibold text-white">Editor șablon — {editingTemplate.name}</h3>
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-400"
                  >
                    Închide
                  </button>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2 lg:p-6">
                  <div className="space-y-3">
                    {[
                      ["subject", "Subject"],
                      ["previewText", "Preview Text"],
                      ["title", "Titlu"],
                      ["subtitle", "Subtitlu"],
                      ["content", "Conținut"],
                      ["buttonText", "Buton principal — text"],
                      ["buttonLink", "Buton principal — link"],
                      ["footer", "Footer"],
                      ["logoUrl", "Logo URL"],
                    ].map(([field, label]) => (
                      <div key={field}>
                        <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">{label}</label>
                        {field === "content" ? (
                          <textarea
                            rows={5}
                            value={editingTemplate.content}
                            onChange={(e) => {
                              const next = { ...editingTemplate, content: e.target.value };
                              setEditingTemplate(next);
                              void refreshTemplatePreview(next);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(editingTemplate[field as keyof EmailTemplateConfig] ?? "")}
                            onChange={(e) => {
                              const next = { ...editingTemplate, [field]: e.target.value } as EmailTemplateConfig;
                              setEditingTemplate(next);
                              void refreshTemplatePreview(next);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                          />
                        )}
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-2">
                      {(["primary", "background", "accent"] as const).map((colorKey) => (
                        <div key={colorKey}>
                          <label className="mb-1 block text-xs uppercase tracking-widest text-gray-500">
                            Culoare {colorKey}
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.colors[colorKey]}
                            onChange={(e) => {
                              const next = {
                                ...editingTemplate,
                                colors: { ...editingTemplate.colors, [colorKey]: e.target.value },
                              };
                              setEditingTemplate(next);
                              void refreshTemplatePreview(next);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleSaveTemplate()}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <Save size={16} />
                        Salvează
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleEditorSendTest()}
                        className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 px-4 py-2.5 text-sm text-purple-200 disabled:opacity-50"
                      >
                        <Send size={16} />
                        Trimite Email Test
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                        <Monitor size={14} />
                        Preview Desktop
                      </p>
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
                        <iframe title="Preview Desktop" srcDoc={editorPreviewDesktop} className="h-[320px] w-full border-0" />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                        <Smartphone size={14} />
                        Preview Mobile
                      </p>
                      <div className="mx-auto max-w-[375px] overflow-hidden rounded-xl border border-white/10 bg-white">
                        <iframe title="Preview Mobile" srcDoc={editorPreviewMobile} className="h-[420px] w-full border-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewHtml && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewHtml(null)} />
              <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-white/10 bg-novra-bg-alt p-4 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Eye size={18} className="text-purple-400" />
                    {previewTitle} — {previewMode === "desktop" ? "Desktop" : "Mobile"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreviewHtml(null)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-400"
                  >
                    Închide
                  </button>
                </div>
                <div className={`mx-auto overflow-hidden rounded-xl border border-white/10 bg-white ${previewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
                  <iframe
                    title={`Preview ${previewTitle}`}
                    srcDoc={previewHtml}
                    className={`w-full border-0 ${previewMode === "mobile" ? "h-[640px]" : "h-[520px]"}`}
                  />
                </div>
              </div>
            </div>
          )}

          {broadcastForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => !broadcastSending && setBroadcastForm(null)}
              />
              <div className="relative z-10 flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-novra-bg-alt shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Megaphone size={18} className="text-purple-400" />
                    {broadcastForm.isSpecial ? "Spune Special Abonaților" : "Trimite șablon către abonați"}
                  </h3>
                  <button
                    type="button"
                    disabled={broadcastSending}
                    onClick={() => setBroadcastForm(null)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-400 disabled:opacity-50"
                  >
                    Închide
                  </button>
                </div>
                <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
                  {!broadcastForm.isSpecial && (
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Șablon</label>
                      <select
                        value={broadcastForm.templateId}
                        disabled={broadcastSending}
                        onChange={(e) => void handleBroadcastTemplateChange(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                      >
                        {EMAIL_TEMPLATES.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Subiect email</label>
                    <input
                      type="text"
                      required
                      disabled={broadcastSending}
                      value={broadcastForm.subject}
                      onChange={(e) => setBroadcastForm((p) => (p ? { ...p, subject: e.target.value } : p))}
                      className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Preview Text (opțional)</label>
                    <input
                      type="text"
                      disabled={broadcastSending}
                      value={broadcastForm.previewText}
                      onChange={(e) => setBroadcastForm((p) => (p ? { ...p, previewText: e.target.value } : p))}
                      className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                    />
                  </div>
                  {broadcastForm.isSpecial && (
                    <>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Titlu email</label>
                        <input
                          type="text"
                          disabled={broadcastSending}
                          value={broadcastForm.title}
                          onChange={(e) => setBroadcastForm((p) => (p ? { ...p, title: e.target.value } : p))}
                          className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Subtitlu (opțional)</label>
                        <input
                          type="text"
                          disabled={broadcastSending}
                          value={broadcastForm.subtitle}
                          onChange={(e) => setBroadcastForm((p) => (p ? { ...p, subtitle: e.target.value } : p))}
                          className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Conținut email</label>
                    <textarea
                      rows={6}
                      required
                      disabled={broadcastSending}
                      value={broadcastForm.content}
                      onChange={(e) => setBroadcastForm((p) => (p ? { ...p, content: e.target.value } : p))}
                      className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Poți folosi variabile: {"{name}"}, {"{email}"}. Conținutul personalizat păstrează stilul șablonului selectat.
                    </p>
                  </div>
                  {broadcastForm.isSpecial && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Buton — text</label>
                        <input
                          type="text"
                          disabled={broadcastSending}
                          value={broadcastForm.buttonText}
                          onChange={(e) => setBroadcastForm((p) => (p ? { ...p, buttonText: e.target.value } : p))}
                          className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Buton — link</label>
                        <input
                          type="url"
                          disabled={broadcastSending}
                          value={broadcastForm.buttonLink}
                          onChange={(e) => setBroadcastForm((p) => (p ? { ...p, buttonLink: e.target.value } : p))}
                          className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl border border-white/10 bg-novra-card/30 p-4">
                    <label className="mb-3 flex items-center gap-2 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        disabled={broadcastSending}
                        checked={broadcastForm.sendToAll}
                        onChange={(e) =>
                          setBroadcastForm((p) =>
                            p
                              ? {
                                  ...p,
                                  sendToAll: e.target.checked,
                                  selectedEmails: e.target.checked ? subscribers.map((s) => s.email) : p.selectedEmails,
                                }
                              : p
                          )
                        }
                        className="rounded border-white/20 bg-novra-bg"
                      />
                      Trimite tuturor abonaților
                    </label>
                    {!broadcastForm.sendToAll && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-widest text-gray-500">Destinatari</p>
                          <button
                            type="button"
                            disabled={broadcastSending}
                            onClick={() =>
                              setBroadcastForm((p) =>
                                p ? { ...p, selectedEmails: subscribers.map((s) => s.email) } : p
                              )
                            }
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                          >
                            Selectează toți
                          </button>
                        </div>
                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-novra-bg/40 p-3">
                          {subscribers.map((sub) => (
                            <label key={sub.email} className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                type="checkbox"
                                disabled={broadcastSending}
                                checked={broadcastForm.selectedEmails.includes(sub.email)}
                                onChange={() => toggleBroadcastRecipient(sub.email)}
                                className="rounded border-white/20 bg-novra-bg"
                              />
                              <span className="truncate">{sub.name !== "—" ? sub.name : sub.email}</span>
                              <span className="truncate text-xs text-gray-500">{sub.email}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-sm text-purple-200">
                      {broadcastForm.sendToAll
                        ? `${subscribers.length} abonați selectați`
                        : `${broadcastForm.selectedEmails.length} abonați selectați`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={broadcastSending}
                      onClick={() => void handleSendBroadcast()}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {broadcastSending ? "Se trimite..." : "Trimite acum"}
                    </button>
                    {broadcastForm.isSpecial && (
                      <>
                        <button
                          type="button"
                          disabled={broadcastSending}
                          onClick={() => void handleBroadcastPreview("desktop")}
                          className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
                        >
                          <Monitor size={16} />
                          Preview Desktop
                        </button>
                        <button
                          type="button"
                          disabled={broadcastSending}
                          onClick={() => void handleBroadcastPreview("mobile")}
                          className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
                        >
                          <Smartphone size={16} />
                          Preview Mobile
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={broadcastSending}
                      onClick={() => setBroadcastForm(null)}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 disabled:opacity-50"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "campaigns" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Campaniile folosesc aceleași date ca modulul Newsletter.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCampaignForm(defaultCampaignForm())}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                <Plus size={16} />
                Campanie nouă
              </button>
            </div>
          </div>

          {campaignForm && (
            <form
              onSubmit={(e) => void handleSaveCampaign(e, !campaignForm.scheduledAt)}
              className="mb-6 rounded-2xl border border-purple-500/20 bg-novra-card/40 p-5 sm:p-6"
            >
              <h3 className="mb-4 text-lg font-semibold text-white">
                {campaignForm.id ? "Editează campanie" : "Campanie nouă (ciornă)"}
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
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Preview Text</label>
                  <input
                    type="text"
                    value={campaignForm.previewText}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, previewText: e.target.value } : p))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Template</label>
                  <select
                    value={campaignForm.templateId}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, templateId: e.target.value } : p))}
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  >
                    {EMAIL_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Destinatari (emailuri, câte unul pe linie)</label>
                  <textarea
                    rows={3}
                    disabled={campaignForm.sendToAll}
                    value={campaignForm.recipients}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, recipients: e.target.value } : p))}
                    placeholder="client@example.com"
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50 disabled:opacity-50"
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={campaignForm.sendToAll}
                      onChange={(e) => setCampaignForm((p) => (p ? { ...p, sendToAll: e.target.checked } : p))}
                    />
                    Trimite tuturor abonaților
                  </label>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
                    Programare dată și oră
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduledAt}
                    onChange={(e) => setCampaignForm((p) => (p ? { ...p, scheduledAt: e.target.value } : p))}
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
                    className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save size={16} />
                  {campaignForm.scheduledAt ? "Programează" : "Salvează Draft"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => void handleSaveCampaign(e, true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-300"
                >
                  <Save size={16} />
                  Salvează ciornă
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
              <p className="text-gray-500">Nicio campanie încă.</p>
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
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full px-2 py-0.5 ${campaignStatusClass(campaign.status)}`}>
                          {campaignStatusLabel(campaign.status)}
                        </span>
                        {campaign.scheduledAt && campaign.status === "scheduled" && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Calendar size={12} />
                            {formatDate(campaign.scheduledAt)}
                          </span>
                        )}
                        {campaign.sentAt && (
                          <span className="text-gray-500">
                            {formatShortDate(campaign.sentAt)} · {campaign.sentCount ?? 0} trimise
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(campaign.status === "draft" || campaign.status === "scheduled") && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCampaignForm({
                                id: campaign.id,
                                title: campaign.title,
                                subject: campaign.subject,
                                previewText: campaign.previewText ?? "",
                                body: campaign.body,
                                templateId: campaign.templateId ?? "newsletter",
                                recipients: (campaign.recipients ?? []).join("\n"),
                                sendToAll: campaign.sendToAll !== false,
                                scheduledAt: campaign.scheduledAt
                                  ? campaign.scheduledAt.slice(0, 16)
                                  : "",
                              })
                            }
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300"
                          >
                            Editează
                          </button>
                          <button
                            type="button"
                            disabled={sendingCampaignId === campaign.id || loading}
                            onClick={() => void handleSendCampaign(campaign.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-xs text-white disabled:opacity-50"
                          >
                            <Send size={12} />
                            {sendingCampaignId === campaign.id ? "Se trimite..." : "Trimite acum"}
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

      {activeTab === "automations" && automations && (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
            <Zap size={20} className="text-purple-400" />
            Automatizări email
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            Confirmarea comenzii este legată de setarea orderEmailsEnabled. EMAILS_ENABLED=true este necesar global.
          </p>
          <div className="space-y-4">
            {AUTOMATION_LABELS.map(({ key, label }) => {
              const meta: EmailAutomationMeta = automations[key];
              return (
              <div
                key={key}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-novra-bg/30 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-medium text-white">{label}</span>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>Status: {meta.enabled ? "Activ" : "Inactiv"}</span>
                      <span>
                        Ultima rulare: {meta.lastRunAt ? formatDate(meta.lastRunAt) : "—"}
                      </span>
                      <span>Trimise: {meta.sentCount}</span>
                    </div>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-3">
                    <span className="text-xs text-gray-500">{meta.enabled ? "ON" : "OFF"}</span>
                    <input
                      type="checkbox"
                      checked={meta.enabled}
                      disabled={loading}
                      onChange={(e) => void handleToggleAutomation(key, e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      className={`relative h-7 w-12 rounded-full transition ${
                        meta.enabled ? "bg-purple-600" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                          meta.enabled ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </span>
                  </label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-xs text-gray-500">Întârziere (minute)</label>
                  <input
                    type="number"
                    min={0}
                    value={meta.delayMinutes}
                    disabled={loading}
                    onChange={(e) =>
                      void handleAutomationDelay(key, Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full max-w-[140px] rounded-xl border border-white/10 bg-novra-bg/50 px-3 py-2 text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {activeTab === "smtp" && smtpInfo && (
        <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-5 sm:p-6 space-y-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Server size={20} className="text-purple-400" />
            Configurare SMTP
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Host</p>
              <p className="mt-1 font-mono text-sm text-white">{smtpInfo.host}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Port</p>
              <p className="mt-1 font-mono text-sm text-white">{smtpInfo.port}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Email</p>
              <p className="mt-1 font-mono text-sm text-white">{smtpInfo.email}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Status conexiune</p>
              <p
                className={`mt-1 text-sm font-medium ${
                  smtpInfo.connectionStatus === "connected"
                    ? "text-emerald-300"
                    : smtpInfo.connectionStatus === "error"
                      ? "text-red-300"
                      : "text-amber-300"
                }`}
              >
                {connectionLabel(smtpInfo.connectionStatus)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                EMAILS_ENABLED: {smtpInfo.emailsEnabled ? "true" : "false"} · SMTP configurat:{" "}
                {smtpInfo.configured ? "da" : "nu"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Ultimul test</p>
              <p className="mt-1 text-sm text-white">
                {smtpInfo.lastTest ? formatDate(smtpInfo.lastTest.testedAt) : "—"}
              </p>
              <p className={`mt-1 text-xs ${smtpInfo.lastTest?.ok ? "text-emerald-300" : "text-red-300"}`}>
                {smtpInfo.lastTest?.message ?? "Niciun test încă"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Ultima eroare</p>
              <p className="mt-1 text-sm text-red-300">{smtpInfo.lastError ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Ultimul email trimis</p>
              <p className="mt-1 text-sm text-white">
                {smtpInfo.lastEmailSent
                  ? `${smtpInfo.lastEmailSent.to} · ${formatDate(smtpInfo.lastEmailSent.sentAt)}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-500">{smtpInfo.lastEmailSent?.subject ?? ""}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-novra-bg/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Verificare configurație</p>
              <ul className="mt-2 space-y-1 text-xs text-gray-400">
                <li>SMTP_HOST: {smtpInfo.configCheck.host ? "✓" : "✗"}</li>
                <li>SMTP_USER: {smtpInfo.configCheck.user ? "✓" : "✗"}</li>
                <li>SMTP_PASS: {smtpInfo.configCheck.pass ? "✓" : "✗"}</li>
                <li>SMTP_FROM: {smtpInfo.configCheck.from ? "✓" : "✗"}</li>
                <li>EMAILS_ENABLED: {smtpInfo.configCheck.emailsEnabled ? "✓" : "✗"}</li>
              </ul>
              <p className={`mt-2 text-xs ${smtpInfo.configCheck.allPresent ? "text-emerald-300" : "text-amber-300"}`}>
                {smtpInfo.configCheck.allPresent ? "Configurație completă" : "Configurație incompletă"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSmtpVerify()}
              className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 px-5 py-3 text-sm font-semibold text-purple-200 disabled:opacity-50"
            >
              <Server size={16} />
              Testează SMTP
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-widest text-gray-500">
              Trimite email de test
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder={admin.email}
                value={smtpTestEmail}
                onChange={(e) => setSmtpTestEmail(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSmtpTest()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Send size={16} />
                Trimite Email Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
