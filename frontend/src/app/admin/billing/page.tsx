"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, CreditCard, ExternalLink, Check, Star, Shield, ArrowRight, Plus, X } from "lucide-react";

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
        alert("Failed to start checkout process. Please ensure the Stripe keys are configured.");
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
            Billing & Subscriptions
          </h1>
          <p className="text-zinc-600">
            Manage your subscription plan, payment methods, and invoices.
          </p>
        </div>
        {user?.stripe_customer_id && (
          <button
            onClick={handleCustomerPortal}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg text-sm font-semibold transition-colors"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Manage Billing <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-50" />
          </button>
        )}
      </div>

      {user?.subscription_status === 'active' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-12 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-900 mb-1">Your subscription is active</h2>
            <p className="text-emerald-700 mb-4">You are currently on the <strong className="uppercase">{user.subscription_tier || 'Premium'}</strong> plan.</p>
            <button
              onClick={handleCustomerPortal}
              className="text-sm font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              View Invoices & Update Payment Method
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-900 mb-1">No Active Subscription</h2>
            <p className="text-amber-700">You are currently on the free trial. Upgrade your plan to unlock all features, custom domains, and automated marketing tools.</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">Available Plans</h2>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsAddPlanModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Plan
            </button>
          )}
        </div>
        
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-zinc-500 mb-2">No active pricing plans found.</p>
            {user?.role === 'ADMIN' && (
              <p className="text-sm text-zinc-400">Configure your Agency Stripe Keys in Settings to create and display plans.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="relative bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className="p-6 border-b border-zinc-100">
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 min-h-[40px]">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-900">${plan.price_monthly}</span>
                    <span className="text-zinc-500 font-medium">/month</span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 bg-zinc-50/50">
                  <ul className="space-y-4 mb-8">
                    {(plan.features || "").split(",").map((feature, i) => (
                      <li key={i} className="flex gap-3 text-sm text-zinc-700">
                        <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span>{feature.trim()}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={actionLoading || user?.subscription_status === 'active'}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-colors ${
                        user?.subscription_status === 'active' 
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe Now"}
                      {!actionLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Plan Modal */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900">Create Pricing Plan</h3>
              <button onClick={() => setIsAddPlanModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Plan Name</label>
                <input type="text" className="w-full border border-zinc-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Pro Plan" value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Description</label>
                <input type="text" className="w-full border border-zinc-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Best for small businesses" value={newPlan.description} onChange={(e) => setNewPlan({...newPlan, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Monthly Price ($)</label>
                  <input type="number" className="w-full border border-zinc-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newPlan.price_monthly} onChange={(e) => setNewPlan({...newPlan, price_monthly: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Stripe Price ID</label>
                  <input type="text" className="w-full border border-zinc-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="price_12345..." value={newPlan.stripe_price_id} onChange={(e) => setNewPlan({...newPlan, stripe_price_id: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">Features (comma separated)</label>
                <textarea className="w-full border border-zinc-200 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Unlimited Leads, Custom Domain, Priority Support" value={newPlan.features} onChange={(e) => setNewPlan({...newPlan, features: e.target.value})} rows={3} />
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
