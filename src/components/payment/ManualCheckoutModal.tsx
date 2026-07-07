"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Smartphone, ExternalLink, ShieldCheck, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ManualCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  isYearly: boolean;
}

export function ManualCheckoutModal({ isOpen, onClose, planName, amount, isYearly }: ManualCheckoutModalProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    if (session?.user?.email) {
      setCustomerEmail(session.user.email);
    }
  }, [session]);

  // --- ⚠️ PENGATURAN PEMBAYARAN MANUAL (UBAH DI SINI) ⚠️ ---
  const WHATSAPP_NUMBER = "6285191219129"; // Ganti dengan nomor WhatsApp Anda (Gunakan 62, hilangkan angka 0 di depan)
  const EWALLET_GOPAY = "0851-9121-9129"; // Ganti dengan nomor GoPay Anda
  const EWALLET_DANA = "0851-9121-9129"; // Ganti dengan nomor DANA Anda
  const EWALLET_OVO = "0851-9121-9129"; // Ganti dengan nomor OVO Anda
  // Untuk QRIS, siapkan gambar qris.png dan taruh di folder public/
  // ---------------------------------------------------------

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text.replace(/-/g, ""));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleWhatsAppConfirm = () => {
    if (!customerEmail || !customerPhone) {
      alert("Mohon isi Email dan Nomor WhatsApp Anda terlebih dahulu agar kami bisa mengirimkan kode voucher.");
      return;
    }

    const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount * 16000);
    const message = `Halo Admin JNext, saya ingin mengaktifkan paket *${planName} (${isYearly ? "Tahunan" : "Bulanan"})* seharga *${formattedAmount}*.

*Data Pelanggan:*
- Email: ${customerEmail}
- WA: ${customerPhone}

Berikut adalah foto bukti transfer saya:`;
    
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4 flex flex-col max-h-[85vh]"
          >
            <GlassCard className="relative overflow-hidden p-0 border border-white/10 shadow-2xl bg-black/90 flex flex-col max-h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
                <div>
                  <h2 className="text-xl font-bold">Pembayaran Manual</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paket: <span className="font-semibold text-white">{planName}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto min-h-0 flex-1">
                
                <div className="text-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs text-orange-200 mb-0.5">Total Tagihan</p>
                  <p className="text-2xl font-black text-white">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount * 16000)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center text-[11px] uppercase tracking-wider text-muted-foreground">
                    <QrCode className="w-3 h-3 mr-1.5" /> Opsi 1: Scan QRIS
                  </h3>
                  <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center space-y-2 shadow-inner">
                    <img src="/qris.jpg" alt="QRIS JAIDAV" className="w-full max-w-[140px] h-auto object-contain rounded-lg border-2 border-gray-100" />
                    <p className="text-[10px] font-bold text-black mt-1">A.N. JAIDAV</p>
                    <a 
                      href="/qris.jpg" 
                      download="QRIS_JNext_Payment.jpg"
                      className="mt-2 flex items-center justify-center text-[10px] font-semibold text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                    >
                      <Download className="w-3 h-3 mr-1" /> Unduh QRIS
                    </a>
                  </div>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-black px-2 text-muted-foreground">Atau Transfer E-Wallet</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Smartphone className="w-3 h-3 mr-1.5" /> Opsi 2: Nomor E-Wallet
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: "GoPay", number: EWALLET_GOPAY, color: "text-blue-400" },
                      { name: "DANA", number: EWALLET_DANA, color: "text-blue-500" },
                      { name: "OVO", number: EWALLET_OVO, color: "text-purple-500" }
                    ].map((wallet) => (
                      <div key={wallet.name} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className={`font-bold text-xs w-12 ${wallet.color}`}>{wallet.name}</div>
                          <div className="font-mono text-xs tracking-wider">{wallet.number}</div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(wallet.number, wallet.name)}
                          className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded font-medium transition-colors w-14 flex justify-center"
                        >
                          {copied === wallet.name ? <Check className="w-3 h-3 text-green-400" /> : "Salin"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Pastikan nama penerima sesuai sebelum mentransfer.</p>
                </div>
              </div>

              <div className="p-4 border-t border-white/5 bg-black/50 shrink-0">
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium uppercase">Email Voucher</label>
                    <Input 
                      type="email" 
                      placeholder="email@domain.com" 
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="bg-black/40 border-white/10 text-white h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground font-medium uppercase">Nomor WhatsApp</label>
                    <Input 
                      type="tel" 
                      placeholder="08123456789" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-black/40 border-white/10 text-white h-8 text-xs"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] leading-snug text-indigo-300 text-center">
                  Setelah transfer, klik tombol di bawah untuk kirim bukti. <strong>Kode Aktivasi</strong> dikirim ke WA Anda.
                </div>
                <Button 
                  onClick={handleWhatsAppConfirm}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg shadow-green-900/20 text-sm font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Konfirmasi WhatsApp
                </Button>
                <div className="mt-3 flex items-center justify-center text-[10px] text-muted-foreground">
                  <ShieldCheck className="w-3 h-3 mr-1 text-green-400" /> Transaksi Aman & Terverifikasi
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
