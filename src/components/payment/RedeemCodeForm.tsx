"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Ticket, Loader2 } from "lucide-react";

export function RedeemCodeForm() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/payment/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message, type: "success" });
        setCode("");
        // Reload page to reflect new tier limits
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ text: data.error || "Gagal mengklaim kode", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Terjadi kesalahan sistem", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRedeem} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Masukkan Kode Aktivasi (mis: JNEXT-PRO-XYZ)"
          className="bg-white/5 border-white/10 text-white font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal flex-1"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !code.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Klaim"}
        </Button>
      </div>
      {message && (
        <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {message.type === "success" && <Ticket className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </form>
  );
}
