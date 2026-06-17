"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  Panel
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { CustomNode } from "@/components/automation/CustomNodes";
import { ArrowLeft, Save, Loader2, Play, Pause, Plus, X, Mail, Tag, Webhook, Clock, Globe, MessageSquare, UserPlus, Trash2, HelpCircle, CheckCircle2, Sparkles, Split, Activity } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const nodeTypes = { trigger: CustomNode, action: CustomNode, condition: CustomNode };

const ACTION_CATALOG = [
  { subtype: "send_email",    label: "Send Email",       icon: "✉️",  color: "indigo",  fields: ["to","subject","body"] },
  { subtype: "add_to_crm",   label: "Add to CRM",       icon: "👤",  color: "emerald", fields: ["name","email","phone","source"] },
  { subtype: "send_webhook",  label: "Send Webhook",     icon: "🔗",  color: "violet",  fields: ["url"] },
  { subtype: "trigger_n8n",   label: "Trigger n8n",      icon: "⚙️",  color: "fuchsia", fields: ["n8n_webhook_url", "payload_data"] },
  { subtype: "trigger_zapier",label: "Trigger Zapier",   icon: "⚡",  color: "orange",  fields: ["zapier_webhook_url", "payload_data"] },
  { subtype: "trigger_make",  label: "Trigger Make",     icon: "🔮",  color: "purple",  fields: ["make_webhook_url", "payload_data"] },
  { subtype: "add_tag",      label: "Add Tag to Lead",  icon: "🏷️",  color: "amber",   fields: ["tag"] },
  { subtype: "slack_notify", label: "Slack Notify",     icon: "💬",  color: "green",   fields: ["webhook_url","message"] },
  { subtype: "delay",        label: "Delay Timer",      icon: "⏱️",  color: "orange",  fields: ["duration","unit"] },
  { subtype: "ai_reply",     label: "AI Generation",    icon: "✨",  color: "fuchsia", fields: ["system_prompt","prompt"] },
];

const CONDITION_CATALOG = [
  { subtype: "if_else",      label: "If / Else",        icon: "🔀",  color: "rose",    fields: ["variable","operator","value"] },
];

const FIELD_CONFIG: Record<string, { label: string; placeholder: string; type?: string; options?: string[]; helper?: string }> = {
  to:          { label: "To Email",        placeholder: "Who gets this email?", helper: "Leave empty or use a variable to send to the lead dynamically." },
  subject:     { label: "Subject",         placeholder: "Your subject line" },
  body:        { label: "Email Body",      placeholder: "Write your email message here..." },
  name:        { label: "Name",            placeholder: "Lead's name", helper: "Map this to the incoming payload name." },
  email:       { label: "Email",           placeholder: "Lead's email address", helper: "Map this to the incoming payload email." },
  phone:       { label: "Phone",           placeholder: "Lead's phone number", helper: "Map this to the incoming payload phone." },
  source:      { label: "Source Label",    placeholder: "e.g. Automation Workflow", helper: "Helps you track where leads came from." },
  url:         { label: "Webhook URL",     placeholder: "https://your-endpoint.com/hook", helper: "The destination URL that will receive the POST request." },
  n8n_webhook_url:    { label: "n8n Webhook URL",    placeholder: "https://your-n8n-instance.com/webhook/...", helper: "Copy the production webhook URL from your n8n workflow." },
  zapier_webhook_url: { label: "Zapier Webhook URL", placeholder: "https://hooks.zapier.com/hooks/catch/...", helper: "Copy the webhook URL from your Zapier Catch Hook." },
  make_webhook_url:   { label: "Make Webhook URL",   placeholder: "https://hook.make.com/...", helper: "Copy the custom webhook URL from Make." },
  payload_data:       { label: "JSON Payload (Optional)", placeholder: '{"name": "{{payload.name}}"}', helper: "Pass custom structured data. If left blank, we will send everything." },
  tag:         { label: "Tag Name",        placeholder: "e.g. hot-lead" },
  webhook_url: { label: "Slack Webhook URL", placeholder: "https://hooks.slack.com/...", helper: "Incoming webhook URL for your Slack workspace." },
  message:     { label: "Message",         placeholder: "New lead just arrived!" },
  duration:    { label: "Duration",        placeholder: "e.g. 5",  type: "number" },
  unit:        { label: "Unit",            placeholder: "",        options: ["seconds","minutes","hours","days"] },
  system_prompt: { label: "System Prompt", placeholder: "e.g. You are a helpful assistant.", helper: "Instructions on how the AI should behave." },
  prompt:      { label: "Prompt / User Message", placeholder: "e.g. Write a welcome email to {{payload.name}}", helper: "The actual task for the AI." },
  variable:    { label: "Variable to Check", placeholder: "e.g. {{payload.score}} or {{payload.type}}", helper: "The dynamic data you want to evaluate." },
  operator:    { label: "Operator", placeholder: "", options: ["equals", "not_equals", "contains", "greater_than", "less_than"] },
  value:       { label: "Value to Compare", placeholder: "e.g. 50 or VIP", helper: "The static value to check the variable against." },
};

