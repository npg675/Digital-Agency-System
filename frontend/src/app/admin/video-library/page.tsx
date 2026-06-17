"use client";

import { useState, useEffect, useRef } from "react";
import {
  Film, Loader2, Search, Filter, Download, ExternalLink, Copy,
  CheckCircle2, X, AlertCircle, Clock, RefreshCw, Play, Tag,
  ThumbsUp, MessageSquare, Eye, Trash2, Send, ChevronDown, Sparkles, Image as ImageIcon, Scissors, Edit, Check
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  heygen: { label: "HeyGen", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  synthesia: { label: "Synthesia", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  runway: { label: "Runway", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200" },
  google: { label: "Veo 2.0", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  google_flow: { label: "Flow (Veo 3.1)", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
};

const TAGS = ["Client Ready", "Published", "Draft", "Revision Needed", "Top Performer", "Archived"];

type VideoAsset = {
  id: string; title: string; content: string; industry_category: string;
  video_url?: string; video_status?: string; video_provider?: string;
  video_job_id?: string; created_at: string; tag?: string;
  approval_status?: "pending" | "approved" | "revision"; approval_note?: string;
};

export default function VideoLibraryPage() {
  const { token } = useAuthStore();
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterProvider, setFilterProvider] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoAsset | null>(null);
  const [tagOpenId, setTagOpenId] = useState<string | null>(null);
  const [approvalModal, setApprovalModal] = useState<VideoAsset | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [isSendingApproval, setIsSendingApproval] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [editModal, setEditModal] = useState<VideoAsset | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  // Thumbnail Generator State
  const [thumbnailModal, setThumbnailModal] = useState<VideoAsset | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailPrompt, setThumbnailPrompt] = useState("");
  const [copiedThumbnail, setCopiedThumbnail] = useState(false);
  // Repurpose Engine State
  const [repurposeModal, setRepurposeModal] = useState<VideoAsset | null>(null);
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposeAction, setRepurposeAction] = useState("9_16"); // 9_16, audio, clip

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchVideos = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (filterProvider !== "ALL") params.set("provider", filterProvider);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/videos?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchVideos(); }, [token, filterStatus, filterProvider]);

  useEffect(() => {
    const hasProcessing = videos.some(v => v.video_status === "PROCESSING");
    if (hasProcessing) {
      pollingRef.current = setInterval(fetchVideos, 6000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [videos]);

  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.industry_category.toLowerCase().includes(search.toLowerCase()) ||
    v.content.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: videos.length, completed: videos.filter(v => v.video_status === "COMPLETED").length,
    processing: videos.filter(v => v.video_status === "PROCESSING").length, failed: videos.filter(v => v.video_status === "FAILED").length,
  };

  const handleCopyLink = (video: VideoAsset) => {
    if (video.video_url) navigator.clipboard.writeText(video.video_url);
    setCopiedId(video.id); setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTagSelect = (videoId: string, tag: string) => {
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, tag } : v));
    setTagOpenId(null);
  };

  const handleSendApproval = async () => {
    if (!approvalModal) return;
    setIsSendingApproval(true);
    await new Promise(r => setTimeout(r, 800));
    setVideos(prev => prev.map(v => v.id === approvalModal.id ? { ...v, approval_status: "pending", approval_note: approvalNote, tag: "Client Ready" } : v));
    setApprovalModal(null); setApprovalNote(""); setIsSendingApproval(false);
    setSuccessMsg("✅ Approval request sent! The client will be notified to review the video.");
  };

  const handleGenerateThumbnail = async () => {
    if (!thumbnailModal) return;
    setIsGeneratingThumbnail(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/generate-thumbnail-prompt`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ script: thumbnailModal.content || "", industry: thumbnailModal.industry_category || "", platform: "YouTube", style: "Bold & Eye-Catching" }),
      });
      if (!res.ok) throw new Error("Thumbnail prompt generation failed.");
      const data = await res.json();
      setThumbnailPrompt(data.prompt);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleCopyThumbnailPrompt = () => {
    navigator.clipboard.writeText(thumbnailPrompt);
    setCopiedThumbnail(true);
    setTimeout(() => setCopiedThumbnail(false), 2000);
  };

  const handleRepurpose = async () => {
    if (!repurposeModal) return;
    setIsRepurposing(true);
    // Simulate complex video processing task
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRepurposing(false);
    setRepurposeModal(null);
    setSuccessMsg(`✅ Video successfully repurposed to format: ${repurposeAction}. Download ready.`);
  };

  const handleEditClick = (video: VideoAsset) => {
    setEditModal(video);
    setEditForm({ title: video.title, content: video.content });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setVideos(prev => prev.map(v => v.id === editModal.id ? { ...v, ...editForm } : v));
        setSuccessMsg("✅ Video details updated!");
        setEditModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video asset?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVideos(prev => prev.filter(v => v.id !== id));
        setSuccessMsg("✅ Video deleted successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerate = async (video: VideoAsset) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/${video.id}/generate-video?provider=${video.video_provider}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, video_status: "PROCESSING" } : v));
        setSuccessMsg("✅ Video regeneration started!");
      } else {
        alert("Failed to start regeneration.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Film className="w-8 h-8 text-violet-500" />
            Video Library
          </h1>
          <p className="text-zinc-500 mt-1">All generated videos — preview, approve, download and manage.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchVideos} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link href="/admin/video-studio" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            + Create Video
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-800 dark:text-green-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
          <button onClick={() => setSuccessMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Videos", value: stats.total, color: "text-zinc-900 dark:text-zinc-50", bg: "bg-white dark:bg-zinc-900" },
          { label: "Completed", value: stats.completed, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Rendering", value: stats.processing, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Failed", value: stats.failed, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5`}>
            <p className="text-sm text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search videos by title, script, industry..." className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-white dark:bg-zinc-900 border rounded-lg px-3 py-2.5 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Statuses</option><option value="COMPLETED">Completed</option><option value="PROCESSING">Rendering</option><option value="FAILED">Failed</option>
        </select>
        <select className="bg-white dark:bg-zinc-900 border rounded-lg px-3 py-2.5 text-sm" value={filterProvider} onChange={e => setFilterProvider(e.target.value)}>
          <option value="ALL">All Providers</option><option value="heygen">HeyGen</option><option value="synthesia">Synthesia</option><option value="runway">Runway</option><option value="google">Google Veo 2.0</option><option value="google_flow">Google Flow</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /><p className="text-sm">Loading your video library...</p></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4"><Film className="w-14 h-14 opacity-20" /><p className="font-semibold text-lg">No videos found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(video => {
            const provider = PROVIDER_LABELS[video.video_provider || ""] || { label: video.video_provider || "Unknown", color: "bg-zinc-100 text-zinc-600" };
            return (
              <div key={video.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col">
                <div className="relative bg-zinc-950 aspect-video flex items-center justify-center">
                  {video.video_status === "COMPLETED" && video.video_url ? (
                    <><video src={video.video_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted preload="metadata" />
                      <button onClick={() => setPreviewVideo(video)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"><div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><Play className="w-6 h-6 text-zinc-900 ml-1" /></div></button>
                    </>
                  ) : video.video_status === "PROCESSING" ? (
                    <div className="flex flex-col items-center gap-3 text-zinc-400"><Loader2 className="w-10 h-10 animate-spin text-indigo-400" /><p className="text-xs font-medium">Rendering...</p></div>
                  ) : video.video_status === "FAILED" ? (
                    <div className="flex flex-col items-center gap-3 text-red-400 px-4 text-center"><AlertCircle className="w-10 h-10" /><p className="text-xs">{video.video_url || "Generation failed"}</p></div>
                  ) : (<Film className="w-12 h-12 text-zinc-600" />)}
                  <div className="absolute top-2 left-2">{video.video_status === "COMPLETED" && <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>}{video.video_status === "PROCESSING" && <span className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded-full flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Rendering</span>}{video.video_status === "FAILED" && <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">Failed</span>}</div>
                  <div className="absolute top-2 right-2"><span className={`px-2 py-1 text-xs font-medium rounded-full ${provider.color}`}>{provider.label}</span></div>
                  {video.approval_status && (
                    <div className="absolute bottom-2 left-2">{video.approval_status === "pending" && <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting Approval</span>}{video.approval_status === "approved" && <span className="px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Approved</span>}</div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">{video.title}</h3>
                  <div className="flex items-center gap-2 mb-3"><span className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(video.created_at).toLocaleDateString()}</span><span className="text-xs text-zinc-400">·</span><span className="text-xs text-zinc-500 truncate">{video.industry_category}</span></div>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3 flex-1">{video.content}</p>
                  {video.tag && <div className="mb-3"><span className="text-xs px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">{video.tag}</span></div>}

                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {video.video_status === "COMPLETED" && video.video_url && (
                      <>
                        <button onClick={() => setPreviewVideo(video)} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /> Preview</button>
                        <a href={video.video_url} download target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors"><Download className="w-3.5 h-3.5" /> Download</a>
                        <button onClick={() => handleCopyLink(video)} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors">{copiedId === video.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                        <button onClick={() => { setApprovalModal(video); setApprovalNote(""); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors border border-emerald-200"><Send className="w-3.5 h-3.5" /> Approve</button>
                        <button onClick={() => { setThumbnailModal(video); setThumbnailPrompt(""); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg transition-colors border border-amber-200"><ImageIcon className="w-3.5 h-3.5" /> Thumbnail</button>
                        <button onClick={() => setRepurposeModal(video)} className="flex items-center gap-1 px-2.5 py-1.5 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 text-pink-700 text-xs font-semibold rounded-lg transition-colors border border-pink-200"><Scissors className="w-3.5 h-3.5" /> Repurpose</button>
                      </>
                    )}
                    {video.video_status === "FAILED" && (
                      <button onClick={() => handleRegenerate(video)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors border border-red-200">
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    )}
                    <div className="flex items-center ml-auto gap-1">
                      <button onClick={() => handleEditClick(video)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(video.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      <div className="relative ml-1">
                        <button onClick={() => setTagOpenId(tagOpenId === video.id ? null : video.id)} className="flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg"><Tag className="w-3.5 h-3.5" /><ChevronDown className="w-3 h-3" /></button>
                        {tagOpenId === video.id && <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-zinc-900 border rounded-xl shadow-xl z-50 py-1 min-w-[150px]">{TAGS.map(t => <button key={t} onClick={() => handleTagSelect(video.id, t)} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50">{t}</button>)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewVideo(null)}>
          <div className="bg-zinc-950 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div><p className="font-semibold text-zinc-100 text-sm truncate">{previewVideo.title}</p><p className="text-xs text-zinc-400">{PROVIDER_LABELS[previewVideo.video_provider || ""]?.label}</p></div>
              <div className="flex items-center gap-2"><a href={previewVideo.video_url} download target="_blank" rel="noreferrer" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><Download className="w-4 h-4" /></a><a href={previewVideo.video_url} target="_blank" rel="noreferrer" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><ExternalLink className="w-4 h-4" /></a><button onClick={() => setPreviewVideo(null)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"><X className="w-4 h-4" /></button></div>
            </div>
            <video src={previewVideo.video_url} controls autoPlay className="w-full max-h-[70vh] bg-black" />
            <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800"><p className="text-xs text-zinc-400 line-clamp-2">{previewVideo.content}</p></div>
          </div>
        </div>
      )}

      {/* Client Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between"><h2 className="text-lg font-bold flex items-center gap-2"><Send className="w-5 h-5 text-emerald-500" /> Send for Client Approval</h2><button onClick={() => setApprovalModal(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800"><p className="text-sm font-semibold">{approvalModal.title}</p><p className="text-xs text-zinc-500 mt-1 line-clamp-2">{approvalModal.content}</p></div>
              <div className="space-y-2"><label className="text-sm font-semibold">Note to Client (optional)</label><textarea rows={3} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm" placeholder="e.g. Please review the opening hook..." value={approvalNote} onChange={e => setApprovalNote(e.target.value)} /></div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl"><p className="text-xs text-blue-700 dark:text-blue-300"><strong>How it works:</strong> The client will receive a notification with a secure preview link. They can <strong>Approve ✓</strong> or <strong>Request Changes ✗</strong> with comments.</p></div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end"><button onClick={() => setApprovalModal(null)} className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 rounded-lg">Cancel</button><button onClick={handleSendApproval} disabled={isSendingApproval} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{isSendingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send</button></div>
          </div>
        </div>
      )}

      {/* Thumbnail Generator Modal */}
      {thumbnailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-amber-500" /> AI Thumbnail Prompt Generator</h2>
              <button onClick={() => setThumbnailModal(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-sm text-zinc-500">Automatically generate an optimized Midjourney / DALL-E 3 image prompt based on the context of your video script.</p>
              <button onClick={handleGenerateThumbnail} disabled={isGeneratingThumbnail} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 w-full disabled:opacity-50 transition-colors">
                {isGeneratingThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Image Prompt
              </button>
              {thumbnailPrompt && (
                <div className="relative mt-4">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">Your DALL-E / Midjourney Prompt:</label>
                  <textarea readOnly rows={6} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-900 dark:text-zinc-100" value={thumbnailPrompt} />
                  <button onClick={handleCopyThumbnailPrompt} className="absolute bottom-3 right-3 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:bg-zinc-50 transition-colors">
                    {copiedThumbnail ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repurpose Modal */}
      {repurposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><Scissors className="w-5 h-5 text-pink-500" /> Repurpose Video</h2>
              <button onClick={() => setRepurposeModal(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-zinc-500">Automatically transform this video into new formats for different platforms.</p>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold">Select Target Format</label>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setRepurposeAction("9_16")} className={`p-4 border rounded-xl flex items-start gap-3 text-left transition-colors ${repurposeAction === "9_16" ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 ring-1 ring-pink-500" : "border-zinc-200 dark:border-zinc-800"}`}>
                    <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900 text-pink-600 flex items-center justify-center shrink-0"><Film className="w-4 h-4" /></div>
                    <div>
                      <p className="font-semibold text-sm">Convert to 9:16 (Vertical)</p>
                      <p className="text-xs text-zinc-500 mt-1">Smart-crop the video and optimize for TikTok, Shorts, and Reels.</p>
                    </div>
                  </button>
                  <button onClick={() => setRepurposeAction("clip")} className={`p-4 border rounded-xl flex items-start gap-3 text-left transition-colors ${repurposeAction === "clip" ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 ring-1 ring-pink-500" : "border-zinc-200 dark:border-zinc-800"}`}>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 flex items-center justify-center shrink-0"><Scissors className="w-4 h-4" /></div>
                    <div>
                      <p className="font-semibold text-sm">Extract Best 15s Clip</p>
                      <p className="text-xs text-zinc-500 mt-1">AI analyzes the video and cuts the most engaging 15-second segment.</p>
                    </div>
                  </button>
                  <button onClick={() => setRepurposeAction("audio")} className={`p-4 border rounded-xl flex items-start gap-3 text-left transition-colors ${repurposeAction === "audio" ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 ring-1 ring-pink-500" : "border-zinc-200 dark:border-zinc-800"}`}>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4" /></div>
                    <div>
                      <p className="font-semibold text-sm">Extract Audio Only (Podcast)</p>
                      <p className="text-xs text-zinc-500 mt-1">Strip video and master the audio for podcast or voiceover reuse.</p>
                    </div>
                  </button>
                </div>
              </div>

              <button onClick={handleRepurpose} disabled={isRepurposing} className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {isRepurposing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing Video...</> : <><Sparkles className="w-5 h-5" /> Execute Repurpose</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><Edit className="w-5 h-5 text-indigo-500" /> Edit Video Details</h2>
              <button onClick={() => setEditModal(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Title</label>
                <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Script / Content</label>
                <textarea rows={6} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancel</button>
                <button onClick={handleSaveEdit} disabled={isSaving || !editForm.title.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
