"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Copy, MoreVertical, LayoutTemplate, Search, LayoutGrid, List } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function TemplatesList() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<"ALL" | "LANDING" | "FUNNELS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [isCreating, setIsCreating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [isEditing, setIsEditing] = useState(false);

  // Use Template Modal State
  const [isUseTemplateOpen, setIsUseTemplateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newPageName, setNewPageName] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageIndustry, setNewPageIndustry] = useState("");

  const { token } = useAuthStore();
  const router = useRouter();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/templates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
  }, [token]);

  const handleSeedTemplates = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/templates/seed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.detail || "Unknown error"}`);
      }
    } catch {
      alert("Network error");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newName.trim()) return;
    try {
      setIsCreating(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          category: newCategory
        })
      });
      if (res.ok) {
        setNewName("");
        setNewCategory("Other");
        setIsCreateOpen(false);
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(`Failed to create template: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to create template", err);
      alert("Failed to create template due to a network error.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setNewPageName("");
    setNewPageSlug("");
    setNewPageIndustry("");
    setIsUseTemplateOpen(true);
  };

  const handleCreatePageFromTemplate = async () => {
    if (!newPageName.trim() || !newPageSlug.trim() || !selectedTemplateId) return;
    try {
      setIsCreating(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPageName,
          slug: newPageSlug,
          template_id: selectedTemplateId,
          industry: newPageIndustry || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsUseTemplateOpen(false);
        router.push(`/admin/pages/${data.id}/editor`);
      } else {
        const err = await res.json();
        alert(`Failed to create page: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to create page", err);
      alert("Failed to create page due to a network error.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (template: any) => {
    setEditTemplateId(template.id);
    setEditName(template.name);
    setEditCategory(template.category);
    setIsEditOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editTemplateId || !editName.trim()) return;
    try {
      setIsEditing(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/templates/${editTemplateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          category: editCategory
        })
      });
      if (res.ok) {
        setIsEditOpen(false);
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(`Failed to update template: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to update template", err);
      alert("Failed to update template due to a network error.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error while deleting");
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/templates/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTemplates();
      } else {
        const err = await res.json();
        alert(`Failed to duplicate template: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error while duplicating template");
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (selectedCategoryTab === "FUNNELS") {
      if (template.category !== "Funnels & Thank You" && template.category !== "FUNNELS") return false;
    } else if (selectedCategoryTab === "LANDING") {
      if (template.category === "Funnels & Thank You" || template.category === "FUNNELS") return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(q) ||
        template.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Templates
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Start a new landing page by choosing a template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSeedTemplates} disabled={isSeeding}>
            {isSeeding ? "Loading..." : "✨ Load Default Templates"}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {/* Category filter tabs */}
        <div className="flex gap-6">
          <button
            onClick={() => setSelectedCategoryTab("ALL")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              selectedCategoryTab === "ALL"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            All Templates
          </button>
          <button
            onClick={() => setSelectedCategoryTab("LANDING")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              selectedCategoryTab === "LANDING"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Landing Pages
          </button>
          <button
            onClick={() => setSelectedCategoryTab("FUNNELS")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              selectedCategoryTab === "FUNNELS"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Funnels & Thank You
          </button>
        </div>

        {/* Search & View Mode Toggles */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* View Toggles */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-950">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <LayoutTemplate className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No templates found</h3>
          <p className="text-zinc-500 mt-1 mb-4">Try adjusting your filters or load defaults</p>
        </div>
      ) : viewMode === "GRID" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
                {template.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.thumbnail_url} alt={template.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-zinc-400">
                    No Thumbnail
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white dark:bg-black/50 dark:hover:bg-black" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(template)} className="cursor-pointer">Edit Template</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)} className="cursor-pointer">Duplicate Template</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardHeader className="p-4 pb-0 flex-1">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-zinc-500">{template.category}</p>
              </CardHeader>
              <CardFooter className="p-4 pt-4 border-t mt-auto">
                <Button className="w-full" onClick={() => handleUseTemplate(template.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="w-12 h-8 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                      {template.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={template.thumbnail_url} alt={template.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 font-semibold">N/A</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{template.name}</TableCell>
                  <TableCell className="text-zinc-500">{template.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => handleUseTemplate(template.id)}>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Use
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 p-0" />}>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(template)} className="cursor-pointer">Edit Template</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)} className="cursor-pointer">Duplicate Template</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new template to use as a starting point for landing pages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Modern Real Estate" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Real Estate">Real Estate</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Hotel">Hotel</option>
                <option value="Travel">Travel</option>
                <option value="Ecommerce">Ecommerce</option>
                <option value="Construction">Construction</option>
                <option value="Consulting">Consulting</option>
                <option value="Finance">Finance</option>
                <option value="Software Company">Software Company</option>
                <option value="NGO">NGO</option>
                <option value="Automotive">Automotive</option>
                <option value="Beauty & Salon">Beauty & Salon</option>
                <option value="Gym & Fitness">Gym & Fitness</option>
                <option value="Funnels & Thank You">Funnels & Thank You</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter showCloseButton={true}>
            <Button onClick={handleCreateTemplate} disabled={!newName.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isUseTemplateOpen} onOpenChange={setIsUseTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Template</DialogTitle>
            <DialogDescription>
              Create a new landing page from this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pageName">Page Name</Label>
              <Input 
                id="pageName" 
                placeholder="e.g. Summer Campaign" 
                value={newPageName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewPageName(val);
                  // auto generate slug if user hasn't typed a custom one (or if it matches auto-generated from old name)
                  const oldSlug = newPageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  if (!newPageSlug || newPageSlug === oldSlug) {
                    setNewPageSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSlug">Page Slug (URL)</Label>
              <Input 
                id="pageSlug" 
                placeholder="e.g. summer-campaign" 
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageIndustry">Industry (Optional - for auto-personalization)</Label>
              <select 
                id="pageIndustry"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newPageIndustry}
                onChange={(e) => setNewPageIndustry(e.target.value)}
              >
                <option value="">None / Keep Original Text</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Hotel">Hotel</option>
                <option value="Ecommerce">Ecommerce</option>
                <option value="Software Company">Software Company</option>
                <option value="Consulting">Consulting</option>
                <option value="Automotive">Automotive</option>
                <option value="Gym & Fitness">Gym & Fitness</option>
              </select>
            </div>
          </div>
          <DialogFooter showCloseButton={true}>
            <Button onClick={handleCreatePageFromTemplate} disabled={!newPageName.trim() || !newPageSlug.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Template Name</Label>
              <Input 
                id="editName" 
                placeholder="e.g. Modern Real Estate" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">Category</Label>
              <select 
                id="editCategory"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                <option value="Real Estate">Real Estate</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Hotel">Hotel</option>
                <option value="Travel">Travel</option>
                <option value="Ecommerce">Ecommerce</option>
                <option value="Construction">Construction</option>
                <option value="Consulting">Consulting</option>
                <option value="Finance">Finance</option>
                <option value="Software Company">Software Company</option>
                <option value="NGO">NGO</option>
                <option value="Automotive">Automotive</option>
                <option value="Beauty & Salon">Beauty & Salon</option>
                <option value="Gym & Fitness">Gym & Fitness</option>
                <option value="Funnels & Thank You">Funnels & Thank You</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter showCloseButton={true}>
            <Button onClick={handleUpdateTemplate} disabled={!editName.trim() || isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
