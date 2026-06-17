"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, GraduationCap, Video, Users, Loader2, PlayCircle, MoreVertical } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function CoursesDashboard() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/courses/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/courses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: "New Course",
          description: "Course description goes here."
        })
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/admin/courses/${data.id}`;
      }
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-indigo-500" />
              Memberships & Courses
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Create video courses and host gated content for your clients.</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Create Course
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">No Courses Found</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-8">
              Host your own video training, coaching programs, or exclusive community content right here.
            </p>
            <button onClick={handleCreate} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500">
              Create your first Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link href={`/admin/courses/${course.id}`} key={course.id} className="block group">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer relative h-full flex flex-col">
                  {/* Thumbnail Placeholder */}
                  <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                    {course.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <PlayCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
                    )}
                    <div className="absolute top-3 right-3">
                      <div className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md shadow-sm ${
                        course.is_published ? "bg-emerald-500/90 text-white" : "bg-black/50 text-white"
                      }`}>
                        {course.is_published ? "Published" : "Draft"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 flex-1">
                      {course.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-auto">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <Users className="w-4 h-4 text-indigo-400" />
                        0 Enrolled
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <Video className="w-4 h-4 text-zinc-400" />
                        Created {course.created_at ? format(new Date(course.created_at), "MMM d") : "Recently"}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
