"use client";

import { useState, useEffect, use } from "react";
import { Loader2, PlayCircle, CheckCircle2, ChevronRight, Menu, X, ArrowLeft, Video } from "lucide-react";
import Link from "next/link";

export default function StudentCourseViewer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/courses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        
        // Auto select first lesson
        if (data.modules && data.modules.length > 0 && data.modules[0].lessons.length > 0) {
          setActiveLesson(data.modules[0].lessons[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbed = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\/]{11})/;
    const match = url.match(regExp);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0`;
    }
    return null;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  if (!course) return <div className="h-screen flex items-center justify-center">Course not found.</div>;

  const ytEmbed = activeLesson ? getYoutubeEmbed(activeLesson.video_url) : null;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Curriculum */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-zinc-900 dark:text-white line-clamp-1">{course.title}</h2>
          <button className="md:hidden text-zinc-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {course.modules?.map((mod: any, mIdx: number) => (
            <div key={mod.id}>
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 px-2">
                Module {mIdx + 1}: {mod.title}
              </h3>
              <div className="space-y-1">
                {mod.lessons?.map((les: any, lIdx: number) => {
                  const isActive = activeLesson?.id === les.id;
                  return (
                    <button
                      key={les.id}
                      onClick={() => { setActiveLesson(les); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        isActive 
                        ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20" 
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent"
                      }`}
                    >
                      {isActive ? (
                        <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                      )}
                      <span className={`text-sm font-medium line-clamp-2 ${isActive ? "text-indigo-900 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {lIdx + 1}. {les.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <div className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 shrink-0 z-10">
          <button className="md:hidden p-2 text-zinc-600 mr-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
            <span className="hidden sm:inline">Course</span> 
            <ChevronRight className="w-4 h-4 hidden sm:inline" /> 
            <span className="text-zinc-900 dark:text-white truncate">{activeLesson?.title || "Welcome"}</span>
          </div>
        </div>

        {/* Video Player & Content */}
        <div className="flex-1 overflow-y-auto">
          {activeLesson ? (
            <div className="max-w-5xl mx-auto w-full p-4 md:p-8">
              
              {/* Video Wrapper */}
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-8 relative group">
                {ytEmbed ? (
                  <iframe 
                    src={ytEmbed} 
                    className="w-full h-full absolute inset-0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                ) : activeLesson.video_url ? (
                  <video 
                    src={activeLesson.video_url} 
                    className="w-full h-full object-contain absolute inset-0"
                    controls
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                    <Video className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-medium">No video available for this lesson</p>
                  </div>
                )}
              </div>

              {/* Lesson Details */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-6">
                  {activeLesson.title}
                </h1>
                
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  {activeLesson.content_text ? (
                    <div dangerouslySetInnerHTML={{ __html: activeLesson.content_text.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p className="text-zinc-500 italic">No additional notes provided for this lesson.</p>
                  )}
                </div>
              </div>
              
              {/* Navigation Footer */}
              <div className="mt-8 flex justify-between items-center pb-20">
                <button className="px-6 py-3 rounded-xl font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors">
                  Previous Lesson
                </button>
                <button className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                  Complete & Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              Select a lesson from the sidebar to begin learning.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
