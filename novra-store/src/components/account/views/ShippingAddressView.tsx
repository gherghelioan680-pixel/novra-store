"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { updateShippingAddress, type ShippingAddress, type User } from "@/lib/auth";

const ROMANIAN_COUNTIES = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brăila",
  "Brașov",
  "București",
  "Buzău",
  "Călărași",
  "Caraș-Severin",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Sălaj",
  "Satu Mare",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vâlcea",
  "Vaslui",
  "Vrancea",
];

const emptyAddress = (): Omit<ShippingAddress, "country"> & { country: string } => ({
  fullName: "",
  addressLine: "",
  city: "",
  county: "",
  postalCode: "",
  phone: "",
  country: "Romania",
});

type ShippingAddressViewProps = {
  user: User;
  onSave: (user: User, message: string) => void;
  onCancel: () => void;
};

export default function ShippingAddressView({ user, onSave, onCancel }: ShippingAddressViewProps) {
  const t = useTranslations("accountShipping");
  const tc = useTranslations("common");
  const saved = user.shippingAddress;

  const [form, setForm] = useState({
    fullName: saved?.fullName ?? "",
    addressLine: saved?.addressLine ?? "",
    city: saved?.city ?? "",
    county: saved?.county ?? "",
    postalCode: saved?.postalCode ?? "",
    phone: saved?.phone ?? user.phone ?? "",
    country: "Romania",
  });

  const [error, setError] = useState("");

  const handleCancel = () => {
    if (saved) {
      setForm({
        fullName: saved.fullName,
        addressLine: saved.addressLine,
        city: saved.city,
        county: saved.county,
        postalCode: saved.postalCode,
        phone: saved.phone,
        country: "Romania",
      });
    } else {
      setForm(emptyAddress());
    }
    setError("");
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = updateShippingAddress(form);

    if (result.success && result.user) {
      onSave(result.user, result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{t("title")}</h2>
      <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>

      {saved && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-white">{saved.fullName}</p>
            <p className="mt-1">{saved.addressLine}</p>
            <p>
              {saved.city}, {saved.county}, {saved.postalCode}
            </p>
            <p className="mt-1 text-gray-400">{saved.phone}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm text-gray-400">{t("fullName")}</label>
          <input
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            placeholder={t("fullNamePlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">{t("address")}</label>
          <input
            value={form.addressLine}
            onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            placeholder={t("addressPlaceholder")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("city")}</label>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder={t("cityPlaceholder")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("county")}</label>
            <select
              value={form.county}
              onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            >
              <option value="">{t("selectCounty")}</option>
              {ROMANIAN_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("postalCode")}</label>
            <input
              value={form.postalCode}
              onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder={t("postalCodePlaceholder")}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">{t("phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder={t("phonePlaceholder")}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">{t("country")}</label>
          <select
            value={form.country}
            disabled
            className="w-full rounded-xl border border-white/10 bg-novra-bg/40 px-4 py-3 text-sm text-gray-500 outline-none"
          >
            <option value="Romania">{t("romania")}</option>
          </select>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            {tc("cancel")}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            {tc("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
