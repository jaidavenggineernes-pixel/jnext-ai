"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Code2, Image as ImageIcon, Video, History, Settings, LogOut, User, CreditCard, Cog } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Coding Assistant", href: "/dashboard/coding", icon: Code2 },
    { name: "Image Studio", href: "/dashboard/image", icon: ImageIcon },
    { name: "Video Creator", href: "/dashboard/video", icon: Video },
    { name: "History", href: "/dashboard/history", icon: History },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Cog },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-black text-white selection:bg-primary/30">
      
      {/* MOBILE TOPBAR */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-md z-40">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">JNext</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          {isMobileMenuOpen ? <LogOut className="w-5 h-5 rotate-180" /> : <LayoutDashboard className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="absolute inset-0 top-[73px] z-40 bg-black/95 backdrop-blur-xl flex flex-col md:hidden p-4 overflow-y-auto border-t border-white/5">
          <div className="flex-1 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-4 px-4 py-4 rounded-2xl text-base font-medium transition-all relative border border-transparent",
                    isActive 
                      ? "text-white bg-primary/10 border-primary/20" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-auto pt-6 pb-8 border-t border-white/10">
            <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-4 px-4 py-4 rounded-2xl text-base font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
              <Settings className="w-6 h-6" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="w-72 h-full p-6 flex-col z-20 hidden md:flex">
        <aside className="w-full h-full glass-panel border border-glass-border/40 rounded-3xl flex flex-col overflow-hidden shadow-2xl bg-black/20">
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">JNext</span>
            </Link>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group",
                    isActive 
                      ? "text-white" 
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {/* Hover/Active Indicator Background */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl border-l-2 border-primary" />
                  )}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                  
                  <item.icon className={cn("w-5 h-5 relative z-10", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "text-muted-foreground group-hover:text-white")} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/5 space-y-2 bg-black/10">
            <Link href="/dashboard/settings" className="flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <div className="flex items-center justify-between px-3 py-3 mt-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white">My Account</span>
                  <span className="text-[10px] text-muted-foreground">Pro Plan</span>
                </div>
              </div>
              <button className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 p-4 md:p-6 md:pl-0">
        <div className="w-full h-full rounded-2xl md:rounded-3xl relative">
          {children}
        </div>
      </main>
    </div>
  );
}
