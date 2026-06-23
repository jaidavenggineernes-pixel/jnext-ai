"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bot, Code2, Image as ImageIcon, Video, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 glass-panel border-b border-glass-border/40 rounded-none bg-glass-bg/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">JNext</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="glass" className="bg-primary/90 text-primary-foreground border-0 hover:bg-primary">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-16">
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container mx-auto px-4 text-center max-w-5xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI Platform</span> for Everything
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            JNext combines the power of Chat, Coding, Image Generation, and Video Editing into one seamless, stunning workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-8 text-lg w-full sm:w-auto h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity border-0">
                Start Creating Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="glass" className="rounded-full px-8 text-lg w-full sm:w-auto h-14">
                Watch Demo
              </Button>
            </Link>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          id="features" 
          className="container mx-auto px-4 mt-32"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One platform. Infinite possibilities.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need to create, code, and converse.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard hoverEffect className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Chat Assistant</h3>
              <p className="text-sm text-muted-foreground">Advanced reasoning, research, and writing assistant powered by industry-leading models.</p>
            </GlassCard>

            <GlassCard hoverEffect className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Coding Copilot</h3>
              <p className="text-sm text-muted-foreground">Generate, debug, and review code in over 50 programming languages instantly.</p>
            </GlassCard>

            <GlassCard hoverEffect className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Image Studio</h3>
              <p className="text-sm text-muted-foreground">Create stunning AI art, realistic photos, and vectors from simple text prompts.</p>
            </GlassCard>

            <GlassCard hoverEffect className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Video Generator</h3>
              <p className="text-sm text-muted-foreground">Generate and edit cinematic videos with AI. Text-to-video made simple.</p>
            </GlassCard>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
