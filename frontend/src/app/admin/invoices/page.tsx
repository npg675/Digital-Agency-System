"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Search, Plus, FileText, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  client_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  due_date: string;
  created_at?: string;
}

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientServices, setClientServices] = useState<any[]>([]);
  const { token } = useAuthStore();

  // Form State
  const [formData, setFormData] = useState({
    client_id: "",
    amount: "",
    description: "",
    due_date: "",
    // New client fields
    new_client_first_name: "",
    new_client_last_name: "",
    new_client_email: "",
    new_client_password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/invoices/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setInvoices(await res.json());
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
        setClients(users.filter((u: any) => u.role === "CLIENT"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      Promise.all([fetchInvoices(), fetchClients()]).finally(() => setLoading(false));
    }
  }, [token]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!formData.client_id) {
        setClientServices([]);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/client-services/client/${formData.client_id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setClientServices(await res.json());
        } else {
          setClientServices([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    if (isModalOpen && !isCreatingClient) {
      fetchServices();
    }
  }, [formData.client_id, isModalOpen, isCreatingClient, token]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    let targetClientId = formData.client_id;

    try {
      // Step 1: Create client if needed
      if (isCreatingClient) {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            first_name: formData.new_client_first_name,
            last_name: formData.new_client_last_name,
            email: formData.new_client_email,
            password: formData.new_client_password,
            role: "CLIENT"
          })
        });

        if (!userRes.ok) {
          const errData = await userRes.json();
          alert(errData.detail || "Failed to create new client.");
          setSubmitting(false);
          return;
        }

        const newUser = await userRes.json();
        targetClientId = newUser.id;
        
        // Refresh client list in background
        fetchClients();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/invoices/`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: targetClientId,
          amount: parseFloat(formData.amount),
          currency: "usd",
          description: formData.description,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setIsCreatingClient(false);
        setFormData({ 
          client_id: "", amount: "", description: "", due_date: "",
          new_client_first_name: "", new_client_last_name: "", new_client_email: "", new_client_password: ""
        });
        fetchInvoices(); // Refresh
      } else {
        alert("Failed to create invoice");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PAID": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "SENT": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "OVERDUE": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "PAID": return <CheckCircle size={14} />;
      case "SENT": return <Clock size={14} />;
      case "OVERDUE": return <AlertCircle size={14} />;
      default: return <FileText size={14} />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Invoices</h1>
          <p className="text-gray-400 mt-1">Manage billing and payments</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 font-medium"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Invoice Description</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading invoices...</td></tr>
            ) : invoices.length === 0 ? (
               <tr><td colSpan={4} className="p-8 text-center text-gray-500">No invoices found.</td></tr>
            ) : invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-200">{invoice.description}</td>
                <td className="px-6 py-4 font-bold text-white">${invoice.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Create Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-300">Client</label>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingClient(!isCreatingClient)}
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    {isCreatingClient ? "Select existing client" : "+ Create new client"}
                  </button>
                </div>

                {!isCreatingClient ? (
                  <select 
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="" disabled>Select a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 p-3 bg-black/30 border border-white/5 rounded-lg">
                    <div className="flex gap-2">
                      <input 
                        type="text" required placeholder="First Name"
                        value={formData.new_client_first_name}
                        onChange={(e) => setFormData({...formData, new_client_first_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-green-500"
                      />
                      <input 
                        type="text" required placeholder="Last Name"
                        value={formData.new_client_last_name}
                        onChange={(e) => setFormData({...formData, new_client_last_name: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <input 
                      type="email" required placeholder="Email Address"
                      value={formData.new_client_email}
                      onChange={(e) => setFormData({...formData, new_client_email: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-green-500"
                    />
                    <input 
                      type="password" required placeholder="Temporary Password"
                      value={formData.new_client_password}
                      onChange={(e) => setFormData({...formData, new_client_password: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                )}
              </div>
              
              {!isCreatingClient && formData.client_id && clientServices.length > 0 && (
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Active Client Services</label>
                  <div className="flex flex-wrap gap-2">
                    {clientServices.map(service => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setFormData({...formData, description: service.service_role})}
                        className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {service.service_role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input 
                  type="text" required
                  placeholder="e.g. Website Development"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
                  <input 
                    type="number" step="0.01" required
                    placeholder="1500.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                  <input 
                    type="date" required
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-green-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-green-500/20 disabled:opacity-50">
                  {submitting ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
