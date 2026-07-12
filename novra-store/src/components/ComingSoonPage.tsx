"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Mail, MessageCircle, Sparkles } from "lucide-react";
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
import type { ComingSoonSettings } from "@/lib/site-settings";

const COMING_SOON_COUNTDOWN_ID = "coming-soon-countdown";

type ComingSoonPageProps = {
  settings: ComingSoonSettings;
  whatsappNumber: string;
  initialTimeLeft?: TimeLeft | null;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
};

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3.5rem] sm:min-w-[4.5rem]">
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

      const count = Math.floor((width * height) / 12000);
      particles = Array.from({ length: Math.max(24, Math.min(count, 80)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 0.6,
        opacity: Math.random() * 0.45 + 0.15,
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
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
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
  initialTimeLeft,
}: ComingSoonPageProps) {
  const headline = settings.headline?.trim() || "Ceva extraordinar se apropie";
  const subtitle =
    settings.subtitle?.trim() ||
    "Pregătim ceva special. Fii primul care află când lansăm.";
  const showNewsletter = settings.showNewsletter !== false;

  const target = getCountdownDate(settings);
  const { timeLeft, launched, mounted, invalidDate } = useLiveCountdown(target, {
    initialTimeLeft,
  });

  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "sending" | "success" | "duplicate" | "error"
  >("idle");
  const [newsletterDiscountMessage, setNewsletterDiscountMessage] = useState("");

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
        setNewsletterDiscountMessage(result.discountMessage ?? "");
      } else {
        setNewsletterStatus("success");
        setNewsletterDiscountMessage(result.discountMessage ?? "");
        form.reset();
      }
    } else {
      setNewsletterStatus("error");
      setNewsletterDiscountMessage("");
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-novra-bg text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.18),transparent_65%)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-600/8 blur-[90px]" />
      <ParticleCanvas />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] max-w-3xl flex-col items-center justify-center px-4 py-10 sm:px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="mb-8 sm:mb-10">
          <Image
            src="/logo.png"
            alt="NOVRA"
            width={160}
            height={52}
            className="h-12 sm:h-14 w-auto"
            priority
          />
        </div>

        <div className="w-full rounded-3xl border border-purple-500/20 bg-novra-card/40 p-6 sm:p-10 backdrop-blur-md shadow-2xl shadow-purple-950/40">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-purple-200">
              <Sparkles size={12} className="text-purple-400" aria-hidden />
              În curând
            </span>
          </div>

          <h1 className="text-center text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300">
              {headline}
            </span>
          </h1>

          <p className="text-center text-sm sm:text-base text-gray-300/90 max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10">
            {subtitle}
          </p>

          <div className="mb-8 sm:mb-10">
            <div className="mb-3 flex items-center justify-center gap-2 text-purple-200/80">
              <Clock size={14} aria-hidden />
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em]">
                Lansare în
              </span>
            </div>

            <div
              id={COMING_SOON_COUNTDOWN_ID}
              data-hydrated={mounted ? "true" : undefined}
              className="mx-auto flex w-fit items-center gap-2 sm:gap-3 rounded-2xl border border-purple-400/20 bg-black/25 px-4 sm:px-6 py-4 sm:py-5 backdrop-blur-sm"
              aria-live="polite"
              aria-atomic="true"
              aria-label={
                invalidDate
                  ? "Dată invalidă"
                  : launched
                    ? "Lansare!"
                    : mounted
                      ? `Timp rămas: ${formatCountdownCompact(timeLeft)}`
                      : COUNTDOWN_STATIC_ARIA_LABEL
              }
              suppressHydrationWarning
            >
              {invalidDate ? (
                <p className="text-sm text-red-300">Dată invalidă</p>
              ) : launched ? (
                <p className="text-lg sm:text-xl font-semibold text-purple-200">Lansare!</p>
              ) : (
                <>
                  <TimeBlock value={timeLeft.days} label="zile" />
                  <span className="pb-5 text-xl sm:text-2xl font-bold text-purple-400/80" aria-hidden>
                    :
                  </span>
                  <TimeBlock value={timeLeft.hours} label="ore" />
                  <span className="pb-5 text-xl sm:text-2xl font-bold text-purple-400/80" aria-hidden>
                    :
                  </span>
                  <TimeBlock value={timeLeft.minutes} label="min" />
                  <span className="pb-5 text-xl sm:text-2xl font-bold text-purple-400/80" aria-hidden>
                    :
                  </span>
                  <TimeBlock value={timeLeft.seconds} label="sec" />
                </>
              )}
            </div>
          </div>

          {showNewsletter && (
            <div className="mb-8 sm:mb-10">
              <p className="text-center text-xs sm:text-sm text-gray-400 mb-4">
                Abonează-te pentru a fi anunțat la lansare
              </p>

              <form onSubmit={handleNewsletterSubmit} className="mx-auto max-w-md space-y-3">
                <div className="flex flex-col gap-2.5 rounded-2xl border border-novra-border/70 bg-novra-bg/50 p-1.5 sm:flex-row">
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
                      placeholder="Adresa ta de email"
                      className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-novra-muted focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={newsletterStatus === "sending"}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-purple-600 disabled:opacity-50"
                  >
                    {newsletterStatus === "sending" ? "Se trimite..." : "Anunță-mă"}
                    {newsletterStatus !== "sending" && <ArrowRight size={16} aria-hidden />}
                  </button>
                </div>

                {newsletterStatus === "success" && (
                  <p className="text-center text-sm text-emerald-400">
                    Abonat cu succes! Te vom anunța la lansare.
                    {newsletterDiscountMessage && (
                      <span className="block mt-1 font-semibold">{newsletterDiscountMessage}</span>
                    )}
                  </p>
                )}
                {newsletterStatus === "duplicate" && (
                  <p className="text-center text-sm text-purple-300">
                    Ești deja abonat la newsletter-ul NOVRA.
                  </p>
                )}
                {newsletterStatus === "error" && (
                  <p className="text-center text-sm text-red-400">
                    Nu s-a putut procesa abonarea. Încearcă din nou.
                  </p>
                )}
              </form>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
            >
              <FaInstagram size={16} className="text-purple-400" aria-hidden />
              Instagram
            </a>
            <a
              href={buildWhatsAppUrl(whatsappNumber, "Salut! Am o întrebare despre NOVRA.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-white"
            >
              <MessageCircle size={16} className="text-purple-400" aria-hidden />
              Contact
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500">
          Precision · Performance · Power
        </p>
      </main>
    </div>
  );
}
