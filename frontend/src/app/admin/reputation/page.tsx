"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Send, Copy, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";

export default function ReputationPage() {
  const { user, token } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'inbox'>('requests');
  
  const [showSendModal, setShowSendModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ customer_name: "", customer_contact: "" });
  
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reputation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.customer_name || !newRequest.customer_contact) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reputation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newRequest)
      });
      if (res.ok) {
        setShowSendModal(false);
        setNewRequest({ customer_name: "", customer_contact: "" });
        fetchRequests();
      } else {
        alert("Failed to send request.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/review/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading reputation data...</div>;
  }

  const averageRating = requests.filter(r => r.rating).length > 0
    ? (requests.filter(r => r.rating).reduce((acc, r) => acc + r.rating, 0) / requests.filter(r => r.rating).length).toFixed(1)
    : "0.0";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Reputation Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Request reviews, filter bad feedback, and grow your 5-star Google rating.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.href='/admin/settings?tab=brand'}>
            Set Google Review URL
          </Button>
          <Button onClick={() => setShowSendModal(true)} className="gap-2">
            <Send className="w-4 h-4" /> Send Request
          </Button>
        </div>
      </div>

      {!user?.brand_google_review_url && user?.role === 'CLIENT' && activeTab === 'requests' && (
        <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3 text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Missing Google Review URL</h3>
            <p className="text-sm">You have not set your Google Maps Review URL in settings. 5-star reviews will not be redirected properly until you set it.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'requests' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Review Requests Campaign
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'inbox' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Live Review Inbox
          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 py-0.5 px-2 rounded-full text-[10px]">3 New</span>
        </button>
      </div>

      {activeTab === 'requests' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Average Rating</h3>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-zinc-900 dark:text-white">{averageRating}</span>
            <div className="flex text-amber-400 mb-1">
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Total Requests Sent</h3>
          <span className="text-4xl font-bold text-zinc-900 dark:text-white">{requests.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-500 mb-2">Reviews Captured</h3>
          <span className="text-4xl font-bold text-zinc-900 dark:text-white">
            {requests.filter(r => r.status === 'REVIEWED' || r.status === 'FEEDBACK_GIVEN').length}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-4 text-sm font-medium text-zinc-500">Customer</th>
              <th className="px-6 py-4 text-sm font-medium text-zinc-500">Sent Date</th>
              <th className="px-6 py-4 text-sm font-medium text-zinc-500">Status</th>
              <th className="px-6 py-4 text-sm font-medium text-zinc-500">Rating</th>
              <th className="px-6 py-4 text-sm font-medium text-zinc-500">Private Feedback</th>
              <th className="px-6 py-4 text-sm font-medium text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No review requests sent yet.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{req.customer_name}</div>
                    <div className="text-sm text-zinc-500">{req.customer_contact}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${req.status === 'SENT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                      ${req.status === 'CLICKED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                      ${req.status === 'REVIEWED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                      ${req.status === 'FEEDBACK_GIVEN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                    `}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {req.rating ? (
                      <div className="flex gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < req.rating ? "fill-current" : "text-zinc-300 dark:text-zinc-700"}`} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    {req.private_feedback ? (
                      <div className="flex gap-2 items-start text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2 rounded">
                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="truncate" title={req.private_feedback}>{req.private_feedback}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleCopyLink(req.id)}
                      className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === req.id ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Live Reviews from Google & Yelp</h3>
            <span className="text-sm text-zinc-500">Auto-syncs every hour</span>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {/* Mock Review 1 */}
            <div className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                G
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Sarah Jenkins</h4>
                    <div className="flex gap-1 text-amber-400 mb-2 mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">2 hours ago via Google</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-4">
                  "Absolutely amazing service! The team was on time, professional, and explained everything clearly. Would highly recommend."
                </p>
                <div className="flex gap-2">
                  <Input placeholder="Write a public reply..." className="h-9 text-sm" />
                  <Button size="sm" className="h-9 shrink-0">Reply</Button>
                </div>
              </div>
            </div>

            {/* Mock Review 2 */}
            <div className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors flex gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                Y
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Mike R.</h4>
                    <div className="flex gap-1 text-amber-400 mb-2 mt-1">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 text-zinc-300" />
                      <Star className="w-4 h-4 text-zinc-300" />
                      <Star className="w-4 h-4 text-zinc-300" />
                      <Star className="w-4 h-4 text-zinc-300" />
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">1 day ago via Yelp</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-4">
                  "They showed up late and the pricing was higher than what was quoted over the phone. Not happy."
                </p>
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-1">Your Reply</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">"Hi Mike, we apologize for the delay. Please contact our office at 555-0123 so we can make this right and adjust the invoice to match the original quote."</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Send Review Request</h2>
              <button onClick={() => setShowSendModal(false)} className="text-zinc-400 hover:text-zinc-500">&times;</button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input 
                  id="name" 
                  value={newRequest.customer_name} 
                  onChange={e => setNewRequest({...newRequest, customer_name: e.target.value})}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Email or Phone Number</Label>
                <Input 
                  id="contact" 
                  value={newRequest.customer_contact} 
                  onChange={e => setNewRequest({...newRequest, customer_contact: e.target.value})}
                  placeholder="e.g. jane@example.com"
                  required
                />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowSendModal(false)}>Cancel</Button>
                <Button type="submit">Send Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
