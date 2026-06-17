"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCrossTabSync, useSyncStore } from "@/store/useSyncStore";
import { Search, Calendar, Clock, MoreVertical, Trash2, CalendarPlus, X, Save, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LeadsList() {
  const [leads, setLeads] = useState<any[]>([]);
  const [pages, setPages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const { token, user } = useAuthStore();
  const syncVersion = useSyncStore(s => s.version);
  const { broadcastSync } = useCrossTabSync();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        
        // Fetch leads and pages concurrently
        const [leadsRes, pagesRes] = await Promise.all([
          fetch(`${apiUrl}/leads`, { headers }),
          fetch(`${apiUrl}/pages`, { headers })
        ]);
        
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          const pagesMap: Record<string, string> = {};
          pagesData.forEach((p: any) => {
            pagesMap[p.id] = p.name;
          });
          setPages(pagesMap);
        }

        if (leadsRes.ok) {
          const data = await leadsRes.json();
          setLeads(data);
        }
      } catch (err) {
        console.error("Failed to fetch leads data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token, syncVersion]);

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLeads(leads.filter(l => l.id !== id));
        broadcastSync();
      } else {
        const err = await res.json();
        alert(`Failed to delete lead: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/leads/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
        broadcastSync();
      } else {
        alert("Failed to update lead status");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleScoreAllLeads = async () => {
    const unscoredLeads = leads.filter(l => !l.ai_score);
    if (unscoredLeads.length === 0) {
      alert("All leads are already scored!");
      return;
    }
    setActionLoading('scoring');
    let scoredCount = 0;
    try {
      for (const lead of unscoredLeads) {
        // 1. Get Score from AI
        const aiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ai/score-lead`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            lead_message: lead.message || "",
            time_since_submission: new Date(lead.submitted_at).toISOString(),
            has_phone: !!lead.phone
          })
        });
        
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          // 2. Update Lead in DB
          const updateRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/leads/${lead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ai_score: aiData.score, ai_score_reason: aiData.reason })
          });
          
          if (updateRes.ok) {
            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ai_score: aiData.score, ai_score_reason: aiData.reason } : l));
            scoredCount++;
          }
        }
      }
      alert(`Successfully scored ${scoredCount} leads!`);
      broadcastSync();
    } catch (e) {
      alert("Network error during scoring.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleScheduleFollowup = async (lead: any) => {
    setActionLoading(`followup-${lead.id}`);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // Default to 10:00 AM tomorrow
      
      const end = new Date(tomorrow);
      end.setMinutes(end.getMinutes() + 30); // 30 mins

      const payload = {
        host_id: user?.id,
        lead_id: lead.id,
        title: `Follow-up Call: ${lead.name}`,
        description: `Source: Landing Page Lead\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nMessage: ${lead.message || 'N/A'}`,
        start_time: tomorrow.toISOString(),
        end_time: end.toISOString(),
        status: "SCHEDULED"
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/appointments/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Follow-up successfully scheduled on your calendar for tomorrow at 10:00 AM!");
        // Update lead status to CONTACTED if it's currently NEW
        if (lead.status === "NEW" || !lead.status) {
          handleStatusChange(lead.id, "CONTACTED");
        }
      } else {
        const err = await res.json();
        alert(`Failed to schedule follow-up: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error while scheduling follow-up");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setActionLoading('saving-notes');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: leadNotes })
      });
      if (res.ok) {
        setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, notes: leadNotes } : l));
        alert("Notes saved successfully!");
        broadcastSync();
      } else {
        alert("Failed to save notes");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCustomReschedule = async () => {
    if (!selectedLead || !followupDate) return;
    setActionLoading('rescheduling');
    try {
      const start = new Date(followupDate);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const payload = {
        host_id: user?.id,
        lead_id: selectedLead.id,
        title: `Follow-up Call: ${selectedLead.name}`,
        description: `Source: Landing Page Lead\nEmail: ${selectedLead.email}\nPhone: ${selectedLead.phone || 'N/A'}\nMessage: ${selectedLead.message || 'N/A'}\nNotes: ${leadNotes}`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "SCHEDULED"
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/appointments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Follow-up successfully scheduled on your calendar!");
        if (selectedLead.status === "NEW" || !selectedLead.status) {
          handleStatusChange(selectedLead.id, "CONTACTED");
        }
      } else {
        alert("Failed to schedule follow-up");
      }
    } catch (err) {
      alert("Network error while scheduling");
    } finally {
      setActionLoading(null);
    }
  };

  const openPanel = (lead: any) => {
    setSelectedLead(lead);
    setLeadNotes(lead.notes || "");
    
    // Default reschedule date to tomorrow 10am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // Format for datetime-local input: YYYY-MM-DDThh:mm
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localIso = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setFollowupDate(localIso);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Leads
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your captured leads from all landing pages
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            type="search"
            placeholder="Search leads..."
            className="pl-8"
          />
        </div>
        <button 
          onClick={handleScoreAllLeads}
          disabled={actionLoading === 'scoring'}
          className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50 text-sm"
        >
          <span className={actionLoading === 'scoring' ? 'animate-pulse' : ''}>✨</span>
          {actionLoading === 'scoring' ? 'Scoring Leads...' : 'Score All Leads'}
        </button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Landing Page</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading leads...
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                  No leads found yet.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-zinc-50 cursor-pointer" onClick={(e) => {
                  // Ignore clicks on selects or action buttons
                  if ((e.target as HTMLElement).tagName !== 'SELECT' && !(e.target as HTMLElement).closest('button')) {
                    openPanel(lead);
                  }
                }}>
                  <TableCell className="whitespace-nowrap text-zinc-500 text-xs">
                    {new Date(lead.submitted_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {lead.ai_score ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        lead.ai_score === 'HOT' ? 'bg-red-100 text-red-700' :
                        lead.ai_score === 'WARM' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`} title={lead.ai_score_reason}>
                        {lead.ai_score}
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-[10px] font-bold uppercase">Unscored</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{lead.name}</TableCell>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell>{lead.phone || "-"}</TableCell>
                  <TableCell>
                    {pages[lead.landing_page_id] ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30">
                        {pages[lead.landing_page_id]}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <select
                      value={lead.status || "NEW"}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="h-8 rounded-md border border-zinc-200 text-xs px-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="PROPOSAL_SENT">Proposal Sent</option>
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openPanel(lead)}
                        className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md transition-colors"
                        title="View CRM Details"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button 
                        onClick={() => handleScheduleFollowup(lead)}
                        disabled={actionLoading === `followup-${lead.id}`}
                        className="text-amber-500 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-1.5 rounded-md transition-colors disabled:opacity-50"
                        title="Quick Follow-up (10:00 AM Tomorrow)"
                      >
                        <Clock size={16} className={actionLoading === `followup-${lead.id}` ? "animate-spin" : ""} />
                      </button>
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Slide-out CRM Panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedLead.name}</h2>
                <p className="text-sm text-zinc-500">Lead CRM Profile</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Contact Info */}
              <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Contact Details</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Email</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedLead.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Phone</span>
                  <span className="text-sm font-medium text-zinc-900">{selectedLead.phone || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                  <span className="text-sm text-zinc-500">Original Message</span>
                  <span className="text-sm italic text-zinc-700 max-w-[200px] text-right truncate" title={selectedLead.message}>{selectedLead.message || "N/A"}</span>
                </div>
              </div>

              {/* Interaction Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interaction Notes</h3>
                  <button 
                    onClick={handleSaveNotes}
                    disabled={actionLoading === 'saving-notes'}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded disabled:opacity-50"
                  >
                    <Save size={14} className={actionLoading === 'saving-notes' ? 'animate-pulse' : ''} />
                    Save Notes
                  </button>
                </div>
                <Textarea 
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Record call history, requests to call back, or extra details about this lead..."
                  className="min-h-[150px] resize-y text-sm focus:ring-indigo-500"
                />
              </div>

              {/* Reschedule Follow-up */}
              <div className="space-y-3 pt-6 border-t border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Schedule Specific Follow-up</h3>
                <div className="flex flex-col gap-3">
                  <Input 
                    type="datetime-local" 
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="text-sm"
                  />
                  <button 
                    onClick={handleCustomReschedule}
                    disabled={actionLoading === 'rescheduling' || !followupDate}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-md"
                  >
                    <CalendarPlus size={16} className={actionLoading === 'rescheduling' ? 'animate-spin' : ''} />
                    Schedule Follow-up Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
