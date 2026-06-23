"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  Crop, Maximize, RotateCcw, ImageMinus, Wand2, 
  Palette, Eraser, Smile, SlidersHorizontal, Scissors, 
  Combine, Music, Type, FileVideo, Download, Save, Upload
} from "lucide-react";

export default function MediaEditorPage() {
  const [activeTab, setActiveTab] = useState<"photo" | "video">("photo");

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Editor</h1>
          <p className="text-sm text-muted-foreground">Professional photo and video editing powered by AI.</p>
        </div>
        <div className="flex space-x-2 bg-white/5 p-1 rounded-xl border border-glass-border">
          <button 
            onClick={() => setActiveTab("photo")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "photo" ? "bg-primary text-white" : "hover:text-white"}`}
          >
            Photo Editor
          </button>
          <button 
            onClick={() => setActiveTab("video")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "video" ? "bg-orange-500 text-white" : "hover:text-white"}`}
          >
            Video Editor
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Toolbar */}
        <GlassCard className="w-64 flex flex-col p-4 overflow-y-auto border-r border-glass-border/40">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Tools</h3>
          
          {activeTab === "photo" ? (
            <div className="space-y-1">
              <ToolButton icon={<Crop />} label="Crop" />
              <ToolButton icon={<Maximize />} label="Resize" />
              <ToolButton icon={<RotateCcw />} label="Rotate" />
              <ToolButton icon={<ImageMinus />} label="Remove BG" highlight />
              <ToolButton icon={<Wand2 />} label="AI Enhance" highlight />
              <ToolButton icon={<Palette />} label="Color Correction" />
              <ToolButton icon={<Eraser />} label="Object Removal" highlight />
              <ToolButton icon={<Smile />} label="Face Enhancement" />
              <ToolButton icon={<SlidersHorizontal />} label="Filters" />
            </div>
          ) : (
            <div className="space-y-1">
              <ToolButton icon={<Scissors />} label="Cut / Split" />
              <ToolButton icon={<Combine />} label="Merge Clips" />
              <ToolButton icon={<Music />} label="Add Music" />
              <ToolButton icon={<Type />} label="Subtitles" />
              <ToolButton icon={<Wand2 />} label="AI Enhancement" highlight />
              <ToolButton icon={<FileVideo />} label="Convert Format" />
            </div>
          )}
        </GlassCard>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <GlassCard className="flex-1 flex items-center justify-center bg-black/20 border border-glass-border/40 relative overflow-hidden">
            <div className="text-center text-muted-foreground">
              <Upload className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">Upload a {activeTab === "photo" ? "photo" : "video"} to start editing</p>
              <Button variant="outline" className="mt-4">Select File</Button>
            </div>
          </GlassCard>
          
          {/* Action Bar */}
          <div className="h-16 mt-4 glass-panel border border-glass-border/40 flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">Undo</Button>
              <Button variant="ghost" size="sm">Redo</Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, highlight = false }: { icon: React.ReactNode, label: string, highlight?: boolean }) {
  return (
    <button className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      highlight 
        ? "text-primary hover:bg-primary/10 font-medium" 
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    }`}>
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
