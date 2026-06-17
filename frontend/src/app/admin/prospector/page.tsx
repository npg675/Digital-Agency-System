"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  Radar, Search, Briefcase, MapPin, Send, Loader2, Sparkles, 
  Building2, AlertTriangle, Mail, Video, CheckCircle2, ArrowRight
} from "lucide-react";

interface ProspectorLead {
  company_name: string;
  owner_name: string;
  weakness: string;
  email_pitch: string;
  video_script: string;
}

export default function ProspectorPage() {
  const { token, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    niche: "",
    location: "",
    agency_name: user?.company_name || "Our Digital Agency"
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [leads, setLeads] = useState<ProspectorLead[] | null>(null);
  const [activeLeadIndex, setActiveLeadIndex] = useState(0);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    // Simulate scraping UI phase
    setIsScraping(true);
    setLeads(null);
    
    setTimeout(async () => {
      setIsScraping(false);
      setIsGenerating(true);
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/prospector-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
          setActiveLeadIndex(0);
        } else {
          alert("Failed to run prospector. Please try again.");
        }
      } catch (err) {
        console.error(err);
        alert("Error connecting to intelligence engine.");
      } finally {
        setIsGenerating(false);
      }
    }, 2500); // 2.5 second simulated scraping delay
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Radar className="w-8 h-8 text-emerald-500" />
            AI Prospector (Lead Gen)
          </h1>
          <p className="text-zinc-500 mt-1">Autonomous outbound lead generation. Find businesses with weak marketing and auto-generate video pitches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-emerald-500" /> Define Target
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-zinc-400" /> Target Niche
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Plumbers, Dentists, Real Estate"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" /> Location Target
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Austin, Texas or Zip Code"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Your Agency Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                />
              </div>
              <button 
                type="submit" 
                disabled={isScraping || isGenerating || !formData.niche || !formData.location}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
              >
                {isScraping || isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> {isScraping ? "Scraping Data..." : "Generating Pitches..."}</> : <><Radar className="w-5 h-5" /> Run Prospector</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {!leads && !isScraping && !isGenerating ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
                <Radar className="w-10 h-10 text-emerald-500 opacity-80 animate-spin-slow" style={{ animationDuration: '4s' }} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Awaiting Target</h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Enter a niche and location. The AI will scan the web, identify businesses with poor marketing, and generate custom video outreach scripts to close them.
              </p>
            </div>
          ) : isScraping || isGenerating ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10" style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)' }}></div>
              <Radar className="w-16 h-16 animate-spin text-emerald-500 mb-6 relative z-10" />
              <div className="space-y-3 relative z-10">
                <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300 animate-pulse">
                  {isScraping ? `Scraping Google Maps & LinkedIn for ${formData.niche}...` : "Analyzing weaknesses & generating custom pitches..."}
                </p>
                <div className="flex flex-col gap-2 text-sm text-zinc-500 mt-4">
                  <div className={`flex items-center gap-2 justify-center ${isScraping ? 'text-emerald-500' : 'text-zinc-400'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Locating targets in {formData.location}
                  </div>
                  <div className={`flex items-center gap-2 justify-center ${isGenerating ? 'text-emerald-500' : 'text-zinc-400 opacity-50'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Analyzing ad transparency & website UX
                  </div>
                  <div className={`flex items-center gap-2 justify-center ${isGenerating ? 'text-emerald-500' : 'text-zinc-400 opacity-50'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Writing personalized video scripts
                  </div>
                </div>
              </div>
            </div>
          ) : leads && leads.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  Found {leads.length} High-Value Targets
                </h3>
              </div>

              {/* Lead Navigator */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {leads.map((lead, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveLeadIndex(idx)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border shrink-0 transition-all ${
                      activeLeadIndex === idx 
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-sm" 
                        : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-200 dark:hover:border-emerald-800"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${activeLeadIndex === idx ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm leading-tight">{lead.company_name}</p>
                      <p className="text-xs opacity-80">{lead.owner_name}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Lead Details */}
              {leads[activeLeadIndex] && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  
                  <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5 mb-5">
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-zinc-400" /> {leads[activeLeadIndex].company_name}
                      </h2>
                      <p className="text-zinc-500 mt-1">Owner / Decision Maker: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{leads[activeLeadIndex].owner_name}</span></p>
                    </div>
                    <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                      <Send className="w-4 h-4" /> Enqueue in CRM
                    </button>
                  </div>

                  <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4" /> Marketing Weakness Identified
                    </h4>
                    <p className="text-rose-900 dark:text-rose-300 text-sm">
                      {leads[activeLeadIndex].weakness}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cold Email Pitch */}
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
                        <Mail className="w-4 h-4 text-indigo-500" /> Auto-Generated Email Pitch
                      </h4>
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 h-[300px] overflow-y-auto">
                        <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {leads[activeLeadIndex].email_pitch}
                        </pre>
                      </div>
                    </div>

                    {/* VOD Script */}
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4 text-rose-500" /> Personalized Video Script (VOD)
                      </h4>
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 h-[300px] overflow-y-auto relative group">
                        <div className="absolute top-2 right-2 flex gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded">Record This</span>
                        </div>
                        <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed pt-6">
                          {leads[activeLeadIndex].video_script}
                        </pre>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors">
                          Send Script to Video Studio <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
