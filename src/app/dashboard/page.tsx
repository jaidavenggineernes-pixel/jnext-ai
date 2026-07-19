import { GlassCard } from "@/components/ui/GlassCard";
import { Bot, Code2, Image as ImageIcon, Video, ArrowRight, History, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardOverview() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">What would you like to create today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[180px]">
        {/* Welcome Hero - Span 2 cols, 2 rows */}
        <GlassCard className="md:col-span-2 lg:col-span-2 row-span-2 flex flex-col justify-between bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-10 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          
          <div className="relative z-10 flex-1">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Unleash Your Creativity</h2>
            <p className="text-muted-foreground text-sm max-w-sm">JNext provides the ultimate suite of AI tools. From writing complex algorithms to directing cinematic videos, everything happens here.</p>
          </div>
          <div className="relative z-10 mt-6 flex gap-4">
            <Link href="/dashboard/chat">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg shadow-primary/25">
                Start Chatting <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </GlassCard>

        {/* AI Chat Widget */}
        <GlassCard hoverEffect className="flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">AI Chat</h3>
            <p className="text-xs text-muted-foreground">Advanced reasoning & writing</p>
          </div>
          <Link href="/dashboard/chat" className="absolute inset-0 z-20" />
        </GlassCard>

        {/* Coding Widget */}
        <GlassCard hoverEffect className="flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-emerald-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Coding Copilot</h3>
            <p className="text-xs text-muted-foreground">Write & debug code instantly</p>
          </div>
          <Link href="/dashboard/coding" className="absolute inset-0 z-20" />
        </GlassCard>

        {/* Image Studio Widget - Span 2 cols */}
        <GlassCard hoverEffect className="md:col-span-2 lg:col-span-2 flex flex-row items-center justify-between group bg-pink-500/5 border-pink-500/20 overflow-hidden relative">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
              <ImageIcon className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold mb-1">Image Studio</h3>
            <p className="text-sm text-muted-foreground">Generate stunning visuals</p>
          </div>
          <div className="relative z-10 w-32 h-32 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
            <ImageIcon className="w-full h-full text-pink-500 blur-xl group-hover:blur-md" />
          </div>
          <Link href="/dashboard/image" className="absolute inset-0 z-20" />
        </GlassCard>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight mb-4">Recent Activity</h2>
        <GlassCard>
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>You haven&apos;t created anything yet.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
