"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Loader2, Pencil, Check, X } from "lucide-react";
import LogoUploader from "@/components/LogoUploader";

export default function SettingsPage() {
  const { user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    phone_number: "",
    password: "",
    openai_key: "",
    default_domain: "",
    branding_logo: "",
    client_self_serve_mode: false,
    show_agency_configs_to_staff: false,
    show_agency_configs_to_clients: false,
    show_reports_to_clients: false,
    agency_name: "",
    agency_address: "",
    agency_email: "",
    agency_profile_text: "",
    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_password: "",
    smtp_from_email: "",
    whatsapp_access_token: "",
    whatsapp_phone_number_id: "",
    brand_primary_color: "",
    brand_secondary_color: "",
    brand_facebook_url: "",
    brand_twitter_url: "",
    brand_instagram_url: "",
    brand_linkedin_url: "",
    media_vault_file_size_limit_mb: 5,
    media_vault_total_size_limit_mb: 100,
    agency_stripe_secret_key: "",
    agency_stripe_publishable_key: "",
  });

  const [agencyConfig, setAgencyConfig] = useState<any>(null);
  
  // Service Roles State
  const [serviceRoles, setServiceRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");

  useEffect(() => {
    const fetchAgencyConfig = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/agency-config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const config = await res.json();
          setAgencyConfig(config);
          
          if (user?.role !== 'ADMIN') {
            setFormData(prev => ({
              ...prev,
              default_domain: config.default_domain || "",
              branding_logo: config.branding_logo || "",
              agency_name: config.agency_name || "",
              agency_address: config.agency_address || "",
              agency_email: config.agency_email || "",
              agency_profile_text: config.agency_profile_text || "",
              client_self_serve_mode: config.client_self_serve_mode || false,
              show_reports_to_clients: config.show_reports_to_clients || false,
              media_vault_file_size_limit_mb: config.media_vault_file_size_limit_mb || 5,
              media_vault_total_size_limit_mb: config.media_vault_total_size_limit_mb || 100,
            }));
          } else {
            const safeConfig = Object.fromEntries(
              Object.entries(config).map(([k, v]) => [k, v === null ? "" : v])
            );
            setFormData(prev => ({
              ...prev,
              ...safeConfig
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch agency config", err);
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

    if (token) {
      fetchAgencyConfig();
      fetchServiceRoles();
    }
  }, [token, user]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        company_name: user.company_name || "",
        phone_number: user.phone_number || "",
        password: "",
        ...(user.role === 'ADMIN' ? {
          openai_key: user.openai_key || "",
          default_domain: user.default_domain || "",
          branding_logo: user.branding_logo || "",
          agency_name: user.agency_name || "",
          agency_address: user.agency_address || "",
          hide_agency_address: user.hide_agency_address || false,
          agency_email: user.agency_email || "",
          hide_agency_email: user.hide_agency_email || false,
          agency_contact_no: user.agency_contact_no || "",
          hide_agency_contact_no: user.hide_agency_contact_no || false,
          agency_website: user.agency_website || "",
          hide_agency_website: user.hide_agency_website || false,
          agency_footer_text: user.agency_footer_text || "",
          hide_agency_footer_text: user.hide_agency_footer_text || false,
          agency_signature: user.agency_signature || "",
          hide_agency_signature: user.hide_agency_signature || false,
          hide_agency_signature_text: user.hide_agency_signature_text || false,
          agency_profile_text: user.agency_profile_text || "",
          client_self_serve_mode: user.client_self_serve_mode || false,
          show_agency_configs_to_staff: user.show_agency_configs_to_staff || false,
          show_agency_configs_to_clients: user.show_agency_configs_to_clients || false,
          show_reports_to_clients: user.show_reports_to_clients || false,
          agency_stripe_secret_key: user.agency_stripe_secret_key || "",
          agency_stripe_publishable_key: user.agency_stripe_publishable_key || "",
        } : {}),
        ...((user.role === 'ADMIN' || user.role === 'CLIENT') ? {
          smtp_host: user.smtp_host || "",
          smtp_port: user.smtp_port || "",
          smtp_user: user.smtp_user || "",
          smtp_password: user.smtp_password || "",
          smtp_from_email: user.smtp_from_email || "",
          whatsapp_access_token: user.whatsapp_access_token || "",
          whatsapp_phone_number_id: user.whatsapp_phone_number_id || "",
        } : {}),
        ...(user.role === 'CLIENT' ? {
          brand_primary_color: user.brand_primary_color || "",
          brand_secondary_color: user.brand_secondary_color || "",
          brand_facebook_url: user.brand_facebook_url || "",
          brand_twitter_url: user.brand_twitter_url || "",
          brand_instagram_url: user.brand_instagram_url || "",
          brand_linkedin_url: user.brand_linkedin_url || "",
        } : {})
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setIsLoadingRoles(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/service-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newRoleName.trim() })
      });
      if (res.ok) {
        const role = await res.json();
        setServiceRoles([...serviceRoles, role]);
        setNewRoleName("");
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to add role");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleEditRole = async (id: string) => {
    if (!editRoleName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/service-roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editRoleName.trim() })
      });
      if (res.ok) {
        const updatedRole = await res.json();
        setServiceRoles(serviceRoles.map(r => r.id === id ? updatedRole : r));
        setEditingRoleId(null);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to update role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/service-roles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setServiceRoles(serviceRoles.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const payload: Record<string, any> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        phone_number: formData.phone_number,
      };

      if (user.role === 'CLIENT') {
        payload.brand_primary_color = formData.brand_primary_color;
        payload.brand_secondary_color = formData.brand_secondary_color;
        payload.brand_facebook_url = formData.brand_facebook_url;
        payload.brand_twitter_url = formData.brand_twitter_url;
        payload.brand_instagram_url = formData.brand_instagram_url;
        payload.brand_linkedin_url = formData.brand_linkedin_url;
      }

      if (user.role === 'ADMIN') {
        payload.openai_key = formData.openai_key;
        payload.default_domain = formData.default_domain;
        payload.branding_logo = formData.branding_logo;
        payload.agency_name = formData.agency_name;
        payload.agency_address = formData.agency_address;
        payload.hide_agency_address = formData.hide_agency_address;
        payload.agency_email = formData.agency_email;
        payload.hide_agency_email = formData.hide_agency_email;
        payload.agency_contact_no = formData.agency_contact_no;
        payload.hide_agency_contact_no = formData.hide_agency_contact_no;
        payload.agency_website = formData.agency_website;
        payload.hide_agency_website = formData.hide_agency_website;
        payload.agency_footer_text = formData.agency_footer_text;
        payload.hide_agency_footer_text = formData.hide_agency_footer_text;
        payload.agency_signature = formData.agency_signature;
        payload.hide_agency_signature = formData.hide_agency_signature;
        payload.hide_agency_signature_text = formData.hide_agency_signature_text;
        payload.agency_profile_text = formData.agency_profile_text;
        payload.client_self_serve_mode = formData.client_self_serve_mode;
        payload.show_agency_configs_to_staff = formData.show_agency_configs_to_staff;
        payload.show_agency_configs_to_clients = formData.show_agency_configs_to_clients;
        payload.show_reports_to_clients = formData.show_reports_to_clients;
        payload.agency_stripe_secret_key = formData.agency_stripe_secret_key;
        payload.agency_stripe_publishable_key = formData.agency_stripe_publishable_key;
        payload.media_vault_file_size_limit_mb = typeof formData.media_vault_file_size_limit_mb === 'string' ? parseInt(formData.media_vault_file_size_limit_mb) : formData.media_vault_file_size_limit_mb;
        payload.media_vault_total_size_limit_mb = typeof formData.media_vault_total_size_limit_mb === 'string' ? parseInt(formData.media_vault_total_size_limit_mb) : formData.media_vault_total_size_limit_mb;
      }

      if (user.role === 'ADMIN' || (user.role === 'CLIENT' && agencyConfig?.client_self_serve_mode)) {
        payload.smtp_host = formData.smtp_host;
        payload.smtp_port = formData.smtp_port ? parseInt(formData.smtp_port as string) : null;
        payload.smtp_user = formData.smtp_user;
        payload.smtp_password = formData.smtp_password;
        payload.smtp_from_email = formData.smtp_from_email;
        payload.whatsapp_access_token = formData.whatsapp_access_token;
        payload.whatsapp_phone_number_id = formData.whatsapp_phone_number_id;
      }

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setIsEditing(false);
        alert("Settings updated successfully!");
        setFormData((prev) => ({ ...prev, password: "" }));
      } else {
        const err = await res.json();
        alert(`Failed to update settings: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  if (!user) {
    return (
      <div className="p-8 max-w-2xl text-center text-zinc-500">
        Loading profile data...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Settings
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your profile and account preferences.
          </p>
        </div>
        <Button 
          variant={isEditing ? "outline" : "default"} 
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Modify"}
        </Button>
      </div>

      
      <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          Profile Details
        </button>
        {user.role === 'CLIENT' && (
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === 'brand'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Brand Vault
          </button>
        )}
        {(user.role === 'ADMIN' || agencyConfig?.can_see_agency_configs || (user.role === 'CLIENT' && agencyConfig?.client_self_serve_mode)) && (
          <button
            onClick={() => setActiveTab('agency')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === 'agency'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            {user.role === 'ADMIN' ? 'Agency Configurations' : 'Configurations'}
          </button>
        )}
        {(user.role === 'ADMIN' || (user.role === 'CLIENT' && agencyConfig?.client_self_serve_mode)) && (
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === 'automation'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Automation & SMTP
          </button>
        )}
        {user.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            Service Roles
          </button>
        )}
      </div>

      <fieldset disabled={!isEditing}>
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-zinc-900 p-6 rounded-xl border">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input 
                  id="first_name" 
                  name="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange} 
                  placeholder="e.g. John" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input 
                  id="last_name" 
                  name="last_name" 
                  value={formData.last_name} 
                  onChange={handleChange} 
                  placeholder="e.g. Doe" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input 
                id="company_name" 
                name="company_name" 
                value={formData.company_name} 
                onChange={handleChange} 
                placeholder="e.g. Acme Corp" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <div className="flex gap-2">
                <select 
                  className="w-24 h-10 px-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm"
                  value={(formData.phone_number || "").split(" ")[0]}
                  onChange={(e) => {
                    const currentNumber = (formData.phone_number || "").split(" ").slice(1).join(" ");
                    setFormData({ ...formData, phone_number: `${e.target.value} ${currentNumber}`.trim() })
                  }}
                >
                  <option value="">Code</option>
                  <option value="+1">US (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+91">IN (+91)</option>
                  <option value="+61">AU (+61)</option>
                  <option value="+977">NP (+977)</option>
                </select>
                <Input 
                  id="phone_number" 
                  name="phone_number" 
                  className="flex-1"
                  value={(formData.phone_number || "").split(" ").slice(1).join(" ")} 
                  onChange={(e) => {
                    const currentCode = (formData.phone_number || "").split(" ")[0];
                    setFormData({ ...formData, phone_number: `${currentCode} ${e.target.value}`.trim() })
                  }} 
                  placeholder="e.g. 555 123 4567" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Change Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Leave blank to keep current password" 
              />
            </div>
          </div>
        )}

        {activeTab === 'brand' && user.role === 'CLIENT' && (
          <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-zinc-900 p-6 rounded-xl border">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                Brand Vault
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                Manage your brand colors and social media links.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand_primary_color" className="text-zinc-500">Primary Color (Hex)</Label>
                  <div className="flex gap-2">
                    <input type="color" name="brand_primary_color" value={formData.brand_primary_color || "#6366f1"} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer border border-zinc-200" />
                    <Input id="brand_primary_color" name="brand_primary_color" value={formData.brand_primary_color} onChange={handleChange} placeholder="#6366f1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_secondary_color" className="text-zinc-500">Secondary Color (Hex)</Label>
                  <div className="flex gap-2">
                    <input type="color" name="brand_secondary_color" value={formData.brand_secondary_color || "#ffffff"} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer border border-zinc-200" />
                    <Input id="brand_secondary_color" name="brand_secondary_color" value={formData.brand_secondary_color} onChange={handleChange} placeholder="#ffffff" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand_facebook_url" className="text-zinc-500">Facebook URL</Label>
                <Input id="brand_facebook_url" name="brand_facebook_url" value={formData.brand_facebook_url} onChange={handleChange} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_twitter_url" className="text-zinc-500">Twitter URL</Label>
                <Input id="brand_twitter_url" name="brand_twitter_url" value={formData.brand_twitter_url} onChange={handleChange} placeholder="https://twitter.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_instagram_url" className="text-zinc-500">Instagram URL</Label>
                <Input id="brand_instagram_url" name="brand_instagram_url" value={formData.brand_instagram_url} onChange={handleChange} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_linkedin_url" className="text-zinc-500">LinkedIn URL</Label>
                <Input id="brand_linkedin_url" name="brand_linkedin_url" value={formData.brand_linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/..." />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agency' && (user.role === 'ADMIN' || agencyConfig?.can_see_agency_configs || (user.role === 'CLIENT' && agencyConfig?.client_self_serve_mode)) && (
          <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-zinc-900 p-6 rounded-xl border">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                {user.role === 'ADMIN' ? "Agency Configurations" : (agencyConfig?.client_self_serve_mode ? "Integrations & Configurations" : "Agency Configurations")}
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                {user.role === 'ADMIN' 
                  ? "Customize options and integrations for your agency." 
                  : (agencyConfig?.client_self_serve_mode ? "Configure your custom integrations and automation settings." : "View agency settings and configurations (Read Only).")}
              </p>
            </div>

            <div className="space-y-4">
              {user.role === 'ADMIN' && (
                <div className="space-y-2">
                  <Label htmlFor="openai_key" className="text-zinc-500">OpenAI API Key (For AI generation)</Label>
                  <Input 
                    id="openai_key" 
                    name="openai_key"
                    value={formData.openai_key}
                    onChange={handleChange}
                    placeholder="sk-proj-..." 
                  />
                </div>
              )}

              {user.role === 'ADMIN' && (
                <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-bold text-zinc-900">Billing & Subscriptions Integration</h3>
                  <p className="text-sm text-zinc-500">Connect your Stripe account to charge your clients directly.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agency_stripe_publishable_key" className="text-zinc-500">Stripe Publishable Key</Label>
                      <Input 
                        id="agency_stripe_publishable_key" 
                        name="agency_stripe_publishable_key"
                        value={formData.agency_stripe_publishable_key}
                        onChange={handleChange}
                        placeholder="pk_test_..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agency_stripe_secret_key" className="text-zinc-500">Stripe Secret Key</Label>
                      <Input 
                        id="agency_stripe_secret_key" 
                        name="agency_stripe_secret_key"
                        type="password"
                        value={formData.agency_stripe_secret_key}
                        onChange={handleChange}
                        placeholder="sk_test_..." 
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {(user.role === 'ADMIN' || agencyConfig?.can_see_agency_configs) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="default_domain" className="text-zinc-500">Default Subdomain Base</Label>
                    <Input 
                      id="default_domain" 
                      name="default_domain"
                      value={formData.default_domain}
                      onChange={handleChange}
                      placeholder="e.g. sites.youragency.com" 
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agency_name" className="text-zinc-500">Agency Name</Label>
                    <Input 
                      id="agency_name" 
                      name="agency_name"
                      value={formData.agency_name}
                      onChange={handleChange}
                      placeholder="e.g. Nexus Marketing" 
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="agency_address" className="text-zinc-500">Agency Address</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hide_agency_address" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide on Quotation</Label>
                        <input
                          type="checkbox"
                          id="hide_agency_address"
                          name="hide_agency_address"
                          checked={formData.hide_agency_address || false}
                          onChange={handleChange}
                          disabled={user.role !== 'ADMIN'}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                        />
                      </div>
                    </div>
                    <textarea 
                      id="agency_address" 
                      name="agency_address"
                      value={formData.agency_address}
                      onChange={(e) => setFormData({...formData, agency_address: e.target.value})}
                      placeholder="Enter agency address..." 
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
                      rows={3}
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="agency_email" className="text-zinc-500">Agency Email</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hide_agency_email" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide on Quotation</Label>
                        <input
                          type="checkbox"
                          id="hide_agency_email"
                          name="hide_agency_email"
                          checked={formData.hide_agency_email || false}
                          onChange={handleChange}
                          disabled={user.role !== 'ADMIN'}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                        />
                      </div>
                    </div>
                    <Input 
                      id="agency_email" 
                      name="agency_email"
                      value={formData.agency_email}
                      onChange={handleChange}
                      placeholder="e.g. contact@youragency.com" 
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="agency_contact_no" className="text-zinc-500">Contact No.</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hide_agency_contact_no" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide on Quotation</Label>
                        <input
                          type="checkbox"
                          id="hide_agency_contact_no"
                          name="hide_agency_contact_no"
                          checked={formData.hide_agency_contact_no || false}
                          onChange={handleChange}
                          disabled={user.role !== 'ADMIN'}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                        />
                      </div>
                    </div>
                    <Input 
                      id="agency_contact_no" 
                      name="agency_contact_no"
                      value={formData.agency_contact_no || ""}
                      onChange={handleChange}
                      placeholder="e.g. +1 800 555 1234" 
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="agency_website" className="text-zinc-500">Web Address</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hide_agency_website" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide on Quotation</Label>
                        <input
                          type="checkbox"
                          id="hide_agency_website"
                          name="hide_agency_website"
                          checked={formData.hide_agency_website || false}
                          onChange={handleChange}
                          disabled={user.role !== 'ADMIN'}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                        />
                      </div>
                    </div>
                    <Input 
                      id="agency_website" 
                      name="agency_website"
                      value={formData.agency_website || ""}
                      onChange={handleChange}
                      placeholder="e.g. www.youragency.com" 
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-500">Agency Logo</Label>
                    <LogoUploader 
                      value={formData.branding_logo}
                      onChange={(url) => setFormData({ ...formData, branding_logo: url })}
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-zinc-500">Authorized Signature Scan</Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 justify-end">
                          <Label htmlFor="hide_agency_signature" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide Image on Quotation</Label>
                          <input
                            type="checkbox"
                            id="hide_agency_signature"
                            name="hide_agency_signature"
                            checked={formData.hide_agency_signature || false}
                            onChange={handleChange}
                            disabled={user.role !== 'ADMIN'}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <Label htmlFor="hide_agency_signature_text" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide Text on Quotation</Label>
                          <input
                            type="checkbox"
                            id="hide_agency_signature_text"
                            name="hide_agency_signature_text"
                            checked={formData.hide_agency_signature_text || false}
                            onChange={handleChange}
                            disabled={user.role !== 'ADMIN'}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                          />
                        </div>
                      </div>
                    </div>
                    <LogoUploader 
                      value={formData.agency_signature}
                      onChange={(url) => setFormData({...formData, agency_signature: url})}
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="agency_footer_text" className="text-zinc-500">Quotation Footer Text</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="hide_agency_footer_text" className="text-xs text-zinc-400 font-normal cursor-pointer">Hide on Quotation</Label>
                        <input
                          type="checkbox"
                          id="hide_agency_footer_text"
                          name="hide_agency_footer_text"
                          checked={formData.hide_agency_footer_text || false}
                          onChange={handleChange}
                          disabled={user.role !== 'ADMIN'}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3 w-3"
                        />
                      </div>
                    </div>
                    <Input 
                      id="agency_footer_text" 
                      name="agency_footer_text"
                      value={formData.agency_footer_text || ""}
                      onChange={handleChange}
                      placeholder="e.g. Thank you for your business. Generated by Prixna IT Solution Pvt. Ltd. © 2026" 
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agency_profile_text" className="text-zinc-500">Company Profile / Introduction</Label>
                    <textarea 
                      id="agency_profile_text" 
                      name="agency_profile_text"
                      value={formData.agency_profile_text}
                      onChange={(e) => setFormData({...formData, agency_profile_text: e.target.value})}
                      placeholder="Briefly introduce your company..." 
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
                      rows={3}
                      disabled={user.role !== 'ADMIN'}
                    />
                  </div>

                  {user.role === 'ADMIN' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="media_vault_file_size_limit_mb" className="text-zinc-500">Max File Size (MB)</Label>
                        <Input 
                          id="media_vault_file_size_limit_mb" 
                          name="media_vault_file_size_limit_mb"
                          type="number"
                          value={formData.media_vault_file_size_limit_mb}
                          onChange={handleChange}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="media_vault_total_size_limit_mb" className="text-zinc-500">Total Client Quota (MB)</Label>
                        <Input 
                          id="media_vault_total_size_limit_mb" 
                          name="media_vault_total_size_limit_mb"
                          type="number"
                          value={formData.media_vault_total_size_limit_mb}
                          onChange={handleChange}
                          min="1"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <div className="flex items-center space-x-2 pt-4 border-t border-zinc-200 dark:border-zinc-800 pb-2">
                    <input 
                      type="checkbox" 
                      id="client_self_serve_mode"
                      name="client_self_serve_mode"
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      checked={formData.client_self_serve_mode}
                      onChange={handleChange}
                    />
                    <Label htmlFor="client_self_serve_mode" className="font-medium text-zinc-900 dark:text-zinc-100">
                      Enable Client Self-Serve Mode (Allows clients to configure their own domains and webhooks)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="show_agency_configs_to_staff"
                      name="show_agency_configs_to_staff"
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      checked={formData.show_agency_configs_to_staff}
                      onChange={handleChange}
                    />
                    <Label htmlFor="show_agency_configs_to_staff" className="text-zinc-600 dark:text-zinc-400">
                      Show configurations to Staff (Read-Only Mode)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="show_agency_configs_to_clients"
                      name="show_agency_configs_to_clients"
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      checked={formData.show_agency_configs_to_clients}
                      onChange={handleChange}
                    />
                    <Label htmlFor="show_agency_configs_to_clients" className="text-zinc-600 dark:text-zinc-400">
                      Show configurations to Clients (Read-Only Mode)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="show_reports_to_clients"
                      name="show_reports_to_clients"
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      checked={formData.show_reports_to_clients}
                      onChange={handleChange}
                    />
                    <Label htmlFor="show_reports_to_clients" className="text-zinc-600 dark:text-zinc-400">
                      Show Reports & Analytics to Clients
                    </Label>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'automation' && (user.role === 'ADMIN' || (user.role === 'CLIENT' && agencyConfig?.client_self_serve_mode)) && (
          <div className="space-y-8 animate-in fade-in duration-300 bg-white dark:bg-zinc-900 p-6 rounded-xl border">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Email Automation (SMTP)</h3>
              <p className="text-sm text-zinc-500">Configure SMTP to send automated lead alerts to your clients.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host" className="text-zinc-500">SMTP Host</Label>
                <Input id="smtp_host" name="smtp_host" value={formData.smtp_host} onChange={handleChange} placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port" className="text-zinc-500">SMTP Port</Label>
                <Input id="smtp_port" name="smtp_port" type="number" value={formData.smtp_port} onChange={handleChange} placeholder="465" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_user" className="text-zinc-500">SMTP User</Label>
                <Input id="smtp_user" name="smtp_user" value={formData.smtp_user} onChange={handleChange} placeholder="alerts@youragency.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_password" className="text-zinc-500">SMTP Password</Label>
                <Input id="smtp_password" name="smtp_password" type="password" value={formData.smtp_password} onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp_from_email" className="text-zinc-500">From Email Address</Label>
              <Input id="smtp_from_email" name="smtp_from_email" value={formData.smtp_from_email} onChange={handleChange} placeholder="alerts@youragency.com" />
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">WhatsApp Automation</h3>
              <p className="text-sm text-zinc-500 mb-6">Configure Meta Cloud API credentials to instantly send WhatsApp lead alerts to you and your clients.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_access_token" className="text-zinc-500">System User Access Token</Label>
                  <Input id="whatsapp_access_token" name="whatsapp_access_token" type="password" value={formData.whatsapp_access_token || ""} onChange={handleChange} placeholder="EAAL..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_phone_number_id" className="text-zinc-500">Phone Number ID</Label>
                  <Input id="whatsapp_phone_number_id" name="whatsapp_phone_number_id" value={formData.whatsapp_phone_number_id || ""} onChange={handleChange} placeholder="123456789012345" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditing && activeTab !== 'roles' && (
          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg" className="w-full sm:w-auto">
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </fieldset>

      {activeTab === 'roles' && user.role === 'ADMIN' && (
        <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-zinc-900 p-6 rounded-xl border">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
              Service Roles
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Manage predefined roles for Specialist Squads and Tasks. These appear as suggestions when assigning staff.
            </p>
          </div>

          <div className="flex gap-2">
            <Input 
              placeholder="New Role (e.g. Web3 Developer)" 
              value={newRoleName} 
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
            />
            <Button onClick={handleAddRole} disabled={isLoadingRoles || !newRoleName.trim()}>
              {isLoadingRoles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </div>

          <div className="mt-6 border rounded-lg overflow-hidden divide-y">
            {serviceRoles.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">No custom roles defined yet.</div>
            ) : (
              serviceRoles.map(role => (
                <div key={role.id} className="p-3 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  {editingRoleId === role.id ? (
                    <div className="flex flex-1 items-center gap-2 mr-4">
                      <Input 
                        value={editRoleName}
                        onChange={(e) => setEditRoleName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditRole(role.id)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleEditRole(role.id)}
                        className="text-green-600 hover:text-green-700 p-1 rounded-md"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingRoleId(null)}
                        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-sm">{role.name}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setEditingRoleId(role.id);
                            setEditRoleName(role.name);
                          }}
                          className="text-zinc-400 hover:text-indigo-500 p-2 rounded-md transition-colors"
                          title="Edit Role"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-zinc-400 hover:text-red-500 p-2 rounded-md transition-colors"
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
