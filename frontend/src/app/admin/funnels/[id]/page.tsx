"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { ArrowDown, Plus, CreditCard, Filter, ArrowRight, Settings, CheckCircle2, ChevronDown } from "lucide-react";

export default function FunnelBuilderPage() {
  const params = useParams();
  const funnelId = params.id as string;
  const { token } = useAuthStore();
  
  const [funnel, setFunnel] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStepType, setNewStepType] = useState("OPTIN");
  const [selectedPageId, setSelectedPageId] = useState("");

  const fetchData = async () => {
    try {
      const fRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/funnels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fRes.ok) {
        const funnels = await fRes.json();
        const f = funnels.find((x: any) => x.id === funnelId);
        setFunnel(f);
      }
      
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        setPages(await pRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && funnelId) fetchData();
  }, [token, funnelId]);

  const handleAddStep = async () => {
    if (!selectedPageId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/funnels/${funnelId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ landing_page_id: selectedPageId, step_type: newStepType })
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading funnel...</div>;
  if (!funnel) return <div className="p-8 text-center text-zinc-500">Funnel not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {funnel.name}
          </h1>
          <div className="flex gap-4 mt-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><CreditCard className="w-4 h-4 text-emerald-500" /> Revenue: ${funnel.total_revenue.toFixed(2)}</span>
            <span className="flex items-center gap-1"><Filter className="w-4 h-4 text-indigo-500" /> {funnel.steps.length} Steps</span>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" /> Settings
        </Button>
      </div>

      <div className="space-y-4">
        {funnel.steps.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 mb-4">No steps in this funnel yet.</p>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add First Step
            </Button>
          </div>
        ) : (
          funnel.steps.map((step: any, index: number) => (
            <div key={step.id} className="relative">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        step.step_type === 'CHECKOUT' ? 'bg-amber-100 text-amber-800' :
                        step.step_type === 'UPSELL' ? 'bg-purple-100 text-purple-800' :
                        step.step_type === 'THANK_YOU' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {step.step_type}
                      </span>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {step.page_name}
                      </h3>
                    </div>
                    <div className="flex gap-4 text-sm text-zinc-500">
                      <span>{step.views} Views</span>
                      <span>{step.conversions} Conversions</span>
                      <span className="text-emerald-600 dark:text-emerald-500">${step.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={() => window.open(`/admin/pages/${step.landing_page_id}`, '_blank')}>
                    Edit Page
                  </Button>
                </div>
              </div>
              
              {index < funnel.steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                </div>
              )}
            </div>
          ))
        )}

        {funnel.steps.length > 0 && (
          <div className="flex justify-center mt-6 pt-4">
            <Button onClick={() => setShowAddModal(true)} variant="outline" className="gap-2 border-dashed border-2 hover:border-indigo-500 hover:text-indigo-600">
              <Plus className="w-4 h-4" /> Add Next Step
            </Button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Add Funnel Step</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-500">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Step Type</label>
                <select 
                  className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={newStepType}
                  onChange={e => setNewStepType(e.target.value)}
                >
                  <option value="OPTIN">Opt-in / Lead Capture</option>
                  <option value="CHECKOUT">Checkout (Stripe)</option>
                  <option value="UPSELL">1-Click Upsell</option>
                  <option value="DOWNSELL">Downsell</option>
                  <option value="THANK_YOU">Thank You / Confirmation</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Landing Page</label>
                <select 
                  className="w-full p-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                  value={selectedPageId}
                  onChange={e => setSelectedPageId(e.target.value)}
                >
                  <option value="">-- Choose a Page --</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleAddStep} disabled={!selectedPageId}>Add Step</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
