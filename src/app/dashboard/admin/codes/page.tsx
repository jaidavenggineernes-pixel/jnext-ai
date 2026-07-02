"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Copy, Plus, Check, Ticket, User as UserIcon, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Code = {
  id: string;
  code: string;
  tier: string;
  isUsed: boolean;
  createdAt: string;
  usedAt: string | null;
  usedBy: { name: string | null; email: string | null } | null;
};

export default function AdminCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<Code[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTier, setSelectedTier] = useState("PLUS");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCodes();
    }
  }, [status, session]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/codes");
      const data = await res.json();
      if (res.ok) setCodes(data.codes);
    } catch (error) {
      console.error("Failed to fetch codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier })
      });
      if (res.ok) {
        fetchCodes();
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (status === "loading" || isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" />
            Activation Codes
          </h1>
          <p className="text-muted-foreground">Pabrik pembuatan Voucher Upgrade JNext</p>
        </div>
      </div>

      <GlassCard className="p-6 border border-white/10">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium mb-2">Pilih Paket (Tier)</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-white/5 p-3 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option className="bg-background" value="PLUS">PLUS</option>
              <option className="bg-background" value="STUDENT">STUDENT</option>
              <option className="bg-background" value="PRO">PRO</option>
              <option className="bg-background" value="EXPERT">EXPERT</option>
              <option className="bg-background" value="PREMIUM">PREMIUM</option>
            </select>
          </div>
          <Button 
            onClick={generateCode} 
            disabled={isGenerating}
            className="h-[46px] rounded-xl px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isGenerating ? "Mencetak..." : <><Plus className="w-4 h-4 mr-2" /> Cetak Kode Baru</>}
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {codes.map((item) => (
          <GlassCard key={item.id} className={`p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${item.isUsed ? 'opacity-60 grayscale' : 'hover:border-primary/50'}`}>
            {item.isUsed && (
              <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded-md">
                TERPAKAI
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                item.tier === 'PLUS' ? 'bg-blue-500/20 text-blue-400' : 
                item.tier === 'PRO' ? 'bg-purple-500/20 text-purple-400' :
                item.tier === 'EXPERT' ? 'bg-orange-500/20 text-orange-400' :
                item.tier === 'PREMIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {item.tier}
              </span>
            </div>

            <div className="font-mono text-lg tracking-wider text-white bg-black/30 p-3 rounded-lg flex justify-between items-center border border-white/5">
              {item.code}
              {!item.isUsed && (
                <button 
                  onClick={() => copyToClipboard(item.code)}
                  className="p-2 hover:bg-white/10 rounded-md transition-colors"
                >
                  {copiedCode === item.code ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-auto space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Dibuat: {new Date(item.createdAt).toLocaleDateString('id-ID')}
              </div>
              {item.isUsed && item.usedBy && (
                <div className="flex items-center gap-1 text-primary">
                  <UserIcon className="w-3 h-3" /> Dipakai oleh: {item.usedBy.email}
                </div>
              )}
            </div>
          </GlassCard>
        ))}

        {codes.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
            Belum ada kode aktivasi yang dicetak.
          </div>
        )}
      </div>
    </div>
  );
}
