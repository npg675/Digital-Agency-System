"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Plus, FileText, CheckCircle, Clock, AlertCircle, Eye, Send, Edit2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Quotation {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  template_name: string;
  valid_until: string | null;
  created_at: string;
}

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Record<string, ClientUser>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const { token } = useAuthStore();

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
  }, [token]);

  const handleSendQuotation = async (id: string) => {
    if (!confirm("Are you sure you want to send this quotation to the client?")) return;
    
    setSending(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Quotation sent successfully!");
        fetchQuotations(); // Refresh status
      } else {
        alert("Failed to send quotation.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSending(null);
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

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Valid Until</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading quotations...</td></tr>
            ) : quotations.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-gray-500">No quotations found.</td></tr>
            ) : quotations.map((quote) => {
              const client = clients[quote.client_id];
              return (
                <tr key={quote.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-200">
                      {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                    </div>
                    <div className="text-xs text-gray-500">{client?.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">${quote.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {quote.valid_until ? format(new Date(quote.valid_until), "MMM d, yyyy") : 'N/A'}
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
                      onClick={() => handleSendQuotation(quote.id)}
                      disabled={sending === quote.id || quote.status === 'ACCEPTED'}
                      className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                        quote.status === 'ACCEPTED' ? 'text-gray-600 bg-white/5 cursor-not-allowed' :
                        'text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20'
                      }`}
                      title="Send via Email"
                    >
                      {sending === quote.id ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
