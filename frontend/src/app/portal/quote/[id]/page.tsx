"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Printer, Download } from "lucide-react";

function numberToWords(amount: number, currency: string): string {
  const getCurrencyName = (symbol: string) => {
    switch(symbol) {
      case "$": return "Dollars";
      case "Rs.": return "Rupees";
      case "₹": return "Rupees";
      case "€": return "Euros";
      case "£": return "Pounds";
      default: return symbol;
    }
  };
  const currencyName = getCurrencyName(currency);

  if (amount === 0) return `Zero ${currencyName} Only`;
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const numString = amount.toString();
  const [dollars, cents] = numString.split(".");

  function convertGroup(n: number): string {
    let str = "";
    if (n >= 100) { str += ones[Math.floor(n / 100)] + " Hundred "; n %= 100; }
    if (n >= 20) { str += tens[Math.floor(n / 10)] + " "; n %= 10; }
    if (n > 0) { str += ones[n] + " "; }
    return str.trim();
  }

  const d = parseInt(dollars);
  let words = "";
  if (d === 0) words = "Zero";
  else if (d < 1000) words = convertGroup(d);
  else if (d < 1000000) words = convertGroup(Math.floor(d / 1000)) + " Thousand " + convertGroup(d % 1000);
  else words = convertGroup(Math.floor(d / 1000000)) + " Million " + convertGroup(Math.floor((d % 1000000) / 1000)) + " Thousand " + convertGroup(d % 1000);

  let result = words.trim() + ` ${currencyName}`;
  if (cents && parseInt(cents) > 0) {
    const c = parseInt(cents.padEnd(2, '0').slice(0, 2));
    result += ` and ${c}/100`;
  } else {
    result += " Only";
  }
  return result;
}

