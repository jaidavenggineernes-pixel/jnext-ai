import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import Link from "next/link";
import { LayoutDashboard, Ticket, LogOut, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0000] text-white selection:bg-orange-500/30 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-red-900/20 bg-gradient-to-b from-black to-[#1a0505] hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto z-40">
        <div className="p-6">
          <Link href="/admin" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              A
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">
              ADMIN
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/admin" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-950/50 text-red-100 hover:text-white transition-colors group">
            <LayoutDashboard className="w-5 h-5 text-red-400 group-hover:text-red-300" />
            <span className="font-medium text-sm">Overview</span>
          </Link>
          <Link href="/admin/codes" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-950/50 text-red-100 hover:text-white transition-colors group">
            <Ticket className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
            <span className="font-medium text-sm">Activation Codes</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-red-900/20 mt-auto">
          <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to User App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0000] relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-red-900/10 blur-[100px] pointer-events-none" />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          <header className="mb-8 flex items-center justify-between md:hidden">
            <Link href="/admin" className="text-xl font-black text-red-500">ADMIN PORTAL</Link>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
