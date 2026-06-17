"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Rocket, Target, Crosshair, Map, ShieldAlert, Zap, 
  TrendingUp, Users, Loader2, Sparkles, CheckCircle2, ChevronRight 
} from "lucide-react";

interface StrategyResult {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  audience_matrix: {
    persona: string;
    pain_points: string[];
    objections: string[];
    desired_outcome: string;
  }[];
  roadmap: {
    month: string;
    focus: string;
    key_activities: string[];
  }[];
  cmo_advice: string;
}

export default function StrategyWarRoomPage() {
  const { token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    client_name: "",
    industry: "",
    business_goal: ""
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [activeTab, setActiveTab] = useState<"swot" | "audience" | "roadmap">("roadmap");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsGenerating(true);
    setResult(null);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/generate-strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        alert("Failed to generate strategy. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to strategy engine.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Target className="w-8 h-8 text-rose-500" />
            The Strategy War Room
          </h1>
          <p className="text-zinc-500 mt-1">Generate CMO-level 90-day roadmaps, SWOT analysis, and audience triggers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Crosshair className="w-5 h-5 text-indigo-500" /> Client Brief
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Client / Brand Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Apex Fitness App"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Industry / Niche</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. B2B SaaS, Real Estate"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Core Objective</label>
                <textarea 
                  required
                  placeholder="e.g. Increase monthly recurring revenue by 20% in Q3 through TikTok ads."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  value={formData.business_goal}
                  onChange={(e) => setFormData({ ...formData, business_goal: e.target.value })}
                />
              </div>
              <button 
                type="submit" 
                disabled={isGenerating || !formData.client_name || !formData.industry || !formData.business_goal}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
              >
                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Market...</> : <><Sparkles className="w-5 h-5" /> Generate War Plan</>}
              </button>
            </form>
            
            {/* Context Info */}
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
              <h3 className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Expert Mode</h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/70 leading-relaxed">
                The AI operates as a 30-year fractional CMO. Provide as much context in the "Core Objective" as possible to get a highly actionable strategy.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {!result && !isGenerating ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-rose-500 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Awaiting Intelligence</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Enter the client's details on the left. The AI will formulate a complete Go-To-Market strategy, SWOT analysis, and 90-day execution roadmap.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-12 h-12 animate-spin text-rose-500 mb-6" />
              <div className="space-y-3">
                <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300 animate-pulse">Running competitive intelligence...</p>
                <p className="text-sm text-zinc-500 animate-pulse delay-100">Mapping audience psychology triggers...</p>
                <p className="text-sm text-zinc-500 animate-pulse delay-200">Formulating 90-day execution roadmap...</p>
              </div>
            </div>
          ) : result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* CMO Advice Banner */}
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                  <TrendingUp className="w-32 h-32" />
                </div>
                <h3 className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Fractional CMO Advice
                </h3>
                <p className="text-lg md:text-xl font-medium text-white dark:text-zinc-900 leading-relaxed italic relative z-10">
                  "{result.cmo_advice}"
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
                <button onClick={() => setActiveTab("roadmap")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "roadmap" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                  <Map className="w-4 h-4" /> 90-Day Roadmap
                </button>
                <button onClick={() => setActiveTab("swot")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "swot" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                  <ShieldAlert className="w-4 h-4" /> SWOT Analysis
                </button>
                <button onClick={() => setActiveTab("audience")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "audience" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                  <Users className="w-4 h-4" /> Audience Matrix
                </button>
              </div>

              {/* Tab Content: Roadmap */}
              {activeTab === "roadmap" && (
                <div className="space-y-4">
                  {result.roadmap.map((month, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500"></div>
                      <div className="md:w-1/3 shrink-0">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{month.month}</h3>
                        <p className="text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1"><Target className="w-4 h-4" /> {month.focus}</p>
                      </div>
                      <div className="md:w-2/3">
                        <ul className="space-y-3">
                          {month.key_activities.map((activity, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-zinc-700 dark:text-zinc-300">{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content: SWOT */}
              {activeTab === "swot" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">Strengths</h3>
                    <ul className="space-y-2">
                      {result.swot.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-emerald-900 dark:text-emerald-300"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400 mb-4 flex items-center gap-2">Weaknesses</h3>
                    <ul className="space-y-2">
                      {result.swot.weaknesses.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-rose-900 dark:text-rose-300"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-400 mb-4 flex items-center gap-2">Opportunities</h3>
                    <ul className="space-y-2">
                      {result.swot.opportunities.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-indigo-900 dark:text-indigo-300"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">Threats</h3>
                    <ul className="space-y-2">
                      {result.swot.threats.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-300"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />{s}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab Content: Audience Matrix */}
              {activeTab === "audience" && (
                <div className="grid grid-cols-1 gap-6">
                  {result.audience_matrix.map((persona, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Persona: {persona.persona}</h3>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Desired Outcome: {persona.desired_outcome}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Deep Pain Points
                          </h4>
                          <ul className="space-y-2">
                            {persona.pain_points.map((p, i) => <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span>{p}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500" /> Buying Objections
                          </h4>
                          <ul className="space-y-2">
                            {persona.objections.map((o, i) => <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>{o}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
