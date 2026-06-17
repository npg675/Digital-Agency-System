"use client";

import { useState } from "react";
import { Search, Play, Zap, Eye, Copy, ExternalLink, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Mock data for competitor ad examples
const AD_EXAMPLES = [
  {
    id: "ad1",
    title: "The 3-Second Hook Pattern",
    industry: "E-Commerce",
    platform: "TikTok",
    views: "2.4M",
    hook: "Stop buying expensive skincare until you watch this...",
    thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop",
    tags: ["Pattern Interrupt", "Direct Response"],
    concept: "Call out the target audience's current expensive habit, agitate the pain point, and introduce the product as the cheaper/better alternative."
  },
  {
    id: "ad2",
    title: "The 'Day in the Life' Flow",
    industry: "Real Estate",
    platform: "Instagram",
    views: "850K",
    hook: "Come with me to tour a $2M penthouse in Miami...",
    thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
    tags: ["Vlog Style", "Aspirational"],
    concept: "Use rapid jump-cuts showing luxury amenities before dropping the price and location in the final 3 seconds to drive comments."
  },
  {
    id: "ad3",
    title: "The Controversial Take",
    industry: "Fitness",
    platform: "YouTube Shorts",
    views: "1.2M",
    hook: "Cardio is making you fat. Here's why...",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    tags: ["Controversial", "Educational"],
    concept: "State an unpopular opinion that goes against conventional wisdom to trigger outrage comments, then back it up with scientific bullet points."
  },
  {
    id: "ad4",
    title: "The 'Found it on Amazon' Viral",
    industry: "Consumer Goods",
    platform: "TikTok",
    views: "5.1M",
    hook: "Amazon finds you didn't know you needed, part 42...",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop",
    tags: ["Product Showcase", "UGC"],
    concept: "Fast-paced demonstration of 3 weird but useful products in action with a trending audio track in the background."
  },
  {
    id: "ad5",
    title: "The Founder Story",
    industry: "SaaS",
    platform: "LinkedIn",
    views: "420K",
    hook: "I almost went bankrupt building this tool...",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
    tags: ["Storytelling", "B2B"],
    concept: "Vulnerable storytelling about a business failure that led to the creation of the current software solution. Highly effective for B2B trust."
  },
  {
    id: "ad6",
    title: "The Visual Before & After",
    industry: "Home Services",
    platform: "Facebook",
    views: "930K",
    hook: "Watch us transform this disaster of a backyard...",
    thumbnail: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop",
    tags: ["Transformation", "Satisfying"],
    concept: "Split-screen or rapid transition from a dirty/broken state to a perfect finished product, accompanied by ASMR cleaning sounds."
  }
];

export default function InspirationLibraryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const router = useRouter();

  const filteredAds = AD_EXAMPLES.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(search.toLowerCase()) || ad.industry.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || ad.platform === filter || ad.industry === filter;
    return matchesSearch && matchesFilter;
  });

  const handleGenerateAdaptation = (ad: typeof AD_EXAMPLES[0]) => {
    // Navigate to Video Studio and pre-fill the prompt with this concept
    const adaptPrompt = `I want to create a video similar to the '${ad.title}' trend. 
The core concept is: ${ad.concept}. 
Please adapt this style for my brand. The hook should be similar to: "${ad.hook}"`;
    
    // In a real app we'd pass this via state manager or query params, using sessionStorage here for simplicity
    sessionStorage.setItem('adapt_prompt', adaptPrompt);
    router.push('/admin/video-studio?adapt=true');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-amber-500" />
            Ad Inspiration Library
          </h1>
          <p className="text-zinc-500 mt-1">Curated top-performing video ad formats to adapt for your brand.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by keyword, industry..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {["All", "TikTok", "Instagram", "LinkedIn", "Real Estate", "E-Commerce"].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map(ad => (
          <div key={ad.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <Play className="w-5 h-5 ml-1" />
                </button>
              </div>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {ad.views}
              </div>
              <div className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                {ad.platform}
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex gap-2 mb-3">
                {ad.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2">{ad.title}</h3>
              
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Winning Hook:</p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">"{ad.hook}"</p>
              </div>
              
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 flex-1">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Concept:</span> {ad.concept}
              </p>
              
              <button 
                onClick={() => handleGenerateAdaptation(ad)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto"
              >
                <Copy className="w-4 h-4" /> Adapt This For Me
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredAds.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No inspiration found matching your search.</p>
        </div>
      )}
    </div>
  );
}
