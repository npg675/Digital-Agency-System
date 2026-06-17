"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowLeft, Plus, Trash2, Save, LayoutTemplate, GripVertical } from "lucide-react";
import Link from "next/link";

interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  address?: string;
}

export default function EditQuotationPage() {
  const router = useRouter();
  const { id } = useParams();
  const { token } = useAuthStore();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    client_id: "",
    valid_until: "",
    template_name: "professional",
    subject: "",
    company_profile: "",
    logo_url: "",
    notes: "We appreciate your business! Please let us know if you have any questions about this quotation.",
    terms: "1. 50% advance payment required to commence work.\n2. Quotation is valid for 30 days.",
    manual_name: "",
    manual_company: "",
    manual_address: "",
    manual_email: "",
    currency: "$",
    manual_currency: "",
    global_tax_rate: 0
  });

  const [items, setItems] = useState([
    { description: "", quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [historyDescriptions, setHistoryDescriptions] = useState<string[]>([]);
  const [subjectHistory, setSubjectHistory] = useState<string[]>([]);

  const [serviceRoles, setServiceRoles] = useState<any[]>([]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    setItems(newItems);
    setDraggedIndex(null);
  };

  useEffect(() => {
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

    const fetchServiceRoles = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/service-roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setServiceRoles(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchQuotation = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const q = await res.json();
          const c = q.customization || {};
          const isStandardCurrency = c.currency === "$" || c.currency === "Rs." || c.currency === "₹";
          
          setFormData({
            client_id: q.client_id,
            valid_until: q.valid_until ? new Date(q.valid_until).toISOString().split('T')[0] : "",
            template_name: q.template_name || "professional",
            subject: c.subject || "",
            company_profile: c.company_profile || "",
            logo_url: c.logo_url || "",
            notes: q.notes || "",
            terms: c.terms || "",
            manual_name: c.manual_name || "",
            manual_company: c.manual_company || "",
            manual_address: c.manual_address || "",
            manual_email: c.manual_email || "",
            currency: isStandardCurrency ? c.currency : (c.currency ? "Custom" : "$"),
            manual_currency: isStandardCurrency ? "" : (c.currency || ""),
            global_tax_rate: c.global_tax_rate || 0
          });

          if (q.items && q.items.length > 0) {
            setItems(q.items.map((i: any) => ({
              description: i.description,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total: i.total
            })));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/items/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setHistoryDescriptions(await res.json());

        const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/subjects/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (subRes.ok) setSubjectHistory(await subRes.json());
      } catch (err) {
        console.error(err);
      }
    };

    if (token) {
      Promise.all([fetchClients(), fetchServiceRoles(), fetchQuotation(), fetchHistory()]).finally(() => setLoading(false));
    }
  }, [token, id]);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unit_price) || 0;
      item.total = q * p;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const globalTaxAmount = subtotal * ((parseFloat(formData.global_tax_rate.toString()) || 0) / 100);
  const totalAmount = subtotal + globalTaxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) return alert("Please select a client.");
    if (items.length === 0) return alert("Please add at least one item.");
    if (items.some(i => !i.description)) return alert("All items must have a description.");

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: formData.client_id,
          status: "DRAFT",
          total_amount: totalAmount,
          valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
          template_name: formData.template_name,
          notes: formData.notes,
          customization: {
            manual_name: formData.manual_name || null,
            manual_company: formData.manual_company || null,
            manual_address: formData.manual_address || null,
            manual_email: formData.manual_email || null,
            subject: formData.subject || null,
            company_profile: formData.company_profile || null,
            logo_url: formData.logo_url || null,
            currency: formData.currency === "Custom" ? formData.manual_currency : formData.currency,
            global_tax_rate: Number(formData.global_tax_rate),
            global_tax_amount: Number(globalTaxAmount),
            terms: formData.terms
          },
          items: items.map(i => ({
            description: i.description,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
            total: Number(i.total)
          }))
        })
      });

      if (res.ok) {
        router.push("/admin/quotations");
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to update quotation.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 max-w-5xl mx-auto space-y-8 text-white">Loading quotation data...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/quotations" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Edit Quotation</h1>
          <p className="text-gray-400 mt-1">Modify your custom quotation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Client Details</h2>
            
            {(() => {
              const selectedClient = clients.find(c => c.id === formData.client_id);
              return (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Select Client <span className="text-red-400">*</span></label>
                    <select 
                      required
                      value={formData.client_id}
                      onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="" disabled>Choose a client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed Client'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-white/10 mt-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Optional: Override Display Details</label>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder={selectedClient ? `Override Name (Default: ${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() + ')' : "Manual Name (Optional)"}
                        value={formData.manual_name || ""}
                  onChange={(e) => setFormData({...formData, manual_name: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                />
                      <input 
                        type="text" 
                        placeholder={selectedClient?.company_name ? `Override Company (Default: ${selectedClient.company_name})` : "Manual Company Name (Optional)"}
                        value={formData.manual_company || ""}
                  onChange={(e) => setFormData({...formData, manual_company: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                />
                      <input 
                        type="text" 
                        placeholder={selectedClient?.address ? `Override Address (Default: ${selectedClient.address})` : "Manual Company Address (Optional)"}
                        value={formData.manual_address || ""}
                  onChange={(e) => setFormData({...formData, manual_address: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                />
                      <input 
                        type="text" 
                        placeholder={selectedClient?.email ? `Override Email (Default: ${selectedClient.email})` : "Manual Email (Optional)"}
                        value={formData.manual_email || ""}
                  onChange={(e) => setFormData({...formData, manual_email: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                />
                      <input 
                        type="text" 
                        placeholder="Company Logo URL (Optional)"
                        value={formData.logo_url || ""}
                        onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                      />
                    </div>
                  </div>
                </>
              );
            })()}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Valid Until</label>
              <input 
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark] transition-colors"
              />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                <LayoutTemplate size={16} className="text-purple-400" />
                Template Style
              </label>
              <select 
                value={formData.template_name}
                onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="professional">Professional (Default)</option>
                <option value="minimal">Minimalist</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
              <select 
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors mb-2"
              >
                <option value="$">US Dollar ($)</option>
                <option value="Rs.">Nepali Rupee (Rs.)</option>
                <option value="₹">Indian Rupee (₹)</option>
                <option value="Custom">Custom Text...</option>
              </select>
              {formData.currency === "Custom" && (
                <input 
                  type="text" 
                  placeholder="E.g. AUD, €, £"
                  value={formData.manual_currency}
                  onChange={(e) => setFormData({...formData, manual_currency: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <datalist id="subject-suggestions">
                {subjectHistory.map((sub, idx) => (
                  <option key={idx} value={sub} />
                ))}
              </datalist>
              <input 
                type="text"
                list="subject-suggestions"
                placeholder="E.g. Quotation for Web Development Services"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Company Profile / Introduction</label>
              <textarea 
                rows={3}
                placeholder="Briefly introduce your company or the purpose of this quotation..."
                value={formData.company_profile}
                onChange={(e) => setFormData({...formData, company_profile: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Additional Notes</label>
              <textarea 
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Terms & Conditions</label>
              <textarea 
                rows={3}
                value={formData.terms}
                onChange={(e) => setFormData({...formData, terms: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Line Items</h2>
            <button 
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium"
            >
              <Plus size={16} /> Add Custom Item
            </button>
          </div>

          {serviceRoles.length > 0 && (
            <div className="mb-6 bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Add Services</label>
              <div className="flex flex-wrap gap-2">
                {serviceRoles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      const emptyIndex = items.findIndex(i => !i.description && i.quantity === 1 && i.unit_price === 0);
                      if (emptyIndex >= 0) {
                        handleItemChange(emptyIndex, 'description', role.name);
                      } else {
                        setItems([...items, { description: role.name, quantity: 1, unit_price: 0, total: 0 }]);
                      }
                    }}
                    className="text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> {role.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2 text-right pr-10">Total</div>
            </div>

            <datalist id="description-suggestions">
              {historyDescriptions.map((desc, idx) => (
                <option key={idx} value={desc} />
              ))}
            </datalist>

            {items.map((item, index) => (
              <div 
                key={index} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`grid grid-cols-12 gap-4 items-center group bg-black/20 p-2 rounded-xl border transition-all ${draggedIndex === index ? 'opacity-50 scale-[0.99] border-purple-500 bg-purple-500/10' : 'border-white/5'}`}
              >
                <div className="col-span-6 flex items-center gap-1">
                  <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 pl-1 py-1">
                    <GripVertical size={16} />
                  </div>
                  <input 
                    type="text" required placeholder="Service or product description..."
                    list="description-suggestions"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full bg-transparent border-none py-1.5 px-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 rounded text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" min="1" step="0.1" required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded py-1.5 px-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" min="0" step="0.01" required
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded py-1.5 px-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between pl-2">
                  <span className="text-white font-medium text-sm">
                    {(formData.currency === "Custom" ? formData.manual_currency : formData.currency)} {item.total.toFixed(2)}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
            <div className="w-80 space-y-3">
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span>Subtotal</span>
                <span>{(formData.currency === "Custom" ? formData.manual_currency : formData.currency)} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-sm">
                <span className="flex items-center gap-2">Tax (%) 
                  <input 
                    type="number" min="0" step="0.1"
                    value={formData.global_tax_rate}
                    onChange={(e) => setFormData({...formData, global_tax_rate: parseFloat(e.target.value) || 0})}
                    className="w-16 bg-black/40 border border-white/10 rounded py-1 px-2 text-white focus:outline-none focus:border-purple-500 text-xs text-center"
                  />
                </span>
                <span>{(formData.currency === "Custom" ? formData.manual_currency : formData.currency)} {globalTaxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-white text-lg font-bold pt-3 border-t border-white/5">
                <span>Total Amount</span>
                <span className="text-purple-400">{(formData.currency === "Custom" ? formData.manual_currency : formData.currency)} {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all shadow-lg shadow-purple-500/25 font-bold disabled:opacity-50"
          >
            <Save size={20} />
            {submitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
