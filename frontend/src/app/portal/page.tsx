"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { CreditCard, CheckSquare, Calendar as CalendarIcon, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PortalDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, videosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/portal/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/videos?approval_status=pending`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (dashRes.ok) {
          setData(await dashRes.json());
        }
        if (videosRes.ok) {
          setPendingVideos(await videosRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboard();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-gray-400 flex items-center gap-2"><div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>Loading your dashboard...</div>;
  }

  const handleAction = async (videoId: string, status: string, note?: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/marketing-assets/${videoId}/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approval_status: status, approval_note: note })
      });
      if (res.ok) {
        setPendingVideos(prev => prev.filter(v => v.id !== videoId));
      } else {
        alert("Action failed.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  if (!data) {
    return <div className="p-8 text-red-400">Failed to load dashboard data.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {data.user.first_name}</h1>
        <p className="text-gray-400 mt-1">Here is an overview of your active projects and billing.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Briefcase size={64} /></div>
          <p className="text-blue-400 font-medium mb-1">Active Services</p>
          <h2 className="text-4xl font-bold text-white">{data.metrics.active_services_count}</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-purple-600/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><CheckSquare size={64} /></div>
          <p className="text-purple-400 font-medium mb-1">Pending Tasks</p>
          <h2 className="text-4xl font-bold text-white">{data.metrics.pending_tasks_count}</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-amber-600/10 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><CreditCard size={64} /></div>
          <p className="text-amber-400 font-medium mb-1">Unpaid Invoices</p>
          <h2 className="text-4xl font-bold text-white">{data.metrics.unpaid_invoices_count}</h2>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckSquare className="text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Active Tasks</h3>
          </div>
          <div className="space-y-4">
            {data.pending_tasks.length === 0 ? (
              <p className="text-gray-500">No active tasks at the moment.</p>
            ) : (
              data.pending_tasks.map((task: any) => (
                <div key={task.id} className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">{task.status}</span>
                  </div>
                  {task.due_date && <p className="text-sm text-gray-500">Due: {format(new Date(task.due_date), "MMM d, yyyy")}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Review (Pending Approvals) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 col-span-1 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <CheckSquare className="text-emerald-400" />
            <h3 className="text-xl font-semibold text-white">Action Needed: Content Approvals</h3>
          </div>
          <div className="space-y-4">
            {pendingVideos.length === 0 ? (
              <p className="text-gray-500">No content pending your review.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingVideos.map((video: any) => (
                  <div key={video.id} className="bg-black/40 rounded-xl overflow-hidden border border-emerald-500/20">
                    <div className="aspect-video bg-zinc-900 relative">
                      {video.video_url ? (
                        <video src={video.video_url} controls className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">Processing...</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-white mb-1 line-clamp-1">{video.title}</h4>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">{video.content}</p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(video.id, 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => {
                            const note = prompt("What changes are needed?");
                            if (note !== null) handleAction(video.id, 'revision', note);
                          }}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                          Request Revision
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments & Invoices */}
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Upcoming Appointments</h3>
            </div>
            <div className="space-y-4">
              {data.upcoming_appointments.length === 0 ? (
                <p className="text-gray-500">No upcoming appointments.</p>
              ) : (
                data.upcoming_appointments.map((appt: any) => (
                  <div key={appt.id} className="bg-black/40 rounded-xl p-4 border border-white/5 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-white">{appt.title}</h4>
                      <p className="text-sm text-gray-400">{format(new Date(appt.start_time), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    {appt.meeting_link && (
                      <a href={appt.meeting_link} target="_blank" rel="noreferrer" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                        Join
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-amber-400" />
              <h3 className="text-xl font-semibold text-white">Action Needed: Billing</h3>
            </div>
            <div className="space-y-4">
              {data.unpaid_invoices.length === 0 ? (
                <p className="text-gray-500">You are all caught up!</p>
              ) : (
                data.unpaid_invoices.map((inv: any) => (
                  <div key={inv.id} className="bg-black/40 rounded-xl p-4 border border-red-500/20 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-white">{inv.description || "Invoice"}</h4>
                      <p className="text-sm text-gray-400">Due: {inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-lg mb-1">${inv.amount.toLocaleString()}</div>
                      <a href="/portal/invoices" className="text-sm text-amber-400 hover:text-amber-300 font-medium">Pay Now →</a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
