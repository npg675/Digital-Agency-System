"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useCrossTabSync } from "@/store/useSyncStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, Settings, LogOut, Copy, Users, BarChart2, Menu, X, Bell, Activity, CheckCircle2, Clock, ListTree, Calendar, CreditCard, Megaphone, MessageSquare, Share2, Star, Route, Zap, GraduationCap, Pin, PinOff, Video, Film, Lightbulb, Target, Search, Edit2, Globe, MapPin, Network } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlaybookBackButton } from "@/components/PlaybookBackButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, logout, setUser } = useAuthStore();
  useCrossTabSync();
  const [agencyConfig, setAgencyConfig] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [resumeSession, setResumeSession] = useState<{ id: string; name: string; url: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";
  const isOnDashboardOrPages = pathname === "/admin" || pathname === "/admin/pages";

  // Check for a saved editor session to resume
  useEffect(() => {
    if (!isOnDashboardOrPages) return;
    try {
      const raw = localStorage.getItem('lastEditorSession');
      if (raw) {
        const session = JSON.parse(raw);
        // Only show if session is less than 7 days old
        const savedAt = new Date(session.savedAt);
        const ageHours = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
        if (session.id && session.url && ageHours < 168) {
          setResumeSession(session);
        } else {
          localStorage.removeItem('lastEditorSession');
        }
      }
    } catch (_) {}
  }, [isOnDashboardOrPages, pathname]);

  const handleResumeSession = () => {
    if (resumeSession) {
      router.push(resumeSession.url);
      setResumeSession(null);
    }
  };

  const handleDismissSession = () => {
    try { localStorage.removeItem('lastEditorSession'); } catch (_) {}
    setResumeSession(null);
  };

  useEffect(() => {
    if (!token && !isLoginPage) {
      router.push("/admin/login");
    } else if (token && isLoginPage) {
      router.push("/admin");
    }
  }, [token, router, isLoginPage]);

  // Fetch user if we have token
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          // Token might be invalid
          logout();
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    if (token) {
      fetchUser();
    }
  }, [token, logout, router, setUser]);

  // Fetch agency config to know if we should show the Reports tab to clients
  useEffect(() => {
    const fetchAgencyConfig = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/agency-config`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const config = await res.json();
          setAgencyConfig(config);
        }
      } catch (err) {
        console.error("Failed to fetch agency config", err);
      }
    };
    if (token) {
      fetchAgencyConfig();
    }
  }, [token, user]);

  // Fetch unread notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/notifications/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const notifs = await res.json();
          setUnreadNotifications(notifs.filter((n: any) => !n.is_read).length);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (token) {
      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  if (!token && !isLoginPage) {
    return null; // or a loading spinner
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {agencyConfig?.branding_logo ? (
            <img src={agencyConfig.branding_logo} alt="Logo" className="w-7 h-7 object-contain shrink-0 rounded" />
          ) : (
            <div className="w-7 h-7 shrink-0 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-sm">
              {(agencyConfig?.agency_name || "LF").substring(0,2).toUpperCase()}
            </div>
          )}
          <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-tight break-words pr-4">
            {agencyConfig?.agency_name || "LandingForge"}
          </h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/admin/notifications" className="relative p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </Link>
          <div className="scale-90 flex items-center"><ThemeToggle /></div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        group fixed inset-y-0 left-0 z-50 border-r bg-white dark:bg-zinc-950 flex flex-col 
        transition-all duration-200 ease-in-out overflow-hidden
        ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0"}
        ${!isMobileMenuOpen && (isSidebarPinned ? "md:w-64" : "md:w-14 md:hover:w-64")}
      `}>
        <div className="py-2 px-4 border-b border-zinc-200 dark:border-zinc-800 hidden md:flex flex-col justify-center h-16 shrink-0 whitespace-nowrap relative">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 overflow-hidden">
              {agencyConfig?.branding_logo ? (
                <img src={agencyConfig.branding_logo} alt="Logo" className="w-6 h-6 object-contain shrink-0 rounded" />
              ) : (
                <div className="w-6 h-6 shrink-0 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-xs shadow-sm">
                  {(agencyConfig?.agency_name || "LF").substring(0,2).toUpperCase()}
                </div>
              )}
              <h1 className={`text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight mt-0.5 transition-opacity duration-200 ${isSidebarPinned ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"}`}>
                {agencyConfig?.agency_name || "LandingForge"}
              </h1>
            </div>
            
            <button 
              onClick={() => setIsSidebarPinned(!isSidebarPinned)}
              className={`p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-opacity duration-200 ${isSidebarPinned ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"}`}
              title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isSidebarPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          </div>
          <div className={`flex items-center gap-1 w-full pl-8 mt-0.5 transition-opacity duration-200 ${isSidebarPinned ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"}`}>
            <Link href="/admin/notifications" className="relative text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors" title="Notifications">
              <Bell className="w-3.5 h-3.5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Link>
            {/* Future notification icons can be added here seamlessly */}
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 mt-16 md:mt-0 overflow-y-auto overflow-x-hidden whitespace-nowrap [&_svg]:shrink-0 sidebar-scroll">
          <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/admin/pages" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <FileText className="w-5 h-5" />
            Landing Pages
          </Link>
          <Link href="/admin/campaigns" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Campaigns
          </Link>
          <Link href="/admin/marketing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Megaphone className="w-5 h-5" />
            Marketing Hub
          </Link>
          <Link href="/admin/video-studio" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Video className="w-5 h-5 text-indigo-500" />
            Video Studio
          </Link>
          <Link href="/admin/video-library" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Film className="w-5 h-5 text-violet-500" />
            Video Library
          </Link>
          <Link href="/admin/inspiration" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Ad Inspiration
          </Link>
          
          {/* Strategy & Intelligence */}
          <div className="pt-2 pb-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Strategy & Intelligence</p>
          </div>
          <Link href="/admin/strategy" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Target className="w-5 h-5 text-rose-500" />
            The War Room
          </Link>
          <Link href="/admin/competitors" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Search className="w-5 h-5 text-indigo-500" />
            Competitor Recon
          </Link>
          <Link href="/admin/seo-audits" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Globe className="w-5 h-5 text-teal-500" />
            Technical SEO Audits
          </Link>
          <Link href="/admin/local-seo" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <MapPin className="w-5 h-5 text-red-500" />
            Local SEO & GMB
          </Link>
          <Link href="/admin/content-strategy" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Network className="w-5 h-5 text-fuchsia-500" />
            AI Content Strategy
          </Link>
          <Link href="/admin/prospector" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Activity className="w-5 h-5 text-emerald-500" />
            AI Prospector
          </Link>
          {(user?.role !== 'CLIENT' || agencyConfig?.show_reports_to_clients) && (
            <Link href="/admin/reports" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <BarChart2 className="w-5 h-5" />
              Reports
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/templates" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <Copy className="w-5 h-5" />
              Templates
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/workflows" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <ListTree className="w-5 h-5" />
              SLA Workflows
            </Link>
          )}
          <Link href="/admin/leads" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Users className="w-5 h-5" />
            Leads
          </Link>
          {user?.role !== 'CLIENT' && (
            <Link href="/admin/inbox" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <MessageSquare className="w-5 h-5" />
              Unified Inbox
            </Link>
          )}
          <Link href="/admin/social" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Share2 className="w-5 h-5" />
            Social Media
          </Link>
          <Link href="/admin/content-calendar" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Calendar className="w-5 h-5 text-pink-500" />
            Content Calendar
          </Link>
          <Link href="/admin/courses" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <GraduationCap className="w-5 h-5" />
            Courses
          </Link>
          <Link href="/admin/automations" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Zap className="w-5 h-5" />
            Automations
          </Link>
          <Link href="/admin/funnels" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Route className="w-5 h-5 text-indigo-500" />
            Funnels
          </Link>
          <Link href="/admin/reputation" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Star className="w-5 h-5 text-amber-500" />
            Reputation
          </Link>
          <Link href="/admin/calendar" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Calendar className="w-5 h-5" />
            Calendar
          </Link>
          <Link href="/admin/invoices" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <CreditCard className="w-5 h-5" />
            Invoices
          </Link>
          <Link href="/admin/quotations" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <FileText className="w-5 h-5" />
            Quotations
          </Link>
          {user?.role !== 'CLIENT' && (
            <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <Users className="w-5 h-5" />
              Users
            </Link>
          )}
          {user?.role !== 'CLIENT' && (
            <Link href="/admin/tasks" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <CheckCircle2 className="w-5 h-5" />
              Tasks
            </Link>
          )}
          {user?.role === 'CLIENT' && (
            <Link href="/admin/timeline" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <Clock className="w-5 h-5" />
              Project Timeline
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/performance" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <BarChart2 className="w-5 h-5" />
              Performance & SLAs
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/activity-logs" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <Activity className="w-5 h-5" />
              Activity Logs
            </Link>
          )}
          
          <Link href="/admin/notifications" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              Notifications
            </div>
            {unreadNotifications > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadNotifications}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-start gap-4 overflow-hidden whitespace-nowrap [&_svg]:shrink-0">
          <Link href="/admin/settings" title="Settings" onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
          <Link href="/admin/billing" title="Billing & Plans" onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <CreditCard className="w-4 h-4" />
          </Link>
          <div className="flex items-center scale-90">
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout}
            title={user?.full_name ? `Logout ${user.full_name}` : (user?.email ? `Logout ${user.email}` : "Logout")}
            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto mt-16 md:mt-0 relative w-full transition-all duration-200 ease-in-out ${isSidebarPinned ? "md:pl-64" : "md:pl-14"}`}>
        <PlaybookBackButton />

        {/* ── Resume Last Session Banner ── */}
        {resumeSession && isOnDashboardOrPages && (
          <div className="mx-4 mt-4 mb-0 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <Edit2 className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                Resume editing: <span className="font-bold">{resumeSession.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleResumeSession}
                className="px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors"
              >
                Resume Editing
              </button>
              <button
                onClick={handleDismissSession}
                className="p-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
