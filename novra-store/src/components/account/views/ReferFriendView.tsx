"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gift, Users, CheckCircle } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { loadReferralData } from "@/lib/referrals";
import { getInviteLinkForCode } from "@/lib/referrals";
import type { FriendReferral, ReferralSettings } from "@/lib/referrals-types";
import type { User } from "@/lib/auth";

type ReferFriendViewProps = {
  user: User;
};

function getDateLocale(locale: string) {
  if (locale === "ro") return "ro-RO";
  if (locale === "de") return "de-DE";
  return "en-US";
}

export default function ReferFriendView({ user }: ReferFriendViewProps) {
  const t = useTranslations("accountRefer");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [referrals, setReferrals] = useState<FriendReferral[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadReferralData().then((data) => {
      if (data) {
        setCode(data.referralCode);
        setInviteLink(data.inviteLink || getInviteLinkForCode(data.referralCode));
        setReferrals(data.referrals);
        setSettings(data.settings);
      }
      setLoading(false);
    });
  }, [user.id]);

  if (loading) {
    return <p className="text-gray-500 text-sm">{t("loading")}</p>;
  }

  if (!settings?.enabled) {
    return (
      <div className="rounded-2xl border border-white/10 bg-novra-card/30 p-6 text-center">
        <Gift size={32} className="mx-auto text-gray-500 mb-3" />
        <p className="text-gray-400">{t("programInactive")}</p>
      </div>
    );
  }

  const rewardLabel =
    settings.rewardType === "credits"
      ? t("rewardCredits", { amount: settings.referrerReward })
      : t("rewardCoupon", { amount: settings.referrerReward });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-novra-card/30 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30">
            <Gift size={22} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t("title")}</h2>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              {t("description", { reward: rewardLabel })}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-novra-bg/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("yourCode")}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-lg font-semibold text-purple-300">{code}</span>
            <CopyButton text={code} label={t("copyCode")} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-novra-bg/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">{t("invitationLink")}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-300 break-all">{inviteLink}</span>
            <CopyButton text={inviteLink} label={t("copyLink")} />
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">{t("programNote")}</p>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          {t("yourInvites", { count: referrals.length })}
        </h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center rounded-xl border border-white/10 bg-novra-card/20">
            {t("noInvites")}
          </p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-novra-card/30 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">{r.refereeEmail ?? t("pending")}</p>
                  <p className="text-xs text-gray-500">
                    {r.registeredAt
                      ? t("registered", {
                          date: new Date(r.registeredAt).toLocaleDateString(getDateLocale(locale)),
                        })
                      : t("linkAccessed")}
                  </p>
                </div>
                {r.firstOrderId ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-300">
                    <CheckCircle size={14} />
                    {t("firstOrder")}
                  </span>
                ) : r.registeredAt ? (
                  <span className="text-xs text-yellow-300">{t("awaitingOrder")}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
