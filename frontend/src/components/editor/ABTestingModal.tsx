"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Split, Plus, Trophy, Activity, Settings2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEditorStore } from "@/store/useEditorStore";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
}

interface VariantResult {
  id: string;
  name: string;
  is_primary: boolean;
  views: number;
  leads: number;
  conversion_rate: number;
  status: string;
  traffic_weight: number;
}

interface TestResults {
  auto_optimize: boolean;
  primary_id: string;
  variants: VariantResult[];
}

export function ABTestingModal({ isOpen, onClose, pageId }: Props) {
  const { token, user } = useAuthStore();
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    if (!token || !pageId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/pages/${pageId}/ab-test-results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setResults(await res.json());
      } else {
        setError("Failed to fetch A/B test results.");
      }
    } catch (e) {
      setError("Network error fetching results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchResults();
    }
  }, [isOpen, pageId, token]);

  const handleCreateVariant = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/pages/${results?.primary_id || pageId}/create-variant`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchResults();
      } else {
        alert("Failed to create variant.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclareWinner = async (winnerId: string) => {
    if (!token || !results) return;
    if (!confirm("Are you sure? This will archive all other variants and make this the permanent primary page.")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/pages/${results.primary_id}/declare-winner?winner_id=${winnerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Winner declared successfully!");
        window.location.href = `/admin/pages/${winnerId}/editor`;
      } else {
        alert("Failed to declare winner.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoOptimize = async (checked: boolean) => {
    if (!token || !results) return;
    try {
      const res = await fetch(`${API}/pages/${results.primary_id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ab_test_auto_optimize: checked })
      });
      if (res.ok) {
        setResults({ ...results, auto_optimize: checked });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
              <Split className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">A/B Testing Engine</h2>
              <p className="text-xs text-zinc-500">Auto-optimize conversion rates using Multi-Armed Bandit logic.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          ) : results ? (
            <div className="space-y-6">
              
              {/* Settings Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-zinc-700" />
                    <h3 className="font-bold text-zinc-900">Optimization Settings</h3>
                  </div>
                  {user?.role !== "CLIENT" && (
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={results.auto_optimize}
                          onChange={(e) => handleToggleAutoOptimize(e.target.checked)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${results.auto_optimize ? 'bg-purple-500' : 'bg-zinc-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${results.auto_optimize ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-3 text-sm font-semibold text-zinc-700">Auto-Optimize Traffic</span>
                    </label>
                  )}
                </div>
                
                <p className="text-sm text-zinc-500 mb-0">
                  {results.auto_optimize 
                    ? "The AI will start with a 50/50 split. Once it detects a clear winner, it will automatically shift 80% of traffic to the winning variant to save your ad budget."
                    : "Traffic is being distributed manually based on Traffic Weights. You are in full manual control."}
                </p>
              </div>

              {/* Variants List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-zinc-900">Page Variants</h3>
                  {user?.role !== "CLIENT" && (
                    <button 
                      onClick={handleCreateVariant}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create New Variant
                    </button>
                  )}
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Variant Name</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Views</th>
                        <th className="px-4 py-3 font-semibold text-right">Leads</th>
                        <th className="px-4 py-3 font-semibold text-right">Conversion Rate</th>
                        <th className="px-4 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {results.variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {variant.is_primary && (
                                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold uppercase tracking-wider">Primary</span>
                              )}
                              <span className="font-semibold text-zinc-900">{variant.name}</span>
                            </div>
                            <a href={`/admin/pages/${variant.id}/editor`} className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Edit Variant</a>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${variant.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {variant.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-zinc-700">{variant.views}</td>
                          <td className="px-4 py-4 text-right font-medium text-emerald-600">{variant.leads}</td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-zinc-100 font-bold text-zinc-900">
                              {variant.conversion_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {user?.role !== "CLIENT" && (
                              <button
                                onClick={() => handleDeclareWinner(variant.id)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                <Trophy className="w-3.5 h-3.5" /> Declare Winner
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.variants.length === 1 && (
                    <div className="p-8 text-center text-zinc-500">
                      <Split className="w-8 h-8 mx-auto mb-3 text-zinc-300" />
                      <p className="font-medium text-zinc-900 mb-1">No active split tests</p>
                      <p className="text-sm">Click "Create New Variant" to start A/B testing this page.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
