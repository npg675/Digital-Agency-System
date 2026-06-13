"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { CreditCard, CheckCircle, FileText, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const { token } = useAuthStore();
  const searchParams = useSearchParams();

  const success = searchParams?.get("success");
  const canceled = searchParams?.get("canceled");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setInvoices(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchInvoices();
  }, [token]);

  const handlePayment = async (invoiceId: string) => {
    setPayingInvoice(invoiceId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.detail || "Payment configuration error. Please contact the agency.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setPayingInvoice(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">My Invoices</h1>
        <p className="text-gray-400 mt-1">View your billing history and securely pay outstanding invoices.</p>
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <p>Payment successful! Your invoice has been marked as paid.</p>
        </div>
      )}

      {canceled && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <p>Payment was canceled. You can try again whenever you're ready.</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-1">No Invoices</h3>
            <p className="text-gray-500">You do not have any invoices at this time.</p>
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/10 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-semibold text-white">{inv.description || "Invoice"}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    inv.status === "PAID" ? "bg-green-500/20 text-green-400" :
                    inv.status === "OVERDUE" ? "bg-red-500/20 text-red-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <p>Issue Date: {format(new Date(inv.created_at), "MMM d, yyyy")}</p>
                  {inv.due_date && <p>Due: {format(new Date(inv.due_date), "MMM d, yyyy")}</p>}
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
                <div className="text-2xl font-bold text-white">
                  ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                
                {inv.status !== "PAID" ? (
                  <button 
                    onClick={() => handlePayment(inv.id)}
                    disabled={payingInvoice === inv.id}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                  >
                    <CreditCard size={18} />
                    {payingInvoice === inv.id ? "Processing..." : "Pay Now"}
                  </button>
                ) : (
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-medium transition-all">
                    <ExternalLink size={18} />
                    Receipt
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
