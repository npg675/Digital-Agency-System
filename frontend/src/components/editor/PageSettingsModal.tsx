"use client";

import React, { useState } from "react";
import { X, Save, Loader2, Link as LinkIcon, Code2, Search, ShieldCheck, Mail, Play } from "lucide-react";
import { useEditorStore, PageSettings } from "@/store/useEditorStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Globe } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PageSettingsModal({ isOpen, onClose }: Props) {
  const { pageId, pageSettings, setPageSettings } = useEditorStore();
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"seo" | "tracking" | "integrations" | "hosting" | "compliance" | "autoresponder">("tracking");
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState<PageSettings>({
    gtm_id: pageSettings.gtm_id || "",
    fb_pixel_id: pageSettings.fb_pixel_id || "",
    tiktok_pixel_id: pageSettings.tiktok_pixel_id || "",
    ga4_id: pageSettings.ga4_id || "",
    webhook_url: pageSettings.webhook_url || "",
    seo_title: pageSettings.seo_title || "",
    seo_description: pageSettings.seo_description || "",
    meta_keywords: pageSettings.meta_keywords || "",
    client_id: pageSettings.client_id || "",
    client_phone: pageSettings.client_phone || "",
    custom_domain: pageSettings.custom_domain || "",
    enable_cookie_consent: pageSettings.enable_cookie_consent || false,
    privacy_policy_url: pageSettings.privacy_policy_url || "",
    tos_url: pageSettings.tos_url || "",
    mailchimp_api_key: pageSettings.mailchimp_api_key || "",
    mailchimp_list_id: pageSettings.mailchimp_list_id || "",
    campaign_id: pageSettings.campaign_id || "",
    autoresponder_subject: pageSettings.autoresponder_subject || "",
    autoresponder_body: pageSettings.autoresponder_body || "",
    default_sequence_id: pageSettings.default_sequence_id || "",
  });
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<{status: string, message: string} | null>(null);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  React.useEffect(() => {
    if (user?.role !== 'CLIENT' && isOpen) {
      fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => setClients(data.filter((u: any) => u.role === 'CLIENT')))
        .catch(console.error);
    }
    
    if (isOpen) {
      fetch(`${API}/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => setCampaigns(data))
        .catch(console.error);
        
      fetch(`${API}/marketing-assets/sequences`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => setSequences(data))
        .catch(console.error);
    }
  }, [user, isOpen, token]);

  const handleSave = async () => {
    if (!pageId || !token) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setPageSettings(formData);
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage({ type: "error", text: "Failed to save settings." });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!formData.webhook_url) return;
    setIsTestingWebhook(true);
    setWebhookTestStatus("idle");
    try {
      const response = await fetch(formData.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          id: "test-id-123",
          name: "John Doe (Test)",
          email: "john.doe@example.com",
          phone: "+15551234567",
          message: "This is a test message from LandingForge.",
          landing_page_id: "test-page-id",
          landing_page_slug: "test-page-slug",
          submitted_at: new Date().toISOString()
        })
      });
      setWebhookTestStatus("success");
      setTimeout(() => setWebhookTestStatus("idle"), 3000);
    } catch (e) {
      setWebhookTestStatus("error");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!pageId || !token || !formData.custom_domain) return;
    setIsVerifyingDomain(true);
    setDomainStatus(null);
    try {
      const res = await fetch(`${API}/pages/${pageId}/verify-domain`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDomainStatus({ status: data.status, message: data.message });
      } else {
        setDomainStatus({ status: "ERROR", message: data.detail || "Failed to verify domain." });
      }
    } catch (e) {
      setDomainStatus({ status: "ERROR", message: "Network error during verification." });
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-xl font-bold text-zinc-900">Page Settings</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-zinc-100 px-6 overflow-x-auto whitespace-nowrap flex-nowrap">
          <button
            onClick={() => setActiveTab("tracking")}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === "tracking" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Code2 className="w-4 h-4" /> Tracking Pixels
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === "integrations" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Integrations
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === "seo" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Search className="w-4 h-4" /> SEO & Meta
          </button>
          <button
            onClick={() => setActiveTab("autoresponder")}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === "autoresponder" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Mail className="w-4 h-4" /> Auto-Responder
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
              activeTab === "compliance" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Compliance
          </button>
          {user?.role !== 'CLIENT' && (
            <button
              onClick={() => setActiveTab("hosting")}
              className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                activeTab === "hosting" ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Globe className="w-4 h-4" /> Hosting & Client
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50">
          {message && (
            <div className={`p-3 mb-6 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
              {message.text}
            </div>
          )}

          {activeTab === "tracking" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Google Tag Manager ID</label>
                <input
                  type="text"
                  placeholder="GTM-XXXXXXX"
                  value={formData.gtm_id || ""}
                  onChange={(e) => setFormData({ ...formData, gtm_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">Fires on all pages. Good for overall tracking and Google Ads.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Facebook Meta Pixel ID</label>
                <input
                  type="text"
                  placeholder="123456789012345"
                  value={formData.fb_pixel_id || ""}
                  onChange={(e) => setFormData({ ...formData, fb_pixel_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">TikTok Pixel ID</label>
                <input
                  type="text"
                  placeholder="CXXXXXXXXXXXXX"
                  value={formData.tiktok_pixel_id || ""}
                  onChange={(e) => setFormData({ ...formData, tiktok_pixel_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Google Analytics 4 ID (Measurement ID)</label>
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={formData.ga4_id || ""}
                  onChange={(e) => setFormData({ ...formData, ga4_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Lead Webhook URL</h3>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Send leads instantly to Zapier, Make.com, GoHighLevel, or any custom CRM when a contact form is submitted.
                </p>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Webhook Endpoint</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={formData.webhook_url || ""}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                  <button
                    onClick={handleTestWebhook}
                    disabled={!formData.webhook_url || isTestingWebhook}
                    className="h-10 px-4 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isTestingWebhook ? "Sending..." : "Test"}
                  </button>
                </div>
                {webhookTestStatus === "success" && <p className="text-sm text-green-600 mt-2">Test webhook sent successfully!</p>}
                {webhookTestStatus === "error" && <p className="text-sm text-red-600 mt-2">Failed to send test webhook.</p>}
                
                <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Payload Preview</p>
                  <pre className="text-xs text-zinc-600 font-mono overflow-x-auto">
{`{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Interested in your services",
  "landing_page_slug": "my-page",
  "submitted_at": "2024-05-20T14:30:00Z"
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Mailchimp Integration</h3>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Automatically sync leads directly to a Mailchimp Audience (List).
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">API Key</label>
                    <input
                      type="password"
                      placeholder="e.g. your-mailchimp-api-key-here"
                      value={formData.mailchimp_api_key || ""}
                      onChange={(e) => setFormData({ ...formData, mailchimp_api_key: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Server Prefix</label>
                      <input
                        type="text"
                        placeholder="e.g. us20"
                        value={formData.mailchimp_server_prefix || ""}
                        onChange={(e) => setFormData({ ...formData, mailchimp_server_prefix: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Audience ID (List ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1a2b3c4d5e"
                        value={formData.mailchimp_list_id || ""}
                        onChange={(e) => setFormData({ ...formData, mailchimp_list_id: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Note: Ensure your audience has FNAME, LNAME, and PHONE merge tags to sync all data.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">SEO Title</label>
                <input
                  type="text"
                  placeholder="Awesome Product - Best in class"
                  value={formData.seo_title || ""}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  placeholder="Discover how our product can help you..."
                  value={formData.seo_description || ""}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  className="w-full p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Keywords</label>
                <input
                  type="text"
                  placeholder="marketing, software, landing pages"
                  value={formData.meta_keywords || ""}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === "autoresponder" && (
            <div className="space-y-5">
              {/* Native Sequence (Drip Campaign) Engine */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm border-l-4 border-l-indigo-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Native Marketing Sequence</h3>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Automatically enroll leads into a multi-day email & SMS drip sequence using our native engine.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Select Sequence</label>
                    <select
                      value={formData.default_sequence_id || ""}
                      onChange={(e) => setFormData({ ...formData, default_sequence_id: e.target.value || null })}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                    >
                      <option value="">-- No Sequence (Manual Follow-up Only) --</option>
                      {sequences.map(seq => (
                        <option key={seq.id} value={seq.id}>{seq.name} ({seq.industry_category})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Simple Immediate Auto-responder */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm opacity-80">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-zinc-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Legacy Immediate Auto-Responder</h3>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Send a single, simple immediate email. (Recommended to use Native Sequence above instead).
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Email Subject</label>
                    <input
                      type="text"
                      placeholder="Thanks for claiming your offer, {{name}}!"
                      value={formData.autoresponder_subject || ""}
                      onChange={(e) => setFormData({ ...formData, autoresponder_subject: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Email Body</label>
                    <textarea
                      rows={6}
                      placeholder={`Hi {{name}},\n\nThanks for reaching out! We have received your details and will be in touch shortly.\n\nBest,\nYour Team`}
                      value={formData.autoresponder_body || ""}
                      onChange={(e) => setFormData({ ...formData, autoresponder_body: e.target.value })}
                      className="w-full p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="enable_cookie_consent"
                    checked={formData.enable_cookie_consent}
                    onChange={(e) => setFormData({ ...formData, enable_cookie_consent: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <div>
                    <label htmlFor="enable_cookie_consent" className="font-bold text-zinc-900 cursor-pointer">
                      Enable Cookie Consent Banner
                    </label>
                    <p className="text-sm text-zinc-500">Show a GDPR/CCPA compliant cookie banner on this page.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-zinc-900 mb-1">Legal Footers</h3>
                  <p className="text-sm text-zinc-500 mb-4">
                    Link your legal documents here to automatically display them in the footer.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Privacy Policy URL</label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/privacy-policy"
                    value={formData.privacy_policy_url || ""}
                    onChange={(e) => setFormData({ ...formData, privacy_policy_url: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Terms of Service URL</label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.com/terms"
                    value={formData.tos_url || ""}
                    onChange={(e) => setFormData({ ...formData, tos_url: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "hosting" && user?.role !== 'CLIENT' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Custom Domain</h3>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Map this landing page to a custom domain (e.g. promo.yourclient.com). You must point the domain's CNAME to this server.
                </p>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Domain Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="promo.yourclient.com"
                    value={formData.custom_domain || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, custom_domain: e.target.value });
                      setDomainStatus(null);
                    }}
                    className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    onClick={handleVerifyDomain}
                    disabled={!formData.custom_domain || isVerifyingDomain}
                    className="h-10 px-4 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {isVerifyingDomain ? "Verifying..." : "Verify Connection"}
                  </button>
                </div>
                
                <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <h4 className="text-sm font-bold text-zinc-700 mb-2">DNS Instructions</h4>
                  <p className="text-sm text-zinc-600 mb-2">Log into your domain provider and create a new CNAME record:</p>
                  <div className="grid grid-cols-3 gap-2 text-sm font-mono bg-white p-2 border border-zinc-200 rounded">
                    <div><span className="text-zinc-500 text-xs block">Type</span>CNAME</div>
                    <div><span className="text-zinc-500 text-xs block">Name / Host</span>{formData.custom_domain?.split('.')[0] || 'promo'}</div>
                    <div><span className="text-zinc-500 text-xs block">Value / Points To</span>cname.landingforge.com</div>
                  </div>
                </div>

                {domainStatus && (
                  <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${domainStatus.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <div>
                      <strong className="block mb-1">{domainStatus.status === 'VERIFIED' ? 'Connection Verified!' : 'Verification Failed'}</strong>
                      {domainStatus.message}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-2">Assign to Client</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Give a client view-only access to this page's analytics and leads.
                </p>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Select Client</label>
                <select
                  value={formData.client_id || ""}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value || null })}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">-- No Client Assigned --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.email}</option>
                  ))}
                </select>

                <div className="mt-4">
                  <h3 className="font-bold text-zinc-900 mb-2">Assign to Campaign</h3>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Select Campaign</label>
                  <select
                    value={formData.campaign_id || ""}
                    onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value || null })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- No Campaign Assigned --</option>
                    {campaigns
                      .filter(camp => !formData.client_id || camp.client_id === formData.client_id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Client Phone Number (For WhatsApp Alerts)</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-24 h-10 px-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                      value={(formData.client_phone || "").split(" ")[0]}
                      onChange={(e) => {
                        const currentNumber = (formData.client_phone || "").split(" ").slice(1).join(" ");
                        setFormData({ ...formData, client_phone: `${e.target.value} ${currentNumber}`.trim() })
                      }}
                    >
                      <option value="">Code</option>
                      <option value="+1">US (+1)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+91">IN (+91)</option>
                      <option value="+61">AU (+61)</option>
                      <option value="+977">NP (+977)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="e.g. 555 123 4567"
                      value={(formData.client_phone || "").split(" ").slice(1).join(" ")}
                      onChange={(e) => {
                        const currentCode = (formData.client_phone || "").split(" ")[0];
                        setFormData({ ...formData, client_phone: `${currentCode} ${e.target.value}`.trim() })
                      }}
                      className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
