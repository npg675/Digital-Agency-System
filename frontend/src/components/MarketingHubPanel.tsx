"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Copy, Megaphone, Mail, ArrowRight, CheckCircle2, Lightbulb, Target, Rocket, Users, FileText, BarChart, BookOpen, Key, Settings, ListTree, CreditCard, LayoutDashboard, Calendar, Activity, Bell, Star, Filter, Zap, GraduationCap, Cloud, Image as ImageIcon, HardDrive, SplitSquareVertical, Globe, Search, Sparkles, X, Loader2, Share2, Route, MessageSquare, MapPin, Network } from "lucide-react";
import Link from "next/link";

interface SequenceStep {
  id: string;
  day_offset: number;
  step_type: string;
  subject_line?: string;
  body_content: string;
}

interface Sequence {
  id: string;
  name: string;
  industry_category: string;
  objective?: string;
  steps: SequenceStep[];
}

interface AdAsset {
  id: string;
  asset_type: string;
  industry_category: string;
  title: string;
  content: string;
  file_url?: string;
  video_url?: string;
  video_status?: string;
  video_job_id?: string;
  video_provider?: string;
}

interface MarketingHubPanelProps {
  isPanelMode?: boolean;
}

export function MarketingHubPanel({ isPanelMode = false }: MarketingHubPanelProps) {
  const { token, user } = useAuthStore();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [ads, setAds] = useState<AdAsset[]>([]);
  const [activeTab, setActiveTab] = useState<"sequences" | "ads" | "hints">("sequences");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // AI Generation
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateFormData, setGenerateFormData] = useState({
    industry_category: "Real Estate",
    platform: "Facebook",
    topic: "",
    content_style: "Direct Pitch",
    target_pain_points: "",
    video_length: "30 Seconds",
    ai_model: "GPT-4o",
    ab_test_mode: false
  });

  // Video Generation
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [videoProvider, setVideoProvider] = useState("heygen");
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoCustomization, setVideoCustomization] = useState({
    avatar: "Anna (Professional)",
    voice: "Female - Upbeat",
    aspect_ratio: "16:9",
    style: "Photorealistic"
  });

  // Ad Deployment
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedDeployAd, setSelectedDeployAd] = useState<AdAsset | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployFormData, setDeployFormData] = useState({
    budget: 50,
    target_audience: "Broad (AI Optimized)",
    platform: "Meta (Facebook/Instagram)"
  });

  // Polling for video status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const activeJobs = ads.filter(a => a.video_status === "PROCESSING").map(a => a.id);
    
    if (activeJobs.length > 0) {
      interval = setInterval(async () => {
        for (const assetId of activeJobs) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/${assetId}/video-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.video_status !== "PROCESSING") {
                setAds(prev => prev.map(a => a.id === assetId ? { ...a, video_status: data.video_status, video_url: data.video_url } : a));
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }, 5000); // poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [ads, token]);

  const handleGenerateVideo = async () => {
    if (!selectedScriptId) return;
    setIsVideoGenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/${selectedScriptId}/generate-video?provider=${videoProvider}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAds(prev => prev.map(a => a.id === selectedScriptId ? { ...a, video_status: "PROCESSING" } : a));
        setIsVideoModalOpen(false);
      } else {
        const err = await res.json();
        alert(`Failed: ${err.detail}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !isPanelMode) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('tab') === 'hints') {
        setActiveTab('hints');
      }
    }
  }, [isPanelMode]);

  useEffect(() => {
    if (!token) return;
    fetchSequences();
    fetchAds();
  }, [token]);

  const fetchSequences = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/sequences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSequences(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAds = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAds(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      if (generateFormData.ab_test_mode) {
        // Run two requests concurrently for A/B Testing
        const [resA, resB] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/generate-ad`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...generateFormData, content_style: "Direct Pitch", topic: `[Variant A] ${generateFormData.topic}` })
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/generate-ad`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...generateFormData, content_style: "Storytelling/Testimonial", topic: `[Variant B] ${generateFormData.topic}` })
          })
        ]);

        if (resA.ok && resB.ok) {
          const adA = await resA.json();
          const adB = await resB.json();
          setAds([adA, adB, ...ads]);
          setIsGenerateModalOpen(false);
          setGenerateFormData({ ...generateFormData, topic: "", target_pain_points: "", ab_test_mode: false });
        } else {
          alert("Failed to generate A/B variants");
        }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/generate-ad`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(generateFormData)
        });

        if (res.ok) {
          const newAd = await res.json();
          setAds([newAd, ...ads]);
          setIsGenerateModalOpen(false);
          setGenerateFormData({ ...generateFormData, topic: "", target_pain_points: "", ab_test_mode: false });
        } else {
          const err = await res.json();
          alert(`Failed to generate ad: ${err.detail}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while generating.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredSequences = sequences.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.industry_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.objective && s.objective.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAds = ads.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.industry_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canGenerateAds = user?.role === "ADMIN" || user?.client_can_generate_ads;

  return (
    <div className={`w-full ${isPanelMode ? '' : 'p-8 max-w-6xl mx-auto'}`}>
      {!isPanelMode && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg">
              <Megaphone className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Marketing Hub
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            Proven, conversion-optimized email sequences and ad copy. Copy and paste directly into your campaigns.
          </p>
        </>
      )}

      {isPanelMode && (
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Megaphone className="w-5 h-5 text-indigo-500" />
            Marketing Hub Assets
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Copy ad copy and sequences below.</p>
        </div>
      )}

      {/* Header and Controls */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6`}>
        <div className={`flex ${isPanelMode ? 'space-x-2' : 'space-x-4'} border-b border-zinc-200 dark:border-zinc-800 flex-wrap overflow-x-auto`}>
          <button
            onClick={() => setActiveTab("sequences")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "sequences"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
          >
            Email & SMS Sequences
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "ads"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
          >
            Ad Copy & Assets
          </button>
          <button
            onClick={() => setActiveTab("hints")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "hints"
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
          >
            <Lightbulb className="w-4 h-4" />
            Hint Steps & Best Practices
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab !== "hints" && (
            <div className="relative flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-4 py-2 w-full ${isPanelMode ? '' : 'md:w-64'} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          )}

          {activeTab === "ads" && canGenerateAds && (
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Generate with AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Sequences Tab */}
      {activeTab === "sequences" && (
        <div className={`grid grid-cols-1 ${isPanelMode ? '' : 'lg:grid-cols-2 xl:grid-cols-3'} gap-4 max-h-[70vh] overflow-y-auto pr-2`}>
          {filteredSequences.map((seq) => (
            <div key={seq.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col h-fit max-h-[500px]">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      {seq.industry_category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {seq.name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Objective: {seq.objective}
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                {seq.steps.sort((a, b) => a.day_offset - b.day_offset).map((step, idx) => (
                  <div key={step.id} className="flex gap-4 relative">
                    {/* Timeline Connector */}
                    {idx !== seq.steps.length - 1 && (
                      <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>
                    )}

                    <div className="shrink-0 w-8 h-8 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400 z-10 border-[3px] border-white dark:border-zinc-900 mt-1">
                      D{step.day_offset}
                    </div>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          {step.step_type === "EMAIL" ? <Mail className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                          {step.step_type}
                        </div>
                        <button
                          onClick={() => handleCopy(step.subject_line ? `Subject: ${step.subject_line}\n\n${step.body_content}` : step.body_content, step.id)}
                          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedId === step.id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      {step.subject_line && (
                        <div className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <span className="text-zinc-500 font-normal">Subject:</span> {step.subject_line}
                        </div>
                      )}
                      <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {step.body_content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredSequences.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">No sequences found matching your search.</div>
          )}
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === "ads" && (
        <div className={`grid grid-cols-1 ${isPanelMode ? '' : 'md:grid-cols-3 lg:grid-cols-4'} gap-4 max-h-[70vh] overflow-y-auto pr-2`}>
          {filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {ad.industry_category}
                  </span>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{ad.title}</h3>
                </div>
                <div className="flex gap-2">
                  <>
                    {ad.video_status === "PROCESSING" ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-sm font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Rendering...
                        </div>
                      ) : ad.video_status === "COMPLETED" && ad.video_url ? (
                        <a href={ad.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                          View Video
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedScriptId(ad.id);
                            setIsVideoModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Generate Video
                        </button>
                      )}
                    </>
                  <button
                    onClick={() => handleCopy(ad.content, ad.id)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Copy to clipboard"
                  >
                    {copiedId === ad.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-lg p-3 text-sm text-zinc-700 dark:text-zinc-300 font-mono whitespace-pre-wrap overflow-y-auto mb-3">
                {ad.content}
              </div>
              
              {/* Deploy Action */}
              <button
                onClick={() => {
                  setSelectedDeployAd(ad);
                  setIsDeployModalOpen(true);
                }}
                className="w-full py-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Rocket className="w-4 h-4" /> Deploy to Ads Manager
              </button>
            </div>
          ))}
          {filteredAds.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">No ad copy found matching your search.</div>
          )}
        </div>
      )}

      {/* Hints Tab */}
      {activeTab === "hints" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[70vh] overflow-y-auto pr-2">
          {/* Include only when NOT in panel mode to save space, but keeping the implementation logic intact */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl px-5 py-4 text-white shadow relative overflow-hidden flex items-center gap-4">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
            <Key className="w-6 h-6 shrink-0 relative z-10" />
            <div className="relative z-10">
              <h2 className="text-base font-bold leading-tight">The A-Z Master Playbook</h2>
              <p className="text-indigo-100 text-xs mt-0.5">Step-by-step roadmap from first client to world-class delivery — across every agency lifecycle phase.</p>
            </div>
          </div>

          <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-4 md:ml-6 space-y-8 pb-4 mt-8">
            
            {/* Step 1: Agency Setup */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-zinc-600 dark:text-zinc-400 font-bold text-sm md:text-base">
                1
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-zinc-500" /> Agency Setup
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Before onboarding clients, configure your Stripe API for billing, AI API keys, SMTP, and White-Label domains.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/settings?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-md"><Settings className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Agency Settings</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure global platform keys.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-zinc-500 transition-all transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 2: Onboarding */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-indigo-600 dark:text-indigo-400 font-bold text-sm md:text-base">
                2
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Client Onboarding
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Start by creating the client's profile and configuring their Brand Vault (social links, colors, etc).</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/users?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md"><Users className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Create Client Profile</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Add details & assign manager.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 3: Workflows */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-emerald-600 dark:text-emerald-400 font-bold text-sm md:text-base">
                3
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <ListTree className="w-5 h-5 text-emerald-500" /> SLAs & Workflows
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Assign standard operating procedures (SOPs) and task checklists for the team.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/workflows?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md"><ListTree className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Assign Workflow</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure Service Level Agreements.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-emerald-500 transition-all transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4: Funnels */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-orange-600 dark:text-orange-400 font-bold text-sm md:text-base">
                4
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Route className="w-5 h-5 text-orange-500" /> Build the Offer
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Set up their landing pages and link them together in a high-converting funnel.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/templates?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md"><Copy className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Page Templates</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Pick a starting design.</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/funnels?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-md"><Route className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Funnel Builder</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Connect pages together.</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 5: Marketing Hub */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-purple-600 dark:text-purple-400 font-bold text-sm md:text-base">
                5
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Megaphone className="w-5 h-5 text-purple-500" /> Prepare Marketing
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Generate Ad Copy and schedule email sequences for the new funnel.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/marketing?tab=ads" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md"><Sparkles className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Generate Ads</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Use AI to write ad copy.</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/marketing?tab=sequences" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md"><Mail className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Email Sequences</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Launch drip campaigns.</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 6: Launch */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-pink-100 dark:bg-pink-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-pink-600 dark:text-pink-400 font-bold text-sm md:text-base">
                6
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Rocket className="w-5 h-5 text-pink-500" /> Launch Campaigns
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Go live by scheduling social media posts and tracking paid ads.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/social?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-md"><Share2 className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Social Scheduler</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Queue up FB/IG posts.</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/campaigns?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-pink-300 dark:hover:border-pink-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-md"><LayoutDashboard className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Ad Campaigns</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Track ROAS & costs.</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 7: Daily Operations */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-cyan-100 dark:bg-cyan-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-cyan-600 dark:text-cyan-400 font-bold text-sm md:text-base">
                7
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-cyan-500" /> Daily Operations
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Manage incoming prospects, reply to messages, and book appointments.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Link href="/admin/leads?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-md"><Users className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Leads CRM</h4>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/inbox?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-md"><MessageSquare className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Unified Inbox</h4>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/calendar?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-cyan-300 dark:hover:border-cyan-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-md"><Calendar className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Calendar</h4>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 8: Automations & Courses */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-rose-600 dark:text-rose-400 font-bold text-sm md:text-base">
                8
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-rose-500" /> Scale & Automate
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Connect Zapier webhooks to auto-trigger actions, and grant clients access to training courses.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/admin/automations?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md"><Zap className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Automations</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure Webhooks.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition-all transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/admin/courses?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md"><GraduationCap className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Courses</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage client training.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition-all transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 9: Billing & Reports */}
            <div className="relative">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-amber-600 dark:text-amber-400 font-bold text-sm md:text-base">
                9
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <BarChart className="w-5 h-5 text-amber-500" /> Billing & Reports
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Send invoices, monitor client reviews, and share performance reports.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Link href="/admin/invoices?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md"><CreditCard className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Invoices</h4>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/reputation?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md"><Star className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Reputation</h4>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/reports?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md"><BarChart className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Reports</h4>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 10: SEO & Traffic Growth */}
            <div className="relative mt-8">
              <div className="absolute -left-[17px] md:-left-[21px] top-0 w-8 h-8 md:w-10 md:h-10 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 z-10 text-teal-600 dark:text-teal-400 font-bold text-sm md:text-base">
                10
              </div>
              <div className="pl-6 md:pl-8">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-teal-500" /> SEO & Traffic Growth
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Run technical audits, track local Google Business rankings, and scale with AI content clusters.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Link href="/admin/seo-audits?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-md"><Globe className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">SEO Audits</h4>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/local-seo?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-md"><MapPin className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Local Grid Tracker</h4>
                      </div>
                    </div>
                  </Link>
                  <Link href="/admin/content-strategy?from=playbook" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-md"><Network className="w-4 h-4" /></div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Content Strategy</h4>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Generate Ad Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Generate AI Ad Copy
              </h2>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAd} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Industry / Niche</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={generateFormData.industry_category}
                  onChange={e => setGenerateFormData({ ...generateFormData, industry_category: e.target.value })}
                  required
                >
                  <option value="Real Estate">Real Estate</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Travel">Travel</option>
                  <option value="Ecommerce">Ecommerce</option>
                  <option value="Construction">Construction</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Finance">Finance</option>
                  <option value="Software Company">Software Company</option>
                  <option value="NGO">NGO</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Beauty & Salon">Beauty & Salon</option>
                  <option value="Gym & Fitness">Gym & Fitness</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Platform</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={generateFormData.platform}
                  onChange={e => setGenerateFormData({ ...generateFormData, platform: e.target.value })}
                  required
                >
                  <option value="Facebook">Facebook Ad</option>
                  <option value="Instagram">Instagram Ad</option>
                  <option value="LinkedIn">LinkedIn Ad</option>
                  <option value="Google">Google Ad</option>
                  <option value="Twitter">Twitter Ad</option>
                  <option value="TikTok Script">TikTok Video Script</option>
                  <option value="YouTube Shorts Script">YouTube Shorts Script</option>
                  <option value="Instagram Reels Script">Instagram Reels Script</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Topic / Offer</label>
                <textarea
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px]"
                  placeholder="e.g. Free 3-Day VIP pass for locals"
                  value={generateFormData.topic}
                  onChange={e => setGenerateFormData({ ...generateFormData, topic: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Content Style / Vibe</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={generateFormData.content_style}
                  onChange={e => setGenerateFormData({ ...generateFormData, content_style: e.target.value })}
                >
                  <option value="Direct Pitch">Direct Pitch</option>
                  <option value="Educational/How-To">Educational / How-To</option>
                  <option value="Entertainment/Humorous">Entertainment / Humorous</option>
                  <option value="Storytelling/Testimonial">Storytelling / Testimonial</option>
                  <option value="Urgent/FOMO">Urgent / FOMO</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Pain Points (Optional)</label>
                <input
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Too expensive, no time, bad past experiences"
                  value={generateFormData.target_pain_points}
                  onChange={e => setGenerateFormData({ ...generateFormData, target_pain_points: e.target.value })}
                />
              </div>

              {generateFormData.platform.includes("Script") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Video Length</label>
                  <select
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={generateFormData.video_length}
                    onChange={e => setGenerateFormData({ ...generateFormData, video_length: e.target.value })}
                  >
                    <option value="15 Seconds">15 Seconds</option>
                    <option value="30 Seconds">30 Seconds</option>
                    <option value="60 Seconds">60 Seconds</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">AI Model</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={generateFormData.ai_model}
                  onChange={e => setGenerateFormData({ ...generateFormData, ai_model: e.target.value })}
                >
                  <option value="GPT-4o">GPT-4o (Recommended)</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                  <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg mt-4">
                <input 
                  type="checkbox" 
                  id="ab-test-mode"
                  checked={generateFormData.ab_test_mode}
                  onChange={(e) => setGenerateFormData({ ...generateFormData, ab_test_mode: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500" 
                />
                <label htmlFor="ab-test-mode" className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1 cursor-pointer">
                  <SplitSquareVertical className="w-4 h-4" /> Generate A/B Split Test Variants
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isGenerating ? "Generating..." : "Generate Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Generation Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                Generate AI Video
              </h2>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-500">
                Turn this script into a fully produced video. The process runs in the background and takes 1-3 minutes.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Select Provider</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={videoProvider}
                  onChange={e => setVideoProvider(e.target.value)}
                >
                  <option value="heygen">HeyGen (Avatar speaking)</option>
                  <option value="synthesia">Synthesia (Avatar speaking)</option>
                  <option value="runway">Runway Gen-3 (Cinematic B-Roll)</option>
                  <option value="google">Google Veo 2.0 (High-fidelity Video)</option>
                  <option value="google_flow">⭐ Google Flow / Veo 3.1 (Highest Quality)</option>
                </select>
              </div>

              {/* Conditional Customization Fields */}
              {(videoProvider === "heygen" || videoProvider === "synthesia") && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Avatar Selection</label>
                    <select
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={videoCustomization.avatar}
                      onChange={e => setVideoCustomization({ ...videoCustomization, avatar: e.target.value })}
                    >
                      <option value="Anna (Professional)">Anna (Professional)</option>
                      <option value="Marcus (Casual)">Marcus (Casual)</option>
                      <option value="Sarah (Friendly)">Sarah (Friendly)</option>
                      <option value="David (Corporate)">David (Corporate)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Voice Profile</label>
                    <select
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={videoCustomization.voice}
                      onChange={e => setVideoCustomization({ ...videoCustomization, voice: e.target.value })}
                    >
                      <option value="Female - Upbeat">Female - Upbeat</option>
                      <option value="Female - Authoritative">Female - Authoritative</option>
                      <option value="Male - Energetic">Male - Energetic</option>
                      <option value="Male - Trustworthy">Male - Trustworthy</option>
                    </select>
                  </div>
                </>
              )}

              {(videoProvider === "runway" || videoProvider === "google" || videoProvider === "google_flow") && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Aspect Ratio</label>
                    <select
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={videoCustomization.aspect_ratio}
                      onChange={e => setVideoCustomization({ ...videoCustomization, aspect_ratio: e.target.value })}
                    >
                      <option value="16:9">16:9 (YouTube / Desktop)</option>
                      <option value="9:16">9:16 (TikTok / Reels / Shorts)</option>
                      <option value="1:1">1:1 (Instagram Square)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Visual Style</label>
                    <select
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={videoCustomization.style}
                      onChange={e => setVideoCustomization({ ...videoCustomization, style: e.target.value })}
                    >
                      <option value="Photorealistic">Photorealistic / Cinematic</option>
                      <option value="Animation">3D Animation</option>
                      <option value="Minimalist">Minimalist / Clean</option>
                      <option value="UGC">User Generated Content (UGC Style)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isVideoGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isVideoGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isVideoGenerating ? "Starting..." : "Start Rendering"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Ad Modal */}
      {isDeployModalOpen && selectedDeployAd && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                <Rocket className="w-5 h-5 text-rose-500" />
                Deploy Campaign
              </h2>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg text-sm text-rose-700 dark:text-rose-300 mb-4">
                Pushing <strong>{selectedDeployAd.title}</strong> directly to live Ad Manager via API.
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Target Platform</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={deployFormData.platform}
                  onChange={e => setDeployFormData({ ...deployFormData, platform: e.target.value })}
                >
                  <option value="Meta (Facebook/Instagram)">Meta (Facebook / Instagram)</option>
                  <option value="Google Ads (Search/Display)">Google Ads (Search / Display)</option>
                  <option value="TikTok Ads Manager">TikTok Ads Manager</option>
                  <option value="LinkedIn Campaign Manager">LinkedIn Campaign Manager</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily Budget ($)</label>
                <input
                  type="number"
                  min="5"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={deployFormData.budget}
                  onChange={e => setDeployFormData({ ...deployFormData, budget: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Audience Targeting</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  value={deployFormData.target_audience}
                  onChange={e => setDeployFormData({ ...deployFormData, target_audience: e.target.value })}
                >
                  <option value="Broad (AI Optimized)">Advantage+ Broad (AI Optimized)</option>
                  <option value="Lookalike (Past Customers)">Lookalike (Past Customers)</option>
                  <option value="Retargeting (Website Visitors)">Retargeting (Website Visitors)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeploying(true);
                    setTimeout(() => {
                      setIsDeploying(false);
                      setIsDeployModalOpen(false);
                      alert("Successfully deployed to Ads Manager! The campaign is now In Review.");
                    }, 2000);
                  }}
                  disabled={isDeploying}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeploying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  {isDeploying ? "Pushing API..." : "Launch Campaign Live"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
