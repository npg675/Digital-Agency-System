"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Zap, Mail, UserPlus, Clock, Play, Webhook, Tag, MessageSquare, Sparkles, Workflow, Waypoints, Split } from "lucide-react";

const iconMap: Record<string, any> = {
  webhook: Zap,
  send_email: Mail,
  add_to_crm: UserPlus,
  send_webhook: Webhook,
  add_tag: Tag,
  slack_notify: MessageSquare,
  delay: Clock,
  ai_reply: Sparkles,
  trigger_n8n: Workflow,
  trigger_zapier: Zap,
  trigger_make: Waypoints,
  if_else: Split,
  trigger: Play,
};

const labelMap: Record<string, string> = {
  webhook: "Webhook Received",
  send_email: "Send Email",
  add_to_crm: "Add to CRM",
  send_webhook: "Send Webhook",
  add_tag: "Add Tag",
  slack_notify: "Slack Notify",
  delay: "Delay",
  ai_reply: "AI Generation",
  trigger_n8n: "Trigger n8n Workflow",
  trigger_zapier: "Trigger Zapier Zap",
  trigger_make: "Trigger Make Scenario",
  if_else: "If / Else Condition",
  trigger: "Trigger Event",
};

const colorMap: Record<string, string> = {
  trigger: "bg-amber-500",
  action: "bg-indigo-500",
  condition: "bg-rose-500",
};

export const CustomNode = memo(({ data, type }: any) => {
  const isTrigger = type === "trigger";
  const triggerType = data.trigger_type || "webhook";
  
  let Icon = iconMap[data.subtype] || iconMap[type] || Play;
  let label = data.label || labelMap[data.subtype] || "Node";
  
  if (isTrigger) {
    if (triggerType === "lead_created") {
      Icon = UserPlus;
      label = "When Lead Created";
    } else {
      Icon = Webhook;
      label = "When Webhook Received";
    }
  }

  const badgeColor = colorMap[type] || "bg-zinc-500";

  return (
    <div className="relative group min-w-[240px] bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer">
      
      {/* Target Handle (Input) */}
      {type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-4 h-4 rounded-sm bg-zinc-300 dark:bg-zinc-600 border-2 border-white dark:border-zinc-900"
        />
      )}

      {/* Node Content */}
      <div className="p-4 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${badgeColor} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
            {type}
          </div>
          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {label}
          </div>
          {data.description && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Source Handles (Output) */}
      {type === "condition" ? (
        <>
          <div className="absolute -bottom-6 left-[30%] text-[10px] font-bold text-emerald-600 -translate-x-1/2">TRUE</div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: "30%" }}
            className="w-4 h-4 rounded-sm bg-emerald-500 border-2 border-white dark:border-zinc-900"
          />
          <div className="absolute -bottom-6 left-[70%] text-[10px] font-bold text-rose-600 -translate-x-1/2">FALSE</div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: "70%" }}
            className="w-4 h-4 rounded-sm bg-rose-500 border-2 border-white dark:border-zinc-900"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 rounded-sm bg-indigo-500 border-2 border-white dark:border-zinc-900"
        />
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";
