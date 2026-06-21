"use client";

import { use } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  Globe,
  Activity,
  AlertTriangle,
  XOctagon,
  Info,
  CheckCircle2,
  ExternalLink,
  Download,
  Clock
} from "lucide-react";

export default function DomainAuditDetail({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = use(params);
  const decodedDomain = decodeURIComponent(domain);

  // Mock data for the detailed view
  const auditData = {
    domain: decodedDomain,
    healthScore: 78,
    lastCrawled: "2 hours ago",
    crawledPages: 142,
    issues: [
      { id: 1, type: "critical", title: "404 Broken Links", count: 3, description: "Links pointing to pages that no longer exist.", urls: ["/about-us-old", "/services/plumbing", "/contact-v1"] },
      { id: 2, type: "critical", title: "Missing H1 Tags", count: 2, description: "Pages without a primary heading.", urls: ["/blog/post-12", "/terms"] },
      { id: 3, type: "warning", title: "Images Missing Alt Text", count: 12, description: "Images without alternative text for accessibility and SEO.", urls: ["/gallery", "/home"] },
      { id: 4, type: "warning", title: "Slow Loading Pages", count: 4, description: "Pages taking longer than 3 seconds to load (LCP > 2.5s).", urls: ["/products", "/portfolio"] },
      { id: 5, type: "notice", title: "Long URLs", count: 14, description: "URLs exceeding 100 characters.", urls: ["/blog/very-long-post-title-that-should-be-shorter-for-seo"] },
    ]
  };

  const getIssueIcon = (type: string) => {
    switch(type) {
      case 'critical': return <XOctagon className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'notice': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getIssueBadgeColor = (type: string) => {
    switch(type) {
      case 'critical': return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case 'warning': return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
      case 'notice': return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
      default: return "bg-zinc-100 text-zinc-700";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-4">
          <Link href="/admin/seo-audits" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Audits
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                {auditData.domain}
                <a href={`https://${auditData.domain}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-indigo-500">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h1>
              <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                <Clock className="w-3.5 h-3.5" />
                Last crawled {auditData.lastCrawled} • {auditData.crawledPages} pages analyzed
              </p>
            </div>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Main Score Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
              <circle 
                cx="64" cy="64" r="56" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="351.858" 
                strokeDashoffset={351.858 - (351.858 * auditData.healthScore) / 100}
                className={`${
                  auditData.healthScore >= 80 ? 'text-emerald-500' :
                  auditData.healthScore >= 50 ? 'text-amber-500' : 'text-red-500'
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{auditData.healthScore}</span>
            </div>
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Health Score</h3>
          <p className="text-xs text-zinc-500 mt-1">Based on 142 checks</p>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20 rounded-2xl p-6 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-3">
              <XOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-700 dark:text-red-400 mb-1">
              {auditData.issues.filter(i => i.type === 'critical').reduce((acc, curr) => acc + curr.count, 0)}
            </p>
            <p className="text-sm font-semibold text-red-600/80 dark:text-red-400/80 uppercase tracking-wider">Critical Issues</p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-6 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 mb-1">
              {auditData.issues.filter(i => i.type === 'warning').reduce((acc, curr) => acc + curr.count, 0)}
            </p>
            <p className="text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider">Warnings</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-6 flex flex-col justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
              {auditData.issues.filter(i => i.type === 'notice').reduce((acc, curr) => acc + curr.count, 0)}
            </p>
            <p className="text-sm font-semibold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">Notices</p>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Activity className="w-5 h-5 text-zinc-400" />
            Issue Details
          </h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {auditData.issues.map((issue) => (
            <div key={issue.id} className="p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {getIssueIcon(issue.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{issue.title}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getIssueBadgeColor(issue.type)}`}>
                      {issue.count} found
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{issue.description}</p>
                  
                  {/* Affected URLs */}
                  <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Affected Pages</p>
                    <ul className="space-y-1">
                      {issue.urls.map((url, idx) => (
                        <li key={idx} className="text-sm font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                          {url}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