export default function PublicQuotationPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/public/${id}`, {
          cache: 'no-store'
        });
        if (res.ok) setQuotation(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuotation();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading beautiful quotation...</div>;
  if (!quotation) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-400">Quotation not found.</div>;

  // Manual Overrides or Fallback
  const cust = quotation.customization || {};
  const c = quotation.client || {};
  
  const clientName = cust.manual_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Client";
  const clientCompany = cust.manual_company || c.company_name;
  const clientAddress = cust.manual_address || c.address;
  const clientEmail = cust.manual_email || c.email;
  const currency = cust.currency || "$";

  const subtotal = quotation.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  const totalTax = cust.global_tax_amount || quotation.items.reduce((sum: number, item: any) => sum + (item.tax_amount || 0), 0);

  const handleDownloadHtml = () => {
    const htmlContent = document.getElementById("quotation-content")?.outerHTML || "";
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation - ${quotation.id.split('-')[0]}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #f8f9fc; padding: 2rem; display: flex; justify-content: center; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    @media print { body { padding: 0; background-color: white; } }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Quotation_${quotation.id.split('-')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0 15mm; size: auto; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      <div className="min-h-screen bg-[#f8f9fc] py-8 px-4 print:py-0 print:px-0 print:bg-white flex flex-col items-center font-sans">
        
        {/* Non-printable action bar */}
        <div className="w-[210mm] max-w-full flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-lg font-bold text-gray-800">Preview Quotation</h1>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadHtml}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 text-sm font-bold rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={16} />
            Download HTML
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div id="quotation-content" className="w-[210mm] max-w-full bg-white shadow-2xl print:shadow-none relative box-border text-[11px] leading-relaxed text-gray-800 flex flex-col print:w-[210mm]">
        
        {/* Striking Gradient Accent Line */}
        <div 
          className="h-4 w-full bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}
        ></div>

        {/* Inner Padding Wrapper */}
        <div className="px-10 pb-10 pt-4 print:px-8 print:pb-8 print:pt-4 flex-1 flex flex-col">
          
          {/* --- Premium Header Section (Letterhead Style) --- */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4 relative">
            {/* Left Side: Logo */}
            <div className="flex-shrink-0">
              {quotation.agency?.branding_logo || cust.logo_url ? (
                <div className="flex items-center justify-center h-16">
                  <img src={quotation.agency?.branding_logo || cust.logo_url} alt="Company Logo" className="h-16 w-auto max-w-[220px] object-contain drop-shadow-sm" />
                </div>
              ) : (
                <div className="bg-gradient-to-tr from-purple-600 to-indigo-600 h-16 w-16 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-2xl tracking-tighter">
                    {(quotation.agency?.agency_name || "LF").substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Right Side: Agency Contact Info */}
            <div className="text-right">
              {quotation.agency?.agency_name && (
                <h2 className="text-3xl font-black tracking-wider text-gray-900 uppercase mb-2">
                  {quotation.agency.agency_name}
                </h2>
              )}
              
              <div className="text-gray-500 text-[12px] leading-tight flex flex-col items-end gap-1">
                {quotation.agency?.agency_address && !quotation.agency?.hide_agency_address && (
                  <p className="font-medium text-gray-700 whitespace-pre-wrap text-right text-[14px]">
                    {quotation.agency.agency_address}
                  </p>
                )}
                
                {/* Horizontal row for contact details to save vertical space */}
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 mt-0.5 text-gray-600">
                  {quotation.agency?.agency_email && !quotation.agency?.hide_agency_email && (
                    <span className="text-purple-400 font-medium">{quotation.agency.agency_email}</span>
                  )}
                  {quotation.agency?.agency_contact_no && !quotation.agency?.hide_agency_contact_no && (
                    <span className={`flex items-center gap-1 text-purple-400 font-medium ${(quotation.agency?.agency_email && !quotation.agency?.hide_agency_email) ? 'border-l border-gray-200 pl-3' : ''}`}>
                      {quotation.agency.agency_contact_no}
                    </span>
                  )}
                  {quotation.agency?.agency_website && !quotation.agency?.hide_agency_website && (
                    <span className={`flex items-center gap-1 text-purple-400 font-medium ${((quotation.agency?.agency_email && !quotation.agency?.hide_agency_email) || (quotation.agency?.agency_contact_no && !quotation.agency?.hide_agency_contact_no)) ? 'border-l border-gray-200 pl-3' : ''}`}>
                      {quotation.agency.agency_website}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Info & Quotation Details Row */}
          <div className="flex justify-between items-start mb-6">
            {/* Left: Quoted To */}
            <div className="flex flex-col max-w-sm">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">
                Quoted To
              </h3>
              <div className="text-gray-900 font-bold text-sm mb-1">{clientName}</div>
              {clientCompany && <div className="text-gray-600 text-xs mb-0.5">{clientCompany}</div>}
              {clientAddress && <div className="text-gray-500 text-xs mb-1 whitespace-pre-wrap">{clientAddress}</div>}
              {clientEmail && <div className="text-purple-600 text-xs font-medium">{clientEmail}</div>}
            </div>

            {/* Right: Quotation Details */}
            <div className="flex flex-col min-w-[200px]">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1 text-right">
                Quotation Details
              </h3>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center gap-6">
                  <span className="text-gray-500 font-medium">Ref No:</span>
                  <span className="font-bold text-gray-900">QT-{quotation.id.split('-')[0]}</span>
                </div>
                <div className="flex justify-between items-center gap-6">
                  <span className="text-gray-500 font-medium">Date:</span>
                  <span className="font-bold text-gray-800">{format(new Date(quotation.created_at), "MMM dd, yyyy")}</span>
                </div>
                {quotation.valid_until && (
                  <div className="flex justify-between items-center gap-6 pt-1">
                    <span className="text-red-400 font-medium">Valid Until:</span>
                    <span className="font-bold text-red-500">{format(new Date(quotation.valid_until), "MMM dd, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {cust.subject && (
            <div className="mb-4 text-center">
              <span className="font-bold text-[10px] uppercase tracking-widest text-gray-500 mr-2">Subject:</span>
              <span className="text-[12px] text-gray-900 font-bold">{cust.subject}</span>
            </div>
          )}

          {cust.company_profile && (
            <div className="mb-4 border-l-2 border-purple-500 pl-4 bg-gray-50/50 p-3 rounded-r-lg">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Company Profile</h3>
              <p className="text-gray-600 text-[10px] whitespace-pre-wrap leading-relaxed">{cust.company_profile}</p>
            </div>
          )}

          {/* Ultra-Thin Data Grid */}
          <div className="flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-gray-900">
                  <th className="py-1 px-1 text-[9px] font-bold uppercase tracking-widest w-[50%]">Description</th>
                  <th className="py-1 px-1 text-[9px] font-bold uppercase tracking-widest text-center">Qty</th>
                  <th className="py-1 px-1 text-[9px] font-bold uppercase tracking-widest text-right">Unit Price</th>
                  <th className="py-1 px-1 text-[9px] font-bold uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotation.items.map((item: any, index: number) => (
                  <tr key={item.id || index} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-0.5 px-1 text-gray-800 font-medium">{item.description}</td>
                    <td className="py-0.5 px-1 text-gray-600 text-center">{item.quantity}</td>
                    <td className="py-0.5 px-1 text-gray-600 text-right">{currency}{item.unit_price.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    <td className="py-0.5 px-1 text-gray-900 font-bold text-right">{currency}{item.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes Section */}
          <div className="mt-8 border-t border-gray-300 pt-6 flex justify-between items-start">
            
            {/* Notes, Terms & Amount */}
            <div className="w-[55%] pr-8 flex flex-col gap-4">
              <div>
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Amount in Words</h3>
                <p className="text-gray-800 font-medium italic text-[11px] capitalize">{numberToWords(quotation.total_amount, currency).toLowerCase()}</p>
              </div>

              {cust.terms && (
                <div>
                  <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Terms & Conditions</h3>
                  <p className="text-gray-600 text-[10px] whitespace-pre-wrap">{cust.terms}</p>
                </div>
              )}

              {quotation.notes && (
                <div>
                  <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</h3>
                  <p className="text-gray-600 text-[10px] whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
            </div>

            {/* Numeric Totals Grid */}
            <div className="w-48 text-right">
              <div className="flex justify-between items-center text-gray-600 mb-1.5">
                <span className="font-medium text-[10px] uppercase tracking-widest">Subtotal</span>
                <span>{currency}{subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              {totalTax > 0 && (
                <div className="flex justify-between items-center text-gray-600 mb-2">
                  <span className="font-medium text-[10px] uppercase tracking-widest">Tax (VAT)</span>
                  <span>{currency}{totalTax.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-gray-300 pt-2 text-sm font-black text-gray-900">
                <span className="uppercase tracking-widest text-[10px]">Total Due</span>
                <span>{currency}{quotation.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              
              {/* Authorized Signature */}
              {(!quotation.agency?.hide_agency_signature || !quotation.agency?.hide_agency_signature_text) && (
                <div className="mt-8 flex flex-col items-center opacity-80 w-full">
                  {/* Signature Space / Image */}
                  <div className="h-16 w-full flex items-end justify-center pb-1 relative">
                    {!quotation.agency?.hide_agency_signature && quotation.agency?.agency_signature && (
                      <img 
                        src={quotation.agency.agency_signature} 
                        alt="Authorized Signature" 
                        className="max-h-20 max-w-[150%] w-auto object-contain absolute bottom-0 mix-blend-multiply"
                      />
                    )}
                  </div>
                  
                  {/* The Line and Text */}
                  {!quotation.agency?.hide_agency_signature_text && (
                    <div className="border-t border-gray-400 w-full pt-2 text-center">
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Authorized Signature</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Minimal Footer */}
          {!quotation.agency?.hide_agency_footer_text && (
            <div className="mt-12 text-center text-[9px] text-gray-400 uppercase tracking-widest">
              {quotation.agency?.agency_footer_text ? (
                quotation.agency.agency_footer_text
              ) : (
                <>Thank you for your business. Generated by {quotation.agency?.agency_name || "Agency"} © {new Date().getFullYear()}</>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
    </>
  );
}
