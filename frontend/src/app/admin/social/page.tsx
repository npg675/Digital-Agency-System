"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, Image as ImageIcon, Trash2, Edit2, Copy, Clock, CheckCircle2, Calendar as CalendarIcon, Wand2, Bold, Italic, Smile, Megaphone, ClipboardPaste, ZoomIn, ZoomOut, X, ExternalLink, Search } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaTiktok, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { MarketingHubPanel } from "@/components/MarketingHubPanel";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SocialMediaPage() {
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isDirectAccessOpen, setIsDirectAccessOpen] = useState(false);
  const [isMarketingHubOpen, setIsMarketingHubOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [vaultMedia, setVaultMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIPicker, setShowAIPicker] = useState(false);
  const [captionFontSize, setCaptionFontSize] = useState(14);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const draggableRef = React.useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    client_ids: user?.role === 'CLIENT' ? [user.id] : ([] as string[]),
    content: "",
    media_urls: [] as string[],
    platforms: [] as string[],
    scheduled_date: "",
    scheduled_time: ""
  });
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [postsRes, usersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/social-posts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        user?.role !== 'CLIENT' ? fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }) : Promise.resolve({ ok: false, json: () => Promise.resolve([]) })
      ]);
      
      if (postsRes.ok) setPosts(await postsRes.json());
      if (usersRes.ok) setClients((await usersRes.json()).filter((u: any) => u.role === 'CLIENT'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    if (formData.platforms.includes(platform)) {
      setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== platform) });
    } else {
      setFormData({ ...formData, platforms: [...formData.platforms, platform] });
    }
  };

  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.client_ids.length === 0) return alert("Select at least one client.");
    if (!formData.content) return alert("Content is required.");
    if (formData.platforms.length === 0) return alert("Select at least one platform.");
    if (!formData.scheduled_date || !formData.scheduled_time) return alert("Date and time are required.");

    const scheduled_for = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00Z`).toISOString();

    try {
      if (formData.id) {
        // Edit mode (single post update)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/social-posts/${formData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            client_id: formData.client_ids[0],
            content: formData.content,
            media_url: formData.media_urls.length > 0 ? formData.media_urls.join(",") : null,
            platforms: formData.platforms.join(","),
            scheduled_for: scheduled_for
          })
        });

        if (res.ok) {
          alert("Post updated successfully!");
          setFormData({ id: undefined, content: "", media_urls: [], platforms: [], client_ids: user?.role === 'CLIENT' ? [user.id] : [], scheduled_date: "", scheduled_time: "" });
          setIsModalOpen(false);
          fetchData();
        } else {
          alert("Failed to update post.");
        }
      } else {
        // Create mode (multiple clients possible)
        const requests = formData.client_ids.map(clientId => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/social-posts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              client_id: clientId,
              content: formData.content,
              media_url: formData.media_urls.length > 0 ? formData.media_urls.join(",") : null,
              platforms: formData.platforms.join(","),
              scheduled_for: scheduled_for
            })
          })
        );

        const responses = await Promise.all(requests);
        const allOk = responses.every(res => res.ok);
        
        if (allOk) {
          alert("Posts scheduled successfully!");
          setFormData({ id: undefined, content: "", media_urls: [], platforms: [], client_ids: user?.role === 'CLIENT' ? [user.id] : [], scheduled_date: "", scheduled_time: "" });
          setIsModalOpen(false);
          fetchData();
        } else {
          alert("Some posts failed to schedule.");
          fetchData();
        }
      }
    } catch (e) {
      alert("Network error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    
    try {
      const files = Array.from(e.target.files);
      const newUrls: string[] = [];

      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        if (formData.client_ids.length > 0) {
          uploadFormData.append("client_id", formData.client_ids[0]);
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/media/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData
        });
        
        if (res.ok) {
          const data = await res.json();
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
          newUrls.push(`${baseUrl}/${data.filepath}`);
        } else {
          const err = await res.json();
          alert(`Upload failed for ${file.name}: ${err.detail || 'Unknown error'}`);
        }
      }

      if (newUrls.length > 0) {
        setFormData(prev => ({ ...prev, media_urls: [...prev.media_urls, ...newUrls] }));
      }
    } catch (e) {
      alert("Network error during upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openMediaVault = async () => {
    setIsVaultOpen(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/media`;
      if (user?.role === 'CLIENT') {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/media/client/${user.id}`;
      } else if (formData.client_ids.length === 1) {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/media/client/${formData.client_ids[0]}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setVaultMedia(await res.json());
    } catch (e) {
      console.error("Failed to load media vault");
    }
  };

  const [aiCaptions, setAiCaptions] = useState<string[]>([]);
  const [aiGoal, setAiGoal] = useState("Promote a new service/product");
  const [clientIndustry, setClientIndustry] = useState("");

  const handleGenerateCaptions = async () => {
    if (!clientIndustry) return alert("Please enter the client's industry/niche.");
    
    setIsAILoading(true);
    setAiCaptions([]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ai/social-caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          client_industry: clientIndustry, 
          goal: aiGoal,
          platforms: formData.platforms
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiCaptions(data.captions);
      } else {
        const err = await res.json();
        alert(`AI failed: ${err.detail || 'Unknown error'}`);
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleEdit = (post: any) => {
    const scheduledDate = new Date(post.scheduled_for);
    const dateStr = scheduledDate.toISOString().split('T')[0];
    const timeStr = scheduledDate.toISOString().split('T')[1].substring(0, 5);

    setFormData({
      id: post.id,
      client_ids: [post.client_id],
      content: post.content,
      media_urls: post.media_url ? post.media_url.split(',') : [],
      platforms: post.platforms.split(','),
      scheduled_date: dateStr,
      scheduled_time: timeStr
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (post: any) => {
    const scheduledDate = new Date(post.scheduled_for);
    const dateStr = scheduledDate.toISOString().split('T')[0];
    const timeStr = scheduledDate.toISOString().split('T')[1].substring(0, 5);

    setFormData({
      id: undefined, // undefined makes it a new post
      client_ids: [post.client_id],
      content: post.content,
      media_urls: post.media_url ? post.media_url.split(',') : [],
      platforms: post.platforms.split(','),
      scheduled_date: dateStr,
      scheduled_time: timeStr
    });
    setIsModalOpen(true);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = formData.content.substring(0, start) + text + formData.content.substring(end);
          setFormData({ ...formData, content: newContent });
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
          }, 10);
        } else {
          setFormData({ ...formData, content: formData.content + text });
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      alert("Please allow clipboard access or use Ctrl+V to paste.");
    }
  };

  const applyFormat = (formatType: 'bold' | 'italic' | 'large' | 'small') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selectedText = formData.content.substring(start, end);

    const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bold   = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
    const italic = '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻0123456789';
    const large  = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９';
    const small  = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ0123456789';

    const normalArr = Array.from(normal);
    const boldArr = Array.from(bold);
    const italicArr = Array.from(italic);
    const largeArr = Array.from(large);
    const smallArr = Array.from(small);

    const targetArr = formatType === 'bold' ? boldArr : formatType === 'italic' ? italicArr : formatType === 'large' ? largeArr : smallArr;

    const selectedArr = Array.from(selectedText);
    
    // Check if we should unformat (if more than 30% is already in target format)
    let formatCount = 0;
    for (const char of selectedArr) {
      if (targetArr.includes(char) && !normalArr.includes(char)) formatCount++;
    }
    const shouldUnformat = formatCount > selectedArr.length * 0.3;

    let newText = "";
    for (const char of selectedArr) {
      let charIndex = normalArr.indexOf(char);
      if (charIndex === -1) charIndex = boldArr.indexOf(char);
      if (charIndex === -1) charIndex = italicArr.indexOf(char);
      if (charIndex === -1) charIndex = largeArr.indexOf(char);
      if (charIndex === -1) charIndex = smallArr.indexOf(char);

      if (charIndex !== -1) {
        newText += shouldUnformat ? normalArr[charIndex] : targetArr[charIndex];
      } else {
        newText += char;
      }
    }

    const newContent = formData.content.substring(0, start) + newText + formData.content.substring(end);
    setFormData({ ...formData, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + newText.length);
    }, 10);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = formData.content.substring(0, start) + emoji + formData.content.substring(end);
    setFormData({ ...formData, content: newContent });
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };

  const commonEmojis = ["🔥", "🚀", "✨", "💡", "📈", "👇", "👉", "✅", "🎉", "🤝", "💯", "❤️", "😊", "👍", "🙌", "📣"];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scheduled post?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/social-posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublish = async (post: any) => {
    if (!confirm("Publish this post immediately to selected platforms?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/social-posts/${post.id}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Post successfully published!");
        fetchData();
      } else {
        alert("Failed to publish post.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
              <CalendarIcon className="w-6 h-6" />
            </span>
            Social Media Scheduler
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Compose and schedule content across all major platforms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsDirectAccessOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
            <ExternalLink className="w-4 h-4 mr-2" />
            Client Direct Access
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Compose Post
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Upcoming Pipeline</h2>
        
        {loading ? (
          <div className="text-center text-zinc-500 py-12">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
            <CalendarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">No upcoming posts scheduled.</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>Schedule your first post</Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex gap-6 hover:shadow-md transition-all">
                {/* Status Column */}
                <div className="flex flex-col items-center justify-start gap-2 border-r border-zinc-100 dark:border-zinc-800 pr-6 w-32 shrink-0">
                  <div className="text-center">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      {new Date(post.scheduled_for).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                    post.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {post.status === 'PUBLISHED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {post.status}
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    {post.platforms.split(",").map((p: string) => (
                      <span key={p} className="text-zinc-400">
                        {p === "FACEBOOK" && <FaFacebook className="w-4 h-4 text-[#1877F2]" />}
                        {p === "INSTAGRAM" && <FaInstagram className="w-4 h-4 text-[#E4405F]" />}
                        {p === "LINKEDIN" && <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />}
                        {p === "TWITTER" && <FaTwitter className="w-4 h-4 text-[#1DA1F2]" />}
                        {p === "TIKTOK" && <FaTiktok className="w-4 h-4 text-black dark:text-white" />}
                        {p === "WHATSAPP" && <FaWhatsapp className="w-4 h-4 text-[#25D366]" />}
                        {p === "EMAIL" && <FaEnvelope className="w-4 h-4 text-zinc-500" />}
                      </span>
                    ))}
                    {user?.role !== 'CLIENT' && (
                      <span className="text-xs text-zinc-500 ml-auto bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {clients.find(c => c.id === post.client_id)?.company_name || 'Client'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap flex-1">{post.content}</p>
                    {post.media_url && (
                      <div className="flex gap-2 overflow-x-auto mt-3 pb-2 scrollbar-thin">
                        {post.media_url.split(",").map((url: string, i: number) => (
                          <img 
                            key={i} 
                            src={url.trim()} 
                            alt="Attached media" 
                            className="w-24 h-24 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 cursor-pointer hover:opacity-90"
                            onClick={() => setPreviewImage(url.trim())} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-start gap-1">
                  {post.status !== 'PUBLISHED' && (
                    <Button variant="ghost" size="icon" onClick={() => handlePublish(post)} className="text-zinc-400 hover:text-green-600 hover:bg-green-50" title="Publish Now">
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(post)} className="text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit Post">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(post)} className="text-zinc-400 hover:text-green-600 hover:bg-green-50" title="Duplicate Post">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="text-zinc-400 hover:text-red-600 hover:bg-red-50" title="Delete Post">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setIsMarketingHubOpen(false); }}>
        <DialogContent className={`transition-all duration-300 ease-in-out sm:max-w-[600px] h-[85vh] flex flex-col ${isMarketingHubOpen ? 'lg:ml-[310px]' : ''}`}>
          
          {/* Draggable Marketing Hub Floating Panel */}
          {isMarketingHubOpen && (
            <Draggable 
              handle=".drag-handle" 
              defaultPosition={typeof window !== 'undefined' && window.innerWidth >= 1024 ? { x: -620, y: 0 } : { x: 20, y: 20 }} 
              nodeRef={draggableRef}
            >
              <div ref={draggableRef} className="absolute top-0 w-[90vw] sm:w-[600px] h-[85vh] bg-white dark:bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-xl border border-zinc-300 dark:border-zinc-700 z-[100] flex flex-col overflow-hidden">
                <div className="drag-handle bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center cursor-move select-none">
                  <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Megaphone className="w-4 h-4" /> Marketing Hub
                  </h3>
                  <button type="button" onClick={() => setIsMarketingHubOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
                  <MarketingHubPanel isPanelMode={true} />
                </div>
              </div>
            </Draggable>
          )}

          <div className="flex flex-col flex-1 min-h-0">
            
            {/* Form Section */}
            <div className="flex flex-col min-w-0 flex-1">
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-xl">{formData.id ? 'Edit Post' : 'Compose Post'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSchedulePost} className="space-y-6 pt-4 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                
                {user?.role !== 'CLIENT' && (() => {
                  const filteredClients = clients.filter(c => {
                    const q = clientSearchQuery.toLowerCase();
                    const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
                    const company = (c.company_name || '').toLowerCase();
                    const email = (c.email || '').toLowerCase();
                    const phone = (c.phone_number || '').toLowerCase();
                    return name.includes(q) || company.includes(q) || email.includes(q) || phone.includes(q);
                  });
                  return (
              <div className="space-y-2">
                <Label>Select Clients</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Search client by name, company, email, or phone..." 
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm bg-white dark:bg-zinc-950"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 space-y-1 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500">Select Multiple</span>
                    <button type="button" onClick={() => {
                      if (formData.client_ids.length === filteredClients.length) {
                        setFormData({ ...formData, client_ids: [] });
                      } else {
                        setFormData({ ...formData, client_ids: filteredClients.map(c => c.id) });
                      }
                    }} className="text-xs text-indigo-600 font-bold hover:underline">
                      {formData.client_ids.length === filteredClients.length && filteredClients.length > 0 ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  {filteredClients.length === 0 ? (
                    <div className="text-sm text-zinc-500 p-2 text-center">No clients found matching your search.</div>
                  ) : filteredClients.map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={formData.client_ids.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, client_ids: [...formData.client_ids, c.id] });
                          } else {
                            setFormData({ ...formData, client_ids: formData.client_ids.filter(id => id !== c.id) });
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {c.company_name || (c.first_name ? c.first_name + ' ' + c.last_name : c.email)}

                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )})() /* Close IIFE for filtered clients */}

            <div className="space-y-3">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'FACEBOOK', icon: FaFacebook, color: 'text-[#1877F2]' },
                  { id: 'INSTAGRAM', icon: FaInstagram, color: 'text-[#E4405F]' },
                  { id: 'LINKEDIN', icon: FaLinkedin, color: 'text-[#0A66C2]' },
                  { id: 'TWITTER', icon: FaTwitter, color: 'text-[#1DA1F2]' },
                  { id: 'TIKTOK', icon: FaTiktok, color: 'text-black dark:text-white' },
                  { id: 'WHATSAPP', icon: FaWhatsapp, color: 'text-[#25D366]' },
                  { id: 'EMAIL', icon: FaEnvelope, color: 'text-zinc-500' }
                ].map(platform => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                      formData.platforms.includes(platform.id) 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-transparent'
                    }`}
                  >
                    <platform.icon className={`w-5 h-5 ${formData.platforms.includes(platform.id) ? platform.color : 'text-zinc-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Caption</Label>
                
                {/* Toolbar */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 relative flex-wrap gap-y-1">
                  <button type="button" onClick={handlePaste} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors" title="Paste from Clipboard">
                    <ClipboardPaste className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>
                  <button type="button" onClick={() => applyFormat('bold')} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors" title="Bold Selected Text">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => applyFormat('italic')} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors" title="Italicize Selected Text">
                    <Italic className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>
                  
                  <button type="button" onClick={() => {setShowEmojiPicker(!showEmojiPicker); setShowAIPicker(false);}} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors" title="Insert Emoji">
                    <Smile className="w-4 h-4" />
                  </button>
                  
                  <button type="button" onClick={() => {setShowAIPicker(!showAIPicker); setShowEmojiPicker(false);}} className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400 transition-colors" title="AI Magic Assist">
                    <Wand2 className={`w-4 h-4 ${isAILoading ? 'animate-pulse' : ''}`} />
                  </button>

                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>

                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => applyFormat('small')} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors" title="Decrease Selected Text Size (Small Caps)">
                      <span className="font-serif font-bold text-[10px]">A-</span>
                    </button>
                    <button type="button" onClick={() => applyFormat('large')} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors" title="Increase Selected Text Size (Fullwidth)">
                      <span className="font-serif font-bold text-[14px]">A+</span>
                    </button>
                  </div>

                  <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>

                  <button type="button" onClick={() => setIsMarketingHubOpen(!isMarketingHubOpen)} className={`p-1.5 rounded transition-colors flex items-center gap-1.5 ${isMarketingHubOpen ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'hover:bg-pink-50 hover:text-pink-600 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'}`} title="Marketing Hub Assets">
                    <Megaphone className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wide hidden sm:inline">Marketing Hub</span>
                  </button>

                  {/* Emoji Popover */}
                  {showEmojiPicker && (
                    <div className="absolute top-full right-0 mt-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl grid grid-cols-4 gap-1 z-10 w-48">
                      {commonEmojis.map(emoji => (
                        <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-lg flex items-center justify-center">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Panel */}
              {showAIPicker && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 space-y-3 mb-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Wand2 className="w-3 h-3" /> Generate with AI
                    </h4>
                    <button type="button" onClick={() => setShowAIPicker(false)} className="text-indigo-400 hover:text-indigo-600">
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-indigo-700">Client Industry / Niche</Label>
                      <Input 
                        value={clientIndustry} 
                        onChange={e => setClientIndustry(e.target.value)} 
                        placeholder="e.g. Local Plumber, Gym, Real Estate" 
                        className="h-8 text-xs bg-white dark:bg-zinc-950 mt-1" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-indigo-700">Post Goal</Label>
                      <select 
                        value={aiGoal}
                        onChange={e => setAiGoal(e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-white dark:bg-zinc-950 px-3 py-1 text-xs shadow-sm mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                      >
                        <option value="Promote a new service/product">Promote Service</option>
                        <option value="Educate the audience with a tip">Share a Tip (Educate)</option>
                        <option value="Engage audience (ask a question)">Engage (Ask Question)</option>
                        <option value="Share an announcement or update">Announcement</option>
                      </select>
                    </div>
                  </div>
                  <Button type="button" onClick={handleGenerateCaptions} disabled={isAILoading || !clientIndustry} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
                    {isAILoading ? 'Generating...' : 'Generate 3 Variations'}
                  </Button>

                  {/* AI Results */}
                  {aiCaptions.length > 0 && (
                    <div className="pt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                      {aiCaptions.map((cap, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-800 rounded p-3 text-sm relative group">
                          <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap text-xs">{cap}</p>
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={() => {
                              setFormData({ ...formData, content: cap });
                              setShowAIPicker(false);
                            }} 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 text-[10px] px-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300"
                          >
                            Use this
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <textarea
                ref={textareaRef}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={`flex min-h-[160px] max-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800`}
                placeholder="What do you want to share? (Highlight text and click Bold/Italic/A+/A- to format!)"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Media Attachments (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder="https://..."
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (mediaUrlInput.trim()) {
                      setFormData({ ...formData, media_urls: [...formData.media_urls, mediaUrlInput.trim()] });
                      setMediaUrlInput("");
                    }
                  }}
                  disabled={!mediaUrlInput.trim()}
                >
                  Add URL
                </Button>
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                
                <Button type="button" variant="outline" className="shrink-0 gap-2 text-zinc-600 dark:text-zinc-300" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <ImageIcon className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                
                <Button type="button" variant="outline" className="shrink-0 gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900" onClick={openMediaVault}>
                  Media Vault
                </Button>
              </div>

              {formData.media_urls.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {formData.media_urls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={url} 
                        alt="attachment" 
                        className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(url)}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, media_urls: formData.media_urls.filter((_, i) => i !== idx) })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule Time</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 mt-4">
              {formData.id ? 'Save Changes' : 'Schedule Post'}
            </Button>
          </form>
          </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isVaultOpen} onOpenChange={setIsVaultOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Media Vault</DialogTitle>
          </DialogHeader>
          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
            {vaultMedia.length === 0 ? (
              <div className="col-span-full text-center py-12 text-zinc-500">
                No media found in the vault.
              </div>
            ) : (
              vaultMedia.map(media => {
                const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
                const fullUrl = `${baseUrl}/${media.filepath}`;
                return (
                  <div 
                    key={media.id} 
                    className="relative aspect-square rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden cursor-pointer hover:border-indigo-500 group"
                    onClick={() => {
                      setFormData({ ...formData, media_urls: [...formData.media_urls, fullUrl] });
                      setIsVaultOpen(false);
                    }}
                  >
                    <img src={fullUrl} alt={media.filename} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-sm font-semibold">Select</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Full Size Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDirectAccessOpen} onOpenChange={setIsDirectAccessOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl">Client Social Media Access</DialogTitle>
          </DialogHeader>
          <div className="shrink-0 pt-2 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Search client by name, company, email, or phone..." 
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-white dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 space-y-4">
            {clients.filter(c => {
              const q = clientSearchQuery.toLowerCase();
              const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
              const company = (c.company_name || '').toLowerCase();
              const email = (c.email || '').toLowerCase();
              const phone = (c.phone_number || '').toLowerCase();
              return name.includes(q) || company.includes(q) || email.includes(q) || phone.includes(q);
            }).map(client => (
              <div key={client.id} className="flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                  <span>{client.company_name || (client.first_name ? client.first_name + ' ' + client.last_name : client.email)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-[#1877F2]" 
                    onClick={() => client.brand_facebook_url ? window.open(client.brand_facebook_url, '_blank') : alert("No Facebook URL configured for this client. Please update their profile.")}
                  >
                    <FaFacebook className="w-4 h-4" /> Facebook
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-[#E4405F]" 
                    onClick={() => client.brand_instagram_url ? window.open(client.brand_instagram_url, '_blank') : alert("No Instagram URL configured for this client. Please update their profile.")}
                  >
                    <FaInstagram className="w-4 h-4" /> Instagram
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-black dark:text-white" 
                    onClick={() => client.brand_tiktok_url ? window.open(client.brand_tiktok_url, '_blank') : alert("No TikTok URL configured for this client. Please update their profile.")}
                  >
                    <FaTiktok className="w-4 h-4" /> TikTok
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-[#0A66C2]" 
                    onClick={() => client.brand_linkedin_url ? window.open(client.brand_linkedin_url, '_blank') : alert("No LinkedIn URL configured for this client. Please update their profile.")}
                  >
                    <FaLinkedin className="w-4 h-4" /> LinkedIn
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-2 text-[#1DA1F2]" 
                    onClick={() => client.brand_twitter_url ? window.open(client.brand_twitter_url, '_blank') : alert("No Twitter URL configured for this client. Please update their profile.")}
                  >
                    <FaTwitter className="w-4 h-4" /> Twitter
                  </Button>
                </div>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="text-center text-zinc-500 py-8">No clients available.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
