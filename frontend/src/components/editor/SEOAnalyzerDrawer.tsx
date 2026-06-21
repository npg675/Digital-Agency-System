"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { X, Search, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SEOAnalyzerDrawer({ isOpen, onClose }: Props) {
  const { pageSettings, sections, setPageSettings } = useEditorStore();
  const [keyword, setKeyword] = useState(pageSettings.target_keyword || "");
  const [score, setScore] = useState(0);

  // Analysis state
  const [checks, setChecks] = useState<{
    titlePresence: boolean;
    titleLength: boolean;
    descPresence: boolean;
    descLength: boolean;
    h1Presence: boolean;
    keywordDensity: boolean;
  }>({
    titlePresence: false,
    titleLength: false,
    descPresence: false,
    descLength: false,
    h1Presence: false,
    keywordDensity: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    const target = keyword.toLowerCase().trim();
    if (!target) {
      setScore(0);
      setChecks({
        titlePresence: false, titleLength: false,
        descPresence: false, descLength: false,
        h1Presence: false, keywordDensity: false,
      });
      return;
    }

    const title = (pageSettings.seo_title || "").toLowerCase();
    const desc = (pageSettings.seo_description || "").toLowerCase();

    // Check Title
    const titlePresence = title.includes(target);
    const titleLength = title.length >= 40 && title.length <= 60;

    // Check Desc
    const descPresence = desc.includes(target);
    const descLength = desc.length >= 120 && desc.length <= 160;

    // Check H1 (Assume Hero section title is H1)
    const heroSection = sections.find((s) => s.type === "Hero");
    const h1Presence = heroSection && heroSection.config?.title 
      ? (heroSection.config.title as string).toLowerCase().includes(target)
      : false;

    // Rough content text extraction for keyword density
    let contentText = "";
    sections.forEach(s => {
      if (s.config?.title) contentText += s.config.title + " ";
      if (s.config?.subtitle) contentText += s.config.subtitle + " ";
      if (s.config?.description) contentText += s.config.description + " ";
    });
    contentText = contentText.toLowerCase();
    
    // Count occurrences (simple split)
    const occurrences = contentText.split(target).length - 1;
    const wordsCount = contentText.split(/\s+/).length;
    const density = wordsCount > 0 ? (occurrences / wordsCount) * 100 : 0;
    const keywordDensity = density >= 0.5 && density <= 2.5;

    setChecks({
      titlePresence,
      titleLength,
      descPresence,
      descLength,
      h1Presence,
      keywordDensity
    });

    // Calculate Score
    let points = 0;
    if (titlePresence) points += 25;
    if (titleLength) points += 10;
    if (descPresence) points += 25;
    if (descLength) points += 10;
    if (h1Presence) points += 20;
    if (keywordDensity) points += 10;

    setScore(points);

  }, [keyword, pageSettings, sections, isOpen]);

  const handleSaveKeyword = () => {
    setPageSettings({ ...pageSettings, target_keyword: keyword });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-all" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-96 bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">SEO Analyzer</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Keyword Input */}
        <div className="p-5 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/50">
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Target Keyword</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. digital marketing agency"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onBlur={handleSaveKeyword}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Enter your primary keyword to see real-time optimization scores.</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {keyword.trim() === "" ? (
            <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <Search className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">No Keyword Set</p>
                <p className="text-xs text-zinc-500 mt-1">Enter a target keyword above to start analysis.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden">
                {/* Background glow based on score */}
                <div className={\`absolute inset-0 opacity-20 \${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}\`} style={{ filter: 'blur(40px)' }} />
                
                <div className="relative flex flex-col items-center">
                  <div className="text-5xl font-black text-white tracking-tighter mb-1">
                    {score}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">SEO Score</p>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Analysis Checklist</h3>
                
                <div className="space-y-2">
                  <ChecklistItem 
                    title="Keyword in SEO Title" 
                    passed={checks.titlePresence} 
                    hint="Include the exact keyword in your page's SEO title (Settings -> SEO)." 
                  />
                  <ChecklistItem 
                    title="SEO Title Length" 
                    passed={checks.titleLength} 
                    hint="Keep title between 40 and 60 characters for optimal display in search results." 
                  />
                  <ChecklistItem 
                    title="Keyword in Meta Description" 
                    passed={checks.descPresence} 
                    hint="Include the exact keyword in your meta description (Settings -> SEO)." 
                  />
                  <ChecklistItem 
                    title="Meta Description Length" 
                    passed={checks.descLength} 
                    hint="Keep description between 120 and 160 characters." 
                  />
                  <ChecklistItem 
                    title="Keyword in Hero H1" 
                    passed={checks.h1Presence} 
                    hint="Make sure your Hero section title contains the target keyword." 
                  />
                  <ChecklistItem 
                    title="Keyword Density (0.5% - 2.5%)" 
                    passed={checks.keywordDensity} 
                    hint="Use the keyword naturally throughout the page content." 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ChecklistItem({ title, passed, hint }: { title: string, passed: boolean, hint: string }) {
  return (
    <div className={\`p-3 rounded-lg border \${passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-800/50 border-zinc-700'}\`}>
      <div className="flex items-start gap-2">
        {passed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={\`text-sm font-medium \${passed ? 'text-emerald-300' : 'text-zinc-300'}\`}>{title}</p>
          {!passed && <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
