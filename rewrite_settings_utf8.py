import codecs

with codecs.open("frontend/src/app/admin/settings/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find('<fieldset disabled={!isEditing}')
ui_head = content[:start_idx]

new_ui = """<fieldset disabled={!isEditing}>
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
                    <Label htmlFor="branding_logo" className="text-zinc-500">Agency Logo URL</Label>
                    <Input 
                      id="branding_logo" 
                      name="branding_logo"
                      value={formData.branding_logo}
                      onChange={handleChange}
                      placeholder="https://youragency.com/logo.png" 
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

        {isEditing && (
          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg" className="w-full sm:w-auto">
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </fieldset>
    </div>
  );
}
"""

final_content = ui_head + new_ui

with codecs.open("frontend/src/app/admin/settings/page.tsx", "w", encoding="utf-8") as f:
    f.write(final_content)
