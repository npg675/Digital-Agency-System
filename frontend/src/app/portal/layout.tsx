"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, FileText, Calendar, LogOut, CheckSquare } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Course portal is publicly accessible for preview (no auth required to view)
  const isPublicRoute = pathname?.startsWith("/portal/quote/") || pathname?.startsWith("/portal/courses/");
  const isAdminPreviewing = user?.role === "ADMIN" || user?.role === "STAFF";

  useEffect(() => {
    if (isPublicRoute) return;
    if (isAdminPreviewing) return;
    
    // Wait for hydration — if token is not yet resolved, don't redirect yet
    if (token === undefined) return;
    
    // If not logged in or not a client, redirect
    if (!token) {
      router.push("/admin/login");
    } else if (user?.role !== "CLIENT") {
      router.push("/");
    }
  }, [token, user, router, isPublicRoute, isAdminPreviewing]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!token) return null;

  const navItems = [
    { name: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { name: "My Invoices", href: "/portal/invoices", icon: FileText },
    // You can add more routes later like My Tasks, My Files, etc.
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/20">
              P
            </div>
            <span className="font-bold text-xl tracking-tight">Client Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {user?.first_name?.charAt(0) || "C"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.company_name}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push("/"); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
