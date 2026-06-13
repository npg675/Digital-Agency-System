"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Search, MoreVertical, Edit2, Copy, Trash2, Eye, Split, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export default function PagesList() {
  const [pages, setPages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clientFilter, setClientFilter] = useState("ALL");
  const [campaignFilter, setCampaignFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [agencyConfig, setAgencyConfig] = useState<{client_self_serve_mode: boolean} | null>(null);
  const { token, user } = useAuthStore();
  
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    const fetchPagesAndConfig = async () => {
      try {
        const [pagesRes, configRes, usersRes, campsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/agency-config`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          user?.role !== 'CLIENT' ? fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users`, {
            headers: { Authorization: `Bearer ${token}` }
          }) : Promise.resolve({ ok: false, json: () => Promise.resolve([]) }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/campaigns`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (pagesRes.ok) setPages(await pagesRes.json());
        if (configRes.ok) setAgencyConfig(await configRes.json());
        if (usersRes.ok) setClients((await usersRes.json()).filter((u: any) => u.role === 'CLIENT'));
        if (campsRes.ok) setCampaigns(await campsRes.json());
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchPagesAndConfig();
    }
  }, [token]);

  const handleDeletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPages(pages.filter(p => p.id !== id));
      } else {
        const err = await res.json();
        alert(`Failed to delete page: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleDuplicatePage = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const newPage = await res.json();
        setPages([...pages, newPage]);
      } else {
        const err = await res.json();
        alert(`Failed to duplicate page: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleCreateVariant = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${id}/create-variant`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const newPage = await res.json();
        // The endpoint modifies the original page to set is_ab_test_primary=True, so we should refresh the pages list
        const pagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (pagesRes.ok) setPages(await pagesRes.json());
      } else {
        const err = await res.json();
        alert(`Failed to create variant: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleCreateTranslation = async (id: string) => {
    const lang = prompt("Enter the 2-letter language code for the translation (e.g. es, fr, de):");
    if (!lang || lang.length !== 2) {
      if (lang !== null) alert("Please enter a valid 2-letter code.");
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${id}/create-translation`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ language_code: lang.toLowerCase() })
      });
      if (res.ok) {
        const pagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (pagesRes.ok) setPages(await pagesRes.json());
      } else {
        const err = await res.json();
        alert(`Failed to create translation: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const openSettings = (page: any) => {
    setEditingPage(page);
    setCustomDomain(page.custom_domain || "");
    setWebhookUrl(page.webhook_url || "");
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages/${editingPage.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          custom_domain: customDomain || null,
          webhook_url: webhookUrl || null,
        })
      });
      if (res.ok) {
        const updatedPage = await res.json();
        setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p));
        setIsSettingsOpen(false);
      } else {
        const err = await res.json();
        alert(`Failed to save settings: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const canEditSettings = user?.role === 'ADMIN' || user?.role === 'STAFF' || (user?.role === 'CLIENT' && agencyConfig?.client_self_serve_mode);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Landing Pages
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your client landing pages
          </p>
        </div>
        {user?.role !== 'CLIENT' && (
          <Button render={<Link href="/admin/templates" />} nativeButton={false}>
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        )}
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Page Settings: {editingPage?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="customDomain">Custom Domain</Label>
              <Input 
                id="customDomain" 
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="e.g. promo.yourdomain.com"
              />
              <p className="text-xs text-zinc-500">
                Point your domain's CNAME record to this server before saving.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL (Lead Capture)</Label>
              <Input 
                id="webhookUrl" 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://zapier.com/hooks/catch/..."
              />
              <p className="text-xs text-zinc-500">
                Data will be sent via POST whenever a lead submits a form.
              </p>
            </div>
            <Button type="submit" className="w-full">Save Settings</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            type="search"
            placeholder="Search pages..."
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
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800"
        >
          <option value="ALL">All Campaigns</option>
          {campaigns.filter(c => clientFilter === "ALL" || c.client_id === clientFilter).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {user?.role !== 'CLIENT' && <TableHead>Client</TableHead>}
              <TableHead>Campaign</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading pages...
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  No landing pages found. Create one from a template!
                </TableCell>
              </TableRow>
            ) : (
              pages
                .filter(p => !p.ab_test_variant_of_id && !p.translation_of_id)
                .filter(p => clientFilter === "ALL" || p.client_id === clientFilter)
                .filter(p => campaignFilter === "ALL" || p.campaign_id === campaignFilter)
                .map((page) => (
                <React.Fragment key={page.id}>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {page.name}
                        {page.language_code && page.language_code !== 'en' && (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 uppercase">
                            {page.language_code}
                          </span>
                        )}
                        {page.is_ab_test_primary && (
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            A/B Test
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {user?.role !== 'CLIENT' && (
                      <TableCell className="text-zinc-600">
                        {clients.find(c => c.id === page.client_id)?.email || "Unassigned"}
                      </TableCell>
                    )}
                    <TableCell className="text-zinc-600">
                      {campaigns.find(c => c.id === page.campaign_id)?.name || "-"}
                    </TableCell>
                    <TableCell>{page.slug}</TableCell>
                    <TableCell>{page.industry || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        page.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {page.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 p-0" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user?.role !== 'CLIENT' && (
                            <DropdownMenuItem render={<Link href={`/admin/pages/${page.id}/editor`} className="cursor-pointer flex items-center" />}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit Page
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem render={<a href={page.status === 'PUBLISHED' ? `/landing/${page.slug}` : `/preview/${page.slug}`} target="_blank" rel="noreferrer" className="cursor-pointer flex items-center" />}>
                            <Eye className="w-4 h-4 mr-2" /> {page.status !== 'PUBLISHED' ? 'Preview' : 'View Live'}
                          </DropdownMenuItem>
                          {canEditSettings && (
                            <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => openSettings(page)}>
                              <Settings className="w-4 h-4 mr-2" /> Page Settings
                            </DropdownMenuItem>
                          )}
                          {user?.role !== 'CLIENT' && (
                            <>
                              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => handleDuplicatePage(page.id)}>
                                <Copy className="w-4 h-4 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => handleCreateVariant(page.id)}>
                                <Split className="w-4 h-4 mr-2" /> Create A/B Variant
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => handleCreateTranslation(page.id)}>
                                <Languages className="w-4 h-4 mr-2" /> Create Translation
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer flex items-center" onClick={() => handleDeletePage(page.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {/* Render A/B variants if any */}
                  {pages.filter(v => v.ab_test_variant_of_id === page.id).map(variant => (
                    <TableRow key={variant.id} className="bg-zinc-50/50">
                      <TableCell className="font-medium pl-10 text-sm text-zinc-600 border-l-2 border-indigo-200">
                        <div className="flex items-center gap-2">
                          <Split className="w-3 h-3 text-indigo-400" />
                          {variant.name}
                        </div>
                      </TableCell>
                      {user?.role !== 'CLIENT' && <TableCell></TableCell>}
                      <TableCell></TableCell>
                      <TableCell className="text-sm text-zinc-500">{variant.slug}</TableCell>
                      <TableCell className="text-sm text-zinc-500">{variant.industry || "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          variant.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {variant.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 p-0" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user?.role !== 'CLIENT' && (
                              <DropdownMenuItem render={<Link href={`/admin/pages/${variant.id}/editor`} className="cursor-pointer flex items-center" />}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Variant
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem render={<a href={variant.status === 'PUBLISHED' ? `/landing/${variant.slug}` : `/preview/${variant.slug}`} target="_blank" rel="noreferrer" className="cursor-pointer flex items-center" />}>
                              <Eye className="w-4 h-4 mr-2" /> {variant.status !== 'PUBLISHED' ? 'Preview' : 'View Live'}
                            </DropdownMenuItem>
                            {user?.role !== 'CLIENT' && (
                              <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer flex items-center" onClick={() => handleDeletePage(variant.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Render translations if any */}
                  {pages.filter(t => t.translation_of_id === page.id).map(translation => (
                    <TableRow key={translation.id} className="bg-zinc-50/50">
                      <TableCell className="font-medium pl-10 text-sm text-zinc-600 border-l-2 border-orange-200">
                        <div className="flex items-center gap-2">
                          <Languages className="w-3 h-3 text-orange-400" />
                          {translation.name}
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 uppercase">
                            {translation.language_code}
                          </span>
                        </div>
                      </TableCell>
                      {user?.role !== 'CLIENT' && <TableCell></TableCell>}
                      <TableCell></TableCell>
                      <TableCell className="text-sm text-zinc-500">{translation.slug}</TableCell>
                      <TableCell className="text-sm text-zinc-500">{translation.industry || "-"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          translation.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {translation.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 p-0" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user?.role !== 'CLIENT' && (
                              <DropdownMenuItem render={<Link href={`/admin/pages/${translation.id}/editor`} className="cursor-pointer flex items-center" />}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Translation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem render={<a href={translation.status === 'PUBLISHED' ? `/landing/${translation.slug}` : `/preview/${translation.slug}`} target="_blank" rel="noreferrer" className="cursor-pointer flex items-center" />}>
                              <Eye className="w-4 h-4 mr-2" /> {translation.status !== 'PUBLISHED' ? 'Preview' : 'View Live'}
                            </DropdownMenuItem>
                            {user?.role !== 'CLIENT' && (
                              <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer flex items-center" onClick={() => handleDeletePage(translation.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
