"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCrossTabSync, useSyncStore } from "@/store/useSyncStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { Search } from "lucide-react";

export default function CampaignsPage() {
  const { user, token } = useAuthStore();
  const syncVersion = useSyncStore(s => s.version);
  const { broadcastSync } = useCrossTabSync();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<{name: string, description: string, client_id?: string}>({ name: "", description: "" });
  const [clientFilter, setClientFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCampaigns();
      if (user?.role !== 'CLIENT') {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            setAllUsers(data);
            setClients(data.filter((u: any) => u.role === 'CLIENT'));
          })
          .catch(console.error);
      }
    }
  }, [token, user, syncVersion]);

  const handleCreate = async () => {
    try {
      const payload = { ...formData };
      if (!payload.client_id) delete payload.client_id;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: "", description: "" });
        fetchCampaigns();
        broadcastSync();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/campaigns/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
      broadcastSync();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading campaigns...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Campaigns</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">Group and organize your landing pages.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            type="search"
            placeholder="Search campaigns..."
            className="pl-8"
          />
        </div>
        {user?.role !== 'CLIENT' && (
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800"
          >
            <option value="ALL">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.email}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <Button onClick={() => setShowModal(true)}>Create Campaign</Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              {user?.role !== 'CLIENT' && <TableHead>Client</TableHead>}
              {user?.role === 'ADMIN' && <TableHead>Managed By</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                  No campaigns found.
                </TableCell>
              </TableRow>
            ) : (
              campaigns
                .filter(camp => clientFilter === "ALL" || camp.client_id === clientFilter)
                .filter(camp => statusFilter === "ALL" || camp.status === statusFilter)
                .map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/campaigns/${camp.id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
                      {camp.name}
                    </Link>
                    <div className="text-xs text-zinc-500 truncate max-w-xs">{camp.description}</div>
                  </TableCell>
                  {user?.role !== 'CLIENT' && (
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      {clients.find(c => c.id === camp.client_id)?.email || "Unassigned"}
                    </TableCell>
                  )}
                  {user?.role === 'ADMIN' && (
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      {(() => {
                        const client = clients.find(c => c.id === camp.client_id);
                        if (!client || !client.manager_id) return <span className="text-zinc-400 dark:text-zinc-500 italic">Unassigned</span>;
                        const manager = allUsers.find(u => u.id === client.manager_id);
                        return manager ? manager.email : <span className="text-zinc-400 dark:text-zinc-500 italic">Unknown</span>;
                      })()}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      camp.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' :
                      camp.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50' :
                      camp.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50' :
                      'bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300'
                    }`}>
                      {camp.status || 'DRAFT'}
                    </span>
                  </TableCell>
                  <TableCell>${camp.budget?.toFixed(2)}</TableCell>
                  <TableCell className={camp.revenue_generated > camp.ad_spend ? "text-green-600 font-medium" : ""}>
                    {camp.ad_spend > 0 
                      ? `${(((camp.revenue_generated - camp.ad_spend) / camp.ad_spend) * 100).toFixed(2)}%` 
                      : "-"}
                  </TableCell>
                  <TableCell>{format(new Date(camp.created_at.endsWith('Z') ? camp.created_at : `${camp.created_at}Z`), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(camp.id)} className="text-red-500">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full border shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Campaign</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Black Friday 2026" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. Main promo for Nov" />
              </div>
              {user?.role !== 'CLIENT' && (
                <div className="space-y-2">
                  <Label>Assign to Client</Label>
                  <select
                    value={formData.client_id || ""}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value || undefined })}
                    className="w-full h-10 px-3 rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800"
                  >
                    <option value="">-- No Client Assigned --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.email}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.name}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
