"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, Settings, LogOut, Copy, Users, BarChart2, Menu, X, Bell, Activity, CheckCircle2, Clock, ListTree, Calendar, CreditCard, Megaphone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, logout, setUser } = useAuthStore();
  const [agencyConfig, setAgencyConfig] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

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
        <div className="flex items-center gap-3">
          {agencyConfig?.branding_logo ? (
            <img src={agencyConfig.branding_logo} alt="Agency Logo" className="h-8 max-w-full object-contain" />
          ) : (
            <h1 className="text-xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50">
              {agencyConfig?.agency_name || "LandingForge"}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/notifications" className="relative p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </Link>
          <ThemeToggle />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
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
        fixed md:static inset-y-0 left-0 z-50 w-64 border-r bg-white dark:bg-zinc-950 flex flex-col 
        transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 border-b hidden md:flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {agencyConfig?.branding_logo ? (
              <img src={agencyConfig.branding_logo} alt="Agency Logo" className="h-8 max-w-full object-contain" />
            ) : (
              <h1 className="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50">
                {agencyConfig?.agency_name || "LandingForge"}
              </h1>
            )}
          </div>
          <Link href="/admin/notifications" className="relative p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0 overflow-y-auto">
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

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Theme</span>
            <ThemeToggle />
          </div>
          <Link href="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <Link href="/admin/billing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <CreditCard className="w-5 h-5" />
            Billing & Plans
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-16 md:mt-0 relative w-full">
        {children}
      </main>
    </div>
  );
}
