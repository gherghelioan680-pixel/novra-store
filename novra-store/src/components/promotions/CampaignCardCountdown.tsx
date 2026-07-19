"use client";

import { useLayoutEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import {
  calcTimeLeft,
  EMPTY_TIME_LEFT,
  padTimeUnit,
  type TimeLeft,
} from "@/lib/countdown";

type CampaignCardCountdownProps = {
  endDate: string;
};

export default function CampaignCardCountdown({ endDate }: CampaignCardCountdownProps) {
  const t = useTranslations("promotions");
  const mounted = useIsClient();
  const target = new Date(endDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(EMPTY_TIME_LEFT);
  const [expired, setExpired] = useState(false);

  useLayoutEffect(() => {
    if (!mounted) return;

    const tick = () => {
      const next = calcTimeLeft(undefined, target);
      if (next) {
        setTimeLeft(next);
        setExpired(false);
      } else {
        setExpired(true);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [mounted, endDate, target]);

  if (expired) return null;

  return (
    <div className="flex items-center gap-2 text-[11px] text-purple-200/90">
      <Clock size={12} className="shrink-0" />
      <span className="uppercase tracking-wider text-purple-300/80">{t("expiresIn")}</span>
      {mounted ? (
        <span className="font-mono font-semibold tabular-nums text-white" suppressHydrationWarning>
          {padTimeUnit(timeLeft.days)}:{padTimeUnit(timeLeft.hours)}:{padTimeUnit(timeLeft.minutes)}:
          {padTimeUnit(timeLeft.seconds)}
        </span>
      ) : (
        <span className="font-mono font-semibold tabular-nums text-white">--:--:--:--</span>
      )}
    </div>
  );
}
