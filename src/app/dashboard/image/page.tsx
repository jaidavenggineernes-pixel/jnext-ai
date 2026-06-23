"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Image as ImageIcon, Wand2, Download, RefreshCw, Layers } from "lucide-react";

export default function ImageStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("None");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;
    
    setIsGenerating(true);
    setErrorMsg(null);
    
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, aspectRatio, negativePrompt })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate image");
      }
      
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    // Route download through our backend proxy to avoid CORS issues
    window.location.href = `/api/download?url=${encodeURIComponent(generatedImage)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Image Studio</h1>
          <p className="text-sm text-muted-foreground">Generate stunning visuals from text descriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-4 space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 rounded-xl border border-glass-border bg-white/5 p-3 text-sm backdrop-blur-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe the image you want to create..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-xl border border-glass-border bg-white/5 p-2.5 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option className="bg-background text-foreground" value="None">None</option>
                  <option className="bg-background text-foreground">Anime / Manga</option>
                  <option className="bg-background text-foreground">Digital Art</option>
                  <option className="bg-background text-foreground">3D Render</option>
                  <option className="bg-background text-foreground">Cinematic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-10 text-xs ${aspectRatio === "1:1" ? "border-primary text-primary bg-primary/10" : ""}`}
                    onClick={() => setAspectRatio("1:1")}
                  >1:1</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-10 text-xs ${aspectRatio === "16:9" ? "border-primary text-primary bg-primary/10" : ""}`}
                    onClick={() => setAspectRatio("16:9")}
                  >16:9</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`h-10 text-xs ${aspectRatio === "9:16" ? "border-primary text-primary bg-primary/10" : ""}`}
                    onClick={() => setAspectRatio("9:16")}
                  >9:16</Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isGenerating || !prompt}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" /> Generate Image
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-medium mb-4 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Advanced Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Negative Prompt</label>
                <Input 
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things to avoid..." 
                  className="text-xs h-8" 
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Seed</label>
                <Input placeholder="Random" className="text-xs h-8" />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="h-full min-h-[500px] flex flex-col items-center justify-center p-2 relative overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center text-primary">
                <Wand2 className="w-12 h-12 animate-pulse mb-4" />
                <p className="animate-pulse">Dreaming up your image...</p>
                <div className="w-64 h-1 bg-glass-border mt-4 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/2 animate-[pulse_2s_ease-in-out_infinite] rounded-full"></div>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="text-center text-red-500 max-w-md p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{errorMsg}</p>
              </div>
            ) : generatedImage ? (
              <div className="w-full h-full relative group flex items-center justify-center">
                <img 
                  src={generatedImage} 
                  alt={prompt} 
                  className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl"
                />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="bg-background/80 backdrop-blur-md hover:bg-background"
                    onClick={handleDownloadImage}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Your generated image will appear here</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
