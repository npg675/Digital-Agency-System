"use client";

import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorPreview } from "@/components/editor/EditorPreview";
import { useEditorStore } from "@/store/useEditorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, EyeOff, CheckCircle2, Loader2, Settings, CopyPlus, Menu, Split, Images } from "lucide-react";
import Link from "next/link";
import { PageSettingsModal } from "@/components/editor/PageSettingsModal";
import { ABTestingModal } from "@/components/editor/ABTestingModal";
import { MediaLibraryDrawer } from "@/components/editor/MediaLibraryDrawer";
import { AssetShelf } from "@/components/editor/AssetShelf";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user } = useAuthStore();
  const router = useRouter();
  const {
    setPageId, setPageMeta, setSections,
    pageName, pageSlug, pageStatus, sections,
    isSaving, setIsSaving, setPageStatus,
    activeSectionId, updateSection,
  } = useEditorStore();

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isABTestingOpen, setIsABTestingOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  // Fetch page data on mount
  useEffect(() => {
    if (!token || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/pages/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { router.push("/admin/pages"); return; }
        const data = await res.json();
        setPageId(data.id);
        setPageMeta(data.name, data.slug, data.status);
        useEditorStore.getState().setPageSettings({
          gtm_id: data.gtm_id,
          fb_pixel_id: data.fb_pixel_id,
          tiktok_pixel_id: data.tiktok_pixel_id,
          ga4_id: data.ga4_id,
          webhook_url: data.webhook_url,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          meta_keywords: data.meta_keywords,
          default_sequence_id: data.default_sequence_id,
        });
        setSections(data.sections || []);

        // ── Persist last editor session so we can restore it after hard refresh ──
        try {
          localStorage.setItem('lastEditorSession', JSON.stringify({
            id: data.id,
            name: data.name,
            slug: data.slug,
            url: `/admin/pages/${data.id}/editor`,
            savedAt: new Date().toISOString(),
          }));
        } catch (_) {}

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API}/pages/${id}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sections.map((s) => ({ type: s.type, config: s.config, order: s.order }))),
      });
      if (res.ok) {
        setSaveMsg("Saved!");
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg("Save failed");
      }
    } catch {
      setSaveMsg("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!token) return;
    setIsSavingTemplate(true);
    try {
      const res = await fetch(`${API}/pages/${id}/save-as-template`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Saved as a global template successfully!");
      } else {
        const data = await res.json();
        alert(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (e) {
      alert("Network error while saving template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!token) return;
    let newStatus = pageStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`${API}/pages/${id}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPageStatus(newStatus);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestApproval = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/pages/${id}/status?status=PENDING_APPROVAL`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPageStatus("PENDING_APPROVAL");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* Editor Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 gap-4 flex-shrink-0 z-50 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {/* Mobile Sidebar Toggle */}
        <button 
          className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/admin/pages" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm shrink-0">
          <ArrowLeft className="w-4 h-4" />
          Pages
        </Link>

        <div className="w-px h-5 bg-zinc-700 shrink-0" />

        <div className="flex-1 min-w-[150px] shrink-0">
          <p className="text-white font-semibold text-sm truncate">{pageName}</p>
          <p className="text-zinc-500 text-xs truncate">/landing/{pageSlug}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            pageStatus === "PUBLISHED"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pageStatus === "PUBLISHED" ? "bg-emerald-400" : "bg-yellow-400"}`} />
            {pageStatus}
          </span>

          {/* Save message */}
          {saveMsg && (
            <span className={`flex items-center gap-1 text-xs font-medium ${saveMsg === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>
              {saveMsg === "Saved!" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {saveMsg}
            </span>
          )}

          {/* View Live */}
          <a
            href={pageStatus === "PUBLISHED" ? `/landing/${pageSlug}` : `/preview/${pageSlug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {pageStatus === "PUBLISHED" ? "View Live" : "Preview"}
          </a>

          {/* Approval Workflow */}
          {(user?.role === "ADMIN" || user?.role === "STAFF") && pageStatus === "DRAFT" && (
            <button
              onClick={handleRequestApproval}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Request Approval
            </button>
          )}

          {user?.role === "CLIENT" && pageStatus === "PENDING_APPROVAL" && (
            <button
              onClick={handleTogglePublish}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors animate-pulse"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
            </button>
          )}

          {/* Publish/Unpublish */}
          {(user?.role !== "CLIENT" || pageStatus === "PUBLISHED") && (
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pageStatus === "PUBLISHED"
                  ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {pageStatus === "PUBLISHED" ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              {pageStatus === "PUBLISHED" ? "Unpublish" : "Publish"}
            </button>
          )}
          
          {/* A/B Testing Modal Toggle */}
          <button
            onClick={() => setIsABTestingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <Split className="w-3.5 h-3.5" /> A/B Testing
          </button>

          {/* Media Library toggle */}
          <button
            onClick={() => setIsMediaLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 transition-colors"
          >
            <Images className="w-3.5 h-3.5" /> Media Library
          </button>
          
          {/* Gallery Background Toggle — shows only when a Gallery section is active */}
          {(() => {
            const activeSection = sections.find(s => s.id === activeSectionId);
            if (!activeSection || activeSection.type !== "Gallery") return null;
            const isDark = activeSection.config?.darkBackground;
            return (
              <button
                onClick={() => updateSection(activeSection.id, { ...activeSection.config, darkBackground: !isDark })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isDark
                    ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    : "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                }`}
                title="Toggle Gallery background between Light and Dark"
              >
                {isDark ? "☀️ Light BG" : "🌙 Dark BG"}
              </button>
            );
          })()}

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>

          {/* Save as Template (Admin Only) */}
          {user?.role === "ADMIN" && (
            <button
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
              title="Save this page layout as a global template"
            >
              {isSavingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CopyPlus className="w-3.5 h-3.5" />}
              {isSavingTemplate ? "Saving..." : "Save as Template"}
            </button>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60 transition-colors"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <EditorSidebar isOpenOnMobile={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
        <EditorPreview />
      </div>

      {/* Asset Shelf — fixed at bottom, always reachable during drag */}
      <AssetShelf />

      <PageSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ABTestingModal isOpen={isABTestingOpen} onClose={() => setIsABTestingOpen(false)} pageId={id} />
      <MediaLibraryDrawer isOpen={isMediaLibraryOpen} onClose={() => setIsMediaLibraryOpen(false)} />
    </div>
  );
}
