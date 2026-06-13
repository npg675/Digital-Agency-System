"use client";

import { use, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Printer, CheckCircle2, CircleDashed, Users, LayoutDashboard, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ClientReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { token } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [agencyConfig, setAgencyConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [reportRes, configRes] = await Promise.all([
          fetch(`${API}/analytics/client-report/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/users/agency-config`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (reportRes.ok) setReport(await reportRes.json());
        if (configRes.ok) setAgencyConfig(await configRes.json());
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <Link href={`/admin/users/${id}`} className="text-indigo-600 hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 print:bg-white text-zinc-900 dark:text-zinc-100 font-sans">
      {/* ── Control Bar (Hidden when printing) ── */}
      <div className="print:hidden bg-white dark:bg-zinc-900 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <Link href={`/admin/users/${id}`} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Report Document ── */}
      <div className="max-w-4xl mx-auto p-8 md:p-12 print:p-0 print:m-0 w-full">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8 mb-8 print:border-b-2 print:border-zinc-200">
          <div>
            {agencyConfig?.branding_logo ? (
              <img src={agencyConfig.branding_logo} alt="Agency Logo" className="h-12 object-contain mb-4" />
            ) : (
              <h1 className="text-2xl font-black tracking-tight text-indigo-600 mb-4 uppercase">
                {agencyConfig?.agency_name || "LandingForge"}
              </h1>
            )}
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 print:text-zinc-900">Client Progress Report</h2>
            <p className="text-lg text-zinc-500 mt-1 font-medium">{report.client_name}</p>
          </div>
          <div className="mt-6 md:mt-0 text-left md:text-right">
            <p className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Report Date</p>
            <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200 print:text-zinc-800">{report.report_date}</p>
          </div>
        </header>

        {/* Overview KPI row */}
        <section className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 print:border-zinc-200 print:bg-zinc-50/50 print:shadow-none shadow-sm">
            <p className="text-sm font-semibold tracking-wide text-zinc-500 uppercase mb-1">Total Traffic</p>
            <p className="text-3xl font-bold">{report.overview.views.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 print:border-zinc-200 print:bg-zinc-50/50 print:shadow-none shadow-sm">
            <p className="text-sm font-semibold tracking-wide text-zinc-500 uppercase mb-1">Total Leads</p>
            <p className="text-3xl font-bold">{report.overview.leads.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl p-5 print:border-zinc-200 print:bg-zinc-50/50 print:shadow-none shadow-sm">
            <p className="text-sm font-semibold tracking-wide text-zinc-500 uppercase mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold">{report.overview.cvr.toFixed(2)}%</p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Left Column: Tasks */}
          <div className="md:col-span-2 space-y-10">
            
            {/* Completed Work */}
            <section>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-600 print:text-zinc-900">
                <CheckCircle2 className="w-5 h-5" />
                Completed Deliverables
              </h3>
              {report.completed_tasks.length === 0 ? (
                <p className="text-zinc-500 italic">No tasks completed in this period.</p>
              ) : (
                <div className="space-y-3">
                  {report.completed_tasks.map((task: any) => (
                    <div key={task.id} className="p-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl print:border-zinc-200 shadow-sm print:shadow-none">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 print:text-zinc-900">{task.title}</h4>
                          <p className="text-sm text-zinc-500 mt-1">Completed by {task.assigned_name}</p>
                        </div>
                        {task.service_category && (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 print:bg-zinc-100 print:text-zinc-700 print:border-zinc-200">
                            {task.service_category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* In Progress Work */}
            <section>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-600 print:text-zinc-900 print:mt-10">
                <CircleDashed className="w-5 h-5" />
                In Progress / Up Next
              </h3>
              {report.in_progress_tasks.length === 0 ? (
                <p className="text-zinc-500 italic">No active tasks currently tracked.</p>
              ) : (
                <div className="space-y-3">
                  {report.in_progress_tasks.map((task: any) => (
                    <div key={task.id} className="p-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl print:border-zinc-200 shadow-sm print:shadow-none relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl print:bg-zinc-300"></div>
                      <div className="pl-3 flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 print:text-zinc-900">{task.title}</h4>
                          <p className="text-sm text-zinc-500 mt-1">Assigned to {task.assigned_name}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-md dark:bg-zinc-800 dark:text-zinc-400 print:bg-zinc-100 print:border-zinc-200 uppercase tracking-wider">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Squad Details */}
          <div className="md:col-span-1">
            <section className="bg-indigo-50 dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 rounded-2xl p-6 print:bg-zinc-50 print:border-zinc-200 print:shadow-none shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-400 print:text-zinc-900">
                <Users className="w-5 h-5" />
                Your Dedicated Team
              </h3>
              {report.squad.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 print:text-zinc-600">No active specialists assigned.</p>
              ) : (
                <div className="space-y-4">
                  {report.squad.map((member: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 print:bg-zinc-200 print:text-zinc-700">
                        {member.staff_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 print:text-zinc-900">{member.staff_name}</p>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 print:text-zinc-500">{member.service_role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t dark:border-zinc-800 print:border-zinc-200 text-center text-sm text-zinc-400">
          Generated automatically by {agencyConfig?.agency_name || "LandingForge"} on {report.report_date}.
        </footer>
      </div>
    </div>
  );
}
