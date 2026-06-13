"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Trash2, Loader2, ListTree, CheckCircle2, ChevronDown, ChevronRight, X, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function WorkflowsPage() {
  const { token, user } = useAuthStore();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [isCreateWorkflowOpen, setIsCreateWorkflowOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDesc, setNewWorkflowDesc] = useState("");

  const [isEditWorkflowOpen, setIsEditWorkflowOpen] = useState(false);
  const [editWorkflowId, setEditWorkflowId] = useState("");
  const [editWorkflowName, setEditWorkflowName] = useState("");
  const [editWorkflowDesc, setEditWorkflowDesc] = useState("");

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Other");
  const [newTaskDueDays, setNewTaskDueDays] = useState<number>(3);
  
  const [serviceRoles, setServiceRoles] = useState<any[]>([]);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [wfRes, rolesRes] = await Promise.all([
        fetch(`${API}/workflows`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/service-roles`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (rolesRes.ok) setServiceRoles(await rolesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return;
    try {
      const res = await fetch(`${API}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newWorkflowName, description: newWorkflowDesc })
      });
      if (res.ok) {
        setIsCreateWorkflowOpen(false);
        setNewWorkflowName("");
        setNewWorkflowDesc("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditWorkflow = async () => {
    if (!editWorkflowName.trim() || !editWorkflowId) return;
    try {
      const res = await fetch(`${API}/workflows/${editWorkflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editWorkflowName, description: editWorkflowDesc })
      });
      if (res.ok) {
        setIsEditWorkflowOpen(false);
        setEditWorkflowId("");
        setEditWorkflowName("");
        setEditWorkflowDesc("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateWorkflow = async (id: string) => {
    try {
      const res = await fetch(`${API}/workflows/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Delete this entire workflow?")) return;
    try {
      const res = await fetch(`${API}/workflows/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async () => {
    if (!activeWorkflowId || !newTaskTitle.trim()) return;
    try {
      const res = await fetch(`${API}/workflows/${activeWorkflowId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          service_category: newTaskCategory,
          due_in_days: newTaskDueDays
        })
      });
      if (res.ok) {
        setIsCreateTaskOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskCategory("Other");
        setNewTaskDueDays(3);
        loadData();
        setExpandedId(activeWorkflowId); // Keep expanded
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task from the workflow?")) return;
    try {
      const res = await fetch(`${API}/workflows/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (user?.role !== "ADMIN") {
    return <div className="p-8 text-center text-zinc-500">Not authorized.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <ListTree className="w-6 h-6 text-indigo-500" />
            Task & SLA Workflows
          </h1>
          <p className="text-zinc-500 mt-1">Create reusable task checklists with automatic SLA target dates.</p>
        </div>
        <Button onClick={() => setIsCreateWorkflowOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      <div className="space-y-4">
        {workflows.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            <p className="text-zinc-500">No workflows created yet.</p>
          </div>
        ) : (
          workflows.map(wf => (
            <div key={wf.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === wf.id ? null : wf.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-zinc-400">
                    {expandedId === wf.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{wf.name}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">{wf.tasks.length} tasks configured</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditWorkflowId(wf.id);
                      setEditWorkflowName(wf.name);
                      setEditWorkflowDesc(wf.description || "");
                      setIsEditWorkflowOpen(true);
                    }}
                    title="Edit Workflow"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateWorkflow(wf.id); }}
                    title="Duplicate Workflow"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }}
                    title="Delete Workflow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {expandedId === wf.id && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 p-5">
                  <div className="space-y-3 mb-4">
                    {wf.tasks.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic">No tasks added to this workflow yet.</p>
                    ) : (
                      wf.tasks.map((task: any) => (
                        <div key={task.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                Due in {task.due_in_days} Days
                              </span>
                              {task.service_category && (
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] px-2 py-0.5 rounded font-medium">
                                  {task.service_category}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{task.title}</h4>
                          </div>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-dashed"
                    onClick={() => { setActiveWorkflowId(wf.id); setIsCreateTaskOpen(true); }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task to Workflow
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Workflow Modal */}
      <Dialog open={isCreateWorkflowOpen} onOpenChange={setIsCreateWorkflowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workflow Template</DialogTitle>
            <DialogDescription>Define a new reusable checklist for onboarding.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input placeholder="e.g. Website Build Onboarding" value={newWorkflowName} onChange={e => setNewWorkflowName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Modal */}
      <Dialog open={isEditWorkflowOpen} onOpenChange={setIsEditWorkflowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workflow Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input placeholder="e.g. Website Build Onboarding" value={editWorkflowName} onChange={e => setEditWorkflowName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditWorkflow}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input placeholder="e.g. Design Wireframes" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SLA Target (Days to complete from start)</Label>
              <Input type="number" min={0} value={newTaskDueDays} onChange={e => setNewTaskDueDays(parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Service Category</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTaskCategory}
                onChange={e => setNewTaskCategory(e.target.value)}
              >
                <option value="Other">Other</option>
                {serviceRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
