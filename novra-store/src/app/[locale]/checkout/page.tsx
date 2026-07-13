"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowLeft, CheckCircle, CreditCard, Banknote, Tag, Loader2, Coins } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { saveOrder, generatePurchaseCode, loadOrders, type Order } from "@/lib/orders";
import { getAffiliateRef } from "@/lib/affiliate-attribution";
import { getCampaignRef } from "@/lib/campaign-attribution";
import { loadCampaignBySlug } from "@/lib/campaigns";
import { loadProductOverrides, validateCartStock } from "@/lib/catalog";
import CopyButton from "@/components/CopyButton";
import { getCurrentUser, addOrderIdToLocalUser, getNovraCredits, refreshCurrentUserFromServer, type User } from "@/lib/auth";
import CheckoutAuthSection, { type CheckoutAuthMode } from "@/components/checkout/CheckoutAuthSection";
import GuestAccountPrompt from "@/components/checkout/GuestAccountPrompt";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  calculateDiscountAmount,
  discountAppliesToProducts,
  discountIncludesFreeShipping,
  formatDiscountValue,
  validateDiscountCode,
  type AppliedDiscount,
} from "@/lib/discount-codes";

function buildInitialFormData() {
  const user = typeof window !== "undefined" ? getCurrentUser() : null;
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? user?.shippingAddress?.phone ?? "",
    address: user?.shippingAddress?.addressLine ?? user?.address ?? "",
    city: user?.shippingAddress?.city ?? "",
    notes: "",
  };
}

type StripeConfig = {
  available: boolean;
  configured: boolean;
  enabled: boolean;
};

