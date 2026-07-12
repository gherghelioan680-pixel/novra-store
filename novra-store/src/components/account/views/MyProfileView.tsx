"use client";

import { useState } from "react";
import { updateCurrentUserProfile, type User } from "@/lib/auth";

type MyProfileViewProps = {
  user: User;
  onSave: (user: User, message: string) => void;
  onCancel: () => void;
};

export default function MyProfileView({ user, onSave, onCancel }: MyProfileViewProps) {
  const [form, setForm] = useState({
    email: user.email,
    firstName: user.firstName || user.name.split(/\s+/)[0] || "",
    lastName: user.lastName || user.name.split(/\s+/).slice(1).join(" ") || "",
    dateOfBirth: user.dateOfBirth || "",
    phone: user.phone || "",
    country: user.country || "Romania",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateCurrentUserProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth,
      phone: form.phone,
      country: form.country,
    });

    if (result.success && result.user) {
      onSave(result.user, result.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white">My Profile</h2>
      <p className="mt-1 text-sm text-gray-400">
        Complete your profile and earn up to 100 NovraCredits
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm text-gray-400">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full rounded-xl border border-white/10 bg-novra-bg/40 px-4 py-3 text-sm text-gray-500 outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">First Name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder="Prenume"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Last Name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder="Nume"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-400">Date of Birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
              placeholder="+40 7XX XXX XXX"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">Country/Region</label>
          <select
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
          >
            <option value="Romania">Romania</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
