"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { Bell, Check, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function NotificationsPage() {
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, [token]);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickNotification = async (notification: any) => {
    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }
    if (notification.reference_id) {
      // It's a client ID, take them to the client profile
      router.push(`/admin/users/${notification.reference_id}`);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-500" />
            Notifications
          </h1>
          <p className="mt-2 text-zinc-600">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" className="gap-2">
            <Check className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No notifications yet.</div>
        ) : (
          <div className="divide-y">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleClickNotification(notif)}
                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${!notif.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-indigo-500'}`} />
                <div className="flex-grow min-w-0">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {format(new Date(notif.created_at.endsWith('Z') ? notif.created_at : `${notif.created_at}Z`), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                <div className="text-zinc-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
