"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CheckCircle, X } from "lucide-react";
import { changePassword, deleteAccount, type User } from "@/lib/auth";

type ManageAccountViewProps = {
  user: User;
  onPasswordChanged?: (user: User, message: string) => void;
};

export default function ManageAccountView({ user, onPasswordChanged }: ManageAccountViewProps) {
  const t = useTranslations("accountManage");
  const tc = useTranslations("common");
  const router = useRouter();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleOpenPasswordForm = () => {
    resetPasswordForm();
    setShowPasswordForm(true);
  };

  const handleClosePasswordForm = () => {
    setShowPasswordForm(false);
    resetPasswordForm();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("passwordsMismatch"));
      return;
    }

    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

    if (result.success && result.user) {
      const successMessage = t("passwordChanged");
      setPasswordSuccess(successMessage);
      onPasswordChanged?.(result.user, successMessage);
      setTimeout(() => {
        handleClosePasswordForm();
      }, 1500);
    } else {
      setPasswordError(t("invalidCurrentPassword"));
    }
  };

  const handleDeleteAccount = () => {
    setDeleteError("");
    setIsDeleting(true);

    const result = deleteAccount();

    if (result.success) {
      router.push("/");
    } else {
      setDeleteError(result.message);
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-white">{t("title")}</h2>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-novra-card/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("email")}</p>
              <p className="mt-1 font-medium text-white">{user.email}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
              <CheckCircle size={14} className="text-green-500" />
              {t("verified")}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-novra-card/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("password")}</p>
              <p className="mt-1 font-medium text-white">••••••••</p>
            </div>
            {!showPasswordForm && (
              <button
                type="button"
                onClick={handleOpenPasswordForm}
                className="text-sm font-medium text-purple-400 transition hover:text-purple-300"
              >
                {t("changePassword")}
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4 border-t border-white/10 pt-5">
              <div>
                <label className="mb-2 block text-sm text-gray-400">{t("currentPassword")}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">{t("newPassword")}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">{t("confirmPassword")}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm outline-none focus:border-purple-500/50"
                  autoComplete="new-password"
                />
              </div>

              {passwordError && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClosePasswordForm}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  {t("updatePassword")}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="pt-4">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeleteError("");
              }}
              className="text-sm text-gray-500 transition hover:text-red-400"
            >
              {t("deleteAccount")}
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{t("areYouSure")}</p>
                  <p className="mt-1 text-sm text-gray-400">{t("deleteWarning")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="shrink-0 rounded-lg p-1 text-gray-500 transition hover:bg-white/5 hover:text-white"
                  aria-label={t("closeAria")}
                >
                  <X size={18} />
                </button>
              </div>

              {deleteError && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {deleteError}
                </p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? t("deleting") : t("confirmDelete")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
