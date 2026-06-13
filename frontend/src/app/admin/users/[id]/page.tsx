"use client";

import { use, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Mail, FileText, ArrowLeft, Save, Trash2, Calendar, MessageCircle, ExternalLink, Loader2, Palette, UploadCloud, Download, Image as ImageIcon, File as FileIcon, LayoutGrid, List, Lock, UserCheck, X, ChevronDown, CheckCircle2, MoreVertical, Plus, Users, LayoutTemplate, ListTree } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Facebook = ({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Twitter = ({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Instagram = ({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Linkedin = ({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Tiktok = ({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Whatsapp = ({ className, ...props }: React.ComponentPropsWithoutRef<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const renderDelayBadge = (dueDate: string | null, completedAt: string | null, status: string) => {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  
  if (status === 'DONE' || status === 'COMPLETED') {
    if (!completedAt) return <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">Completed</span>;
    const comp = new Date(completedAt);
    // @ts-ignore
    const diff = Math.ceil((comp - due) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">On Time</span>;
    return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">{diff}d Late</span>;
  }
  
  // @ts-ignore
  const diff = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  if (diff > 0) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">{diff}d Overdue</span>;
  if (diff === 0) return <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">Due Today</span>;
  return <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">Due in {Math.abs(diff)}d</span>;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user: currentUser } = useAuthStore();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clientSquad, setClientSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notes");
  
  const [showAddSquad, setShowAddSquad] = useState(false);
  const [squadStaffId, setSquadStaffId] = useState("");
  const [squadRole, setSquadRole] = useState("");
  const [squadDueDate, setSquadDueDate] = useState("");
  const [isAddingSquad, setIsAddingSquad] = useState(false);
  const [serviceRoles, setServiceRoles] = useState<any[]>([]);

  // Client Tasks state
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to_id: "", service_category: "", due_date: "" });
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Workflow states
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [showApplyWorkflow, setShowApplyWorkflow] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [workflowStaffId, setWorkflowStaffId] = useState("");
  const [isApplyingWorkflow, setIsApplyingWorkflow] = useState(false);

  // Handover modal
  const [showHandover, setShowHandover] = useState(false);
  const [handoverStaffId, setHandoverStaffId] = useState("");
  const [handoverReason, setHandoverReason] = useState("");
  const [isHandingOver, setIsHandingOver] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [isNewNoteInternal, setIsNewNoteInternal] = useState(false);
  const [noteStep, setNoteStep] = useState<'idle' | 'choosing' | 'composing'>('idle');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyIsInternal, setReplyIsInternal] = useState(false);
  const [replyStep, setReplyStep] = useState<'choosing' | 'composing'>('choosing');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadNotes, setUploadNotes] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaViewMode, setMediaViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [mediaLimits, setMediaLimits] = useState({ maxFileMB: 5, totalQuotaMB: 100 });
  
  const [brandData, setBrandData] = useState({
    brand_primary_color: "",
    brand_secondary_color: "",
    brand_facebook_url: "",
    brand_twitter_url: "",
    brand_instagram_url: "",
    brand_linkedin_url: "",
    brand_tiktok_url: "",
    brand_whatsapp: "",
    brand_email: "",
    brand_notes: "",
  });

  const loadData = async () => {
    if (!token) return;
    try {
      const uRes = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
      const users = await uRes.json();
      const u = users.find((x: any) => x.id === id);
      if (!u) { router.push("/admin/users"); return; }
      setUser(u);
      setBrandData({
        brand_primary_color: u.brand_primary_color || "",
        brand_secondary_color: u.brand_secondary_color || "",
        brand_facebook_url: u.brand_facebook_url || "",
        brand_twitter_url: u.brand_twitter_url || "",
        brand_instagram_url: u.brand_instagram_url || "",
        brand_linkedin_url: u.brand_linkedin_url || "",
        brand_tiktok_url: u.brand_tiktok_url || "",
        brand_whatsapp: u.brand_whatsapp || "",
        brand_email: u.brand_email || "",
        brand_notes: u.brand_notes || "",
      });

      const [notesRes, campsRes, pagesRes, mediaRes, configRes, staffRes, squadRes, tasksRes, rolesRes, wfRes] = await Promise.all([
        fetch(`${API}/client-notes/client/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/pages`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/media/client/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/users/agency-config`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/users/staff`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/client-services/client/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/client-tasks/client/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/service-roles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/workflows`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (notesRes.ok) setNotes(await notesRes.json());
      if (rolesRes.ok) setServiceRoles(await rolesRes.json());
      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (mediaRes.ok) setMediaAssets(await mediaRes.json());
      if (staffRes.ok) setStaffList(await staffRes.json());
      if (squadRes.ok) setClientSquad(await squadRes.json());
      if (tasksRes.ok) setClientTasks(await tasksRes.json());
      
      if (configRes.ok) {
        const config = await configRes.json();
        setMediaLimits({
          maxFileMB: config.media_vault_file_size_limit_mb || 5,
          totalQuotaMB: config.media_vault_total_size_limit_mb || 100
        });
      }
      
      if (campsRes.ok) {
        const allCamps = await campsRes.json();
        setCampaigns(allCamps.filter((c: any) => c.client_id === id));
      }
      
      if (pagesRes.ok) {
        const allPages = await pagesRes.json();
        setPages(allPages.filter((p: any) => p.client_id === id));
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

  const handleAddSquad = async () => {
    if (!squadStaffId || !squadRole) return;
    setIsAddingSquad(true);
    try {
      const res = await fetch(`${API}/client-services/client/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          staff_id: squadStaffId, 
          service_role: squadRole,
          due_date: squadDueDate ? new Date(squadDueDate).toISOString() : null
        })
      });
      if (res.ok) {
        setShowAddSquad(false);
        setSquadStaffId("");
        setSquadRole("");
        setSquadDueDate("");
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to add specialist");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingSquad(false);
    }
  };

  const handleRemoveSquad = async (squadId: string) => {
    if (!confirm("Remove this specialist from the client's squad?")) return;
    try {
      const res = await fetch(`${API}/client-services/${squadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    setIsAddingTask(true);
    try {
      const payload = { 
        ...newTask, 
        client_id: id,
        assigned_to_id: newTask.assigned_to_id || null,
        service_category: newTask.service_category || null,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
      };
      const res = await fetch(`${API}/client-tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddTask(false);
        setNewTask({ title: "", description: "", assigned_to_id: "", service_category: "", due_date: "" });
        loadData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create task");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`${API}/client-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Refresh tasks
        const tRes = await fetch(`${API}/client-tasks/client/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (tRes.ok) setClientTasks(await tRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyWorkflow = async () => {
    if (!selectedWorkflowId) return;
    try {
      setIsApplyingWorkflow(true);
      const res = await fetch(`${API}/workflows/${selectedWorkflowId}/apply/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          staff_id: workflowStaffId || null
        })
      });
      if (res.ok) {
        setShowApplyWorkflow(false);
        setSelectedWorkflowId("");
        setWorkflowStaffId("");
        
        // Refresh tasks
        const tRes = await fetch(`${API}/client-tasks/client/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (tRes.ok) setClientTasks(await tRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplyingWorkflow(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API}/client-tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (
    parentId: string | null = null,
    content: string = newNote,
    isInternal: boolean = isNewNoteInternal
  ) => {
    if (!content.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`${API}/client-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, client_id: id, parent_id: parentId, is_internal: isInternal })
      });
      if (res.ok) {
        if (!parentId) {
          setNewNote("");
          setIsNewNoteInternal(false);
          setNoteStep('idle');
        } else {
          setReplyContent("");
          setReplyIsInternal(false);
          setReplyingTo(null);
          setReplyStep('choosing');
        }
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const isAdminOrStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF';

  const renderNote = (note: any, isReply = false) => (
    <div key={note.id} className={`group relative flex gap-4 ${isReply ? 'mt-4 ml-10 relative' : ''}`}>
      {/* Thread Connector Line */}
      {isReply && (
        <div className="absolute left-[-28px] top-[-16px] bottom-8 w-[2px] bg-zinc-200 dark:bg-zinc-800" />
      )}
      <div className="flex-shrink-0 z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-white dark:border-zinc-900 ring-2 ${
          note.is_internal
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ring-amber-50 dark:ring-zinc-800'
            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 ring-indigo-50 dark:ring-zinc-800'
        }`}>
          {note.author?.first_name ? note.author.first_name[0] : (note.author?.email ? note.author.email[0] : 'S')}
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
            {note.author?.first_name ? `${note.author.first_name} ${note.author.last_name || ''}` : (note.author?.email || 'System')}
            <span className="text-xs font-normal text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(note.created_at.endsWith('Z') ? note.created_at : `${note.created_at}Z`), "MMM d, yyyy h:mm a")}
            </span>
            {/* Internal badge — only visible to admin/staff */}
            {note.is_internal && isAdminOrStaff && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                <Lock className="w-2.5 h-2.5" />
                Internal
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdminOrStaff && (
              <button 
                onClick={() => { setReplyingTo(note.id); setReplyContent(""); setReplyIsInternal(false); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Reply
              </button>
            )}
            {(currentUser?.role === 'ADMIN' || currentUser?.id === note.author_id) && (
              <button 
                onClick={() => handleDeleteNote(note.id)}
                className="text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className={`text-sm whitespace-pre-wrap p-3.5 rounded-lg border shadow-sm ${
          note.is_internal
            ? 'text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
            : 'text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/50'
        }`}>
          {note.content}
        </div>
        
        {/* Reply Box — only for admin/staff */}
        {replyingTo === note.id && isAdminOrStaff && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* Step 1: Choose audience */}
            {replyStep === 'choosing' && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Who is this reply for?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setReplyIsInternal(false); setReplyStep('composing'); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800 hover:border-indigo-400 hover:bg-indigo-100 transition-all text-center group"
                  >
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Everyone</span>
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-500">Client can read this</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReplyIsInternal(true); setReplyStep('composing'); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 hover:border-amber-400 hover:bg-amber-100 transition-all text-center group"
                  >
                    <Lock className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Staff &amp; Admin Only</span>
                    <span className="text-[10px] text-amber-500 dark:text-amber-500">Hidden from client</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Compose */}
            {replyStep === 'composing' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Selected audience badge */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setReplyStep('choosing')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      replyIsInternal
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                    }`}
                  >
                    {replyIsInternal ? <Lock className="w-3 h-3" /> : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    {replyIsInternal ? 'Staff & Admin Only' : 'Visible to Everyone'}
                    <span className="opacity-50 ml-0.5">· change</span>
                  </button>
                </div>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={replyIsInternal ? "Write an internal reply (not visible to client)..." : "Write a reply..."}
                  className={`text-sm min-h-[80px] transition-colors ${
                    replyIsInternal ? 'border-amber-300 focus-visible:ring-amber-400 dark:border-amber-700' : ''
                  }`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddNote(note.id, replyContent, replyIsInternal)}
                    disabled={isAddingNote || !replyContent.trim()}
                    className={replyIsInternal ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                  >
                    {isAddingNote ? 'Posting...' : (replyIsInternal ? '🔒 Post Internal Reply' : 'Post Reply')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyStep('choosing'); setReplyIsInternal(false); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nested Replies */}
        {note.replies && note.replies.length > 0 && (
          <div className="mt-2 space-y-1">
            {note.replies.map((reply: any) => renderNote(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await fetch(`${API}/client-notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHandover = async () => {
    if (!handoverStaffId) return;
    setIsHandingOver(true);
    try {
      const res = await fetch(`${API}/users/${id}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_manager_id: handoverStaffId, reason: handoverReason || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setShowHandover(false);
        setHandoverStaffId("");
        setHandoverReason("");
        loadData(); // Refresh to show updated manager or keep the same until approved
      } else {
        const err = await res.json();
        alert(err.detail || "Handover failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsHandingOver(false);
    }
  };

  const handleSaveBrand = async () => {
    if (currentUser?.role === 'STAFF' && currentUser?.can_manage_users !== true) {
      alert("You do not have permission to manage users");
      return;
    }
    setIsSavingBrand(true);
    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(brandData)
      });
      if (res.ok) {
        alert("Brand & Social Media details saved successfully!");
      } else {
        alert("Failed to save brand details.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleUploadMedia = async () => {
    if (uploadFiles.length === 0) return;

    const currentTotalBytes = mediaAssets.reduce((sum, asset) => sum + asset.size, 0);
    const newFilesBytes = uploadFiles.reduce((sum, file) => sum + file.size, 0);
    
    const maxFileBytes = mediaLimits.maxFileMB * 1024 * 1024;
    const maxTotalBytes = mediaLimits.totalQuotaMB * 1024 * 1024;

    for (const file of uploadFiles) {
      if (file.size > maxFileBytes) {
        alert(`File "${file.name}" exceeds the maximum allowed size of ${mediaLimits.maxFileMB} MB.`);
        return;
      }
    }

    if (currentTotalBytes + newFilesBytes > maxTotalBytes) {
      alert(`Uploading these files would exceed the client's media vault quota of ${mediaLimits.totalQuotaMB} MB.`);
      return;
    }

    setIsUploadingMedia(true);
    try {
      const uploadPromises = uploadFiles.map(file => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("client_id", id);
        if (uploadNotes) formData.append("notes", uploadNotes);

        return fetch(`${API}/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }).then(res => {
          if (!res.ok) throw new Error("Upload failed");
          return res.json();
        });
      });

      const newAssets = await Promise.all(uploadPromises);
      setMediaAssets([...newAssets.reverse(), ...mediaAssets]);
      setUploadFiles([]);
      setUploadNotes("");
    } catch (err) {
      console.error(err);
      alert("Some uploads failed. Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`${API}/media/${mediaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMediaAssets(mediaAssets.filter(m => m.id !== mediaId));
      } else {
        alert("Delete failed. You may not have permission.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const forceDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed", error);
      window.open(url, '_blank');
    }
  };

  const handleBulkDownload = () => {
    if (selectedMedia.length === 0) return;
    const assetsToDownload = mediaAssets.filter(m => selectedMedia.includes(m.id));
    assetsToDownload.forEach((asset, index) => {
      const fileUrl = `${API.replace("/api/v1", "")}/${asset.filepath}`;
      // slight delay to prevent browser from blocking multiple popups/downloads
      setTimeout(() => {
        forceDownload(fileUrl, asset.filename);
      }, index * 300);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedMedia.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedMedia.length} selected asset(s)?`)) return;
    
    // Attempt to delete sequentially or in parallel
    for (const mediaId of selectedMedia) {
      try {
        await fetch(`${API}/media/${mediaId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Bulk delete error:", err);
      }
    }
    setMediaAssets(mediaAssets.filter(m => !selectedMedia.includes(m.id)));
    setSelectedMedia([]);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">

      {/* ── Handover Modal ── */}
      {showHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-500" />
                  Handover Client
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Reassign <strong>{user?.first_name || user?.email}</strong> to a different staff member.
                </p>
              </div>
              <button onClick={() => { setShowHandover(false); setHandoverStaffId(""); setHandoverReason(""); }} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current manager */}
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
              <span className="text-zinc-500">Current manager: </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {user?.manager_id
                  ? (() => {
                      const mgr = staffList.find((s: any) => s.id === user.manager_id);
                      return mgr ? `${mgr.first_name || ""} ${mgr.last_name || ""}`.trim() || mgr.email : "Unknown";
                    })()
                  : "Unassigned"
                }
              </span>
            </div>

            {/* New staff picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                Assign to
              </label>
              <div className="relative">
                <select
                  value={handoverStaffId}
                  onChange={(e) => setHandoverStaffId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a staff member...</option>
                  {staffList
                    .filter((s: any) => s.id !== user?.manager_id)
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {`${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email}
                      </option>
                    ))
                  }
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                Reason <span className="font-normal text-zinc-400 normal-case">(optional)</span>
              </label>
              <Textarea
                value={handoverReason}
                onChange={(e) => setHandoverReason(e.target.value)}
                placeholder="e.g. Staff is unavailable, better expertise match, client request..."
                rows={3}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-zinc-400">This reason is saved as an internal audit note.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleHandover}
                disabled={!handoverStaffId || isHandingOver}
                className="flex-1"
              >
                {isHandingOver ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Handing Over...</> : <><UserCheck className="w-4 h-4 mr-2" />Confirm Handover</>}
              </Button>
              <Button variant="outline" onClick={() => { setShowHandover(false); setHandoverStaffId(""); setHandoverReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Profile Header ── */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/admin/users" className="text-zinc-500 hover:text-zinc-900 mt-1">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {user?.first_name || user?.last_name ? `${user.first_name || ""} ${user.last_name || ""}` : "Client Profile"}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {user?.company_name} • {user?.email}
          </p>
          {/* Current assigned staff */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {user?.manager_id ? (
              (() => {
                const mgr = staffList.find((s: any) => s.id === user.manager_id);
                const mgrName = mgr ? `${mgr.first_name || ""} ${mgr.last_name || ""}`.trim() || mgr.email : "Unknown";
                return (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                    <UserCheck className="w-3 h-3" />
                    Managed by {mgrName}
                  </span>
                );
              })()
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400">
                <UserCheck className="w-3 h-3" />
                Unassigned
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 items-start mt-2 md:mt-0">
          {/* Generate Report button */}
          {isAdminOrStaff && (
            <Link
              href={`/admin/users/${id}/report`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm whitespace-nowrap dark:bg-indigo-900/20 dark:border-indigo-800/50 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </Link>
          )}

          {/* Handover button — visible to admin or current manager */}
          {isAdminOrStaff && staffList.length > 0 && (
            <button
              onClick={() => setShowHandover(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4" />
              Handover Client
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg mb-8">
        {[
          { id: 'notes', label: 'Communication' },
          { id: 'brand', label: 'Brand Vault' },
          { id: 'assets', label: 'Campaigns & Pages' },
          { id: 'media', label: 'Media Vault' },
          ...(isAdminOrStaff ? [{ id: 'squad', label: 'Specialist Squad' }] : []),
          ...(isAdminOrStaff ? [{ id: 'tasks', label: 'Tasks & Progress' }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-zinc-900 shadow text-zinc-900 dark:text-zinc-50' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'notes' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
          <h2 className="text-xl font-bold mb-4">Notes &amp; Communication</h2>
          <p className="text-sm text-zinc-500 mb-6">Leave notes, instructions, or updates here.</p>

          {/* ── Note Composer ── */}
          <div className="mb-8">

            {/* STEP 0: Idle prompt — click to begin */}
            {noteStep === 'idle' && (
              <button
                type="button"
                onClick={() => isAdminOrStaff ? setNoteStep('choosing') : setNoteStep('composing')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-sm font-medium group"
              >
                <span className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors flex-shrink-0">+</span>
                Write a note...
              </button>
            )}

            {/* STEP 1: Choose audience (admin/staff only) */}
            {noteStep === 'choosing' && isAdminOrStaff && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Who is this note for?</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Choose before writing your note.</p>
                  </div>
                  <button
                    onClick={() => setNoteStep('idle')}
                    className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Card: Visible to All */}
                  <button
                    type="button"
                    onClick={() => { setIsNewNoteInternal(false); setNoteStep('composing'); }}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/30 dark:to-zinc-900 dark:border-indigo-800 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30 transition-all text-center group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Everyone</p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-500 mt-0.5">Client + Staff + Admin</p>
                    </div>
                  </button>

                  {/* Card: Staff & Admin Only */}
                  <button
                    type="button"
                    onClick={() => { setIsNewNoteInternal(true); setNoteStep('composing'); }}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-zinc-900 dark:border-amber-800 hover:border-amber-400 hover:shadow-md hover:shadow-amber-100 dark:hover:shadow-amber-900/20 transition-all text-center group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Staff &amp; Admin Only</p>
                      <p className="text-xs text-amber-500 dark:text-amber-500 mt-0.5">Hidden from client</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Compose & post */}
            {noteStep === 'composing' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Audience pill — click to go back and change */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => isAdminOrStaff ? setNoteStep('choosing') : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isNewNoteInternal
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 cursor-pointer'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 cursor-pointer'
                    }`}
                  >
                    {isNewNoteInternal
                      ? <><Lock className="w-3 h-3" /> Staff &amp; Admin Only · <span className="opacity-60">change</span></>
                      : <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Visible to Everyone · <span className="opacity-60">change</span></>}
                  </button>
                </div>

                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={isNewNoteInternal
                    ? "Write an internal note (not visible to client)..."
                    : "E.g. Client requested a budget increase next month..."
                  }
                  rows={4}
                  className={isNewNoteInternal ? 'border-amber-300 focus-visible:ring-amber-400 dark:border-amber-700' : ''}
                  autoFocus
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddNote(null, newNote, isNewNoteInternal)}
                    disabled={isAddingNote || !newNote.trim()}
                    className={isNewNoteInternal ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                  >
                    {isAddingNote ? 'Adding...' : (isNewNoteInternal ? '🔒 Add Internal Note' : 'Add Note')}
                  </Button>
                  <Button variant="ghost" onClick={() => { setNoteStep('idle'); setNewNote(''); setIsNewNoteInternal(false); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {notes.length === 0 ? (
              <p className="text-zinc-500 italic text-sm text-center py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">No notes recorded yet.</p>
            ) : (
              notes.map(note => renderNote(note, false))
            )}
          </div>
        </div>
      )}

      {activeTab === 'brand' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Brand Vault & Social Media</h2>
            <p className="text-sm text-zinc-500">Manage client's branding assets and social media accounts.</p>
          </div>
          <Button 
            onClick={handleSaveBrand} 
            disabled={isSavingBrand || (currentUser?.role === 'STAFF' && currentUser?.can_manage_users !== true)}
          >
            {isSavingBrand ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Assets
          </Button>
        </div>

        <fieldset 
          disabled={currentUser?.role === 'STAFF' && currentUser?.can_manage_users !== true}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 disabled:opacity-75"
        >
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Palette className="w-4 h-4 text-zinc-400" /> Brand Colors</h3>
            <div>
              <Label>Primary Color (Hex)</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="color" 
                  value={brandData.brand_primary_color || "#000000"} 
                  onChange={(e) => setBrandData({...brandData, brand_primary_color: e.target.value})} 
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={brandData.brand_primary_color} 
                  onChange={(e) => setBrandData({...brandData, brand_primary_color: e.target.value})} 
                  placeholder="#4F46E5" 
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color (Hex)</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="color" 
                  value={brandData.brand_secondary_color || "#000000"} 
                  onChange={(e) => setBrandData({...brandData, brand_secondary_color: e.target.value})} 
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={brandData.brand_secondary_color} 
                  onChange={(e) => setBrandData({...brandData, brand_secondary_color: e.target.value})} 
                  placeholder="#10B981" 
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900">Social Media Links</h3>
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook</Label>
              <div className="flex gap-2">
                <Input 
                  value={brandData.brand_facebook_url} 
                  onChange={(e) => setBrandData({...brandData, brand_facebook_url: e.target.value})} 
                  placeholder="https://facebook.com/..." 
                />
                {brandData.brand_facebook_url && (
                  <a href={brandData.brand_facebook_url.startsWith('http') ? brandData.brand_facebook_url : `https://${brandData.brand_facebook_url}`} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button type="button" variant="outline" size="icon" title="Open Link"><ExternalLink className="w-4 h-4 text-zinc-500" /></Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Twitter className="w-4 h-4 text-[#1DA1F2]" /> Twitter / X</Label>
              <div className="flex gap-2">
                <Input 
                  value={brandData.brand_twitter_url} 
                  onChange={(e) => setBrandData({...brandData, brand_twitter_url: e.target.value})} 
                  placeholder="https://twitter.com/..." 
                />
                {brandData.brand_twitter_url && (
                  <a href={brandData.brand_twitter_url.startsWith('http') ? brandData.brand_twitter_url : `https://${brandData.brand_twitter_url}`} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button type="button" variant="outline" size="icon" title="Open Link"><ExternalLink className="w-4 h-4 text-zinc-500" /></Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Instagram className="w-4 h-4 text-[#E4405F]" /> Instagram</Label>
              <div className="flex gap-2">
                <Input 
                  value={brandData.brand_instagram_url} 
                  onChange={(e) => setBrandData({...brandData, brand_instagram_url: e.target.value})} 
                  placeholder="https://instagram.com/..." 
                />
                {brandData.brand_instagram_url && (
                  <a href={brandData.brand_instagram_url.startsWith('http') ? brandData.brand_instagram_url : `https://${brandData.brand_instagram_url}`} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button type="button" variant="outline" size="icon" title="Open Link"><ExternalLink className="w-4 h-4 text-zinc-500" /></Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Linkedin className="w-4 h-4 text-[#0A66C2]" /> LinkedIn</Label>
              <div className="flex gap-2">
                <Input 
                  value={brandData.brand_linkedin_url} 
                  onChange={(e) => setBrandData({...brandData, brand_linkedin_url: e.target.value})} 
                  placeholder="https://linkedin.com/company/..." 
                />
                {brandData.brand_linkedin_url && (
                  <a href={brandData.brand_linkedin_url.startsWith('http') ? brandData.brand_linkedin_url : `https://${brandData.brand_linkedin_url}`} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button type="button" variant="outline" size="icon" title="Open Link"><ExternalLink className="w-4 h-4 text-zinc-500" /></Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Tiktok className="w-4 h-4 text-black dark:text-white" /> TikTok</Label>
              <div className="flex gap-2">
                <Input 
                  value={brandData.brand_tiktok_url} 
                  onChange={(e) => setBrandData({...brandData, brand_tiktok_url: e.target.value})} 
                  placeholder="https://tiktok.com/@..." 
                />
                {brandData.brand_tiktok_url && (
                  <a href={brandData.brand_tiktok_url.startsWith('http') ? brandData.brand_tiktok_url : `https://${brandData.brand_tiktok_url}`} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button type="button" variant="outline" size="icon" title="Open Link"><ExternalLink className="w-4 h-4 text-zinc-500" /></Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset 
          disabled={currentUser?.role === 'STAFF' && currentUser?.can_manage_users !== true}
          className="mt-6 disabled:opacity-75 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Whatsapp className="w-4 h-4 text-[#25D366]" /> WhatsApp Number</Label>
              <div className="flex gap-2">
                <Input 
                  value={brandData.brand_whatsapp} 
                  onChange={(e) => setBrandData({...brandData, brand_whatsapp: e.target.value})} 
                  placeholder="+1234567890" 
                />
                {brandData.brand_whatsapp && (
                  <a 
                    href={`https://wa.me/${brandData.brand_whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button type="button" variant="outline" size="icon" title="Chat on WhatsApp">
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-zinc-600"><Mail className="w-4 h-4" /> Support / Brand Email</Label>
              <div className="flex gap-2">
                <Input 
                  type="email"
                  value={brandData.brand_email} 
                  onChange={(e) => setBrandData({...brandData, brand_email: e.target.value})} 
                  placeholder="hello@brand.com" 
                />
                {brandData.brand_email && (
                  <a href={`mailto:${brandData.brand_email}`} className="shrink-0">
                    <Button type="button" variant="outline" size="icon" title="Send Email"><ExternalLink className="w-4 h-4 text-zinc-500" /></Button>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2 text-zinc-600"><FileText className="w-4 h-4" /> Special Notes / Guidelines</Label>
            <Textarea 
              value={brandData.brand_notes} 
              onChange={(e) => setBrandData({...brandData, brand_notes: e.target.value})} 
              placeholder="E.g. Target audience is Gen-Z, use casual tone, specific hashtags..." 
              rows={3}
            />
          </div>
        </fieldset>
      </div>
      )}

      {/* Client Assets Section */}
      {activeTab === 'assets' && (
      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
        <h2 className="text-xl font-bold mb-4">Client Assets</h2>
        <p className="text-sm text-zinc-500 mb-6">Landing pages and ad campaigns associated with this client.</p>

        <div className="space-y-8">
          {/* Campaigns */}
          <div>
            <h3 className="text-md font-semibold mb-3 flex items-center justify-between">
              Active Campaigns
              <Link href="/admin/campaigns" className="text-xs text-indigo-600 font-normal hover:underline">View All</Link>
            </h3>
            {campaigns.length === 0 ? (
              <p className="text-sm text-zinc-500 bg-zinc-50 py-4 text-center rounded-lg border border-dashed">No campaigns found.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 border-b">
                    <tr>
                      <th className="px-4 py-2 font-medium text-zinc-600">Campaign</th>
                      <th className="px-4 py-2 font-medium text-zinc-600">Status</th>
                      <th className="px-4 py-2 font-medium text-zinc-600">ROI</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {campaigns.map(camp => (
                      <tr key={camp.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 font-medium">{camp.name}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            camp.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
                            camp.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            camp.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            'bg-zinc-100 text-zinc-800 border-zinc-200'
                          }`}>
                            {camp.status || 'DRAFT'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-zinc-600">
                          {camp.ad_spend > 0 ? `${(((camp.revenue_generated - camp.ad_spend) / camp.ad_spend) * 100).toFixed(0)}%` : "-"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/admin/campaigns/${camp.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                            Dashboard
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Landing Pages */}
          <div>
            <h3 className="text-md font-semibold mb-3 flex items-center justify-between">
              Landing Pages
              <Link href="/admin/pages" className="text-xs text-indigo-600 font-normal hover:underline">View All</Link>
            </h3>
            {pages.length === 0 ? (
              <p className="text-sm text-zinc-500 bg-zinc-50 py-4 text-center rounded-lg border border-dashed">No pages found.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 border-b">
                    <tr>
                      <th className="px-4 py-2 font-medium text-zinc-600">Page Name</th>
                      <th className="px-4 py-2 font-medium text-zinc-600">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pages.map(page => (
                      <tr key={page.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 font-medium flex items-center gap-2">
                          {page.name}
                          {page.is_ab_test_primary && (
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">A/B</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            page.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {page.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={page.status === 'PUBLISHED' ? `/landing/${page.slug}` : `/preview/${page.slug}`} target="_blank" className="text-indigo-600 hover:text-indigo-800 font-medium text-xs mr-4">
                            View
                          </Link>
                          {currentUser?.role !== 'CLIENT' && (
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
      </div>
      )}
      {/* Media Vault Section */}
      {activeTab === 'media' && (
      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
        <h2 className="text-xl font-bold mb-4">Media Vault</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <p className="text-sm text-zinc-500">Upload and manage shared files, images, and brand assets for this client.</p>
          <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Storage Used</span>
            <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  (mediaAssets.reduce((sum, asset) => sum + asset.size, 0) / 1024 / 1024) > (mediaLimits.totalQuotaMB * 0.9) ? 'bg-red-500' : 
                  (mediaAssets.reduce((sum, asset) => sum + asset.size, 0) / 1024 / 1024) > (mediaLimits.totalQuotaMB * 0.75) ? 'bg-yellow-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, ((mediaAssets.reduce((sum, asset) => sum + asset.size, 0) / 1024 / 1024) / mediaLimits.totalQuotaMB) * 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {((mediaAssets.reduce((sum, asset) => sum + asset.size, 0)) / 1024 / 1024).toFixed(1)} / {mediaLimits.totalQuotaMB} MB
            </span>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-8 p-6 border border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="font-semibold text-sm mb-4">Upload New Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label className="mb-2 block">Select Files</Label>
              <div className="flex flex-col gap-2">
                <Input 
                  type="file" 
                  multiple
                  onChange={(e) => setUploadFiles(e.target.files ? Array.from(e.target.files) : [])} 
                  className="cursor-pointer"
                />
                {uploadFiles.length > 0 && (
                  <span className="text-xs text-zinc-500">{uploadFiles.length} file{uploadFiles.length === 1 ? '' : 's'} selected</span>
                )}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Notes / Description (Optional)</Label>
              <Input 
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="E.g. Branding assets for June"
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <Button onClick={handleUploadMedia} disabled={uploadFiles.length === 0 || isUploadingMedia}>
                {isUploadingMedia ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                {isUploadingMedia ? `Uploading ${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'}...` : "Upload Assets"}
              </Button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-sm">Uploaded Assets ({mediaAssets.length})</h3>
            {selectedMedia.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">{selectedMedia.length} selected</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleBulkDownload}>
                  <Download className="w-3 h-3 mr-1" /> Download
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleBulkDelete}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
          <div className="flex border rounded-md overflow-hidden">
            <button 
              onClick={() => setMediaViewMode("grid")}
              className={`p-2 flex items-center justify-center ${mediaViewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'bg-white text-zinc-400 hover:text-zinc-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMediaViewMode("list")}
              className={`p-2 flex items-center justify-center border-l ${mediaViewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'bg-white text-zinc-400 hover:text-zinc-600'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Rendering */}
        {mediaAssets.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 border border-dashed rounded-xl">
            No media assets uploaded yet.
          </div>
        ) : mediaViewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {mediaAssets.map((asset) => {
              const isImage = asset.mimetype?.startsWith("image/");
              const fileUrl = `${API.replace("/api/v1", "")}/${asset.filepath}`;
              return (
                <div key={asset.id} className={`border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col relative transition-all ${selectedMedia.includes(asset.id) ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}>
                  <div className="absolute top-2 left-2 z-10">
                    <input 
                      type="checkbox" 
                      checked={selectedMedia.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMedia([...selectedMedia, asset.id]);
                        else setSelectedMedia(selectedMedia.filter(id => id !== asset.id));
                      }}
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600 shadow-sm"
                    />
                  </div>
                  {/* Preview Area */}
                  <div className="h-40 bg-zinc-100 flex items-center justify-center relative group">
                    {isImage ? (
                      <img src={fileUrl} alt={asset.filename} className="w-full h-full object-cover" />
                    ) : (
                      <FileIcon className="w-12 h-12 text-zinc-400" />
                    )}
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="secondary" size="sm" className="h-8" onClick={() => forceDownload(fileUrl, asset.filename)}>
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                  
                  {/* Info Area */}
                  <div className="p-3 border-t bg-zinc-50/50 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold truncate" title={asset.filename}>{asset.filename}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{(asset.size / 1024 / 1024).toFixed(2)} MB • {format(new Date(asset.created_at), "MMM d, yyyy")}</p>
                      {asset.notes && (
                        <p className="text-xs text-zinc-600 mt-2 bg-zinc-100 p-2 rounded border border-zinc-200 line-clamp-2" title={asset.notes}>
                          {asset.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-3">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2" onClick={() => handleDeleteMedia(asset.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-600 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedMedia.length === mediaAssets.length && mediaAssets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMedia(mediaAssets.map(a => a.id));
                        else setSelectedMedia([]);
                      }}
                      className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium text-zinc-600">File</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Notes</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Size</th>
                  <th className="px-4 py-3 font-medium text-zinc-600">Date</th>
                  <th className="px-4 py-3 font-medium text-zinc-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mediaAssets.map((asset) => {
                  const isImage = asset.mimetype?.startsWith("image/");
                  const fileUrl = `${API.replace("/api/v1", "")}/${asset.filepath}`;
                  return (
                    <tr key={asset.id} className={`hover:bg-zinc-50 ${selectedMedia.includes(asset.id) ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedMedia.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedMedia([...selectedMedia, asset.id]);
                            else setSelectedMedia(selectedMedia.filter(id => id !== asset.id));
                          }}
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden border">
                            {isImage ? (
                              <img src={fileUrl} alt={asset.filename} className="w-full h-full object-cover" />
                            ) : (
                              <FileIcon className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>
                          <span className="font-medium truncate max-w-[200px]" title={asset.filename}>{asset.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {asset.notes ? (
                          <span className="truncate block max-w-[250px]" title={asset.notes}>{asset.notes}</span>
                        ) : (
                          <span className="text-zinc-400 italic">No notes</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{(asset.size / 1024 / 1024).toFixed(2)} MB</td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{format(new Date(asset.created_at), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Download" onClick={() => forceDownload(fileUrl, asset.filename)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteMedia(asset.id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'squad' && isAdminOrStaff && (
        <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Specialist Squad
              </h2>
              <p className="text-sm text-zinc-500">Manage specialized staff assigned to this client's projects.</p>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <Button onClick={() => setShowAddSquad(true)}>Enroll Specialist</Button>
            )}
          </div>

          {showAddSquad && (
            <div className="mb-8 p-4 border border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-900/30 rounded-xl animate-in slide-in-from-top-2">
              <h3 className="font-semibold text-sm mb-3">Enroll New Specialist</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 bg-white text-sm dark:bg-zinc-950 dark:border-zinc-800"
                    value={squadStaffId}
                    onChange={(e) => setSquadStaffId(e.target.value)}
                  >
                    <option value="">Select Staff...</option>
                    {staffList.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {`${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    list="common-roles"
                    placeholder="Role (e.g. Graphic Designer)"
                    value={squadRole}
                    onChange={(e) => setSquadRole(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Completion Date (Optional)</label>
                  <input 
                    type="date" 
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={squadDueDate}
                    onChange={(e) => setSquadDueDate(e.target.value)}
                  />
                </div>
              </div> 
              <div className="flex gap-2 mt-3">
                  <Button onClick={handleAddSquad} disabled={isAddingSquad || !squadStaffId || !squadRole}>
                    {isAddingSquad ? 'Adding...' : 'Add'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddSquad(false)}>Cancel</Button>
                </div>
            </div>
          )}

          <div className="space-y-4">
            {clientSquad.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No specialists enrolled yet.</p>
            ) : (
              clientSquad.map((squad) => (
                <div key={squad.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                      {squad.staff_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{squad.staff_name}</h4>
                      <p className="text-xs text-zinc-500">{squad.staff_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                      {squad.service_role}
                    </span>
                    {renderDelayBadge(squad.due_date, squad.completed_at, squad.status)}
                    {currentUser?.role === 'ADMIN' && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveSquad(squad.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Client Tasks Board ── */}
      {activeTab === 'tasks' && isAdminOrStaff && (
        <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                Tasks &amp; Progress
              </h2>
              <p className="text-sm text-zinc-500">Track and manage service deliverables for this client.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowApplyWorkflow(true)}>
                <ListTree className="w-4 h-4 mr-2" />
                Apply SLA Workflow
              </Button>
              <Button onClick={() => setShowAddTask(!showAddTask)}>
                <Plus className="w-4 h-4 mr-1" /> Create Task
              </Button>
            </div>
          </div>

          {/* Apply Workflow Modal */}
          <Dialog open={showApplyWorkflow} onOpenChange={setShowApplyWorkflow}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply SLA Workflow</DialogTitle>
                <DialogDescription>Automatically generate tasks with calculated SLA target dates.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Workflow Template</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  >
                    <option value="">-- Choose Workflow --</option>
                    {workflows.map(wf => (
                      <option key={wf.id} value={wf.id}>{wf.name} ({wf.tasks.length} tasks)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Bulk Assign To (Optional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={workflowStaffId}
                    onChange={(e) => setWorkflowStaffId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    <optgroup label="Client Squad">
                      {clientSquad.map((squad: any) => (
                        <option key={squad.staff_id} value={squad.staff_id}>
                          {squad.staff_name} ({squad.service_role})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="All Staff">
                      {staffList.filter(s => !clientSquad.find(sq => sq.staff_id === s.id)).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {`${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowApplyWorkflow(false)}>Cancel</Button>
                <Button onClick={handleApplyWorkflow} disabled={!selectedWorkflowId || isApplyingWorkflow}>
                  {isApplyingWorkflow ? "Applying..." : "Apply Workflow"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Progress Bar */}
          {clientTasks.length > 0 && (
            <div className="mb-8 p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Overall Progress</span>
                <span>{Math.round((clientTasks.filter(t => t.status === 'DONE').length / clientTasks.length) * 100)}%</span>
              </div>
              <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500 ease-in-out" 
                  style={{ width: `${Math.round((clientTasks.filter(t => t.status === 'DONE').length / clientTasks.length) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Add Task Form */}
          {showAddTask && (
            <div className="mb-8 p-5 border border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-900/30 rounded-xl animate-in slide-in-from-top-2">
              <h3 className="font-semibold text-sm mb-4">Create New Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-1 md:col-span-2">
                  <Label>Task Title</Label>
                  <Input 
                    placeholder="e.g. Design 3 Ad Creatives" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Assign To (Squad)</Label>
                  <select
                    className="w-full h-10 px-3 mt-1.5 rounded-md border border-zinc-200 bg-white text-sm dark:bg-zinc-950 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.assigned_to_id}
                    onChange={(e) => setNewTask({...newTask, assigned_to_id: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {clientSquad.map((squad: any) => (
                      <option key={squad.staff_id} value={squad.staff_id}>
                        {squad.staff_name} ({squad.service_role})
                      </option>
                    ))}
                    {/* Fallback to all staff if needed, but Squad is preferred */}
                    <optgroup label="All Staff">
                      {staffList.filter(s => !clientSquad.find(sq => sq.staff_id === s.id)).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {`${s.first_name || ""} ${s.last_name || ""}`.trim() || s.email}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Service Category (Optional)</Label>
                  <Input 
                    list="common-roles"
                    placeholder="e.g. Graphic Design" 
                    value={newTask.service_category}
                    onChange={(e) => setNewTask({...newTask, service_category: e.target.value})}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Provide details..." 
                    rows={2}
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
                <Button onClick={handleAddTask} disabled={isAddingTask || !newTask.title}>
                  {isAddingTask ? 'Saving...' : 'Save Task'}
                </Button>
              </div>
            </div>
          )}

          {/* Task Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(status => {
              const columnTasks = clientTasks.filter(t => t.status === status);
              return (
                <div key={status} className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-3 border">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h3 className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">{status.replace('_', ' ')}</h3>
                    <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs py-0.5 px-2 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const assignedUser = staffList.find(s => s.id === task.assigned_to_id);
                        const assignedName = assignedUser ? `${assignedUser.first_name || ""} ${assignedUser.last_name || ""}`.trim() || assignedUser.email : 'Unassigned';
                        
                        return (
                          <div key={task.id} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border shadow-sm group">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm leading-snug">{task.title}</h4>
                              {isAdminOrStaff && (
                                <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            {task.service_category && (
                              <span className="inline-block px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded mb-2 mr-2">
                                {task.service_category}
                              </span>
                            )}
                            {renderDelayBadge(task.due_date, task.completed_at, task.status)}
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-zinc-800">
                              <div className="flex items-center gap-1.5" title={assignedName}>
                                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                  {assignedName !== 'Unassigned' ? assignedName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">
                                  {assignedName}
                                </span>
                              </div>
                              
                              <select 
                                className="text-[10px] bg-transparent border-none cursor-pointer focus:ring-0 p-0 font-medium text-zinc-600 dark:text-zinc-400"
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">Review</option>
                                <option value="DONE">Done</option>
                              </select>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reusable Data List for Service Roles */}
      <datalist id="common-roles">
        {serviceRoles.map(role => (
          <option key={role.id} value={role.name} />
        ))}
        {/* Fallbacks if db is empty */}
        {serviceRoles.length === 0 && (
          <>
            <option value="Graphic Designer" />
            <option value="Video Editor" />
            <option value="Copywriter" />
            <option value="SEO Specialist" />
            <option value="Web Developer" />
            <option value="Ads Specialist" />
            <option value="Account Manager" />
            <option value="UI/UX Designer" />
          </>
        )}
      </datalist>
    </div>
  );
}
