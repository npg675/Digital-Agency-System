"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, TrendingUp, PlayCircle, Clock, MousePointerClick, BrainCircuit, Sparkles, Award } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AnalyticsDashboard() {
  const { token } = useAuthStore();
  const [performance, setPerformance] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [perfRes, insRes] = await Promise.all([
          fetch(`${API}/analytics/video-performance`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/analytics/ai-insights`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (perfRes.ok) setPerformance(await perfRes.json());
        if (insRes.ok) setInsights(await insRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const { overview, leaderboard } = performance || { overview: {}, leaderboard: [] };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-indigo-500" />
          Campaign & Video Analytics
        </h1>
        <p className="text-zinc-500 mt-1">
          Measure the ROI and performance of your AI-generated marketing assets.
        </p>
      </div>

      {/* AI Insights Panel */}
      {insights?.insights && insights.insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">AI Performance Insights</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {insights.insights.map((insight: string, idx: number) => (
              <div key={idx} className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm border border-white/20 dark:border-zinc-700/50 p-4 rounded-xl flex gap-3">
                <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <PlayCircle className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Total Views</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {overview?.total_views?.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Avg Watch Time</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {overview?.avg_watch_time}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <MousePointerClick className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Overall CTR</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 text-indigo-600 dark:text-indigo-400">
            {overview?.overall_ctr}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-zinc-500 dark:text-zinc-400">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Engagement Rate</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 text-green-600 dark:text-green-400">
            {overview?.engagement_rate}
          </p>
        </div>
      </div>

      {/* Video Leaderboard */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Award className="w-5 h-5 text-amber-500" />
            Top Performing Videos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400">Video Title</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-center">Platform</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Views</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">CTR</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {leaderboard.map((video: any) => (
                <tr key={video.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {video.title}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {video.platform === "YouTube" && <FaYoutube className="text-red-500" />}
                      {video.platform === "TikTok" && <FaTiktok className="text-black dark:text-white" />}
                      {video.platform === "LinkedIn" && <FaLinkedin className="text-blue-600" />}
                      {video.platform === "Instagram" && <FaInstagram className="text-pink-600" />}
                      {video.platform === "Facebook" && <FaFacebook className="text-blue-500" />}
                      {video.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-zinc-700 dark:text-zinc-300">
                    {video.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    {video.ctr}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{video.watch_time_pct}</span>
                      <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: video.watch_time_pct }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
