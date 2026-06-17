"use client";

import { useState, useEffect } from "react";
import { Video, Loader2, ExternalLink, Sparkles, CheckCircle2, X, Film, AlertCircle, History, Copy, RotateCcw, Search, ChevronDown, ChevronUp, Clock, Wand2, Building2, ChevronRight, Mic, Share2, Rocket, ClipboardPaste } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

const VIDEO_PROVIDERS = [
  { id: "heygen", name: "HeyGen Studio", description: "AI avatar videos from text.", color: "bg-indigo-600", tag: "Avatar", tagColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  { id: "synthesia", name: "Synthesia", description: "Professional AI avatar video creation.", color: "bg-blue-600", tag: "Avatar", tagColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "runway", name: "Runway Gen-3", description: "Cinematic B-roll scene generation.", color: "bg-zinc-800", tag: "Cinematic", tagColor: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  { id: "google", name: "Google Veo 2.0", description: "High-fidelity cinematic video generation.", color: "bg-gradient-to-br from-blue-600 to-green-500", tag: "Cinematic", tagColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { id: "google_flow", name: "Google Flow (Veo 3.1)", description: "Highest quality cinematic video generation.", color: "bg-gradient-to-br from-violet-600 to-blue-600", tag: "⭐ Best Quality", tagColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" }
];

type VideoJob = { assetId: string; provider: string; providerName: string; prompt: string; status: "PROCESSING" | "COMPLETED" | "FAILED"; videoUrl?: string; startedAt: Date; };
type PromptHistory = { id: string; title: string; content: string; created_at: string; video_status?: string; video_url?: string; video_provider?: string; };

export default function VideoStudioPage() {
  const { token } = useAuthStore();
  const [studioTab, setStudioTab] = useState<"single" | "magic" | "series">("single");
  const [selectedProvider, setSelectedProvider] = useState<typeof VIDEO_PROVIDERS[0] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [activeJobs, setActiveJobs] = useState<VideoJob[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptForm, setScriptForm] = useState({ industry: "Real Estate", video_type: "TikTok Video Script", tone: "Urgent/FOMO", topic: "", pain_points: "" });

  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);
  const [showHooksModal, setShowHooksModal] = useState(false);

  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [voiceoverDataUrl, setVoiceoverDataUrl] = useState<string | null>(null);

  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposeModal, setRepurposeModal] = useState<PromptHistory | null>(null);
  const [repurposeFormat, setRepurposeFormat] = useState("email");
  const [repurposedContent, setRepurposedContent] = useState("");

  // Magic Bundle State
  const [isBundling, setIsBundling] = useState(false);
  const [bundleForm, setBundleForm] = useState({ campaign_name: "", industry: "Real Estate", topic: "", tone: "Professional & Urgent", target_language: "English" });
  const [bundleResult, setBundleResult] = useState<any>(null);

  // Series Mode State
  const [isGeneratingSeries, setIsGeneratingSeries] = useState(false);
  const [seriesForm, setSeriesForm] = useState({ series_title: "", industry: "Fitness", topic: "", episodes: 3 });
  const [seriesResult, setSeriesResult] = useState<any>(null);

  const handleBundleCampaign = async () => {
    if (!bundleForm.campaign_name || !bundleForm.topic) return setErrorMsg("Please fill out campaign name and topic.");
    setIsBundling(true); setErrorMsg(""); setSuccessMsg(""); setBundleResult(null);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/bundle-campaign/`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ campaign_name: bundleForm.campaign_name, industry: bundleForm.industry, topic: bundleForm.topic, tone: bundleForm.tone, target_language: bundleForm.target_language, video_provider: selectedProvider?.id || "heygen" }),
        });
        if (!res.ok) throw new Error("Magic Bundle generation failed.");
        const data = await res.json();
        setBundleResult(data);
        setSuccessMsg("✨ Magic Bundle generated successfully! Check your Video Library and Campaigns.");
        await fetchPromptHistory();
        
        // Add pseudo-job to queue to show processing
        setActiveJobs(prev => [{ assetId: data.video_asset_id, provider: selectedProvider?.id || "heygen", providerName: selectedProvider?.name || "HeyGen Studio", prompt: "Magic Bundle AI Script Auto-Generation", status: "PROCESSING", startedAt: new Date() }, ...prev]);
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsBundling(false); }
  };

  const handleGenerateScript = async () => {
    if (!scriptForm.topic.trim()) { setErrorMsg("Please enter a topic."); return; }
    setIsGeneratingScript(true); setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/generate-ad`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ industry_category: scriptForm.industry, platform: scriptForm.video_type, topic: scriptForm.topic, content_style: scriptForm.tone, target_pain_points: scriptForm.pain_points || undefined }),
      });
      if (!res.ok) throw new Error("Script generation failed.");
      const data = await res.json();
      setPrompt(data.content || "");
      setIsGeneratorOpen(false);
      setSuccessMsg("✅ Script generated!");
      setTimeout(() => document.getElementById("prompt-textarea")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      await fetchPromptHistory();
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsGeneratingScript(false); }
  };

  const handleGenerateHooks = async () => {
    if (!prompt.trim() && !scriptForm.topic.trim()) { setErrorMsg("Please write a topic or script first."); return; }
    setIsGeneratingHooks(true); setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/generate-hooks`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: prompt.slice(0, 100) || scriptForm.topic, industry: scriptForm.industry, platform: scriptForm.video_type, count: 5 }),
      });
      if (!res.ok) throw new Error("Failed to generate hooks.");
      const data = await res.json();
      setGeneratedHooks(data.hooks || []);
      setShowHooksModal(true);
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsGeneratingHooks(false); }
  };

  const handleGenerateVoiceover = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingVoiceover(true); setErrorMsg(""); setVoiceoverDataUrl(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/generate-voiceover`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ script: prompt }),
      });
      if (!res.ok) throw new Error("Voiceover failed. Check your ElevenLabs key.");
      const data = await res.json();
      setVoiceoverDataUrl(`data:${data.mime_type};base64,${data.audio_base64}`);
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsGeneratingVoiceover(false); }
  };

  const handleRepurpose = async () => {
    if (!repurposeModal) return;
    setIsRepurposing(true); setErrorMsg("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/repurpose-script`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ script: repurposeModal.content, target_format: repurposeFormat }),
      });
      if (!res.ok) throw new Error("Repurposing failed.");
      const data = await res.json();
      setRepurposedContent(data.content);
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsRepurposing(false); }
  };

  const fetchPromptHistory = async () => {
    if (!token) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPromptHistory((data.items || data || []).filter((a: PromptHistory) => a.content && a.content.length > 20));
      }
    } catch {}
    setIsHistoryLoading(false);
  };
  useEffect(() => { fetchPromptHistory(); }, [token]);

  useEffect(() => {
    const processingJobs = activeJobs.filter(j => j.status === "PROCESSING");
    if (processingJobs.length === 0) return;
    const interval = setInterval(async () => {
      const updated = await Promise.all(
        activeJobs.map(async (job) => {
          if (job.status !== "PROCESSING") return job;
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/${job.assetId}/video-status`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); return { ...job, status: data.video_status, videoUrl: data.video_url }; }
          } catch {}
          return job;
        })
      );
      setActiveJobs(updated as VideoJob[]);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeJobs, token]);

  const handleCreateVideo = async () => {
    if (!selectedProvider || !prompt.trim()) return;
    setIsCreating(true); setErrorMsg(""); setSuccessMsg("");
    try {
      const assetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asset_type: "AD_COPY", industry_category: "Video Studio", title: `Video Studio — ${selectedProvider.name} — ${new Date().toLocaleDateString()}`, content: prompt }),
      });
      if (!assetRes.ok) throw new Error("Failed to create asset.");
      const asset = await assetRes.json();

      const genRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/${asset.id}/generate-video?provider=${selectedProvider.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!genRes.ok) throw new Error("Failed to start video generation.");

      setActiveJobs(prev => [{ assetId: asset.id, provider: selectedProvider.id, providerName: selectedProvider.name, prompt, status: "PROCESSING", startedAt: new Date() }, ...prev]);
      setSuccessMsg(`✅ Video rendering started with ${selectedProvider.name}!`);
      setPrompt(""); setSelectedProvider(null);
      await fetchPromptHistory();
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsCreating(false); }
  };

  const handleGenerateSeries = async () => {
    if (!selectedProvider || !seriesForm.topic.trim()) return;
    setIsGeneratingSeries(true); setErrorMsg(""); setSuccessMsg("");
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/generate-hooks`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ topic: `Series: ${seriesForm.series_title}. Concept: ${seriesForm.topic}`, industry: seriesForm.industry, platform: "TikTok", count: seriesForm.episodes }),
        });
        if (!res.ok) throw new Error("Failed to generate series episodes.");
        const data = await res.json();
        
        // Loop through generated hooks and create videos
        const newJobs: VideoJob[] = [];
        for (let i = 0; i < data.hooks.length; i++) {
            const hook = data.hooks[i];
            const assetRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ asset_type: "AD_COPY", industry_category: seriesForm.industry, title: `${seriesForm.series_title} - Episode ${i+1}`, content: hook }),
            });
            if (assetRes.ok) {
                const asset = await assetRes.json();
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/marketing-assets/${asset.id}/generate-video?provider=${selectedProvider.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                newJobs.push({ assetId: asset.id, provider: selectedProvider.id, providerName: selectedProvider.name, prompt: hook, status: "PROCESSING", startedAt: new Date() });
            }
        }
        
        setActiveJobs(prev => [...newJobs, ...prev]);
        setSuccessMsg(`✅ Generated ${newJobs.length} episodes and queued them for rendering!`);
        setSeriesResult({ count: newJobs.length });
        await fetchPromptHistory();
    } catch (e: any) { setErrorMsg(e.message); } finally { setIsGeneratingSeries(false); }
  };

  const filteredHistory = promptHistory.filter(p => p.title.toLowerCase().includes(historySearch.toLowerCase()) || p.content.toLowerCase().includes(historySearch.toLowerCase()));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Video Studio</h1>
          <p className="text-zinc-500 mt-2 text-lg">Create AI-generated videos from scratch or launch massive omnichannel campaigns.</p>
        </div>
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl overflow-x-auto">
          <button onClick={() => setStudioTab("single")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${studioTab === "single" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}><Film className="w-4 h-4 inline-block mr-2" />Single Video</button>
          <button onClick={() => setStudioTab("magic")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${studioTab === "magic" ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400"}`}><Rocket className="w-4 h-4 inline-block mr-2" />Magic Bundle</button>
          <button onClick={() => setStudioTab("series")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${studioTab === "series" ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm" : "text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"}`}><Film className="w-4 h-4 inline-block mr-2" />Series Mode</button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-800 dark:text-green-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
          <button onClick={() => setSuccessMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
          <button onClick={() => setErrorMsg("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          
          {studioTab === "magic" ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-violet-200 dark:border-violet-900/50 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-violet-500/10 dark:bg-violet-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
              
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 flex items-center gap-2"><Rocket className="w-6 h-6 text-violet-500" /> Omni-Channel Campaign Bundle</h2>
              <p className="text-sm text-zinc-500 mb-6">Instantly orchestrate an entire marketing campaign from a single prompt. We will automatically generate and schedule your Video, Blog Post, 3-part Email Drip, and 5 Social Media posts.</p>

              <div className="space-y-3 mb-5">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Choose Visual Video AI</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VIDEO_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)} className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedProvider?.id === p.id ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-500/30" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${p.color}`}><Video className="w-4 h-4" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tagColor}`}>{p.tag}</span></div>
                      {selectedProvider?.id === p.id && <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-1.5"><label className="text-sm font-semibold">Campaign Name</label><input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" placeholder="e.g. Summer Real Estate Push" value={bundleForm.campaign_name} onChange={e => setBundleForm({ ...bundleForm, campaign_name: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Industry</label><input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" value={bundleForm.industry} onChange={e => setBundleForm({ ...bundleForm, industry: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Overall Tone</label><input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" value={bundleForm.tone} onChange={e => setBundleForm({ ...bundleForm, tone: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Target Language</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" value={bundleForm.target_language} onChange={e => setBundleForm({ ...bundleForm, target_language: e.target.value })}>
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Dutch">Dutch</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Korean">Korean</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-semibold">Central Topic / Offer / Hook</label><textarea rows={4} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none" placeholder="Describe the core offer, e.g. 'We are doing free home valuations for the month of July...'" value={bundleForm.topic} onChange={e => setBundleForm({ ...bundleForm, topic: e.target.value })} /></div>
              </div>

              <button onClick={handleBundleCampaign} disabled={isBundling || !bundleForm.topic.trim() || !bundleForm.campaign_name.trim()} className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 transition-all hover:scale-[1.02]">
                {isBundling ? <><Loader2 className="w-5 h-5 animate-spin" /> Orchestrating AI Pipeline...</> : <><Sparkles className="w-5 h-5" /> Generate Complete Campaign</>}
              </button>

              {bundleResult && (
                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3">Generation Complete</h3>
                  <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Video Script Generated & Render Started</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> SEO Blog Post Created</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 3-Part Email Drip Sequence Scheduled</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 5 Social Media Captions Drafted</li>
                  </ul>
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                    <Link href="/admin/video-library" className="text-sm font-semibold text-violet-600 hover:underline">View Video in Library →</Link>
                    <Link href="/admin/social" className="text-sm font-semibold text-indigo-600 hover:underline">View Social Posts →</Link>
                  </div>
                </div>
              )}
            </div>
          ) : studioTab === "series" ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-blue-200 dark:border-blue-900/50 shadow-sm p-6 relative overflow-hidden">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 flex items-center gap-2"><Film className="w-6 h-6 text-blue-500" /> Auto-Generate Video Series</h2>
              <p className="text-sm text-zinc-500 mb-6">Instantly create a multi-part episodic video series (e.g. 5-Part Challenge, 3-Part Tips) from a single prompt.</p>

              <div className="space-y-3 mb-5">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Choose AI Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VIDEO_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)} className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedProvider?.id === p.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${p.color}`}><Video className="w-4 h-4" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</p></div>
                      {selectedProvider?.id === p.id && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Series Title</label><input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 5 Days to Better Sleep" value={seriesForm.series_title} onChange={e => setSeriesForm({ ...seriesForm, series_title: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-semibold">Number of Episodes</label><input type="number" min="2" max="10" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={seriesForm.episodes} onChange={e => setSeriesForm({ ...seriesForm, episodes: parseInt(e.target.value) || 3 })} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-semibold">Industry</label><input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={seriesForm.industry} onChange={e => setSeriesForm({ ...seriesForm, industry: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-semibold">Overall Series Concept</label><textarea rows={4} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="Describe the overarching theme of this series..." value={seriesForm.topic} onChange={e => setSeriesForm({ ...seriesForm, topic: e.target.value })} /></div>
              </div>

              <button onClick={handleGenerateSeries} disabled={isGeneratingSeries || !seriesForm.topic.trim() || !seriesForm.series_title.trim() || !selectedProvider} className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all">
                {isGeneratingSeries ? <><Loader2 className="w-5 h-5 animate-spin" /> Batch Processing Series...</> : <><Sparkles className="w-5 h-5" /> Generate {seriesForm.episodes} Episodes</>}
              </button>

              {seriesResult && (
                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-semibold">Success! Queued {seriesResult.count} episodes for rendering.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-5 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" />New Video</h2>

              {/* Step 1: Provider */}
              <div className="space-y-3 mb-5">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">1. Choose AI Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {VIDEO_PROVIDERS.map(p => (
                    <button key={p.id} onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)} className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedProvider?.id === p.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/30" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${p.color}`}><Video className="w-4 h-4" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tagColor}`}>{p.tag}</span></div>
                      {selectedProvider?.id === p.id && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Script Gen */}
              <div className="mb-5">
                <button type="button" onClick={() => setIsGeneratorOpen(v => !v)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isGeneratorOpen ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"}`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"><Wand2 className="w-4 h-4 text-indigo-500" />2. Generate Script with AI<span className="text-xs font-normal text-zinc-400 ml-1">— choose industry, type &amp; topic</span></span>
                  {isGeneratorOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </button>

                {isGeneratorOpen && (
                  <div className="mt-3 border border-indigo-100 dark:border-indigo-800/50 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><label className="text-xs font-semibold">Industry</label><input type="text" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm" value={scriptForm.industry} onChange={e => setScriptForm({ ...scriptForm, industry: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold">Video Type</label><input type="text" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm" value={scriptForm.video_type} onChange={e => setScriptForm({ ...scriptForm, video_type: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold">Tone</label><input type="text" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm" value={scriptForm.tone} onChange={e => setScriptForm({ ...scriptForm, tone: e.target.value })} /></div>
                      <div className="space-y-1.5"><label className="text-xs font-semibold">Topic / Offer</label><input type="text" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm" value={scriptForm.topic} onChange={e => setScriptForm({ ...scriptForm, topic: e.target.value })} /></div>
                    </div>
                    <div className="flex justify-end pt-2"><button onClick={handleGenerateScript} disabled={isGeneratingScript || !scriptForm.topic.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate Script</button></div>
                  </div>
                )}
              </div>

              {/* Step 3: Prompt & Extras */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">3. Video Prompt / Script</label>
                    <button 
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          setPrompt(prev => prev + (prev ? "\n\n" : "") + text);
                        } catch (err) {
                          console.error("Failed to read clipboard contents: ", err);
                        }
                      }} 
                      title="Paste from clipboard" 
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={handleGenerateHooks} disabled={isGeneratingHooks} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg transition-colors border border-amber-200 dark:border-amber-800">
                    {isGeneratingHooks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate 5 Viral Hooks
                  </button>
                </div>
                <textarea id="prompt-textarea" rows={6} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" placeholder="Write or paste your script here..." value={prompt} onChange={e => setPrompt(e.target.value)} />
                
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  <p className="text-xs text-zinc-400">{prompt.length} chars</p>
                  <button onClick={handleGenerateVoiceover} disabled={isGeneratingVoiceover || !prompt.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 disabled:opacity-50">
                    {isGeneratingVoiceover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                    Generate AI Voiceover (ElevenLabs)
                  </button>
                </div>
                {voiceoverDataUrl && (
                  <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Voiceover Audio Preview:</p>
                    <audio controls className="w-full h-10" src={voiceoverDataUrl} />
                  </div>
                )}
              </div>

              {/* Options & Create */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2"><label className="text-sm font-semibold">Aspect Ratio</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border rounded-lg p-2.5 text-sm" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}><option value="16:9">16:9</option><option value="9:16">9:16</option></select></div>
                <div className="space-y-2"><label className="text-sm font-semibold">Duration</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border rounded-lg p-2.5 text-sm" value={duration} onChange={e => setDuration(e.target.value)}><option value="5">5s</option><option value="15">15s</option></select></div>
              </div>
              <button onClick={handleCreateVideo} disabled={isCreating || !selectedProvider || !prompt.trim()} className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                {isCreating ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting Render...</> : <><Sparkles className="w-5 h-5" /> Create Video</>}
              </button>
            </div>
          )}

          {/* History */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> Previous Prompts & Scripts</h2>
              <button onClick={fetchPromptHistory} className="p-2 hover:bg-zinc-100 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
            </div>
            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" /><input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-sm" value={historySearch} onChange={e => setHistorySearch(e.target.value)} /></div>
            
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {filteredHistory.map(item => {
                const isExpanded = expandedHistoryId === item.id;
                return (
                  <div key={item.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden">
                    <div className="flex items-start justify-between p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        <button 
                          onClick={() => { 
                            navigator.clipboard.writeText(item.content); 
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }} 
                          title="Copy" 
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        >
                          {copiedId === item.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => { setRepurposeModal(item); setRepurposedContent(""); }} title="Repurpose Content" className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Share2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setPrompt(item.content); document.getElementById("prompt-textarea")?.scrollIntoView({behavior:"smooth"}); }} title="Reuse" className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><RotateCcw className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)} className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg">{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
                      </div>
                    </div>
                    {isExpanded && <div className="px-3 pb-3"><div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border text-xs whitespace-pre-wrap">{item.content}</div></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Film className="w-5 h-5 text-indigo-500" /> Job Queue</h2>
            {activeJobs.length === 0 ? (
              <div className="text-center py-8 text-zinc-400"><Video className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No jobs yet.</p></div>
            ) : (
              <div className="space-y-3">
                {activeJobs.map((job, i) => (
                  <div key={i} className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-950">
                    <div className="flex items-center justify-between mb-1"><p className="text-xs font-semibold">{job.providerName}</p>{job.status === "PROCESSING" && <span className="text-xs text-amber-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Rendering</span>}{job.status === "COMPLETED" && <span className="text-xs text-green-600">✓ Done</span>}</div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{job.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hooks Modal */}
      {showHooksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> 5 Viral Hooks Generated</h2>
              <button onClick={() => setShowHooksModal(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-zinc-500 mb-2">Click any hook below to insert it at the beginning of your script.</p>
              {generatedHooks.map((h, i) => (
                <button key={i} onClick={() => { setPrompt(h + "\n\n" + prompt); setShowHooksModal(false); }} className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{h}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Repurpose Modal */}
      {repurposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2"><Share2 className="w-5 h-5 text-blue-500" /> Repurpose Script</h2>
              <button onClick={() => setRepurposeModal(null)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <select className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm flex-1" value={repurposeFormat} onChange={e => setRepurposeFormat(e.target.value)}>
                  <option value="email">Email Newsletter</option><option value="blog">SEO Blog Post</option>
                  <option value="linkedin">LinkedIn Post</option><option value="twitter_thread">Twitter Thread</option>
                  <option value="sms">SMS Marketing</option>
                </select>
                <button onClick={handleRepurpose} disabled={isRepurposing} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                  {isRepurposing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Transform
                </button>
              </div>
              {repurposedContent && (
                <div className="relative">
                  <textarea readOnly rows={12} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-900 dark:text-zinc-100" value={repurposedContent} />
                  <button onClick={() => navigator.clipboard.writeText(repurposedContent)} className="absolute top-3 right-3 p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm hover:bg-zinc-50">
                    <Copy className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
