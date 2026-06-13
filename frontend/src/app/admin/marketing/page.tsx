"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Copy, Megaphone, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

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
}

export default function MarketingHub() {
  const { token } = useAuthStore();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [ads, setAds] = useState<AdAsset[]>([]);
  const [activeTab, setActiveTab] = useState<"sequences" | "ads">("sequences");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  return (
    <div className="p-8 max-w-6xl mx-auto">
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

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab("sequences")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "sequences"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Email & SMS Sequences
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "ads"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Ad Copy & Assets
        </button>
      </div>

      {/* Sequences Tab */}
      {activeTab === "sequences" && (
        <div className="space-y-8">
          {sequences.map((seq) => (
            <div key={seq.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between">
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
              <div className="p-6 space-y-6">
                {seq.steps.sort((a,b)=>a.day_offset - b.day_offset).map((step, idx) => (
                  <div key={step.id} className="flex gap-4 relative">
                    {/* Timeline Connector */}
                    {idx !== seq.steps.length - 1 && (
                      <div className="absolute left-6 top-10 bottom-[-24px] w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>
                    )}
                    
                    <div className="shrink-0 w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400 z-10 border-4 border-white dark:border-zinc-900">
                      D{step.day_offset}
                    </div>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-lg p-5 border border-zinc-200 dark:border-zinc-800">
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
          {sequences.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No sequences found.</div>
          )}
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === "ads" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {ad.industry_category}
                  </span>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{ad.title}</h3>
                </div>
                <button
                  onClick={() => handleCopy(ad.content, ad.id)}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {copiedId === ad.id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {ad.content}
                </p>
              </div>
            </div>
          ))}
          {ads.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">No ad copy found.</div>
          )}
        </div>
      )}
    </div>
  );
}
