"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

type SocialPost = {
  id: string;
  title: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  platform: string;
  video_url: string | null;
};

export default function ContentCalendarPage() {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/social-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => {
          if (!a.scheduled_at) return 1;
          if (!b.scheduled_at) return -1;
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        });
        setPosts(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("linkedin")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (p.includes("twitter") || p.includes("x")) return "bg-zinc-100 text-zinc-700 border-zinc-200";
    if (p.includes("instagram")) return "bg-pink-100 text-pink-700 border-pink-200";
    if (p.includes("facebook")) return "bg-blue-50 text-blue-800 border-blue-200";
    if (p.includes("tiktok")) return "bg-zinc-900 text-zinc-100 border-zinc-800";
    return "bg-violet-100 text-violet-700 border-violet-200";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-violet-500" />
            Content Calendar
          </h1>
          <p className="text-zinc-500 mt-1">Manage and track your scheduled social media and video campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPosts} className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link href="/admin/social" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
            Manage Queue
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-3 text-center text-xs font-semibold text-zinc-500">
              {day}
            </div>
          ))}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
            <p className="text-sm">Loading calendar...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Upcoming Schedule</h3>
              {posts.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No posts scheduled yet.</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors">
                    <div className="w-40 shrink-0">
                      {post.scheduled_at ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          <Clock className="w-4 h-4 text-violet-500" />
                          {new Date(post.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-400 font-medium">Unscheduled</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${getPlatformColor(post.platform)}`}>
                          {post.platform}
                        </span>
                        {post.status === "PUBLISHED" ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Published</span>
                        ) : post.status === "FAILED" ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><Clock className="w-3.5 h-3.5" /> Scheduled</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{post.title}</p>
                      <p className="text-xs text-zinc-500 line-clamp-1">{post.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
