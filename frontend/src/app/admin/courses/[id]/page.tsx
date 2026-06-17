"use client";

import { useState, useEffect, use } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ArrowLeft, Plus, Video, Loader2, GripVertical, FileText,
  Globe, X, Save, Eye, EyeOff, PlaySquare, Link2, AlignLeft, Pencil, Trash2
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function CourseBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Module / lesson creation
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // Lesson Editor Panel
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonDraft, setLessonDraft] = useState<any>(null);
  const [lessonSaving, setLessonSaving] = useState(false);

  useEffect(() => { fetchCourse(); }, [id, token]);

  const fetchCourse = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourse(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdateCourse = async (updates: any) => {
    setSaving(true);
    try {
      await fetch(`${API}/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      setCourse({ ...course, ...updates });
    } finally { setSaving(false); }
  };

  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/courses/${id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newModuleTitle })
      });
      if (res.ok) {
        const mod = await res.json();
        setCourse({ ...course, modules: [...course.modules, { ...mod, lessons: [] }] });
        setNewModuleTitle("");
      }
    } finally { setSaving(false); }
  };

  const addLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/courses/${id}/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newLessonTitle, content_text: "", video_url: "", is_free_preview: false })
      });
      if (res.ok) {
        const les = await res.json();
        setCourse({
          ...course,
          modules: course.modules.map((m: any) =>
            m.id === moduleId ? { ...m, lessons: [...m.lessons, les] } : m
          )
        });
        setNewLessonTitle("");
        setActiveModuleId(null);
        // Auto-open editor for new lesson
        openLessonEditor(les);
      }
    } finally { setSaving(false); }
  };

  const deleteLesson = async (courseId: string, lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    const res = await fetch(`${API}/courses/${courseId}/lessons/${lessonId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setCourse({
        ...course,
        modules: course.modules.map((m: any) => ({
          ...m,
          lessons: m.lessons.filter((l: any) => l.id !== lessonId)
        }))
      });
      if (editingLesson?.id === lessonId) closeLessonEditor();
    }
  };

  const openLessonEditor = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonDraft({ ...lesson });
  };

  const closeLessonEditor = () => {
    setEditingLesson(null);
    setLessonDraft(null);
  };

  const saveLesson = async () => {
    if (!lessonDraft || !editingLesson) return;
    setLessonSaving(true);
    try {
      const res = await fetch(`${API}/courses/${id}/lessons/${editingLesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: lessonDraft.title,
          content_text: lessonDraft.content_text,
          video_url: lessonDraft.video_url,
          is_free_preview: lessonDraft.is_free_preview
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setCourse({
          ...course,
          modules: course.modules.map((m: any) => ({
            ...m,
            lessons: m.lessons.map((l: any) => l.id === updated.id ? { ...l, ...updated } : l)
          }))
        });
        setEditingLesson(updated);
      }
    } finally { setLessonSaving(false); }
  };

  const getVideoType = (url: string) => {
    if (!url) return null;
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("vimeo.com")) return "vimeo";
    return "mp4";
  };

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\/]{11})/);
    return match ? match[1] : null;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 flex">

      {/* ── Main Builder Column ── */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${editingLesson ? "mr-[480px]" : ""}`}>

        {/* Top Navbar */}
        <div className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin/courses" className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-zinc-900 dark:text-white text-lg">Course Curriculum</h1>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${course?.is_published ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                {course?.is_published ? "Published" : "Draft"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/portal/courses/${id}`} target="_blank"
              className="px-4 py-2 rounded-lg font-bold text-sm text-zinc-600 hover:bg-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Preview Portal
            </Link>
            <button
              onClick={() => handleUpdateCourse({ is_published: !course.is_published })}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${course?.is_published
                ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {course?.is_published ? "Unpublish" : "Publish Course"}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-8 px-6">
          {/* Course Meta */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
            <div className="mb-4">
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Course Title</label>
              <input
                type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={course?.title || ""}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                onBlur={(e) => handleUpdateCourse({ title: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
              <textarea
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={course?.description || ""}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                onBlur={(e) => handleUpdateCourse({ description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">Thumbnail URL</label>
              <input
                type="url"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
                value={course?.thumbnail_url || ""}
                onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                onBlur={(e) => handleUpdateCourse({ thumbnail_url: e.target.value || null })}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Curriculum</h2>

          <div className="space-y-6">
            {course?.modules?.map((mod: any, mIdx: number) => (
              <div key={mod.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-zinc-400 cursor-grab" />
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg flex-1">
                    Module {mIdx + 1}: {mod.title}
                  </h3>
                  <span className="text-xs text-zinc-400">{mod.lessons?.length || 0} lessons</span>
                </div>

                <div className="p-2 space-y-1">
                  {mod.lessons?.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center py-4 italic">No lessons yet. Add one below.</p>
                  ) : (
                    mod.lessons?.map((les: any, lIdx: number) => (
                      <div
                        key={les.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all group cursor-pointer ${editingLesson?.id === les.id
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-zinc-100 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50"
                          }`}
                        onClick={() => editingLesson?.id === les.id ? closeLessonEditor() : openLessonEditor(les)}
                      >
                        <GripVertical className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity shrink-0" />
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          {les.video_url ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{les.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {les.is_free_preview && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">FREE</span>
                            )}
                            {les.video_url && (
                              <span className="text-[10px] text-zinc-400 font-medium">{getVideoType(les.video_url)?.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openLessonEditor(les); }}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                            title="Edit Lesson"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteLesson(id, les.id); }}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {activeModuleId === mod.id ? (
                    <div className="flex items-center gap-2 p-2 mt-1">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Lesson title..."
                        className="flex-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addLesson(mod.id)}
                      />
                      <button onClick={() => addLesson(mod.id)} className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-bold">Add</button>
                      <button onClick={() => { setActiveModuleId(null); setNewLessonTitle(""); }} className="px-3 py-2 text-zinc-500 text-sm font-bold">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveModuleId(mod.id)}
                      className="w-full py-3 mt-1 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Lesson
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Module */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="New module title..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-semibold mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addModule()}
                />
                <button
                  onClick={addModule}
                  disabled={!newModuleTitle.trim() || saving}
                  className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl disabled:opacity-40 transition-opacity"
                >
                  Add Module
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Slide-out Lesson Editor Panel ── */}
      <div className={`fixed top-0 right-0 h-full w-[480px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-30 flex flex-col transition-transform duration-300 ease-in-out ${editingLesson ? "translate-x-0" : "translate-x-full"}`}>
        {editingLesson && lessonDraft && (
          <>
            {/* Panel Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-zinc-900 dark:text-white text-sm">Edit Lesson</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveLesson}
                  disabled={lessonSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {lessonSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                <button onClick={closeLessonEditor} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Lesson Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Lesson Title</label>
                <input
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={lessonDraft.title}
                  onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })}
                  placeholder="Enter lesson title..."
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Video</label>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={lessonDraft.video_url || ""}
                      onChange={(e) => setLessonDraft({ ...lessonDraft, video_url: e.target.value })}
                      placeholder="YouTube, Vimeo, or direct MP4 URL..."
                    />
                  </div>

                  {/* Video type chips */}
                  <div className="flex gap-2">
                    {[
                    { label: "YouTube", hint: "youtube.com/watch?v=...", icon: <PlaySquare className="w-3 h-3" /> },
                      { label: "Vimeo", hint: "vimeo.com/...", icon: <Video className="w-3 h-3" /> },
                      { label: "MP4", hint: "Direct .mp4 link", icon: <Link2 className="w-3 h-3" /> },
                    ].map(t => (
                      <div key={t.label} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">
                        {t.icon} {t.label}
                      </div>
                    ))}
                  </div>

                  {/* Video Preview */}
                  {lessonDraft.video_url && getVideoType(lessonDraft.video_url) === "youtube" && getYoutubeId(lessonDraft.video_url) && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-700">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(lessonDraft.video_url)}?rel=0`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {lessonDraft.video_url && getVideoType(lessonDraft.video_url) === "mp4" && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-700">
                      <video src={lessonDraft.video_url} controls className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Lesson Notes / Content */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Lesson Notes
                </label>
                <textarea
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[200px]"
                  value={lessonDraft.content_text || ""}
                  onChange={(e) => setLessonDraft({ ...lessonDraft, content_text: e.target.value })}
                  placeholder="Add lesson notes, resources, or instructions here. Supports plain text."
                />
                <p className="text-xs text-zinc-400 mt-1.5">These notes appear below the video on the student portal.</p>
              </div>

              {/* Free Preview Toggle */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                    {lessonDraft.is_free_preview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Free Preview
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">
                    Allow non-enrolled visitors to watch this lesson for free.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLessonDraft({ ...lessonDraft, is_free_preview: !lessonDraft.is_free_preview })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${lessonDraft.is_free_preview ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${lessonDraft.is_free_preview ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {/* Danger Zone */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => { deleteLesson(id, editingLesson.id); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" /> Delete This Lesson
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Overlay dim when panel is open */}
      {editingLesson && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={closeLessonEditor}
        />
      )}
    </div>
  );
}