export default function CheckoutPage() {
  const tc = useTranslations("common");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-novra-bg text-white flex items-center justify-center">
          <p className="text-gray-500 text-sm">{tc("loading")}</p>
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const { items, totalPrice, clearCart, hydrated } = useCart();
  const { freeShippingThreshold, deliveryCost, cardPaymentEnabled } = useSiteSettings();
  const [status, setStatus] = useState<"idle" | "sending" | "redirecting" | "success" | "error">("idle");
  const [stripeRedirectUrl, setStripeRedirectUrl] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState(buildInitialFormData);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ramburs">("ramburs");
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [authMode, setAuthMode] = useState<CheckoutAuthMode>("guest");
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(() =>
    typeof window !== "undefined" ? getCurrentUser() : null
  );
  const [useCredits, setUseCredits] = useState(false);
  const [campaignDiscount, setCampaignDiscount] = useState<{
    slug: string;
    percent: number;
    title: string;
  } | null>(null);

  const currentUser = authenticatedUser ?? getCurrentUser();
  const userCredits = getNovraCredits(currentUser);
  const canUseCredits = Boolean(currentUser) && userCredits > 0;

  const canShowCheckoutForm = Boolean(currentUser) || authMode === "guest";

  const cancelled = searchParams.get("cancelled") === "1";
  const cardAvailable = Boolean(stripeConfig?.available && cardPaymentEnabled);

  useEffect(() => {
    const slug = getCampaignRef();
    if (!slug) return;
    void loadCampaignBySlug(slug).then((campaign) => {
      if (campaign && campaign.discountPercent > 0) {
        setCampaignDiscount({
          slug: campaign.slug,
          percent: campaign.discountPercent,
          title: campaign.title,
        });
      }
    });
  }, []);

  useEffect(() => {
    void fetch("/api/store/stripe/config")
      .then((res) => res.json())
      .then((data: StripeConfig) => setStripeConfig(data))
      .catch(() => setStripeConfig({ available: false, configured: false, enabled: cardPaymentEnabled }));
  }, [cardPaymentEnabled]);

  useEffect(() => {
    if (hydrated && items.length === 0 && status !== "success" && status !== "redirecting") {
      router.replace("/cos");
    }
  }, [hydrated, items.length, status, router]);

  useEffect(() => {
    if (!hydrated || items.length === 0 || status === "success") return;

    const email = (currentUser?.email ?? formData.email).trim().toLowerCase();
    if (!email || !email.includes("@")) return;

    const timer = window.setTimeout(() => {
      void fetch("/api/store/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items,
          totalPrice,
        }),
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [hydrated, items, totalPrice, formData.email, currentUser?.email, status]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-novra-bg text-white">
        <Navbar />
        <main className="pb-page px-4 sm:px-6 md:px-12 max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">{tc("loadingCart")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && status !== "success") {
    return (
      <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
        <Navbar />
        <main className="pb-page px-4 sm:px-6 md:px-12 max-w-4xl mx-auto text-center">
          <p className="text-gray-300 mb-6">{t("emptyCart")}</p>
          <Link
            href="/produse"
            className="inline-flex items-center justify-center min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-all touch-manipulation"
          >
            {tc("viewProducts")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const productDiscountApplies = appliedDiscount
    ? discountAppliesToProducts(appliedDiscount)
    : false;
  const freeShippingFromCode = appliedDiscount
    ? discountIncludesFreeShipping(appliedDiscount)
    : false;

  const campaignDiscountAmount =
    campaignDiscount && campaignDiscount.percent > 0
      ? Math.round(totalPrice * (campaignDiscount.percent / 100) * 100) / 100
      : 0;

  const discountAmount =
    appliedDiscount && productDiscountApplies
      ? calculateDiscountAmount(totalPrice, appliedDiscount)
      : 0;
  const subtotalAfterDiscount = Math.max(0, totalPrice - discountAmount - campaignDiscountAmount);
  const thresholdFreeShipping = subtotalAfterDiscount >= freeShippingThreshold;
  const shippingCost =
    freeShippingFromCode || thresholdFreeShipping ? 0 : deliveryCost;
  const totalBeforeCredits = subtotalAfterDiscount + shippingCost;
  const creditsToApply =
    useCredits && canUseCredits
      ? Math.min(userCredits, Math.round(totalBeforeCredits * 100) / 100)
      : 0;
  const orderTotal = Math.max(0, totalBeforeCredits - creditsToApply);
  const fullyPaidWithCredits = creditsToApply > 0 && orderTotal === 0;

  const formatOrderMessage = (purchaseCode?: string) => {
    const lines = items.map(
      (item) =>
        `- ${item.title} (${item.variantLabel}) x${item.quantity} = ${(item.unitPrice * item.quantity).toFixed(2)} RON`
    );
    return [
      "COMANDĂ NOVRA",
      purchaseCode ? `Cod comandă: ${purchaseCode}` : "",
      "",
      "Produse:",
      ...lines,
      "",
      `Subtotal: ${totalPrice.toFixed(2)} RON`,
      appliedDiscount && discountAmount > 0
        ? `Reducere (${appliedDiscount.code}): -${discountAmount.toFixed(2)} RON`
        : "",
      campaignDiscount && campaignDiscountAmount > 0
        ? `Reducere campanie (${campaignDiscount.title}): -${campaignDiscountAmount.toFixed(2)} RON`
        : "",
      freeShippingFromCode && appliedDiscount
        ? `Livrare gratuită (cod ${appliedDiscount.code})`
        : `Livrare: ${shippingCost === 0 ? "Gratuită" : `${shippingCost.toFixed(2)} RON`}`,
      creditsToApply > 0 ? `NovraCredits: -${creditsToApply.toFixed(2)} RON` : "",
      `Total: ${orderTotal.toFixed(2)} RON`,
      "",
      `Metodă plată: ${
        fullyPaidWithCredits
          ? "NovraCredits"
          : paymentMethod === "card"
            ? "Plată cu cardul"
            : "Ramburs (numerar la livrare)"
      }`,
      "",
      "Date livrare:",
      `Nume: ${formData.name}`,
      `Email: ${formData.email}`,
      `Telefon: ${formData.phone}`,
      `Adresă: ${formData.address}`,
      `Oraș: ${formData.city}`,
      formData.notes ? `Observații: ${formData.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleApplyDiscount = async () => {
    setDiscountError("");
    setDiscountSuccess("");
    setDiscountLoading(true);
    const userEmail = (getCurrentUser()?.email ?? formData.email).trim().toLowerCase();
    const result = await validateDiscountCode(discountInput, userEmail || undefined);
    setDiscountLoading(false);

    if (!result.ok) {
      setDiscountError(result.message);
      setAppliedDiscount(null);
      return;
    }

    setAppliedDiscount(result.discount);
    setDiscountInput(result.discount.code);
    setDiscountSuccess(t("codeApplied"));
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError("");
    setDiscountSuccess("");
  };

  const buildOrder = async (): Promise<Order> => {
    const now = new Date().toISOString();
    const activeUser = getCurrentUser();
    const userEmail = (activeUser?.email ?? formData.email).trim().toLowerCase();
    const userName = formData.name.trim();
    const isGuest = !activeUser && authMode === "guest";
    const userId = isGuest ? `guest-${Date.now()}` : (activeUser?.id ?? userEmail);
    const effectivePaymentMethod = fullyPaidWithCredits ? "credits" : paymentMethod;

    const existingOrders = await loadOrders();
    const purchaseCode = generatePurchaseCode(existingOrders.map((o) => o.purchaseCode));
    const affiliateRef = getAffiliateRef();
    const campaignSlug = campaignDiscount?.slug ?? getCampaignRef() ?? undefined;

    return {
      id: `order-${Date.now()}`,
      userId,
      userEmail,
      userName,
      isGuest: isGuest || undefined,
      createdAt: now,
      updatedAt: now,
      purchaseCode,
      items: items.map((item) => ({
        productId: item.productId,
        title: item.title,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      total: orderTotal,
      shipping: shippingCost,
      paymentMethod: effectivePaymentMethod,
      paymentStatus:
        effectivePaymentMethod === "credits"
          ? "paid"
          : effectivePaymentMethod === "card"
            ? "pending"
            : undefined,
      creditsUsed: creditsToApply > 0 ? creditsToApply : undefined,
      discountCode: appliedDiscount?.code,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      campaignSlug,
      campaignDiscountPercent: campaignDiscount?.percent,
      campaignDiscountAmount: campaignDiscountAmount > 0 ? campaignDiscountAmount : undefined,
      discountFreeShipping: freeShippingFromCode || undefined,
      address: { ...formData, name: userName, email: userEmail },
      status: "pending",
      affiliateCode: affiliateRef ?? undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setStripeError("");

    await loadProductOverrides();
    const stockCheck = validateCartStock(items);
    if (!stockCheck.ok) {
      setStripeError(stockCheck.message);
      setStatus("error");
      return;
    }

    const activeUser = getCurrentUser();
    const userEmail = (activeUser?.email ?? formData.email).trim().toLowerCase();
    const order = await buildOrder();

    const saveResult = await saveOrder(order);
    if (!saveResult.ok) {
      setStripeError(saveResult.message);
      setStatus("error");
      return;
    }

    const finalOrder = saveResult.order;
    await loadProductOverrides();

    if (activeUser) {
      addOrderIdToLocalUser(userEmail, finalOrder.id);
      if (creditsToApply > 0) {
        await refreshCurrentUserFromServer();
      }
    }

    if (paymentMethod === "card" && cardAvailable && !fullyPaidWithCredits) {
      try {
        const response = await fetch("/api/store/stripe/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: finalOrder.id }),
        });

        const data = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !data.url) {
          setStripeError(data.error ?? t("stripeInitError"));
          setStatus("error");
          return;
        }

        // Defer clearCart until payment succeeds — clearing here races with redirect on
        // mobile (empty cart triggers router.replace("/cos") before Stripe navigation).
        setStripeRedirectUrl(data.url);
        setStatus("redirecting");
        window.location.assign(data.url);
        return;
      } catch {
        setStripeError(t("stripeNetworkError"));
        setStatus("error");
        return;
      }
    }

    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "b7020925-857c-4f6e-97eb-23f4c1139e97",
          subject: `Comandă nouă NOVRA - ${formData.name} (${finalOrder.purchaseCode})`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formatOrderMessage(finalOrder.purchaseCode),
          from_name: "NOVRA Checkout",
        }),
      });
    } catch {
      /* optional notification */
    }

    setPlacedOrder(finalOrder);
    clearCart();
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
        <Navbar />
        <main className="pb-page px-4 sm:px-6 md:px-12 max-w-2xl mx-auto text-center">
          <CheckCircle size={56} className="mx-auto text-green-500 mb-6" />
          <h1 className="text-4xl font-bold tracking-tighter mb-4">{t("orderSent")}</h1>
          <p className="text-gray-300 mb-4 leading-relaxed px-2">{t("successConfirmEmail")}</p>
          {placedOrder?.purchaseCode && (
            <div className="mb-8 inline-flex flex-col items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/10 px-6 py-4">
              <p className="text-xs uppercase tracking-widest text-gray-400">{t("purchaseCode")}</p>
              <p className="font-mono text-lg font-semibold text-purple-300">{placedOrder.purchaseCode}</p>
              <CopyButton text={placedOrder.purchaseCode} label={t("copyCode")} />
              <p className="text-xs text-gray-500">{t("keepCodeRef")}</p>
            </div>
          )}
          {placedOrder?.isGuest && !getCurrentUser() && (
            <GuestAccountPrompt order={placedOrder} />
          )}
          <button
            type="button"
            onClick={() => router.push("/produse")}
            className="min-h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-10 py-4 rounded-xl text-sm transition-all touch-manipulation"
          >
            {t("backToProducts")}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-novra-bg text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="pb-page px-4 sm:px-6 md:px-12 max-w-4xl mx-auto">
        <Link
          href="/cos"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-purple-400 uppercase tracking-widest mb-8 transition-colors group touch-manipulation min-h-11"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {t("backToCart")}
        </Link>

        {cancelled && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {t("paymentCancelled")}
          </div>
        )}

        <div className="border-b border-white/10 pb-10 mb-10">
          <span className="text-purple-500 text-xs font-semibold tracking-[0.3em] uppercase block mb-3">
            {t("checkoutLabel")}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter">{t("placeOrderTitle")}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="order-2 lg:order-1">
            <CheckoutAuthSection
              mode={authMode}
              onModeChange={setAuthMode}
              onAuthSuccess={(user) => {
                setAuthenticatedUser(user);
                setFormData({
                  name: user.name,
                  email: user.email,
                  phone: user.phone ?? user.shippingAddress?.phone ?? "",
                  address: user.shippingAddress?.addressLine ?? user.address ?? "",
                  city: user.shippingAddress?.city ?? "",
                  notes: "",
                });
              }}
            />

            {canShowCheckoutForm ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* form fields - same as before */}
            <div>
              <label htmlFor="checkout-name" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("fullName")} *
              </label>
              <input
                id="checkout-name"
                required
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full min-h-11 bg-novra-surface/70 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="checkout-email" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("email")} *
              </label>
              <input
                id="checkout-email"
                required
                type="email"
                autoComplete="email"
                inputMode="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full min-h-11 bg-novra-surface/70 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="checkout-phone" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("phone")} *
              </label>
              <input
                id="checkout-phone"
                required
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full min-h-11 bg-novra-surface/70 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="checkout-address" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("shippingAddress")} *
              </label>
              <input
                id="checkout-address"
                required
                type="text"
                autoComplete="street-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full min-h-11 bg-novra-surface/70 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="checkout-city" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("city")} *
              </label>
              <input
                id="checkout-city"
                required
                type="text"
                autoComplete="address-level2"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full min-h-11 bg-novra-surface/70 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="checkout-discount" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("discountCode")}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400/60" />
                  <input
                    id="checkout-discount"
                    type="text"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                    placeholder="NOVRA10-XXXXXX"
                    disabled={Boolean(appliedDiscount)}
                    className="w-full min-h-11 bg-novra-surface/70 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-60"
                  />
                </div>
                {appliedDiscount ? (
                  <button
                    type="button"
                    onClick={handleRemoveDiscount}
                    className="min-h-11 shrink-0 rounded-xl border border-white/10 px-4 text-xs text-gray-300 hover:bg-white/5"
                  >
                    {t("remove")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={discountLoading || !discountInput.trim()}
                    className="min-h-11 shrink-0 rounded-xl bg-purple-600/20 border border-purple-500/30 px-4 text-xs font-semibold text-purple-200 hover:bg-purple-600/30 disabled:opacity-50"
                  >
                    {discountLoading ? "..." : t("applyDiscount")}
                  </button>
                )}
              </div>
              {appliedDiscount && (
                <p className="mt-2 text-xs text-emerald-400">
                  {discountSuccess || t("codeApplied")}
                  {productDiscountApplies && discountAmount > 0 && (
                    <>
                      {" "}
                      {t("discountAmount")} {formatDiscountValue(appliedDiscount.type, appliedDiscount.value)} (−
                      {discountAmount.toFixed(2)} RON)
                    </>
                  )}
                  {freeShippingFromCode && (
                    <>
                      {productDiscountApplies && discountAmount > 0 ? " · " : " "}
                      {t("freeShipping")}
                    </>
                  )}
                </p>
              )}
              {discountError && <p className="mt-2 text-xs text-red-400">{discountError}</p>}
            </div>

            {canUseCredits && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-600/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={useCredits}
                    onChange={(e) => setUseCredits(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-novra-surface text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Coins size={16} className="text-purple-400" />
                      {t("useNovraCredits")}
                    </span>
                    <p className="mt-1 text-xs text-gray-400">
                      {t("creditsAvailable", { credits: userCredits })}
                      {useCredits && creditsToApply > 0 && (
                        <span className="text-emerald-400">
                          {t("creditsApplying", { amount: creditsToApply.toFixed(2) })}
                        </span>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 block mb-3">
                {t("paymentMethod")} *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => !fullyPaidWithCredits && setPaymentMethod("ramburs")}
                  disabled={fullyPaidWithCredits}
                  className={`flex items-center gap-3 p-4 min-h-11 rounded-xl border text-left transition-all touch-manipulation ${
                    fullyPaidWithCredits ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    paymentMethod === "ramburs" || fullyPaidWithCredits
                      ? "bg-purple-600/10 border-purple-500 text-white"
                      : "bg-novra-surface/70 border-white/10 text-gray-300 hover:border-white/20"
                  }`}
                >
                  <Banknote size={22} className={paymentMethod === "ramburs" ? "text-purple-400" : ""} />
                  <div>
                    <span className="block text-sm font-semibold text-white">{t("ramburs")}</span>
                    <span className="block text-xs mt-0.5 opacity-70">{t("rambursDesc")}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => !fullyPaidWithCredits && cardAvailable && setPaymentMethod("card")}
                  disabled={!cardAvailable || fullyPaidWithCredits}
                  className={`flex items-center gap-3 p-4 min-h-11 rounded-xl border text-left transition-all touch-manipulation ${
                    !cardAvailable || fullyPaidWithCredits ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    paymentMethod === "card" && !fullyPaidWithCredits
                      ? "bg-purple-600/10 border-purple-500 text-white"
                      : "bg-novra-surface/70 border-white/10 text-gray-300 hover:border-white/20"
                  }`}
                >
                  <CreditCard size={22} className={paymentMethod === "card" ? "text-purple-400" : ""} />
                  <div>
                    <span className="block text-sm font-semibold text-white">{t("cardPayment")}</span>
                    <span className="block text-xs mt-0.5 opacity-70">
                      {cardAvailable ? t("stripeSecure") : t("cardUnavailable")}
                    </span>
                  </div>
                </button>
              </div>
              {fullyPaidWithCredits && (
                <p className="mt-2 text-xs text-emerald-400">{t("paidFullyWithCredits")}</p>
              )}
              {cardPaymentEnabled && !cardAvailable && !fullyPaidWithCredits && stripeConfig !== null && (
                <p className="mt-2 text-xs text-amber-400/90">{t("stripeNotConfigured")}</p>
              )}
            </div>

            <div>
              <label htmlFor="checkout-notes" className="text-xs uppercase tracking-widest text-gray-500 block mb-2">
                {t("observations")}
              </label>
              <textarea
                id="checkout-notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-novra-surface/70 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
              />
            </div>

            {status === "error" && (
              <p className="text-red-400 text-sm">
                {stripeError || tc("error")}
              </p>
            )}

            {status === "redirecting" && stripeRedirectUrl && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-100">
                <p className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  {t("stripeRedirect")}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {t("redirectManual")}{" "}
                  <a
                    href={stripeRedirectUrl}
                    className="text-purple-300 underline underline-offset-2 touch-manipulation"
                  >
                    {t("clickToPay")}
                  </a>
                  .
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending" || status === "redirecting"}
              className="w-full min-h-11 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl text-sm uppercase tracking-wider transition-all shadow-xl touch-manipulation inline-flex items-center justify-center gap-2"
            >
              {(status === "sending" || status === "redirecting") && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {status === "redirecting"
                ? t("stripeRedirect")
                : status === "sending"
                  ? t("processing")
                  : fullyPaidWithCredits
                    ? t("payWithCredits")
                    : paymentMethod === "card" && cardAvailable && !fullyPaidWithCredits
                      ? t("payNow", { total: orderTotal.toFixed(2) })
                      : t("sendOrder", { total: orderTotal.toFixed(2) })}
            </button>
          </form>
            ) : (
              <p className="rounded-xl border border-white/10 bg-novra-card/20 px-4 py-4 text-sm text-gray-400">
                {t("authRequired")}
              </p>
            )}
          </div>

          <div className="bg-novra-card/30 border border-white/8 rounded-2xl p-5 sm:p-6 h-fit order-1 lg:order-2">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-4">
              {t("orderSummary")}
            </h2>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm gap-3">
                  <span className="text-gray-300 min-w-0">
                    {item.title}{" "}
                    <span className="text-gray-500">({item.variantLabel}) x{item.quantity}</span>
                  </span>
                  <span className="text-white font-medium shrink-0">
                    {(item.unitPrice * item.quantity).toFixed(2)} RON
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>{t("subtotalProducts")}</span>
                <span>{totalPrice.toFixed(2)} RON</span>
              </div>
              {discountAmount > 0 && appliedDiscount && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>{t("discountAmount")} ({appliedDiscount.code})</span>
                  <span>−{discountAmount.toFixed(2)} RON</span>
                </div>
              )}
              {campaignDiscountAmount > 0 && campaignDiscount && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>{t("campaign")} ({campaignDiscount.title})</span>
                  <span>−{campaignDiscountAmount.toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-300">
                <span>
                  {t("shipping")}
                  {freeShippingFromCode && appliedDiscount && (
                    <span className="text-emerald-400"> {t("freeShippingCode", { code: appliedDiscount.code })}</span>
                  )}
                </span>
                <span className={freeShippingFromCode ? "text-emerald-400" : undefined}>
                  {shippingCost === 0 ? t("freeShipping") : `${shippingCost.toFixed(2)} RON`}
                </span>
              </div>
              {shippingCost > 0 && !freeShippingFromCode && (
                <p className="text-xs text-purple-300">
                  {t("freeShippingOver", { threshold: freeShippingThreshold })}
                </p>
              )}
              {creditsToApply > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>{t("useNovraCredits")}</span>
                  <span>−{creditsToApply.toFixed(2)} RON</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-300">
                <span>{t("paymentLabel")}</span>
                <span>
                  {fullyPaidWithCredits
                    ? t("useNovraCredits")
                    : paymentMethod === "card"
                      ? t("cardPayment")
                      : t("ramburs")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">{tc("total")}</span>
                <span className="text-xl font-bold text-purple-400">{orderTotal.toFixed(2)} RON</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
