"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, Activity, Eye, Loader2, Globe, Clock, ArrowRight, MessageSquare, Save, X, CalendarPlus } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
// @ts-ignore
import NepaliDate from "nepali-date-converter";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface DailyStats {
  date: string;
  views: number;
  leads: number;
}

interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  total_clients: number;
  published_pages: number;
  total_views: number;
  total_leads: number;
  cvr: number;
}

interface DashboardData {
  total_pages: number;
  published_pages: number;
  total_leads: number;
  total_views: number;
  daily_stats: DailyStats[];
  staff_performance?: StaffPerformance[];
}

interface ComprehensiveData {
  lead_funnel: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
  overview: {
    views: number;
    leads: number;
    cvr: number;
  };
}

function DateTimeCard() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [localeIdx, setLocaleIdx] = useState(0);

  const locales = [
    { code: 'en-US', label: 'English' },
    { code: 'ne-NP', label: 'नेपाली' },
    { code: 'hi-IN', label: 'हिन्दी' }
  ];

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const currentLocale = locales[localeIdx].code;
  const timeZone = currentLocale === 'hi-IN' ? 'Asia/Kolkata' : currentLocale === 'ne-NP' ? 'Asia/Kathmandu' : undefined;

  let dateStr = "";
  if (currentLocale === 'ne-NP') {
    // If the system is not in NPT, we should ideally shift the time, but for now we rely on the client.
    const nd = new NepaliDate(time);
    dateStr = nd.format('ddd, MMMM DD', 'np');
  } else {
    dateStr = new Intl.DateTimeFormat(currentLocale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone
    }).format(time);
  }

  const timeStr = new Intl.DateTimeFormat(currentLocale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone
  }).format(time);

  return (
    <div 
      className="flex items-center gap-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 shadow-sm backdrop-blur-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer group"
      onClick={() => setLocaleIdx((prev) => (prev + 1) % locales.length)}
      title="Click to change language"
    >
      <div className="flex flex-col text-right">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {dateStr}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium font-mono tracking-wider">
          {timeStr}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center border-l border-zinc-200 dark:border-zinc-800 pl-3">
        <Globe className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors mb-1" />
        <span className="text-[9px] font-bold text-zinc-400 group-hover:text-indigo-500 uppercase tracking-wider">
          {locales[localeIdx].label}
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [reportsData, setReportsData] = useState<ComprehensiveData | null>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      try {
        const [resDash, resRep, resLeads] = await Promise.all([
          fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/analytics/reports`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/leads`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (!resDash.ok || !resRep.ok) throw new Error("Failed to load dashboard data");
        const jsonDash = await resDash.json();
        const jsonRep = await resRep.json();
        const jsonLeads = resLeads.ok ? await resLeads.json() : [];
        
        setData(jsonDash);
        setReportsData(jsonRep);
        
        // Only show NEW leads that need action
        const newLeads = Array.isArray(jsonLeads) 
          ? jsonLeads.filter((l: any) => l.status === "NEW" || !l.status).slice(0, 5)
          : [];
        setRecentLeads(newLeads);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const handleScheduleFollowup = async (lead: any) => {
    setActionLoading(`followup-${lead.id}`);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); 
      
      const end = new Date(tomorrow);
      end.setMinutes(end.getMinutes() + 30); 

      const payload = {
        host_id: user?.id,
        lead_id: lead.id,
        title: `Follow-up Call: ${lead.name}`,
        description: `Source: Landing Page Lead\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nMessage: ${lead.message || 'N/A'}`,
        start_time: tomorrow.toISOString(),
        end_time: end.toISOString(),
        status: "SCHEDULED"
      };

      const res = await fetch(`${API}/appointments/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Follow-up successfully scheduled on your calendar for tomorrow at 10:00 AM!");
        
        // Remove from list or update locally
        const statusRes = await fetch(`${API}/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "CONTACTED" })
        });
        
        if (statusRes.ok) {
          setRecentLeads(recentLeads.filter(l => l.id !== lead.id));
        }
      } else {
        const err = await res.json();
        alert(`Failed to schedule follow-up: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error while scheduling follow-up");
    } finally {
      setActionLoading(null);
    }
  };

  const openPanel = (lead: any) => {
    setSelectedLead(lead);
    setLeadNotes(lead.notes || "");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localIso = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setFollowupDate(localIso);
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setActionLoading('saving-notes');
    try {
      const res = await fetch(`${API}/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: leadNotes })
      });
      if (res.ok) {
        setRecentLeads(recentLeads.map(l => l.id === selectedLead.id ? { ...l, notes: leadNotes } : l));
        alert("Notes saved successfully!");
      } else {
        alert("Failed to save notes");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCustomReschedule = async () => {
    if (!selectedLead || !followupDate) return;
    setActionLoading('rescheduling');
    try {
      const start = new Date(followupDate);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const payload = {
        host_id: user?.id,
        lead_id: selectedLead.id,
        title: `Follow-up Call: ${selectedLead.name}`,
        description: `Source: Landing Page Lead\nEmail: ${selectedLead.email}\nPhone: ${selectedLead.phone || 'N/A'}\nMessage: ${selectedLead.message || 'N/A'}\nNotes: ${leadNotes}`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "SCHEDULED"
      };

      const res = await fetch(`${API}/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Follow-up successfully scheduled on your calendar!");
        
        // Mark as contacted
        const statusRes = await fetch(`${API}/leads/${selectedLead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "CONTACTED" })
        });
        
        if (statusRes.ok) {
          setRecentLeads(recentLeads.filter(l => l.id !== selectedLead.id));
          setSelectedLead(null);
        }
      } else {
        alert("Failed to schedule follow-up");
      }
    } catch (err) {
      alert("Network error while scheduling");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4">
        <p className="text-red-500">Failed to load dashboard.</p>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  // Format dates for the chart
  const chartData = data.daily_stats.map(d => ({
    ...d,
    formattedDate: format(parseISO(d.date), "MMM d")
  }));

  const funnelData = reportsData ? [
    { name: "New", count: reportsData.lead_funnel.new, fill: "#3b82f6" },
    { name: "Contacted", count: reportsData.lead_funnel.contacted, fill: "#8b5cf6" },
    { name: "Qualified", count: reportsData.lead_funnel.qualified, fill: "#eab308" },
    { name: "Converted", count: reportsData.lead_funnel.converted, fill: "#10b981" },
  ] : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Welcome back, {user?.email || "Admin"}. Here's an overview of your agency.
          </p>
        </div>
        <DateTimeCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Pages</CardTitle>
            <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.total_pages}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Published</CardTitle>
            <Activity className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.published_pages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Views</CardTitle>
            <Eye className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.total_views}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Leads</CardTitle>
            <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.total_leads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversions Overview</CardTitle>
            <CardDescription>Views and Leads over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 12 }} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#18181b', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    name="Page Views"
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    name="Leads"
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Lead Funnel</CardTitle>
            <CardDescription>Overall conversion pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Leads Section */}
      <Card className="border-amber-200 dark:border-amber-900/50 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-100 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-500">Action Required: Uncontacted Leads</CardTitle>
              <CardDescription className="text-amber-600/80 dark:text-amber-500/70">
                These new leads have not been followed up with yet. Convert them to customers!
              </CardDescription>
            </div>
            <Link href="/admin/leads" className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
        </div>
        <CardContent className="p-0">
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              Awesome job! You have zero uncontacted leads.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer" onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button')) {
                    openPanel(lead);
                  }
                }}>
                  <div className="space-y-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{lead.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">NEW</span>
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 flex flex-col md:flex-row md:gap-4">
                      <span>{lead.email}</span>
                      {lead.phone && <span className="hidden md:inline">•</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                    {lead.message && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-1 italic">
                        "{lead.message}"
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => openPanel(lead)}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors font-medium"
                      title="View CRM Details"
                    >
                      <MessageSquare size={16} />
                      CRM Profile
                    </button>
                    <button 
                      onClick={() => handleScheduleFollowup(lead)}
                      disabled={actionLoading === `followup-${lead.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium shadow-sm shadow-amber-500/20 disabled:opacity-50"
                      title="Quick Follow-up Tomorrow"
                    >
                      <Clock size={16} className={actionLoading === `followup-${lead.id}` ? "animate-spin" : ""} />
                      Quick Follow-up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Performance Tracking (Admin Only) */}
      {user?.role === 'ADMIN' && data.staff_performance && (
        <Card className="col-span-4 border-zinc-200 dark:border-zinc-800 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Staff Performance Tracking</CardTitle>
            <CardDescription>Track the deployed works and overall progress of your agency's staff members.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Staff Name</th>
                    <th className="px-4 py-3 font-medium text-center">Managed Clients</th>
                    <th className="px-4 py-3 font-medium text-center">Deployed Works (Published Pages)</th>
                    <th className="px-4 py-3 font-medium text-center">Traffic (Views)</th>
                    <th className="px-4 py-3 font-medium text-center">Leads Generated</th>
                    <th className="px-4 py-3 font-medium text-center">Average CVR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {data.staff_performance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    data.staff_performance.map((staff) => (
                      <tr key={staff.staff_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{staff.staff_name}</td>
                        <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">{staff.total_clients}</td>
                        <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                            {staff.published_pages}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-300">{staff.total_views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-zinc-900 dark:text-zinc-300">{staff.total_leads.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center font-medium text-zinc-900 dark:text-zinc-300">{staff.cvr.toFixed(2)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slide-out CRM Panel (Dashboard Version) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedLead.name}</h2>
                <p className="text-sm text-zinc-500">Lead CRM Profile</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Contact Info */}
              <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Contact Details</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Email</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedLead.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Phone</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedLead.phone || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                  <span className="text-sm text-zinc-500">Original Message</span>
                  <span className="text-sm italic text-zinc-700 max-w-[200px] text-right truncate" title={selectedLead.message}>{selectedLead.message || "N/A"}</span>
                </div>
              </div>

              {/* Interaction Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interaction Notes</h3>
                  <button 
                    onClick={handleSaveNotes}
                    disabled={actionLoading === 'saving-notes'}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded disabled:opacity-50"
                  >
                    <Save size={14} className={actionLoading === 'saving-notes' ? 'animate-pulse' : ''} />
                    Save Notes
                  </button>
                </div>
                <Textarea 
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Record call history, requests to call back, or extra details about this lead..."
                  className="min-h-[150px] resize-y text-sm focus:ring-indigo-500"
                />
              </div>

              {/* Reschedule Follow-up */}
              <div className="space-y-3 pt-6 border-t border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Schedule Specific Follow-up</h3>
                <div className="flex flex-col gap-3">
                  <Input 
                    type="datetime-local" 
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="text-sm"
                  />
                  <button 
                    onClick={handleCustomReschedule}
                    disabled={actionLoading === 'rescheduling' || !followupDate}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-md"
                  >
                    <CalendarPlus size={16} className={actionLoading === 'rescheduling' ? 'animate-spin' : ''} />
                    Schedule Follow-up Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
