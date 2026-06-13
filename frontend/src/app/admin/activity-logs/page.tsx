"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Activity, Clock, User as UserIcon, Tag, AlignLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const { token, user: currentUser } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLogs = async () => {
    if (!token || currentUser?.role !== "ADMIN") return;
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token, currentUser]);

  if (!mounted) return null;

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-600" />
            Activity Logs
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            System-wide audit trail of all staff and client actions.
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              <TableHead className="w-[180px]"><div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> Time</div></TableHead>
              <TableHead><div className="flex items-center gap-1.5"><UserIcon className="w-4 h-4"/> User</div></TableHead>
              <TableHead><div className="flex items-center gap-1.5"><Tag className="w-4 h-4"/> Action</div></TableHead>
              <TableHead><div className="flex items-center gap-1.5"><AlignLeft className="w-4 h-4"/> Details</div></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  Loading activity logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                    {format(new Date(log.created_at), "MMM d, yyyy")}
                    <br />
                    {format(new Date(log.created_at), "h:mm:ss a")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{log.user_name}</div>
                    <div className="text-xs text-zinc-500">{log.user_email}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                      {log.action}
                    </span>
                    {log.entity_type && (
                      <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">
                        {log.entity_type}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
