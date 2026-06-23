"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { ExternalLink, Plus, StickyNote, Trash2, Edit2, X, Copy as CopyIcon, Maximize2, Printer, Grid, List, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    url: ""
  });

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/personal-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/personal-notes/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/personal-notes`;
        
      const method = editingId ? "PUT" : "POST";
      
      const payload = { ...formData };
      if (!payload.content) delete payload.content;
      if (!payload.url) delete payload.url;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: "", content: "", url: "" });
        setEditingId(null);
        fetchNotes();
        
        // Update viewing note if it was being edited
        if (viewingNote && editingId === viewingNote.id) {
          const updated = await res.json();
          setViewingNote(updated);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error saving note: ${errorData.detail || res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: any) => {
    setFormData({
      title: note.title,
      content: note.content || "",
      url: note.url || ""
    });
    setEditingId(note.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/personal-notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
      if (viewingNote?.id === id) {
        setViewingNote(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    // Optional: add a tiny toast here if you have a toast system
  };

  const handlePrint = (note: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${note.title} - Notes</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; color: #18181b; }
              h1 { border-bottom: 1px solid #e4e4e7; padding-bottom: 12px; margin-bottom: 24px; font-size: 24px; }
              .content { white-space: pre-wrap; font-size: 15px; color: #3f3f46; }
              .url { margin-top: 24px; padding: 12px; background: #f4f4f5; border-radius: 8px; font-size: 14px; }
              .meta { color: #a1a1aa; font-size: 12px; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.05em; }
            </style>
          </head>
          <body>
            <h1>${note.title}</h1>
            <div class="content">${note.content || ''}</div>
            ${note.url ? `<div class="url"><strong>Reference:</strong> <a href="${note.url}" target="_blank">${note.url}</a></div>` : ''}
            <div class="meta">Created: ${format(new Date(note.created_at), "PPP")}</div>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 250); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <StickyNote className="w-6 h-6 text-indigo-500" />
            My Notes
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Save ideas, AI prompts, and useful links here.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
            />
          </div>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setFormData({ title: "", content: "", url: "" });
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
          
          <button
            onClick={() => router.push("/admin")}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Close Notes"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
          <StickyNote className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No notes yet</h3>
          <p className="text-zinc-500 mt-1">Create your first note to start saving ideas and links.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()))
          ).map((note) => (
            <div 
              key={note.id} 
              className="break-inside-avoid bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col"
            >
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 
                    className="font-semibold text-zinc-900 dark:text-zinc-50 leading-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                    onClick={() => setViewingNote(note)}
                  >
                    {note.title}
                  </h3>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1 shrink-0 bg-white dark:bg-zinc-900 shadow-[0_0_10px_rgba(255,255,255,1)] dark:shadow-[0_0_10px_rgba(24,24,27,1)] rounded-bl-lg">
                    <button 
                      onClick={() => setViewingNote(note)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors"
                      title="Read note"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleCopy(note.content || note.title)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors"
                      title="Copy content"
                    >
                      <CopyIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handlePrint(note)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors"
                      title="Print note"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleEdit(note)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                {note.content && viewMode === "grid" && (
                  <div 
                    onClick={() => setViewingNote(note)}
                    className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap mb-4 overflow-hidden line-clamp-6 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex-1"
                  >
                    {note.content}
                  </div>
                )}
                
                <div className={`mt-auto ${viewMode === "grid" ? "pt-2" : "pt-0 flex items-center justify-between"}`}>
                  {note.url && (
                    <a 
                      href={note.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-md max-w-full block w-fit"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{note.url.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  
                  <div className={`text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider ${viewMode === "grid" ? "mt-3" : ""}`}>
                    {format(new Date(note.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reading View Modal */}
      {viewingNote && !showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 pr-4">
                {viewingNote.title}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleCopy(viewingNote.content || viewingNote.title)}
                  className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Copy content"
                >
                  <CopyIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handlePrint(viewingNote)}
                  className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Print note"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleEdit(viewingNote)}
                  className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Edit note"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                <button 
                  onClick={() => setViewingNote(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {viewingNote.content ? (
                <div className="text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-medium">
                  {viewingNote.content}
                </div>
              ) : (
                <div className="text-zinc-400 italic">No additional content</div>
              )}
              
              {viewingNote.url && (
                <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Reference Link</div>
                  <a 
                    href={viewingNote.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {viewingNote.url}
                  </a>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 text-xs font-medium text-zinc-400 flex justify-between items-center shrink-0">
              <span>Created on {format(new Date(viewingNote.created_at), "PPP")}</span>
              <span>ID: {viewingNote.id.substring(0,8)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingId ? "Edit Note" : "Create Note"}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                  <span>Title *</span>
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setFormData({...formData, title: text});
                      } catch (err) {}
                    }}
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <CopyIcon className="w-3 h-3" /> Paste
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
                  placeholder="e.g., Target Audience Insights"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                  <span>Content (Optional)</span>
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setFormData({...formData, content: text});
                      } catch (err) {}
                    }}
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <CopyIcon className="w-3 h-3" /> Paste
                  </button>
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  rows={8}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100 resize-y font-medium"
                  placeholder="Paste your notes, AI outputs, or ideas here..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
                  <span>Reference URL (Optional)</span>
                  <button 
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setFormData({...formData, url: text});
                      } catch (err) {}
                    }}
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-1"
                  >
                    <CopyIcon className="w-3 h-3" /> Paste
                  </button>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-zinc-100"
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : (editingId ? "Save Changes" : "Save Note")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
