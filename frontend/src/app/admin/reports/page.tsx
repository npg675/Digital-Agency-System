"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Users, MousePointerClick, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";

export default function ReportsPage() {
  const { token, user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFunnel, setShowFunnel] = useState(true); // Toggle for lead funnel
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/analytics/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const err = await res.json();
          setError(err.detail || "Failed to load reports");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReports();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading comprehensive analytics...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 font-medium">Error: {error}</div>;
  }

  if (!data) return null;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCampaigns = [...data.campaigns].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const funnelData = [
    { name: 'New', value: data.lead_funnel.new, color: '#3b82f6' },
    { name: 'Contacted', value: data.lead_funnel.contacted, color: '#eab308' },
    { name: 'Qualified', value: data.lead_funnel.qualified, color: '#a855f7' },
    { name: 'Converted', value: data.lead_funnel.converted, color: '#22c55e' }
  ];

  const campaignChartData = sortedCampaigns.slice(0, 10).map(c => ({
    name: c.name,
    Views: c.views,
    Leads: c.leads
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
          Performance Reports
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Comprehensive marketing performance for your services and campaigns.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Traffic (Views)</CardTitle>
            <Eye className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.views.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-1">Total page impressions</p>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Leads Captured</CardTitle>
            <Users className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.leads.toLocaleString()}</div>
            <p className="text-xs text-zinc-500 mt-1">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Avg. Conversion Rate</CardTitle>
            <MousePointerClick className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overview.cvr.toFixed(2)}%</div>
            <p className="text-xs text-zinc-500 mt-1">Lead generation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Quality Funnel */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
              Lead Quality Pipeline
            </CardTitle>
            <p className="text-sm text-zinc-500 mt-1">Breakdown of leads by their current status</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowFunnel(!showFunnel)}
              className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
            >
              {showFunnel ? "Hide Visual" : "Show Visual"}
              {showFunnel ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
            </button>
          )}
        </CardHeader>
        {showFunnel && (
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e4e4e7" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Campaign Performance Chart & Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Campaign Performance</CardTitle>
          <CardDescription>Visual breakdown of Traffic vs Leads for your top campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dx={-10} />
                <RechartsTooltip cursor={{fill: '#f4f4f5'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Views" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Leads" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Service / Page Name</th>
                  {user?.role !== 'CLIENT' && <th className="px-4 py-3 font-medium">Client</th>}
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-900" onClick={() => handleSort('views')}>
                    Traffic (Views) {sortConfig?.key === 'views' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-900" onClick={() => handleSort('leads')}>
                    Leads {sortConfig?.key === 'leads' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-900" onClick={() => handleSort('cvr')}>
                    CVR {sortConfig?.key === 'cvr' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sortedCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role !== 'CLIENT' ? 6 : 5} className="px-4 py-8 text-center text-zinc-500">
                      No campaign data available.
                    </td>
                  </tr>
                ) : (
                  sortedCampaigns.map((camp: any) => (
                    <tr key={camp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{camp.name}</td>
                      {user?.role !== 'CLIENT' && <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{camp.client_name}</td>}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          camp.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-300">{camp.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-300">{camp.leads.toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-300">{camp.cvr.toFixed(2)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Client Summary Table (Admin/Staff Only) */}
      {user?.role !== 'CLIENT' && data.clients && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Client Summary</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">Aggregated performance reporting for individual clients.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Company Name</th>
                    <th className="px-4 py-3 font-medium">Total Services/Pages</th>
                    <th className="px-4 py-3 font-medium">Total Traffic</th>
                    <th className="px-4 py-3 font-medium">Total Leads</th>
                    <th className="px-4 py-3 font-medium">Average CVR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {data.clients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                        No client data available.
                      </td>
                    </tr>
                  ) : (
                    data.clients.map((client: any) => (
                      <tr key={client.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                          {client.company_name || client.name || "Unknown Client"}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{client.total_campaigns}</td>
                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-300">{client.views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-300">{client.leads.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-300">{client.cvr.toFixed(2)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
