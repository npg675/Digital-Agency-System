"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { CreditCard, CheckSquare, Calendar as CalendarIcon, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PortalDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/portal/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
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
    return <div className="p-8 text-gray-400">Loading your dashboard...</div>;
  }

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