export default function AutomationBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuthStore();

  const [automation, setAutomation] = useState<any>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  
  // Execution Logs state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Node config editor
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => { fetchAutomation(); }, [id, token]);

  const fetchAutomation = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/automations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAutomation(data);
        if (data.nodes?.length > 0) {
          setNodes(data.nodes.map((n: any) => ({
            id: n.id, type: n.type, position: n.position,
            data: { ...n.data, subtype: n.subtype }
          })));
        } else {
          setNodes([{ id: '1', type: 'trigger', position: { x: 250, y: 100 }, data: { subtype: 'webhook', label: 'Webhook Received' } }]);
        }
        if (data.edges) setEdges(data.edges);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((c: Connection) =>
    setEdges(eds => addEdge({ ...c, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)), []);

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), []);

  const updateNodeData = (field: string, value: string) => {
    if (!selectedNode) return;
    const updated = { ...selectedNode, data: { ...selectedNode.data, [field]: value } };
    setSelectedNode(updated);
    setNodes(nds => nds.map(n => n.id === selectedNode.id ? updated : n));
  };

  const handleDeleteNode = () => {
    if (!selectedNode || selectedNode.type === "trigger") return;
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: automation?.name,
          nodes: nodes.map(n => ({ id: n.id, type: n.type, subtype: n.data.subtype, position_x: n.position.x, position_y: n.position.y, data: n.data })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, source_handle: e.sourceHandle || "", target_handle: e.targetHandle || "" }))
        })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Save failed:", err);
        alert(`Failed to save: ${err}`);
      } else {
        alert("Flow saved successfully!");
      }
    } catch (err: any) { 
      console.error(err);
      alert(`Network error: ${err.message}`);
    } finally { setSaving(false); }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    setShowLogsModal(true);
    try {
      const res = await fetch(`${API}/automations/${id}/runs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setExecutionLogs(await res.json());
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!automation) return;
    const newStatus = automation.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch(`${API}/automations/${id}/status?status=${newStatus}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setAutomation({ ...automation, status: newStatus });
  };

  const addActionNode = (subtype: string, label: string) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `node_${Math.random().toString(36).substring(2, 15)}`;
      
    // Random jitter so new nodes don't perfectly overlap if added quickly
    const jitterX = Math.floor(Math.random() * 60) - 30;
    const jitterY = Math.floor(Math.random() * 60) - 30;
      
    setNodes(nds => [...nds, {
      id: newId, type: 'action',
      position: { x: 300 + jitterX, y: 200 + jitterY },
      data: { subtype, label }
    }]);
  };

  const addConditionNode = (subtype: string, label: string) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `node_${Math.random().toString(36).substring(2, 15)}`;
      
    const jitterX = Math.floor(Math.random() * 60) - 30;
    const jitterY = Math.floor(Math.random() * 60) - 30;
      
    setNodes(nds => [...nds, {
      id: newId, type: 'condition',
      position: { x: 300 + jitterX, y: 200 + jitterY },
      data: { subtype, label }
    }]);
  };

  const catalogItem = selectedNode 
    ? [...ACTION_CATALOG, ...CONDITION_CATALOG].find(a => a.subtype === (selectedNode.data.subtype as string)) 
    : null;

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Navbar */}
      <div className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/automations" className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <input 
              type="text"
              value={automation?.name || ""}
              onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
              placeholder="Untitled Workflow"
              className="font-bold text-zinc-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1 -ml-1 text-lg max-w-[250px] truncate placeholder:text-zinc-400"
            />
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${automation?.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
              {automation?.status === "ACTIVE" ? "Live" : "Draft"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {automation && (
            <div className="text-xs text-zinc-400 font-mono hidden lg:block bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 truncate max-w-xs">
              Webhook: {API}/automations/{id}/webhook
            </div>
          )}
          <button 
            onClick={fetchLogs}
            className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="View Execution Logs"
          >
            <Activity className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHintModal(true)}
            className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="How to build automations"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button onClick={toggleStatus}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all border ${automation?.status === "ACTIVE" ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"}`}>
            {automation?.status === "ACTIVE" ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Publish</>}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Flow
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick}
            nodeTypes={nodeTypes} fitView
            className="bg-zinc-50 dark:bg-zinc-950"
            defaultEdgeOptions={{ animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }}
          >
            <Background color="#71717a" gap={24} size={2} opacity={0.15} />
            <Controls className="bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden" />

            {/* Add Action Panel */}
            <Panel position="top-right" className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 m-4 w-56">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Action
              </h3>
              <div className="space-y-1.5">
                {ACTION_CATALOG.map(a => (
                  <button key={a.subtype}
                    onClick={() => addActionNode(a.subtype, a.label)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-2">
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
              
              <h3 className="font-bold text-zinc-900 dark:text-white mb-3 mt-6 text-sm flex items-center gap-2">
                <Split className="w-4 h-4" /> Add Logic
              </h3>
              <div className="space-y-1.5">
                {CONDITION_CATALOG.map(c => (
                  <button key={c.subtype}
                    onClick={() => addConditionNode(c.subtype, c.label)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-2">
                    <span>{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Node Config Slide-in Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-30 flex flex-col transition-transform duration-300 ${selectedNode ? "translate-x-0" : "translate-x-full"}`}>
        {selectedNode && (
          <>
            <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{selectedNode.type}</p>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{(selectedNode.data.label as string) || (selectedNode.data.subtype as string)}</h3>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedNode.type === "trigger" ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-xl p-4">
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-4">Automation Trigger</p>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1.5">Trigger Source</label>
                    <select
                      className="w-full bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-indigo-900 dark:text-indigo-100"
                      value={(selectedNode.data.trigger_type as string) || "webhook"}
                      onChange={e => updateNodeData("trigger_type", e.target.value)}
                    >
                      <option value="webhook">External Webhook</option>
                      <option value="lead_created">Native: When a Lead is Created</option>
                    </select>
                  </div>
                  
                  {((selectedNode.data.trigger_type as string) || "webhook") === "webhook" ? (
                    <>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3">This automation starts when the URL below receives a POST request.</p>
                      <div className="bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-zinc-700 rounded-lg p-3 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 break-all mb-4">
                        POST {API}/automations/{id}/webhook
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-4">
                      This automation will automatically trigger in the background whenever a lead submits a form on any of your Landing Pages.
                    </p>
                  )}
                  
                  <div className="pt-3 border-t border-indigo-200 dark:border-indigo-700/50">
                    <p className="text-xs text-indigo-500 font-semibold mb-2">Payload variables you can use in actions:</p>
                    <div className="flex flex-wrap gap-1">
                      {["{{payload.name}}", "{{payload.email}}", "{{payload.phone}}", "{{payload.source}}"].map(v => (
                        <span key={v} className="text-[10px] font-mono bg-white dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/30">{v}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : catalogItem ? (
                catalogItem.fields.map(field => {
                  const fc = FIELD_CONFIG[field];
                  if (!fc) return null;
                  
                  const isTextField = !fc.options && fc.type !== "number";
                  
                  return (
                    <div key={field} className="bg-white dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/50 space-y-2">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">{fc.label}</label>
                      {fc.helper && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2 leading-tight">{fc.helper}</p>}
                      
                      {fc.options ? (
                        <select
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          value={(selectedNode.data[field] as string) || ""}
                          onChange={e => updateNodeData(field, e.target.value)}
                        >
                          {fc.options.map(o => <option key={o} value={o}>{o.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                      ) : field === "body" || field === "message" || field === "payload_data" ? (
                        <textarea
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] font-mono"
                          placeholder={fc.placeholder}
                          value={(selectedNode.data[field] as string) || ""}
                          onChange={e => updateNodeData(field, e.target.value)}
                        />
                      ) : (
                        <input
                          type={fc.type || "text"}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          placeholder={fc.placeholder}
                          value={(selectedNode.data[field] as string) || ""}
                          onChange={e => updateNodeData(field, e.target.value)}
                        />
                      )}
                      
                      {/* Quick Variable Injectors */}
                      {isTextField && (
                        <div className="pt-2">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Insert Dynamic Data</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "Name", val: "{{payload.name}}" },
                              { label: "Email", val: "{{payload.email}}" },
                              { label: "Phone", val: "{{payload.phone}}" },
                              { label: "AI Output", val: "{{ai_reply}}" }
                            ].map(v => (
                              <button 
                                key={v.label}
                                onClick={() => {
                                  const currentVal = (selectedNode.data[field] as string) || "";
                                  const spacing = currentVal && !currentVal.endsWith(" ") ? " " : "";
                                  updateNodeData(field, currentVal + spacing + v.val);
                                }}
                                className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-2 py-1 rounded transition-colors"
                              >
                                + {v.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-500">No configuration available for this node type.</p>
              )}

              {selectedNode.type === "action" && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                  <p className="text-xs text-zinc-400 font-medium">
                    💡 Use <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{payload.name}}"}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{payload.email}}"}</code>, or <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{"{{ai_reply}}"}</code> as dynamic variables.
                  </p>
                  <button 
                    onClick={handleDeleteNode}
                    className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Action
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-indigo-500" />
                How to Build Automations
              </h2>
              <button onClick={() => setShowHintModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">The Basics</h3>
                <div className="flex gap-3">
                  <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-sm">1. Add & Connect</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Click actions on the right to add them. Connect them by dragging lines from the bottom dot of one node to the top dot of the next.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">Specific Task Examples</h3>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div>
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Sending Automated Emails
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Configure the <b>To Email</b> field as <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-[10px]">{"{{payload.email}}"}</code> to send dynamically to the lead. In the body, greet them with <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-[10px]">{"Hi {{payload.name}}"}</code>.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Saving Leads to CRM
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Use the <b>Add to CRM</b> action. Map the fields to <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-[10px]">{"{{payload.name}}"}</code> and <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-[10px]">{"{{payload.email}}"}</code>. Set the Source to "Website Form" so your sales team knows where they came from.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-orange-500 dark:text-orange-400 text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" /> n8n / Zapier Integrations
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Add a <b>Trigger n8n/Zapier</b> action. Paste your Webhook URL. In the JSON Payload field, send a mapped object like: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-[10px]">{'{"lead": "{{payload.email}}"}'}</code>.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-fuchsia-600 dark:text-fuchsia-400 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Generation
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Use <b>AI Generation</b> to draft personalized messages. Set the Prompt to: <i>"Write a welcome text message for {'{{payload.name}}'}"</i>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button 
                onClick={() => setShowHintModal(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
              >
                Got it, let's build!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-zinc-200 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-500" />
                Execution Logs
              </h2>
              <button onClick={() => setShowLogsModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-zinc-50 dark:bg-zinc-950/50">
              {logsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : executionLogs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">No execution logs found. Try triggering the automation.</div>
              ) : (
                <div className="space-y-4">
                  {executionLogs.map(run => (
                    <div key={run.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            run.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            run.status === 'RUNNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                          }`}>
                            {run.status}
                          </span>
                          <span className="text-sm font-mono text-zinc-500">{new Date(run.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">ID: {run.id.split('-')[0]}</div>
                      </div>
                      <div className="p-4">
                        <div className="mb-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Incoming Payload</h4>
                          <pre className="bg-zinc-950 text-emerald-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                            {JSON.stringify(run.payload, null, 2)}
                          </pre>
                        </div>
                        
                        {run.error_message && (
                          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm text-rose-600 dark:text-rose-400">
                            <b>Error:</b> {run.error_message}
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Step Execution Trace</h4>
                          {run.logs && run.logs.length > 0 ? (
                            <div className="space-y-2">
                              {run.logs.map((log: any, idx: number) => (
                                <div key={idx} className="flex gap-3 text-sm items-start p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                                  <div className="mt-0.5">
                                    {log.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                      {log.type.toUpperCase()}: {log.subtype}
                                      <span className="text-[10px] text-zinc-400 font-mono font-normal">({log.node_id})</span>
                                    </div>
                                    <div className="text-zinc-600 dark:text-zinc-400 text-xs mt-0.5">{log.message}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-500 italic">No node traces recorded.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
