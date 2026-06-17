"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Zap, Activity, Clock, MoreVertical, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function AutomationsDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [token]);

  const fetchAutomations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/automations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAutomations(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/automations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: "Untitled Automation",
          description: "New visual automation workflow"
        })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/automations/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this automation?")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/automations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAutomations(automations.filter(a => a.id !== id));
      } else {
        alert("Failed to delete automation.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting automation.");
    }
    setActiveDropdown(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-indigo-500" />
              Automations
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Build visual workflows and automate your business.</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Create Automation
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : automations.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">No Automations Yet</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-8">
              Connect your landing pages, forms, and tools together with powerful visual workflows.
            </p>
            <button onClick={handleCreate} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500">
              Build your first Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map((auto) => (
              <div 
                key={auto.id} 
                onClick={() => router.push(`/admin/automations/${auto.id}`)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer relative flex flex-col group"
              >
                <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                      auto.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                      auto.status === "PAUSED" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {auto.status}
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Toggle dropdown, delay state update slightly to avoid the document click listener closing it immediately
                          setTimeout(() => {
                            setActiveDropdown(activeDropdown === auto.id ? null : auto.id);
                          }, 0);
                        }}
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {activeDropdown === auto.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-20 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/admin/automations/${auto.id}`);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, auto.id)}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {auto.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 flex-1">
                    {auto.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                      <Play className="w-4 h-4 text-indigo-400" />
                      {auto.total_runs} Runs
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      {format(new Date(auto.created_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
