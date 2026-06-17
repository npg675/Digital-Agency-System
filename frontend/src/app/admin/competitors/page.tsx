"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Crosshair, Search, ShieldAlert, Zap, Loader2, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown 
} from "lucide-react";

interface CompetitorResult {
  threat_level: "High" | "Medium" | "Low";
  threat_reason: string;
  content_gaps: string[];
  positioning_strategy: string;
  attack_angles: string[];
}

export default function CompetitorReconPage() {
  const { token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    client_industry: "",
    competitor_name: "",
    competitor_strengths: ""
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CompetitorResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/analyze-competitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        alert("Failed to analyze competitor. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to intelligence engine.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Search className="w-8 h-8 text-amber-500" />
            Competitor Reconnaissance
          </h1>
          <p className="text-zinc-500 mt-1">Analyze competitors, find their weak spots, and discover content "White Space" you can dominate.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Crosshair className="w-5 h-5 text-indigo-500" /> Target Lock
            </h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Industry / Niche</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. D2C Skincare"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.client_industry}
                  onChange={(e) => setFormData({ ...formData, client_industry: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Competitor Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Glossier"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.competitor_name}
                  onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">What are they good at?</label>
                <textarea 
                  required
                  placeholder="e.g. Great influencer marketing, massive Instagram following, aesthetic packaging."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  value={formData.competitor_strengths}
                  onChange={(e) => setFormData({ ...formData, competitor_strengths: e.target.value })}
                />
              </div>
              <button 
                type="submit" 
                disabled={isAnalyzing || !formData.client_industry || !formData.competitor_name || !formData.competitor_strengths}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
              >
                {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Scanning Threats...</> : <><Sparkles className="w-5 h-5" /> Run Diagnostics</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {!result && !isAnalyzing ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-amber-500 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No Active Target</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Lock onto a competitor on the left to reveal their content gaps and formulate an attack strategy.
              </p>
            </div>
          ) : isAnalyzing ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-6" />
              <div className="space-y-3">
                <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300 animate-pulse">Running reconnaissance...</p>
                <p className="text-sm text-zinc-500 animate-pulse delay-100">Identifying market white space...</p>
                <p className="text-sm text-zinc-500 animate-pulse delay-200">Generating attack angles...</p>
              </div>
            </div>
          ) : result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Threat Level Banner */}
              <div className={`p-6 rounded-2xl shadow-sm border flex items-center justify-between gap-4 ${
                result.threat_level === "High" ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800" :
                result.threat_level === "Medium" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
                "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              }`}>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-2 ${
                    result.threat_level === "High" ? "text-rose-700 dark:text-rose-400" :
                    result.threat_level === "Medium" ? "text-amber-700 dark:text-amber-400" :
                    "text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {result.threat_level === "High" ? <AlertTriangle className="w-4 h-4" /> : result.threat_level === "Medium" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    Threat Level: {result.threat_level}
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300">{result.threat_reason}</p>
                </div>
              </div>

              {/* Positioning Strategy */}
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                  <ShieldAlert className="w-32 h-32" />
                </div>
                <h3 className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Positioning Strategy
                </h3>
                <p className="text-lg font-medium text-white dark:text-zinc-900 leading-relaxed relative z-10">
                  {result.positioning_strategy}
                </p>
              </div>

              {/* Content Gaps & Attack Angles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Content Gaps */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-500" /> "White Space" (Gaps)
                  </h3>
                  <p className="text-sm text-zinc-500 mb-4">What they are failing to talk about in their marketing:</p>
                  <ul className="space-y-3">
                    {result.content_gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Attack Angles */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-rose-500" /> Creative Attack Angles
                  </h3>
                  <p className="text-sm text-zinc-500 mb-4">How you can frame your video scripts to steal their audience:</p>
                  <ul className="space-y-3">
                    {result.attack_angles.map((angle, i) => (
                      <li key={i} className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        <Crosshair className="w-5 h-5 text-rose-500 shrink-0" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{angle}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
