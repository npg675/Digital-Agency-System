"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCrossTabSync, useSyncStore } from "@/store/useSyncStore";
import { Plus, FileText, CheckCircle, Clock, AlertCircle, Eye, Send, Edit2, Copy, Search, Filter, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Quotation {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  template_name: string;
  valid_until: string | null;
  created_at: string;
  customization?: any;
  logs?: any[];
}

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  phone_number?: string;
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<string, ClientUser>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sendModalOpen, setSendModalOpen] = useState<Quotation | null>(null);
  const [sendMethod, setSendMethod] = useState("EMAIL");
  const [contactInfo, setContactInfo] = useState("");
  const [formatType, setFormatType] = useState("LINK");
  const { token } = useAuthStore();
  const router = useRouter();
  const syncVersion = useSyncStore(s => s.version);
  const { broadcastSync } = useCrossTabSync();

  const fetchQuotations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQuotations(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        const clientMap: Record<string, ClientUser> = {};
        users.forEach((u: ClientUser) => {
          clientMap[u.id] = u;
        });
        setClients(clientMap);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchQuotations(), fetchClients()]).finally(() => setLoading(false));
    }
  }, [token, syncVersion]);

  const openSendModal = (quote: Quotation) => {
    setSendModalOpen(quote);
    setSendMethod("EMAIL");
    setFormatType("LINK");
    const client = clients[quote.client_id];
    setContactInfo(client?.email || "");
  };

  const executeSend = async () => {
    if (!sendModalOpen || !contactInfo) return;
    const id = sendModalOpen.id;
    setSending(id);
    setSendModalOpen(null);
    try {
      let pdfBlob = null;
      if (formatType === "PDF") {
        const pdfRes = await fetch(`/api/pdf?id=${id}`);
        if (!pdfRes.ok) throw new Error("Failed to generate PDF");
        pdfBlob = await pdfRes.blob();
      }

      const formData = new FormData();
      formData.append("method", sendMethod);
      formData.append("contact_info", contactInfo);
      formData.append("format_type", formatType);
      if (pdfBlob) {
        formData.append("file", pdfBlob, `Quotation_${id}.pdf`);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert(`Quotation sent via ${sendMethod}!`);
        if (sendMethod === "WHATSAPP") {
          let text = `Hello! Your quotation (QT-${id.split('-')[0].toUpperCase()}) is ready. `;
          if (formatType === "PDF") {
             text += `You can view or download the PDF here: ${window.location.origin}/portal/quote/${id}`;
          } else {
             text += `View it here: ${window.location.origin}/portal/quote/${id}`;
          }
          window.open(`https://wa.me/${contactInfo.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
        }
        fetchQuotations(); // Refresh status
        broadcastSync();
      } else {
        alert("Failed to send quotation.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error or PDF generation failed.");
    } finally {
      setSending(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!confirm("Are you sure you want to duplicate this quotation?")) return;
    setDuplicating(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const newQuote = await res.json();
        router.push(`/admin/quotations/${newQuote.id}/edit`);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to duplicate quotation");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this DRAFT quotation? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setQuotations(quotations.filter(q => q.id !== id));
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to delete quotation");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "ACCEPTED": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "SENT": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "REJECTED": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "VIEWED": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "ACCEPTED": return <CheckCircle size={14} />;
      case "SENT": return <Clock size={14} />;
      case "REJECTED": return <AlertCircle size={14} />;
      case "VIEWED": return <Eye size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const filteredQuotations = quotations.filter(quote => {
    const client = clients[quote.client_id];
    const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim().toLowerCase() : '';
    const companyName = client?.company_name?.toLowerCase() || '';
    const subject = quote.customization?.subject?.toLowerCase() || '';
    const refNo = `qt-${quote.id.split('-')[0]}`.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchQuery.toLowerCase()) || 
      companyName.includes(searchQuery.toLowerCase()) ||
      subject.includes(searchQuery.toLowerCase()) ||
      refNo.includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "ALL" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Quotations</h1>
          <p className="text-gray-400 mt-1">Create and manage client quotations</p>
        </div>
        
        <Link 
          href="/admin/quotations/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 font-medium"
        >
          <Plus size={18} />
          Create Quotation
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by quote #, client, company, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="VIEWED">Viewed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Quote # & Subject</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Dates</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading quotations...</td></tr>
            ) : filteredQuotations.length === 0 ? (
               <tr><td colSpan={6} className="p-8 text-center text-gray-500">No quotations found.</td></tr>
            ) : filteredQuotations.map((quote) => {
              const client = clients[quote.client_id];
              const currency = quote.customization?.currency === "Custom" ? quote.customization?.manual_currency : (quote.customization?.currency || "$");
              const sentLog = [...(quote.logs || [])].reverse().find((l: any) => l.action === "SENT_VIA_EMAIL");
              return (
                <tr key={quote.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">
                      QT-{quote.id.split('-')[0].toUpperCase()}
                    </div>
                    {quote.customization?.subject && (
                      <div className="text-xs text-purple-400 mt-0.5 line-clamp-1 max-w-[200px]" title={quote.customization.subject}>
                        {quote.customization.subject}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-200">
                      {client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown Client' : 'Unknown Client'}
                    </div>
                    {client?.company_name && (
                      <div className="text-xs text-zinc-400 mt-0.5">{client.company_name}</div>
                    )}
                    <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
                    {client?.email && !client.email.endsWith('@system.example.com') && !client.email.endsWith('@system.local') && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">{currency} {quote.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs space-y-1">
                    <div className="text-gray-400"><span className="text-gray-500 font-medium">Created:</span> {format(new Date(quote.created_at), "MMM d, yyyy")}</div>
                    {sentLog && <div className="text-blue-400"><span className="text-gray-500 font-medium">Sent:</span> {format(new Date(sentLog.created_at), "MMM d, yyyy")}</div>}
                    {quote.valid_until && <div className="text-red-400"><span className="text-gray-500 font-medium">Valid:</span> {format(new Date(quote.valid_until), "MMM d, yyyy")}</div>}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link 
                      href={`/portal/quote/${quote.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="View PDF / HTML"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link 
                      href={`/admin/quotations/${quote.id}/edit`}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Quotation"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDuplicate(quote.id)}
                      disabled={duplicating === quote.id}
                      className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Duplicate Quotation"
                    >
                      {duplicating === quote.id ? <Clock size={16} className="animate-spin" /> : <Copy size={16} />}
                    </button>
                    <button 
                      onClick={() => openSendModal(quote)}
                      disabled={sending === quote.id || quote.status === 'ACCEPTED'}
                      className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                        quote.status === 'ACCEPTED' ? 'text-gray-600 bg-white/5 cursor-not-allowed' :
                        'text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20'
                      }`}
                      title="Send via Email"
                    >
                      {sending === quote.id ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                    {quote.status === "DRAFT" && (
                      <button 
                        onClick={() => handleDelete(quote.id)}
                        disabled={deleting === quote.id}
                        className="inline-flex items-center justify-center p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete Draft"
                      >
                        {deleting === quote.id ? <Clock size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-4">Send Quotation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSendMethod("EMAIL")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${sendMethod === "EMAIL" ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-black/30 text-gray-400 border-white/10 hover:bg-white/5'}`}
                  >
                    Email
                  </button>
                  <button 
                    onClick={() => setSendMethod("WHATSAPP")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${sendMethod === "WHATSAPP" ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-black/30 text-gray-400 border-white/10 hover:bg-white/5'}`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Format</label>
                <div className="flex gap-2">
                  {['LINK', 'HTML', 'PDF'].map((fmt) => (
                    <button 
                      key={fmt}
                      onClick={() => setFormatType(fmt)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${formatType === fmt ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-black/30 text-gray-400 border-white/10 hover:bg-white/5'}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {sendMethod === "EMAIL" ? "Email Address" : "WhatsApp Number (with country code)"}
                </label>
                <input 
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={sendMethod === "EMAIL" ? "client@example.com" : "e.g. 1234567890"}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {clients[sendModalOpen.client_id] && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {clients[sendModalOpen.client_id].email && (
                     <button onClick={() => { setSendMethod("EMAIL"); setContactInfo(clients[sendModalOpen.client_id].email); }} className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded text-gray-300 transition-colors">
                       Use Email: {clients[sendModalOpen.client_id].email}
                     </button>
                  )}
                  {clients[sendModalOpen.client_id].phone_number && (
                     <button onClick={() => { setSendMethod("WHATSAPP"); setContactInfo(clients[sendModalOpen.client_id].phone_number as string); }} className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded text-gray-300 transition-colors">
                       Use Phone: {clients[sendModalOpen.client_id].phone_number}
                     </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setSendModalOpen(null)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={executeSend}
                disabled={!contactInfo}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
