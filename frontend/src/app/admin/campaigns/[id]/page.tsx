"use client";

import { use, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Plus, Trash2, Save, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user } = useAuthStore();
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Financials
  const [budget, setBudget] = useState(0);
  const [adSpend, setAdSpend] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [isSavingFinancials, setIsSavingFinancials] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Task Creation
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      const campRes = await fetch(`${API}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      const allCamps = await campRes.json();
      const camp = allCamps.find((c: any) => c.id === id);
      if (!camp) { router.push("/admin/campaigns"); return; }
      
      setCampaign(camp);
      setBudget(camp.budget || 0);
      setAdSpend(camp.ad_spend || 0);
      setRevenue(camp.revenue_generated || 0);

      const tasksRes = await fetch(`${API}/campaign-tasks/campaign/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (tasksRes.ok) setTasks(await tasksRes.json());

      const pagesRes = await fetch(`${API}/pages`, { headers: { Authorization: `Bearer ${token}` } });
      if (pagesRes.ok) {
        const allPages = await pagesRes.json();
        setPages(allPages.filter((p: any) => p.campaign_id === id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`${API}/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCampaign({ ...campaign, status: newStatus });
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFinancials = async () => {
    setIsSavingFinancials(true);
    try {
      const res = await fetch(`${API}/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ budget, ad_spend: adSpend, revenue_generated: revenue })
      });
      if (res.ok) {
        alert("Financials updated!");
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingFinancials(false);
    }
  };

  const handleSendReport = async () => {
    setIsSendingReport(true);
    try {
      const res = await fetch(`${API}/campaigns/${id}/send-report`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Report sent to client successfully!");
      } else {
        const data = await res.json();
        alert(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert("Network error occurred while sending report.");
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`${API}/campaign-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle, campaign_id: id })
      });
      if (res.ok) {
        setNewTaskTitle("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (task: any) => {
    try {
      await fetch(`${API}/campaign-tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_completed: !task.is_completed })
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`${API}/campaign-tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/campaigns" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {campaign?.name}
            </h1>
            <select
              value={campaign?.status || "DRAFT"}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={user?.role === 'CLIENT'}
              className={`text-xs px-3 py-1 rounded-full font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-70 disabled:cursor-not-allowed ${
                campaign?.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
                campaign?.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                campaign?.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                'bg-zinc-100 text-zinc-800 border-zinc-200'
              } border`}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {campaign?.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Financials / ROI Calculator */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Budget & ROI</h2>
            {user?.role !== "CLIENT" && (
              <Button onClick={handleSendReport} disabled={isSendingReport} size="sm" variant="outline" className="gap-2">
                <Send className="w-4 h-4" /> {isSendingReport ? "Sending..." : "Send Report"}
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <Label>Campaign Budget ($)</Label>
              <Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </div>
            <div>
              <Label>Actual Ad Spend ($)</Label>
              <Input type="number" value={adSpend} onChange={(e) => setAdSpend(Number(e.target.value))} />
            </div>
            <div>
              <Label>Revenue Generated ($)</Label>
              <Input type="number" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} />
            </div>
            <Button onClick={handleSaveFinancials} disabled={isSavingFinancials} className="w-full gap-2">
              <Save className="w-4 h-4" /> Save Financials
            </Button>
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2">Campaign Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-indigo-700">Remaining Budget</p>
                <p className="text-lg font-bold text-indigo-900">${Math.max(0, budget - adSpend).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-indigo-700">ROI (Return on Investment)</p>
                <p className="text-lg font-bold text-indigo-900">
                  {adSpend > 0 ? (((revenue - adSpend) / adSpend) * 100).toFixed(2) : "0"}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col h-[500px]">
          <h2 className="text-xl font-bold mb-4">Tasks & Checklist</h2>
          
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
            {tasks.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No tasks added yet.</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-zinc-50 border rounded-lg group">
                  <button onClick={() => handleToggleTask(task)}>
                    {task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-300 hover:text-indigo-500" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${task.is_completed ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                    {task.title}
                  </span>
                  <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCreateTask} className="flex gap-2 pt-4 border-t">
            <Input 
              placeholder="e.g. Set up Facebook Pixel" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Attached Landing Pages */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Attached Landing Pages</h2>
          {user?.role !== "CLIENT" && (
            <Button render={<Link href="/admin/templates" />} nativeButton={false} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Create New
            </Button>
          )}
        </div>
        
        {pages.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed">
            No landing pages are attached to this campaign yet.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-600">Page Name</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Slug</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pages.map(page => (
                  <tr key={page.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium">{page.name}</td>
                    <td className="px-4 py-3 text-zinc-500">/{page.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        page.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={page.status === 'PUBLISHED' ? `/landing/${page.slug}` : `/preview/${page.slug}`} target="_blank" className="text-indigo-600 hover:text-indigo-800 font-medium text-xs mr-4">
                        View
                      </Link>
                      {user?.role !== 'CLIENT' && (
                        <Link href={`/admin/pages/${page.id}/editor`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
