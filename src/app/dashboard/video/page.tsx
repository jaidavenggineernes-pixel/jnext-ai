"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Video, Film, RefreshCw, Upload, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoCreatorPage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isMotionGraphics, setIsMotionGraphics] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedVideo(null);
    
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate video");
      }
      
      setGeneratedVideo(data.videoUrl);
      setIsMotionGraphics(data.isMotionGraphics || false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    // Route download through our backend proxy to avoid CORS issues
    window.location.href = `/api/download?url=${encodeURIComponent(generatedVideo)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Creator</h1>
          <p className="text-sm text-muted-foreground">Generate cinematic videos from text or images.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <GlassCard className="p-4 space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Video Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 rounded-xl border border-glass-border bg-white/5 p-3 text-sm backdrop-blur-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the video scene in detail (e.g. A cinematic shot of a cyberpunk city at night with neon lights...)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-10 text-xs ${aspectRatio === "1:1" ? "border-orange-500 text-orange-500 bg-orange-500/10" : ""}`}
                    onClick={() => setAspectRatio("1:1")}
                  >1:1 (Square)</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-10 text-xs ${aspectRatio === "16:9" ? "border-orange-500 text-orange-500 bg-orange-500/10" : ""}`}
                    onClick={() => setAspectRatio("16:9")}
                  >16:9 (Landscape)</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-10 text-xs ${aspectRatio === "9:16" ? "border-orange-500 text-orange-500 bg-orange-500/10" : ""}`}
                    onClick={() => setAspectRatio("9:16")}
                  >9:16 (Portrait)</Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Starting Image (Optional)</label>
                <div className="border-2 border-dashed border-glass-border rounded-xl p-4 text-center cursor-pointer hover:bg-white/5 transition-colors">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <select className="w-full rounded-xl border border-glass-border bg-white/5 p-2.5 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
                  <option className="bg-background text-foreground">3 seconds (Fast)</option>
                  <option className="bg-background text-foreground">5 seconds (Standard)</option>
                  <option className="bg-background text-foreground">10 seconds (Pro)</option>
                </select>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isGenerating || !prompt}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Rendering...
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4 mr-2" /> Generate Video
                  </>
                )}
              </Button>
            </form>
          </GlassCard>
        </div>

        <div className="xl:col-span-2">
          <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center p-2 relative overflow-hidden bg-black/40">
            {isGenerating ? (
              <div className="flex flex-col items-center text-orange-500">
                <Video className="w-12 h-12 animate-pulse mb-4" />
                <p className="animate-pulse">Rendering your cinematic shot...</p>
                <div className="w-64 h-1 bg-glass-border mt-4 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-1/3 animate-[pulse_3s_ease-in-out_infinite] rounded-full"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">This usually takes 1-2 minutes</p>
              </div>
            ) : errorMsg ? (
              <div className="text-center text-red-500 max-w-md p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{errorMsg}</p>
              </div>
            ) : generatedVideo ? (
              <div className={`relative group rounded-lg overflow-hidden flex items-center justify-center shadow-2xl ${
                aspectRatio === "1:1" ? "aspect-square w-[400px]" : 
                aspectRatio === "9:16" ? "aspect-[9/16] h-[500px]" : 
                "aspect-video w-full"
              }`}>
                {isMotionGraphics ? (
                  <motion.img 
                    initial={{ scale: 1.0, x: 0, y: 0 }}
                    animate={{ scale: 1.15, x: Math.random() > 0.5 ? -15 : 15, y: Math.random() > 0.5 ? -10 : 10 }}
                    transition={{ duration: 30, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                    src={generatedVideo} 
                    alt={prompt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    src={generatedVideo} 
                    autoPlay 
                    loop 
                    controls 
                    className="w-full h-full object-cover"
                  />
                )}
                {isMotionGraphics && (
                  <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-md border border-white/10 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                    AI Cinematic Render
                  </div>
                )}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="bg-background/80 backdrop-blur-md hover:bg-background"
                    onClick={handleDownloadVideo}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Your generated video will appear here</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
