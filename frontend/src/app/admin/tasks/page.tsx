"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { CheckCircle2, Search, Filter, Loader2, ArrowRight, Users, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function TasksDashboardPage() {
  const { token, user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);

  const loadData = async () => {
    if (!token) return;
    try {
      // Admins see all tasks, Staff see their assigned tasks
      const endpoint = user?.role === "ADMIN" ? `${API}/client-tasks/all` : `${API}/client-tasks/staff/me`;
      
      const [tasksRes, clientsRes, staffRes, servicesRes] = await Promise.all([
        fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/users/staff`, { headers: { Authorization: `Bearer ${token}` } }),
        user?.role === "ADMIN" ? fetch(`${API}/client-services/all`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (servicesRes.ok) setAllServices(await servicesRes.json());
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, user]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API}/client-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(t => filterStatus === "ALL" || t.status === filterStatus)
    .filter(t => {
      if (!search) return true;
      const client = clients.find(c => c.id === t.client_id);
      const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : '';
      return t.title.toLowerCase().includes(search.toLowerCase()) || 
             clientName.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'TODO': return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'REVIEW': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'DONE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-indigo-500" />
            My Tasks
          </h1>
          <p className="mt-2 text-zinc-500">Manage and track your service deliverables.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search tasks or clients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Capacity Overview (Admin Only) */}
      {user?.role === 'ADMIN' && staffList.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <Users className="w-5 h-5 text-indigo-500" />
            Staff Capacity Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {staffList.map(staff => {
              const activeTasksCount = tasks.filter(t => t.assigned_to_id === staff.id && t.status !== 'DONE').length;
              const activeServicesCount = allServices.filter(s => s.staff_id === staff.id && s.status === 'ACTIVE').length;
              const activeCount = activeTasksCount + activeServicesCount;
              const isIdle = activeCount === 0;
              return (
                <div 
                  key={staff.id} 
                  className="p-4 border dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 flex flex-col justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => setSelectedStaff(staff)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate pr-2" title={staff.email}>
                      {`${staff.first_name || ""} ${staff.last_name || ""}`.trim() || staff.email.split('@')[0]}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                      isIdle 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                    }`}>
                      {isIdle ? 'Idle' : 'Active'}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 flex items-center justify-between mt-2">
                    <span>Active Services</span>
                    <span className={`font-bold text-lg ${activeServicesCount === 0 ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {activeServicesCount}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 flex items-center justify-between">
                    <span>Active Tasks</span>
                    <span className={`font-bold text-lg ${activeTasksCount === 0 ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {activeTasksCount}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-200">No tasks found</h3>
            <p className="mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {filteredTasks.map(task => {
              const client = clients.find(c => c.id === task.client_id);
              const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email : 'Unknown Client';
              
              const assignedUser = staffList.find(s => s.id === task.assigned_to_id);
              const assignedName = assignedUser ? `${assignedUser.first_name || ""} ${assignedUser.last_name || ""}`.trim() || assignedUser.email : 'Unassigned';

              return (
                <div key={task.id} className="p-5 flex flex-col md:flex-row items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.service_category && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {task.service_category}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 ml-auto md:ml-0 flex items-center gap-1">
                        Added {format(new Date(task.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1 leading-snug">
                      {task.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Link href={`/admin/users/${task.client_id}`} className="hover:text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        {clientName}
                      </Link>
                      <span>•</span>
                      <span>Assigned: {assignedName}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex items-center gap-3 md:pt-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="flex-1 md:w-40 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="DONE">Done</option>
                    </select>
                    
                    <Link href={`/admin/users/${task.client_id}?tab=tasks`} className="h-9 w-9 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-900/30 transition-colors shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff Details Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b dark:border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {`${selectedStaff.first_name || ""} ${selectedStaff.last_name || ""}`.trim() || selectedStaff.email.split('@')[0]}
                </h3>
                <p className="text-sm text-zinc-500">{selectedStaff.email}</p>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8">
              {/* Active Services */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Active Squad Roles</h4>
                <div className="space-y-2">
                  {allServices.filter(s => s.staff_id === selectedStaff.id && s.status === 'ACTIVE').length === 0 ? (
                    <p className="text-sm text-zinc-400 italic">No active squad roles.</p>
                  ) : (
                    allServices.filter(s => s.staff_id === selectedStaff.id && s.status === 'ACTIVE').map(service => {
                      const client = clients.find(c => c.id === service.client_id);
                      const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email : 'Unknown Client';
                      return (
                        <div key={service.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-800 flex justify-between items-center">
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{service.service_role}</span>
                          <Link href={`/admin/users/${service.client_id}?tab=squad`} className="text-sm text-indigo-600 hover:underline" onClick={() => setSelectedStaff(null)}>
                            {clientName}
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Tasks */}
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Active Tasks</h4>
                <div className="space-y-2">
                  {tasks.filter(t => t.assigned_to_id === selectedStaff.id && t.status !== 'DONE').length === 0 ? (
                    <p className="text-sm text-zinc-400 italic">No active tasks.</p>
                  ) : (
                    tasks.filter(t => t.assigned_to_id === selectedStaff.id && t.status !== 'DONE').map(task => {
                      const client = clients.find(c => c.id === task.client_id);
                      const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email : 'Unknown Client';
                      return (
                        <div key={task.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-zinc-500">{task.service_category || 'General Task'}</span>
                            </div>
                          </div>
                          <Link href={`/admin/users/${task.client_id}?tab=tasks`} className="text-sm text-indigo-600 hover:underline shrink-0" onClick={() => setSelectedStaff(null)}>
                            {clientName}
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
