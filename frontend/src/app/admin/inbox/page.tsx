"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Send, Phone, Mail, User as UserIcon, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InboxPage() {
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [loading, setLoading] = useState(true);
  
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSuggestReply = async () => {
    if (!activeLeadId) return;
    setIsAiSuggesting(true);
    setAiSuggestion(null);
    try {
      const activeConversation = conversations.find(c => c.lead_id === activeLeadId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ai/reply-suggestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lead_name: activeConversation?.lead_name || "Lead",
          lead_message: messages.length > 0 ? messages[0].content : "", // assuming first msg is lead's form submission
          conversation_history: messages.map(m => ({ direction: m.direction, content: m.content }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.suggestion);
      } else {
        alert("Failed to generate suggestion.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (activeLeadId) {
      fetchMessages(activeLeadId);
    }
  }, [activeLeadId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/inbox/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/inbox/${leadId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeLeadId) return;

    const tempMsg = {
      id: "temp-" + Date.now(),
      direction: "OUTBOUND",
      channel,
      content: newMessage,
      status: "SENDING",
      sent_at: new Date().toISOString()
    };
    
    setMessages([...messages, tempMsg]);
    setNewMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/inbox/${activeLeadId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ channel, content: tempMsg.content })
      });
      if (res.ok) {
        const savedMsg = await res.json();
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? savedMsg : m));
        // Refresh conversations to show latest snippet
        fetchConversations();
      } else {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: "FAILED" } : m));
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: "FAILED" } : m));
    }
  };

  if (user?.role === 'CLIENT') {
    return <div className="p-8">Clients do not have access to the inbox.</div>;
  }

  const activeConversation = conversations.find(c => c.lead_id === activeLeadId);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-zinc-950">
      {/* Left Pane: Conversations List */}
      <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Unified Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search conversations..." className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-zinc-500 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm">No conversations found.</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.lead_id} 
                onClick={() => setActiveLeadId(conv.lead_id)}
                className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors ${activeLeadId === conv.lead_id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{conv.lead_name}</h3>
                  <span className="text-xs text-zinc-500">{new Date(conv.last_message_date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{conv.last_message || "No messages yet"}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
        {activeLeadId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{activeConversation?.lead_name}</h2>
                  <div className="flex gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {activeConversation?.lead_phone || "No Phone"}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {activeConversation?.lead_email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm flex-col gap-2">
                  <Mail className="w-8 h-8 text-zinc-300" />
                  <p>No messages in this conversation yet.</p>
                  <p className="text-xs text-zinc-400">Send the first message below.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[70%] ${isOutbound ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar for inbound */}
                        {!isOutbound && (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-zinc-600">{activeConversation?.lead_name?.[0]}</span>
                          </div>
                        )}
                        
                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isOutbound 
                            ? 'bg-indigo-600 text-white rounded-br-sm' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-700'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                      
                      {/* Meta data (time & status) */}
                      <div className={`flex items-center gap-1 mt-1 text-[10px] text-zinc-500 ${isOutbound ? 'pr-10' : 'pl-10'}`}>
                        <span className="uppercase text-[9px] px-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-400">{msg.channel}</span>
                        <span>{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOutbound && msg.status === "SENT" && <CheckCircle2 className="w-3 h-3 text-zinc-400" />}
                        {isOutbound && msg.status === "SENDING" && <span className="text-zinc-400">Sending...</span>}
                        {isOutbound && msg.status === "FAILED" && <span className="text-red-500">Failed</span>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              {/* AI Suggestion Panel */}
              {aiSuggestion && (
                <div className="max-w-4xl mx-auto mb-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 relative group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5"><Wand2 className="w-3 h-3" /> AI Suggestion</span>
                    <button type="button" onClick={() => setAiSuggestion(null)} className="text-indigo-400 hover:text-indigo-600">×</button>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 pr-16">{aiSuggestion}</p>
                  <Button 
                    type="button" 
                    size="sm" 
                    className="absolute bottom-3 right-3 h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      setNewMessage(aiSuggestion);
                      setAiSuggestion(null);
                    }}
                  >
                    Use This
                  </Button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500">Send via:</span>
                    <div className="flex bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-md">
                      <button type="button" onClick={() => setChannel("SMS")} className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${channel === 'SMS' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                        SMS
                      </button>
                      <button type="button" onClick={() => setChannel("EMAIL")} className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${channel === 'EMAIL' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                        Email
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleSuggestReply} 
                    disabled={isAiSuggesting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Wand2 className={`w-3 h-3 ${isAiSuggesting ? 'animate-pulse' : ''}`} />
                    {isAiSuggesting ? 'Thinking...' : 'Suggest Reply'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Type your ${channel} message here...`}
                    className="flex-1 bg-white dark:bg-zinc-950 border-zinc-300 focus-visible:ring-indigo-500"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                    <Send className="w-4 h-4 mr-2" />
                    Send {channel}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center flex-col text-zinc-500 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <Mail className="w-8 h-8 text-zinc-400" />
            </div>
            <p>Select a conversation from the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
