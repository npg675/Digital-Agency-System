"use client";

import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Users, Zap, LayoutTemplate, ShieldCheck, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function AgencyStorefront() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const pageRes = await fetch(`${API}/pages/slug/agency-storefront`);
      let landingPageId = null;
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        landingPageId = pageData.id;
      }

      if (!landingPageId) {
        throw new Error("Agency Storefront landing page not configured. Please create a page with slug 'agency-storefront'.");
      }

      const leadRes = await fetch(`${API}/leads/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, landing_page_id: landingPageId })
      });

      if (leadRes.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden transition-colors">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/50 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center transform -rotate-6">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">LandingForge</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#services" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Services</a>
            <a href="#features" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Platform</a>
            <Link href="/admin/login" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Client Login
            </Link>
            <a href="#contact" className="px-5 py-2.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
              Get Started
            </a>
            <ThemeToggle />
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <button 
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6 transition-colors">
          <div className="flex justify-end">
            <button 
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          <div className="flex flex-col gap-6 mt-12 text-center">
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-white">Services</a>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-white">Platform</a>
            <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-zinc-900 dark:text-white">
              Client Login
            </Link>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="mx-auto mt-6 px-8 py-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full text-lg font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
              Get Started
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 dark:bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none transition-colors" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-fuchsia-600/10 dark:bg-fuchsia-600/20 blur-[120px] rounded-full pointer-events-none transition-colors" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-300 font-medium mb-8 transition-colors">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Accepting New Clients
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-white dark:to-zinc-500 max-w-4xl leading-[1.1] mb-8 transition-colors">
              Scale Your Revenue With High-Converting Funnels.
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-12 transition-colors">
              We build, manage, and optimize enterprise-grade landing pages and automated CRM pipelines that turn clicks into paying customers.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <a href="#contact" className="px-8 py-4 bg-indigo-600 text-white rounded-full text-base font-bold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 group">
                Book a Free Strategy Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services / Value Prop */}
      <section id="services" className="py-24 px-6 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/50 transition-colors">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <div className="text-center mb-16">
              <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold mb-4">Everything you need to grow.</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg transition-colors">Stop juggling 10 different tools. We provide the complete infrastructure for lead generation.</motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:shadow-lg dark:hover:bg-white/[0.07] transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <LayoutTemplate className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast Pages</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors">
                  We build conversion-optimized landing pages that load instantly and look beautiful on every device.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:shadow-lg dark:hover:bg-white/[0.07] transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-500/20 flex items-center justify-center mb-6 text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Automated CRM</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors">
                  Every lead flows directly into your dedicated client portal. Manage pipelines and track conversions effortlessly.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:shadow-lg dark:hover:bg-white/[0.07] transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Transparent ROI</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed transition-colors">
                  Automated performance reports delivered straight to your inbox showing exactly what your ad spend is generating.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 border-t border-zinc-200 dark:border-white/5 relative overflow-hidden transition-colors">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-indigo-600/10 dark:bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none transition-colors" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-xl dark:shadow-2xl transition-all">
            <div className="text-center mb-10">
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">Ready to scale?</motion.h2>
              <motion.p variants={fadeUp} className="text-zinc-600 dark:text-zinc-400 transition-colors">Fill out the form below and our team will be in touch within 24 hours.</motion.p>
            </div>

            <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center transition-colors">
                  Something went wrong. Please ensure an internal landing page with slug 'agency-storefront' exists.
                </div>
              )}
              
              {status === "success" ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Message Received!</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 transition-colors">We'll be in touch shortly.</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full h-12 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full h-12 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full h-12 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm dark:shadow-none"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">How can we help?</label>
                    <textarea 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full h-32 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-sm dark:shadow-none"
                      placeholder="Tell us about your business goals..."
                    />
                  </div>
                  <button 
                    disabled={status === "submitting"}
                    className="w-full h-14 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl text-base font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === "submitting" ? "Sending..." : "Submit Inquiry"}
                  </button>
                </>
              )}
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-zinc-200 dark:border-white/5 text-center px-6 transition-colors">
        <p className="text-zinc-500 dark:text-zinc-500 text-sm">© {new Date().getFullYear()} LandingForge Agency. All rights reserved.</p>
      </footer>
    </div>
  );
}
