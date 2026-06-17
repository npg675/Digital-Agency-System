"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, CreditCard, ExternalLink, Check, Star, Shield, ArrowRight, Plus, X, Info } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Plan {
  id: string;
  name: string;
  description: string;
  stripe_price_id: string;
  price_monthly: number;
  features: string;
}

export default function BillingPage() {
  const { user, token } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "", description: "", stripe_price_id: "", price_monthly: 0, features: ""
  });

  useEffect(() => {
    const fetchPlans = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API}/billing/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setPlans(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [token]);

  const handleCheckout = async (planId: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/billing/checkout?plan_id=${planId}&success_url=${encodeURIComponent(window.location.origin + '/admin/billing?success=true')}&cancel_url=${encodeURIComponent(window.location.origin + '/admin/billing?canceled=true')}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const err = await res.json();
        alert(`Failed to start checkout: ${err.detail || "Please ensure Stripe keys are configured."}`);
      }
    } catch (e) {
      alert("Network error starting checkout.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/billing/portal?return_url=${encodeURIComponent(window.location.href)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        alert("Failed to access billing portal.");
      }
    } catch (e) {
      alert("Network error opening portal.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/billing/plans`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        const plan = await res.json();
        setPlans([...plans, plan]);
        setIsAddPlanModalOpen(false);
        setNewPlan({ name: "", description: "", stripe_price_id: "", price_monthly: 0, features: "" });
      } else {
        alert("Failed to create plan.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Billing & Subscriptions
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage your subscription, payment methods, and invoices.
          </p>
        </div>
        {user?.stripe_customer_id && (
          <button
            onClick={handleCustomerPortal}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Manage Billing <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
          </button>
        )}
      </div>

      {user?.subscription_status === 'active' ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Subscription Active</h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">You are on the <strong className="uppercase">{user.subscription_tier || 'Premium'}</strong> plan.</p>
            </div>
          </div>
          <button
            onClick={handleCustomerPortal}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Update Payment Method
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-100">No Active Subscription</h2>
            <p className="text-xs text-amber-700 dark:text-amber-300">You are currently on the free trial. Upgrade to unlock all features.</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Available Plans</h2>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsAddPlanModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Plan
            </button>
          )}
        </div>
        
        {plans.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 mb-1">No active pricing plans found.</p>
            {user?.role === 'ADMIN' && (
              <p className="text-xs text-zinc-400">Configure your Agency Stripe Keys in Settings to create and display plans.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 min-h-[32px]">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">${plan.price_monthly}</span>
                    <span className="text-xs text-zinc-500 font-medium">/mo</span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col justify-between">
                  <ul className="space-y-2.5 mb-6">
                    {(plan.features || "").split(",").map((feature, i) => (
                      <li key={i} className="flex gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                        <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{feature.trim()}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={actionLoading || user?.subscription_status === 'active'}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      user?.subscription_status === 'active' 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
                    {!actionLoading && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Plan Modal */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-white">Create Pricing Plan</h3>
              <button onClick={() => setIsAddPlanModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 flex items-start gap-2 mb-4">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Ensure the Monthly Price matches the exact amount configured in your Stripe Dashboard for the given Price ID.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Plan Name</label>
                <input type="text" className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Pro Plan" value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Description</label>
                <input type="text" className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Best for small businesses" value={newPlan.description} onChange={(e) => setNewPlan({...newPlan, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Monthly Price ($)</label>
                  <input type="number" className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPlan.price_monthly} onChange={(e) => setNewPlan({...newPlan, price_monthly: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 mb-1">
                    Stripe Price ID
                  </label>
                  <input type="text" className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-1" placeholder="price_12345..." value={newPlan.stripe_price_id} onChange={(e) => setNewPlan({...newPlan, stripe_price_id: e.target.value})} />
                  <p className="text-[10px] text-zinc-400">Found in your Stripe Dashboard under Product Catalog.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Features</label>
                <textarea className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-1" placeholder="e.g. Unlimited Leads, Custom Domain, Priority Support" value={newPlan.features} onChange={(e) => setNewPlan({...newPlan, features: e.target.value})} rows={3} />
                <p className="text-[10px] text-zinc-400">Separate each feature with a comma.</p>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
              <button onClick={() => setIsAddPlanModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 rounded-lg">Cancel</button>
              <button onClick={handleCreatePlan} disabled={actionLoading} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                {actionLoading ? "Saving..." : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
