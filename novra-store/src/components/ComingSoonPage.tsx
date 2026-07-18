"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Clock,
  Mail,
  MessageCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  Gem,
  Cpu,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import {
  COUNTDOWN_STATIC_ARIA_LABEL,
  formatCountdownCompact,
  padTimeUnit,
  type TimeLeft,
} from "@/lib/countdown";
import { useLiveCountdown } from "@/hooks/useLiveCountdown";
import { addNewsletterSubscriber } from "@/lib/newsletter";
import { parseIsoDate } from "@/lib/datetime";
import { buildWhatsAppUrl } from "@/lib/store";
import CopyButton from "@/components/CopyButton";
import type { ComingSoonSettings } from "@/lib/site-settings";

const COMING_SOON_COUNTDOWN_ID = "coming-soon-countdown";

type ComingSoonPageProps = {
  settings: ComingSoonSettings;
  whatsappNumber: string;
  instagramUrl?: string;
  initialTimeLeft?: TimeLeft | null;
  newsletterDiscountPercent?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
};

const FEATURE_ICONS = [Zap, Cpu, ShieldCheck, Gem] as const;

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3.25rem] sm:min-w-[4.5rem]">
      <span
        className="text-2xl sm:text-4xl md:text-5xl font-bold tabular-nums text-white leading-none"
        suppressHydrationWarning
      >
        {padTimeUnit(value)}
      </span>
      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-purple-200/70 mt-2">
        {label}
      </span>
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((width * height) / 10000);
      particles = Array.from({ length: Math.max(32, Math.min(count, 100)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      }));
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${particle.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      window.cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

function getCountdownDate(settings: ComingSoonSettings): Date | null {
  return parseIsoDate(settings.countdownDate ?? "2026-08-11T23:59:59+03:00");
}

export default function ComingSoonPage({
  settings,
  whatsappNumber,
  instagramUrl,
  initialTimeLeft,
  newsletterDiscountPercent = 10,
}: ComingSoonPageProps) {
  const t = useTranslations("comingSoon");
  const tCopy = useTranslations("copy");
  const headline = settings.headline?.trim() || t("defaultHeadline");
  const subtitle = settings.subtitle?.trim() || t("defaultSubtitle");
  const showNewsletter = settings.showNewsletter !== false;

  const target = getCountdownDate(settings);
  const { timeLeft, launched, mounted, invalidDate } = useLiveCountdown(target, {
    initialTimeLeft,
  });

  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "sending" | "success" | "duplicate" | "error"
  >("idle");
  const [newsletterDiscountCode, setNewsletterDiscountCode] = useState("");

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewsletterStatus("sending");

    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const emailValue = emailInput?.value ?? "";

    const result = await addNewsletterSubscriber(emailValue, { source: "other" });

    if (result.ok) {
      if (result.alreadySubscribed) {
        setNewsletterStatus("duplicate");
        setNewsletterDiscountCode(result.discountCode ?? "");
      } else {
        setNewsletterStatus("success");
        setNewsletterDiscountCode(result.discountCode ?? "");
        form.reset();
      }
    } else {
      setNewsletterStatus("error");
      setNewsletterDiscountCode("");
    }
  };

  const renderDiscountCodeSuccess = (status: "success" | "duplicate") => (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-center">
      <p className="text-sm font-medium text-emerald-400">
        {status === "success" ? t("successMessage") : t("duplicateMessage")}
      </p>
      {newsletterDiscountCode ? (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">
            {t("discountCodeLabel")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-xl border border-emerald-500/40 bg-black/40 px-4 py-2.5 font-mono text-base font-bold tracking-wider text-white sm:text-lg">
              {newsletterDiscountCode}
            </span>
            <CopyButton text={newsletterDiscountCode} label={t("copyCode")} copiedLabel={tCopy("copied")} />
          </div>
          <p className="text-xs text-emerald-300/80">
            {t("discountHint", { percent: newsletterDiscountPercent })}
          </p>
        </div>
      ) : status === "duplicate" ? (
        <p className="mt-2 text-sm text-purple-300">{t("duplicateNoCode")}</p>
      ) : null}
    </div>
  );

  const featureKeys = ["power120w", "ganTech", "warranty", "premium"] as const;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#06060c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-20%,rgba(139,92,246,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_100%,rgba(217,70,239,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-purple-600/12 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
      <ParticleCanvas />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-4xl flex-col items-center justify-center px-4 py-10 sm:px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="mb-6 sm:mb-8 animate-[fadeIn_0.8s_ease-out]">
          <Image
            src="/logo.png"
            alt="NOVRA"
            width={180}
            height={58}
            className="h-14 sm:h-16 w-auto drop-shadow-[0_0_24px_rgba(168,85,247,0.35)]"
            priority
          />
        </div>

        <p className="mb-6 text-center text-[10px] sm:text-xs uppercase tracking-[0.35em] text-purple-300/80 font-medium">
          {t("socialProof")}
        </p>

        <div className="w-full rounded-3xl border border-purple-500/25 bg-gradient-to-b from-novra-card/50 to-novra-card/20 p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-purple-950/50">
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-purple-100">
              <Sparkles size={12} className="text-purple-300 animate-pulse" aria-hidden />
              {t("badge")}
            </span>
          </div>

          <h1 className="text-center text-2xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight leading-[1.15] mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300">
              {headline}
            </span>
          </h1>

          <p className="text-center text-sm sm:text-base text-gray-300/90 max-w-xl mx-auto leading-relaxed mb-8">
            {subtitle}
          </p>

          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {featureKeys.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-purple-500/15 bg-black/20 px-3 py-4 text-center backdrop-blur-sm transition hover:border-purple-400/30 hover:bg-purple-500/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/25">
                    <Icon size={18} className="text-purple-300" aria-hidden />
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-purple-100/90 leading-tight">
                    {t(`features.${key}`)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mb-8 sm:mb-10">
            <div className="mb-3 flex items-center justify-center gap-2 text-purple-200/80">
              <Clock size={14} aria-hidden />
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em]">
                {t("countdownLabel")}
              </span>
            </div>

            <div
              id={COMING_SOON_COUNTDOWN_ID}
              data-hydrated={mounted ? "true" : undefined}
              className="mx-auto flex w-fit items-center gap-2 sm:gap-3 rounded-2xl border border-purple-400/25 bg-black/30 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-md shadow-inner shadow-purple-900/20"
              aria-live="polite"
              aria-atomic="true"
              aria-label={
                invalidDate
                  ? t("invalidDate")
                  : launched
                    ? t("launched")
                    : mounted
                      ? t("timeRemaining", { time: formatCountdownCompact(timeLeft) })
                      : COUNTDOWN_STATIC_ARIA_LABEL
              }
              suppressHydrationWarning
            >
              {invalidDate ? (
                <p className="text-sm text-red-300">{t("invalidDate")}</p>
              ) : launched ? (
                <p className="text-lg sm:text-xl font-semibold text-purple-200">{t("launched")}</p>
              ) : (
                <>
                  <TimeBlock value={timeLeft.days} label={t("days")} />
                  <span className="pb-5 text-xl sm:text-2xl font-bold text-purple-400/80" aria-hidden>:</span>
                  <TimeBlock value={timeLeft.hours} label={t("hours")} />
                  <span className="pb-5 text-xl sm:text-2xl font-bold text-purple-400/80" aria-hidden>:</span>
                  <TimeBlock value={timeLeft.minutes} label={t("minutes")} />
                  <span className="pb-5 text-xl sm:text-2xl font-bold text-purple-400/80" aria-hidden>:</span>
                  <TimeBlock value={timeLeft.seconds} label={t("seconds")} />
                </>
              )}
            </div>
          </div>

          {showNewsletter && (
            <div className="mb-8 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-purple-950/40 to-fuchsia-950/20 p-5 sm:p-6">
              <h2 className="text-center text-base sm:text-lg font-bold text-white mb-1">
                {t("newsletterTitle", { percent: newsletterDiscountPercent })}
              </h2>
              <p className="text-center text-xs sm:text-sm text-gray-400 mb-4">
                {t("newsletterSubtitle")}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="mx-auto max-w-md space-y-3">
                <div className="flex flex-col gap-2.5 rounded-2xl border border-purple-400/25 bg-black/30 p-1.5 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/70"
                      aria-hidden
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={t("emailPlaceholder")}
                      className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-novra-muted focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={newsletterStatus === "sending"}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-purple-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-fuchsia-500 hover:via-purple-500 hover:to-purple-600 disabled:opacity-50"
                  >
                    {newsletterStatus === "sending" ? t("sending") : t("subscribe")}
                    {newsletterStatus !== "sending" && <ArrowRight size={16} aria-hidden />}
                  </button>
                </div>

                {newsletterStatus === "success" && renderDiscountCodeSuccess("success")}
                {newsletterStatus === "duplicate" && renderDiscountCodeSuccess("duplicate")}
                {newsletterStatus === "error" && (
                  <p className="text-center text-sm text-red-400">{t("errorMessage")}</p>
                )}
              </form>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {instagramUrl?.trim() ? (
              <a
                href={instagramUrl.trim()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
              >
                <FaInstagram size={16} className="text-purple-400" aria-hidden />
                Instagram
              </a>
            ) : null}
            <a
              href={buildWhatsAppUrl(whatsappNumber, t("whatsappMessage"))}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
            >
              <MessageCircle size={16} className="text-purple-400" aria-hidden />
              {t("contact")}
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] sm:text-xs uppercase tracking-[0.35em] text-gray-500">
          {t("tagline")}
        </p>
      </main>
    </div>
  );
}
