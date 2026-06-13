"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { BarChart2, CheckCircle2, Clock, AlertTriangle, Loader2, ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function PerformanceDashboard() {
  const { token, user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;

    const loadData = async () => {
      try {
        const [tasksRes, servicesRes, staffRes, clientsRes] = await Promise.all([
          fetch(`${API}/client-tasks/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/client-services/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/users/staff`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (servicesRes.ok) setServices(await servicesRes.json());
        if (staffRes.ok) setStaffList(await staffRes.json());
        if (clientsRes.ok) setClients(await clientsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="p-8 text-center text-zinc-500">
        You do not have permission to view this page.
      </div>
    );
  }

  // Calculate Metrics
  const itemsWithSLA = [
    ...tasks.filter(t => t.due_date).map(t => ({ ...t, type: 'Task', title: t.title })),
    ...services.filter(s => s.due_date).map(s => ({ ...s, type: 'Service', title: s.service_role }))
  ];

  const completedItems = itemsWithSLA.filter(i => (i.status === 'DONE' || i.status === 'COMPLETED') && i.completed_at);
  const activeItems = itemsWithSLA.filter(i => i.status !== 'DONE' && i.status !== 'COMPLETED');

  // Completed metrics
  let onTimeCount = 0;
  let totalDelayDays = 0;
  let delayedCount = 0;

  completedItems.forEach(item => {
    const due = new Date(item.due_date);
    const comp = new Date(item.completed_at);
    const diff = differenceInDays(comp, due);
    
    if (diff <= 0) {
      onTimeCount++;
    } else {
      delayedCount++;
      totalDelayDays += diff;
    }
  });

  const onTimePercentage = completedItems.length > 0 ? Math.round((onTimeCount / completedItems.length) * 100) : 0;
  const avgDelay = delayedCount > 0 ? (totalDelayDays / delayedCount).toFixed(1) : 0;

  // Active Overdue
  const now = new Date();
  const overdueActive = activeItems.filter(i => differenceInDays(now, new Date(i.due_date)) > 0);

  // Client-wise metrics
  const clientMetrics = clients.map(client => {
    const clientItems = itemsWithSLA.filter(i => i.client_id === client.id);
    const cCompleted = clientItems.filter(i => (i.status === 'DONE' || i.status === 'COMPLETED') && i.completed_at);
    const cActive = clientItems.filter(i => i.status !== 'DONE' && i.status !== 'COMPLETED');
    
    let cOnTime = 0;
    let cDelayed = 0;
    let cDelayDays = 0;
    
    cCompleted.forEach(item => {
      const diff = differenceInDays(new Date(item.completed_at), new Date(item.due_date));
      if (diff <= 0) cOnTime++;
      else {
        cDelayed++;
        cDelayDays += diff;
      }
    });
    
    const cOverdueActive = cActive.filter(i => differenceInDays(now, new Date(i.due_date)) > 0);
    const avgDelay = cDelayed > 0 ? (cDelayDays / cDelayed).toFixed(1) : 0;
    
    return {
      client,
      total: clientItems.length,
      completed: cCompleted.length,
      onTime: cOnTime,
      delayed: cDelayed,
      avgDelay,
      overdueActive: cOverdueActive.length
    };
  }).filter(c => c.total > 0).sort((a, b) => b.overdueActive - a.overdueActive || b.total - a.total);

  // Staff-wise metrics
  const staffMetrics = staffList.map(staff => {
    const staffItems = itemsWithSLA.filter(i => (i.assigned_to_id === staff.id || i.staff_id === staff.id));
    const sCompleted = staffItems.filter(i => (i.status === 'DONE' || i.status === 'COMPLETED') && i.completed_at);
    const sActive = staffItems.filter(i => i.status !== 'DONE' && i.status !== 'COMPLETED');
    
    let sOnTime = 0;
    let sDelayed = 0;
    let sDelayDays = 0;
    
    sCompleted.forEach(item => {
      const diff = differenceInDays(new Date(item.completed_at), new Date(item.due_date));
      if (diff <= 0) sOnTime++;
      else {
        sDelayed++;
        sDelayDays += diff;
      }
    });
    
    const sOverdueActive = sActive.filter(i => differenceInDays(now, new Date(i.due_date)) > 0);
    const avgDelay = sDelayed > 0 ? (sDelayDays / sDelayed).toFixed(1) : 0;
    
    return {
      staff,
      total: staffItems.length,
      completed: sCompleted.length,
      onTime: sOnTime,
      delayed: sDelayed,
      avgDelay,
      overdueActive: sOverdueActive.length
    };
  }).filter(s => s.total > 0).sort((a, b) => b.overdueActive - a.overdueActive || b.total - a.total);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Performance & SLAs</h1>
        <p className="text-zinc-500 mt-1">Track delivery times and staff performance across the agency.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm">Completed w/ SLA</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{completedItems.length}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm">On-Time Delivery</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{onTimePercentage}%</p>
            <p className="text-sm text-zinc-500 mb-1">({onTimeCount} items)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm">Avg Delay</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{avgDelay}</p>
            <p className="text-sm text-zinc-500 mb-1">days</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-zinc-600 dark:text-zinc-400 text-sm">Active Overdue</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{overdueActive.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Overdue Items List */}
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Overdue Items
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {overdueActive.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                <p>No overdue items! Great job.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {overdueActive.map(item => {
                  const client = clients.find(c => c.id === item.client_id);
                  const assigned = staffList.find(s => s.id === (item.assigned_to_id || item.staff_id));
                  const delay = differenceInDays(now, new Date(item.due_date));
                  
                  return (
                    <div key={item.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide bg-red-100 text-red-700`}>
                            {delay}d Overdue
                          </span>
                          <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{item.type}</span>
                        </div>
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h4>
                        <div className="text-xs text-zinc-500 mt-1 flex gap-2">
                          <span>{client?.first_name || client?.email.split('@')[0]}</span>
                          <span>•</span>
                          <span>Assigned: {assigned?.first_name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <Link href={`/admin/users/${item.client_id}`} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recently Completed SLA Items */}
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              Recently Completed
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {completedItems.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <p>No SLA-tracked items have been completed yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {completedItems
                  .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                  .slice(0, 50)
                  .map(item => {
                    const client = clients.find(c => c.id === item.client_id);
                    const assigned = staffList.find(s => s.id === (item.assigned_to_id || item.staff_id));
                    const diff = differenceInDays(new Date(item.completed_at), new Date(item.due_date));
                    
                    return (
                      <div key={item.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {diff <= 0 ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide bg-emerald-100 text-emerald-700">On Time</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide bg-red-100 text-red-700">{diff}d Late</span>
                            )}
                            <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{item.type}</span>
                          </div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h4>
                          <div className="text-xs text-zinc-500 mt-1 flex gap-2">
                            <span>{client?.first_name || client?.email.split('@')[0]}</span>
                            <span>•</span>
                            <span>Done: {format(new Date(item.completed_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Client-wise Performance Table */}
      <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Users className="w-5 h-5 text-indigo-500" />
            Client-wise Performance
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Breakdown of SLA adherence and task delays by client.</p>
        </div>
        <div className="overflow-x-auto">
          {clientMetrics.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p>No SLA metrics available for clients.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400">Client Name</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Total SLA Items</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">On-Time</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Delayed</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Avg Delay (Days)</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Active Overdue</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {clientMetrics.map(cm => (
                  <tr key={cm.client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {cm.client.first_name || cm.client.last_name ? `${cm.client.first_name} ${cm.client.last_name}` : cm.client.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-zinc-500">{cm.client.email}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-medium">{cm.total}</td>
                    <td className="px-5 py-4 text-center">
                      {cm.onTime > 0 ? <span className="text-emerald-600 font-bold">{cm.onTime}</span> : <span className="text-zinc-400">0</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {cm.delayed > 0 ? <span className="text-amber-600 font-bold">{cm.delayed}</span> : <span className="text-zinc-400">0</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {Number(cm.avgDelay) > 0 ? <span className="text-amber-600">{cm.avgDelay}</span> : <span className="text-zinc-400">-</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {cm.overdueActive > 0 ? (
                        <span className="inline-flex items-center justify-center bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          {cm.overdueActive}
                        </span>
                      ) : (
                        <span className="text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/users/${cm.client.id}`} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        View Profile <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Staff-wise Performance Table */}
      <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Users className="w-5 h-5 text-indigo-500" />
            Staff-wise Performance
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Breakdown of SLA adherence and task delays by staff member.</p>
        </div>
        <div className="overflow-x-auto">
          {staffMetrics.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <p>No SLA metrics available for staff members.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400">Staff Member</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Total SLA Items</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">On-Time</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Delayed</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Avg Delay (Days)</th>
                  <th className="px-5 py-3 font-medium text-zinc-600 dark:text-zinc-400 text-center">Active Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {staffMetrics.map(sm => (
                  <tr key={sm.staff.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {sm.staff.first_name || sm.staff.last_name ? `${sm.staff.first_name} ${sm.staff.last_name}` : sm.staff.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-zinc-500">{sm.staff.email}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-medium">{sm.total}</td>
                    <td className="px-5 py-4 text-center">
                      {sm.onTime > 0 ? <span className="text-emerald-600 font-bold">{sm.onTime}</span> : <span className="text-zinc-400">0</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {sm.delayed > 0 ? <span className="text-amber-600 font-bold">{sm.delayed}</span> : <span className="text-zinc-400">0</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {Number(sm.avgDelay) > 0 ? <span className="text-amber-600">{sm.avgDelay}</span> : <span className="text-zinc-400">-</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {sm.overdueActive > 0 ? (
                        <span className="inline-flex items-center justify-center bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold text-xs">
                          {sm.overdueActive}
                        </span>
                      ) : (
                        <span className="text-emerald-500"><CheckCircle2 className="w-4 h-4 mx-auto" /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
