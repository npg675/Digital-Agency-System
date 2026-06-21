"use client";

import { useState } from "react";
import { 
  Wand2, 
  Network, 
  FileText, 
  Search, 
  Loader2, 
  ChevronRight, 
  PenTool,
  Save,
  CheckCircle2,
  X,
  Copy
} from "lucide-react";

export default function ContentStrategyPage() {
  const [keyword, setKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedPost, setDraftedPost] = useState<any>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;
    
    setIsGenerating(true);
    setStrategy(null);
    setDraftedPost(null);
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setStrategy({
        core: {
          title: `The Ultimate Guide to ${keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
          type: "Pillar Page"
        },
        spokes: [
          { title: `5 Common Mistakes When Dealing With ${keyword}`, volume: "1.2K", difficulty: "Low" },
          { title: `How Much Does ${keyword} Cost in 2026?`, volume: "3.4K", difficulty: "Medium" },
          { title: `Best Tools & Software for ${keyword}`, volume: "850", difficulty: "Low" },
          { title: `${keyword} vs Alternatives: Which is Better?`, volume: "2.1K", difficulty: "High" },
          { title: `A Beginner's Checklist for ${keyword}`, volume: "4.5K", difficulty: "Medium" }
        ]
      });
    }, 2000);
  };

  const handleDraftPost = (topic: any) => {
    setIsDrafting(true);
    // Simulate AI drafting
    setTimeout(() => {
      setIsDrafting(false);
      setDraftedPost({
        title: topic.title,
        slug: topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        metaDescription: `Discover everything you need to know about ${topic.title.toLowerCase()}. Learn the top tips, tricks, and strategies to improve your results today.`,
        content: `<h2>Introduction</h2>\n<p>Welcome to our comprehensive guide on ${topic.title}. If you've been struggling to figure out the best approach, you're in the right place.</p>\n\n<h2>Why This Matters</h2>\n<p>Understanding this topic is crucial for long-term success. Many beginners make the mistake of overlooking the fundamentals.</p>\n\n<h2>Key Takeaways</h2>\n<ul>\n  <li>Always plan ahead before execution.</li>\n  <li>Track your metrics to measure success.</li>\n  <li>Stay consistent over time.</li>\n</ul>\n\n<h2>Conclusion</h2>\n<p>By following the steps outlined above, you will be well on your way to mastering ${keyword}.</p>`
      });
    }, 2500);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 flex flex-col h-[calc(100vh-4rem)]">
      
      {/* Header & Generator Input */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
              <Network className="w-8 h-8 text-indigo-500" />
              AI Content Strategy
            </h1>
            <p className="text-zinc-500 mt-2">
              Generate entire "Hub and Spoke" SEO blog strategies in seconds. Enter a seed keyword, and the AI will build a topical cluster designed to rank.
            </p>
          </div>
          
          <form onSubmit={handleGenerate} className="flex-1 w-full max-w-md flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text" 
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Enter seed keyword (e.g. Tax Law)"
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isGenerating || !keyword}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-colors"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Building Cluster...</>
              ) : (
                <><Wand2 className="w-5 h-5" /> Generate Strategy</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0 pb-8">
        
        {/* Left Column: The Strategy Hub */}
        <div className={`flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${draftedPost ? 'w-1/3 opacity-75' : 'w-full'}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-500" />
              Topical Cluster
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {!strategy && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Network className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
                <p>Enter a keyword above to map out a content strategy.</p>
              </div>
            )}

            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="font-medium text-indigo-600 dark:text-indigo-400">AI is researching search intent...</p>
              </div>
            )}

            {strategy && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Pillar Page */}
                <div className="relative">
                  <div className="absolute left-6 top-12 bottom-[-2rem] w-0.5 bg-indigo-200 dark:bg-indigo-900/50 z-0" />
                  <div className="relative z-10 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Core Pillar Page</span>
                    </div>
                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{strategy.core.title}</h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">
                      This massive guide will serve as the hub. All other articles will link back to this page to pass SEO authority.
                    </p>
                  </div>
                </div>

                {/* Spoke Pages */}
                <div className="space-y-4 pl-12 relative z-10">
                  {strategy.spokes.map((spoke: any, idx: number) => (
                    <div key={idx} className="relative">
                      {/* Connection Line */}
                      <div className="absolute -left-6 top-6 w-6 h-0.5 bg-indigo-200 dark:bg-indigo-900/50" />
                      
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:border-indigo-400 transition-colors group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {spoke.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                              <span className="text-zinc-500">Vol: <span className="text-zinc-900 dark:text-zinc-100">{spoke.volume}</span></span>
                              <span className={`${
                                spoke.difficulty === 'Low' ? 'text-emerald-600' :
                                spoke.difficulty === 'Medium' ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                Diff: {spoke.difficulty}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDraftPost(spoke)}
                            disabled={isDrafting}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-indigo-50 text-zinc-700 hover:text-indigo-700 dark:bg-zinc-800 dark:hover:bg-indigo-900/30 dark:text-zinc-300 dark:hover:text-indigo-400 rounded-lg text-xs font-bold transition-colors"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            Draft Post
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Drafter Modal / Panel */}
        {draftedPost && (
          <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-right-8 duration-300">
            
            {/* Toolbar */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                <Wand2 className="w-4 h-4" />
                AI Generated Draft
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
                  <Save className="w-3.5 h-3.5" /> Save to Drafts
                </button>
                <button 
                  onClick={() => setDraftedPost(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Meta Settings */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-emerald-500" /> SEO Settings
                  </h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Page Title (H1)</label>
                    <input 
                      type="text" 
                      defaultValue={draftedPost.title}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">URL Slug</label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-r-0 border-zinc-200 dark:border-zinc-800 rounded-l-lg text-sm text-zinc-500 shrink-0">/blog/</span>
                      <input 
                        type="text" 
                        defaultValue={draftedPost.slug}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-r-lg text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Meta Description</label>
                    <textarea 
                      defaultValue={draftedPost.metaDescription}
                      rows={2}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                    <div className="text-[10px] text-zinc-400 text-right">{draftedPost.metaDescription.length} / 160 characters</div>
                  </div>
                </div>

                {/* Content Editor */}
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Blog Content</label>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-col min-h-[400px]">
                    {/* Mock Editor Toolbar */}
                    <div className="border-b border-zinc-200 dark:border-zinc-800 p-2 flex gap-1 bg-zinc-50 dark:bg-zinc-900">
                      {['Paragraph', 'H2', 'H3', 'Bold', 'Italic', 'Link', 'Image'].map(btn => (
                        <button key={btn} className="px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded transition-colors">
                          {btn}
                        </button>
                      ))}
                    </div>
                    {/* Editor Canvas */}
                    <textarea
                      defaultValue={draftedPost.content.replace(/<[^>]+>/g, '')} // Stripping HTML just for the mock textarea
                      className="flex-1 w-full p-4 md:p-6 bg-transparent resize-none focus:outline-none text-zinc-800 dark:text-zinc-200 leading-relaxed font-serif text-lg"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay for Drafter */}
        {isDrafting && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm animate-in slide-in-from-right-8 duration-300">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">AI is drafting your post...</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-sm text-center">Writing SEO-optimized content, adding headers, and generating meta descriptions.</p>
          </div>
        )}

      </div>
    </div>
  );
}
