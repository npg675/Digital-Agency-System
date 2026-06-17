"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Filter, Route, ArrowRight, Activity, DollarSign } from "lucide-react";
import Link from "next/link";

export default function FunnelsPage() {
  const { token, user } = useAuthStore();
  const [funnels, setFunnels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState("");

  const fetchFunnels = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/funnels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFunnels(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchFunnels();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFunnelName) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/funnels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newFunnelName })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewFunnelName("");
        fetchFunnels();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading funnels...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Sales Funnels
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Chain pages together and collect Stripe payments with 1-click upsells.
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> Create Funnel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Total Funnels</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-zinc-900 dark:text-white">{funnels.length}</span>
            <div className="flex text-indigo-500 mb-1">
              <Route className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Funnel Revenue</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-500">
              ${funnels.reduce((acc, f) => acc + f.total_revenue, 0).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Active Steps</h3>
          <span className="text-4xl font-bold text-zinc-900 dark:text-white">
            {funnels.reduce((acc, f) => acc + f.steps.length, 0)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {funnels.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
            <Route className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Funnels Yet</h3>
            <p className="mb-6 max-w-md mx-auto">Create a funnel to start chaining your landing pages together and building checkout flows.</p>
            <Button onClick={() => setShowCreateModal(true)}>Create First Funnel</Button>
          </div>
        ) : (
          funnels.map(f => (
            <Link key={f.id} href={`/admin/funnels/${f.id}`} className="block group">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                    {f.name}
                  </h3>
                  <div className="text-sm text-zinc-500 mt-2 flex gap-4">
                    <span className="flex items-center gap-1"><Route className="w-4 h-4" /> {f.steps.length} Steps</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-500" /> ${f.total_revenue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  {f.steps.map((step: any, i: number) => (
                    <div key={step.id} className="hidden md:flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        step.step_type === 'CHECKOUT' ? 'bg-amber-100 text-amber-800' :
                        step.step_type === 'UPSELL' ? 'bg-purple-100 text-purple-800' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {step.step_type}
                      </div>
                      {i < f.steps.length - 1 && <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />}
                    </div>
                  ))}
                  <div className="ml-4 p-2 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                    <ArrowRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create Sales Funnel</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-500">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Funnel Name</Label>
                <Input 
                  id="name" 
                  value={newFunnelName} 
                  onChange={e => setNewFunnelName(e.target.value)}
                  placeholder="e.g. Masterclass Checkout Funnel"
                  required
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit">Create Funnel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
