"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/components/home/ScrollReveal";

type StatItem = {
  value: string;
  labelKey: "statClients" | "statSatisfaction" | "statShipping" | "statWarranty" | "statPower";
  numericTarget?: number;
  suffix?: string;
  prefix?: string;
};

const STATS: StatItem[] = [
  { value: "10000", labelKey: "statClients", numericTarget: 10000, suffix: "+" },
  { value: "98", labelKey: "statSatisfaction", numericTarget: 98, suffix: "%" },
  { value: "24h", labelKey: "statShipping" },
  { value: "2", labelKey: "statWarranty", numericTarget: 2, suffix: " ani" },
  { value: "100W", labelKey: "statPower" },
];

function AnimatedValue({
  target,
  suffix = "",
  prefix = "",
  formatThousands = false,
}: {
  target?: number;
  suffix?: string;
  prefix?: string;
  formatThousands?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() =>
    target !== undefined ? `${prefix}0${suffix}` : `${prefix}${suffix}`,
  );
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (target === undefined) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;

        const duration = 1400;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          const formatted = formatThousands
            ? current.toLocaleString("ro-RO")
            : String(current);
          setDisplay(`${prefix}${formatted}${suffix}`);

          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, prefix, formatThousands]);

  if (target === undefined) {
    return (
      <span ref={ref} className="tabular-nums">
        {prefix}
        {suffix || display}
      </span>
    );
  }

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

export default function StatsBar() {
  const t = useTranslations("home");

  return (
    <ScrollReveal as="section" variant="fade-up" className="py-8 sm:py-10 site-container">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/70 via-novra-card/50 to-purple-950/70 shadow-xl shadow-purple-950/25">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_50%_0%,rgba(139,92,246,0.14),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-purple-600/5 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-purple-600/5 to-transparent" />

        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-purple-500/10">
          {STATS.map((stat, index) => (
            <div
              key={stat.labelKey}
              className={`flex flex-col items-center justify-center px-4 py-6 sm:py-8 text-center ${
                index === STATS.length - 1 && STATS.length % 2 !== 0
                  ? "col-span-2 sm:col-span-1"
                  : ""
              }`}
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-200 mb-1.5">
                {stat.numericTarget !== undefined ? (
                  <AnimatedValue
                    target={stat.numericTarget}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    formatThousands={stat.labelKey === "statClients"}
                  />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[11px] sm:text-xs text-purple-300/90 font-medium uppercase tracking-[0.15em]">
                {t(stat.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
