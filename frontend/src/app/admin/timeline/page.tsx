"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function ClientTimelinePage() {
  const { token, user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "CLIENT") {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [tasksRes, servicesRes] = await Promise.all([
          fetch(`${API}/client-tasks/client/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/client-services/client/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        let allItems: any[] = [];
        
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          allItems = [...allItems, ...tasks.map((t: any) => ({ ...t, type: 'Task', title: t.title }))];
        }
        
        if (servicesRes.ok) {
          const services = await servicesRes.json();
          allItems = [...allItems, ...services.map((s: any) => ({ ...s, type: 'Service', title: s.service_role }))];
        }

        // Sort chronologically by due_date
        allItems.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        setItems(allItems);
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

  if (user?.role !== "CLIENT") {
    return (
      <div className="p-8 text-center text-zinc-500 max-w-md mx-auto mt-20">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Client View Only</h2>
        <p>This page is specifically designed for clients to view their project timeline. As an admin or staff member, please use the User Profiles or Tasks dashboard to manage client work.</p>
      </div>
    );
  }

  const renderClientBadge = (dueDate: string | null, status: string, completedAt: string | null) => {
    if (status === 'DONE' || status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }

    if (!dueDate) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-zinc-100 text-zinc-600">
          <Clock className="w-3 h-3" />
          In Progress
        </span>
      );
    }

    const due = new Date(dueDate);
    const now = new Date();
    const diff = differenceInDays(now, due);

    if (diff > 0) {
      // Overdue
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-200">
          <AlertCircle className="w-3 h-3" />
          Delayed
        </span>
      );
    }

    // Upcoming or On Track
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3" />
        On Track
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-32">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Project Timeline</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Track the progress and expected delivery dates of your active tasks and services.
        </p>
      </div>

      <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 md:ml-6 space-y-8 pb-8">
        {items.length === 0 ? (
          <div className="pl-8 text-zinc-500">
            No tasks or services have been scheduled yet.
          </div>
        ) : (
          items.map((item, index) => {
            const isCompleted = item.status === 'DONE' || item.status === 'COMPLETED';
            
            return (
              <div key={`${item.type}-${item.id}`} className="relative pl-8 md:pl-10">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-zinc-950 ${isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-indigo-500'}`} />
                
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {item.type}
                        </span>
                        {renderClientBadge(item.due_date, item.status, item.completed_at)}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                    </div>
                    
                    {item.due_date && (
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border dark:border-zinc-700/50">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(item.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  {isCompleted && item.completed_at && (
                    <div className="mt-3 text-xs text-zinc-500 font-medium">
                      Delivered on: {format(new Date(item.completed_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
