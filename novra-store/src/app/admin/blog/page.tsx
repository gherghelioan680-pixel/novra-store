"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, FileText, RefreshCw, ExternalLink } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdmin } from "@/lib/auth";
import { deleteBlogArticleAdmin, loadBlogArticles, saveBlogArticleAdmin } from "@/lib/blog";
import { createStoreRefreshEffect } from "@/lib/store";
import type { BlogArticle } from "@/lib/blog-types";

const emptyForm = (): Partial<BlogArticle> & { title: string; slug: string } => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  published: false,
  metaTitle: "",
  metaDescription: "",
  categories: [],
  tags: [],
});

export default function AdminBlogPage() {
  const admin = requireAdmin();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<(Partial<BlogArticle> & { title: string; slug: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setArticles(await loadBlogArticles());
    setLoading(false);
  };

  useEffect(() => {
    return createStoreRefreshEffect(refresh, { scopes: ["blog"] });
  }, []);

  if (!admin) return null;

  const handleSave = async () => {
    if (!editing?.title || !editing.slug) {
      setMessage("Completează titlul și slug-ul.");
      return;
    }
    setSaving(true);
    const result = await saveBlogArticleAdmin({
      ...editing,
      categories: parseList(editing.categories),
      tags: parseList(editing.tags),
    });
    setSaving(false);
    if (result.ok) {
      setMessage("Articol salvat.");
      setEditing(null);
      await refresh();
    } else {
      setMessage(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ștergi acest articol?")) return;
    const result = await deleteBlogArticleAdmin(id);
    setMessage(result.ok ? "Articol șters." : result.message);
    if (result.ok) await refresh();
  };

  return (
    <div>
      <AdminHeader user={admin} title="Blog & Ghiduri" subtitle="Articole, ghiduri și conținut SEO" />

      {message && (
        <p className="mb-4 rounded-xl border border-purple-500/30 bg-purple-600/10 px-4 py-3 text-sm text-purple-200">
          {message}
        </p>
      )}

      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(emptyForm())}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
        >
          <Plus size={16} />
          Articol nou
        </button>
        <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300">
          <RefreshCw size={16} />
          Reîncarcă
        </button>
      </div>

      {editing && (
        <section className="mb-8 rounded-2xl border border-purple-500/30 bg-novra-card/30 p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">{editing.id ? "Editează articol" : "Articol nou"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titlu" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v, metaTitle: editing.metaTitle || v })} />
            <Field label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Rezumat</label>
              <textarea value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Conținut (Markdown)</label>
              <textarea value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={12} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-3 text-sm text-white font-mono" />
            </div>
            <Field label="Imagine copertă (URL)" value={editing.coverImageUrl ?? ""} onChange={(v) => setEditing({ ...editing, coverImageUrl: v })} />
            <Field label="Categorii (virgulă)" value={listToString(editing.categories)} onChange={(v) => setEditing({ ...editing, categories: parseList(v) })} />
            <Field label="Tag-uri (virgulă)" value={listToString(editing.tags)} onChange={(v) => setEditing({ ...editing, tags: parseList(v) })} />
            <Field label="Meta title" value={editing.metaTitle ?? ""} onChange={(v) => setEditing({ ...editing, metaTitle: v })} />
            <Field label="Meta description" value={editing.metaDescription ?? ""} onChange={(v) => setEditing({ ...editing, metaDescription: v })} />
            <label className="flex items-center gap-3 sm:col-span-2">
              <input type="checkbox" checked={editing.published ?? false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4 rounded" />
              <span className="text-sm text-gray-300">Publicat</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              <Save size={16} />
              {saving ? "Se salvează..." : "Salvează"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400">Anulează</button>
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Se încarcă...</p>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-novra-card/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-purple-400" />
                  <p className="font-medium text-white">{a.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.published ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}`}>
                    {a.published ? "Publicat" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-1">/blog/{a.slug}</p>
              </div>
              <div className="flex gap-2">
                {a.published && (
                  <a href={`/blog/${a.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300">
                    <ExternalLink size={14} /> Vezi
                  </a>
                )}
                <button type="button" onClick={() => setEditing({ ...a })} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300">Editează</button>
                <button type="button" onClick={() => void handleDelete(a.id)} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function parseList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function listToString(value: string[] | undefined): string {
  return value?.join(", ") ?? "";
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-novra-bg/50 px-4 py-2.5 text-sm text-white" />
    </div>
  );
}
