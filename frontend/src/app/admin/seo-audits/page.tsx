"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ArrowRight,
  Globe,
  Loader2,
  TrendingUp,
  X,
  XOctagon,
  Info
} from "lucide-react";

export default function SEOAuditsDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditUrl, setAuditUrl] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);

  // Mock data for existing audits
  const recentAudits = [
    { id: 1, domain: "client-business.com", healthScore: 78, critical: 3, warnings: 12, lastCrawled: "2 hours ago" },
    { id: 2, domain: "localplumber.net", healthScore: 92, critical: 0, warnings: 4, lastCrawled: "1 day ago" },
    { id: 3, domain: "marketing-blog.io", healthScore: 45, critical: 15, warnings: 28, lastCrawled: "3 days ago" },
    { id: 4, domain: "ecommerce-store.co", healthScore: 85, critical: 1, warnings: 8, lastCrawled: "1 week ago" },
  ];

  const handleRunAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditUrl) return;
    setIsAuditing(true);
    
    // Simulate API call for audit
    setTimeout(() => {
      setIsAuditing(false);
      setIsModalOpen(false);
      setAuditUrl("");
      // In a real app, we'd add the new audit to the list or redirect to the detailed view.
      // For this mock, we'll just show an alert or let the UI reset.
      alert(`Audit completed for ${auditUrl}`);
    }, 3000);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500" />
            Technical SEO Auditor
          </h1>
          <p className="text-zinc-500 mt-1">
            Monitor client site health, identify technical issues, and track improvements over time.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Audit
        </button>
      </div>

      {/* Global Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Activity className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-100 font-medium uppercase tracking-wider text-xs mb-2">Agency Average</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-black tracking-tighter">75</span>
              <span className="text-indigo-200 font-medium mb-1">/ 100</span>
            </div>
            <p className="text-indigo-100 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              +2 points this week
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center">
          <div className="grid grid-cols-3 w-full divide-x divide-zinc-200 dark:divide-zinc-800">
            <div className="px-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-3">
                <XOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">19</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Critical Issues</p>
            </div>
            <div className="px-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">52</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Warnings</p>
            </div>
            <div className="px-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">14</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Globe className="w-5 h-5 text-zinc-400" />
            Monitored Domains
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search domains..." 
              className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400">Domain</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-center">Health Score</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-center">Issues</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Last Crawled</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentAudits.map((audit) => (
                <tr key={audit.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        {audit.domain.charAt(0).toUpperCase()}
                      </div>
                      {audit.domain}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${
                        audit.healthScore >= 80 ? 'text-emerald-500' :
                        audit.healthScore >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {audit.healthScore}
                      </span>
                      <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full rounded-full ${
                            audit.healthScore >= 80 ? 'bg-emerald-500' :
                            audit.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${audit.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded">
                        <XOctagon className="w-3 h-3" /> {audit.critical}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> {audit.warnings}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-500 dark:text-zinc-400">
                    {audit.lastCrawled}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/seo-audits/${audit.domain}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Run New Audit</h3>
              <button 
                onClick={() => !isAuditing && setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                disabled={isAuditing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRunAudit} className="p-6 space-y-6">
              {!isAuditing ? (
                <>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Enter any external URL (like a client's WordPress site, e-commerce store, etc.) to simulate a technical SEO crawl.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">Target URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="url"
                        placeholder="https://client-website.com"
                        required
                        value={auditUrl}
                        onChange={(e) => setAuditUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
                  >
                    <Search className="w-5 h-5" /> Start Audit
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin absolute" />
                    <Search className="w-5 h-5 text-indigo-500 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">Crawling Website...</h4>
                    <p className="text-sm text-zinc-500">Analyzing `{auditUrl}` for technical issues. This usually takes 1-2 minutes.</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
