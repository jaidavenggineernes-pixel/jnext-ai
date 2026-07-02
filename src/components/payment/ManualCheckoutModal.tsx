"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Smartphone, ExternalLink, ShieldCheck, Check } from "lucide-react";
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <GlassCard className="relative overflow-hidden p-0 border border-white/10 shadow-2xl bg-black/90">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
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
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                
                <div className="text-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm text-orange-200 mb-1">Total Tagihan</p>
                  <p className="text-3xl font-black text-white">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount * 16000)}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center text-sm uppercase tracking-wider text-muted-foreground">
                    <QrCode className="w-4 h-4 mr-2" /> Opsi 1: Scan QRIS
                  </h3>
                  <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-3 shadow-inner">
                    <img src="/qris.jpg" alt="QRIS JAIDAV" className="w-full max-w-[200px] h-auto object-contain rounded-lg border-2 border-gray-100" />
                    <p className="text-xs font-bold text-black mt-2">A.N. JAIDAV</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-muted-foreground">Atau Transfer E-Wallet</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center text-sm uppercase tracking-wider text-muted-foreground">
                    <Smartphone className="w-4 h-4 mr-2" /> Opsi 2: Nomor E-Wallet
                  </h3>
                  
                  <div className="space-y-2">
                    {[
                      { name: "GoPay", number: EWALLET_GOPAY, color: "text-blue-400" },
                      { name: "DANA", number: EWALLET_DANA, color: "text-blue-500" },
                      { name: "OVO", number: EWALLET_OVO, color: "text-purple-500" }
                    ].map((wallet) => (
                      <div key={wallet.name} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`font-bold ${wallet.color}`}>{wallet.name}</div>
                          <div className="font-mono text-sm tracking-widest">{wallet.number}</div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(wallet.number, wallet.name)}
                          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md font-medium transition-colors w-20 flex justify-center"
                        >
                          {copied === wallet.name ? <Check className="w-4 h-4 text-green-400" /> : "Salin"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Pastikan nama penerima sesuai sebelum mentransfer.</p>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/50">
                <div className="mb-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Email Anda (Untuk Menerima Voucher)</label>
                    <Input 
                      type="email" 
                      placeholder="email@domain.com" 
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="bg-black/40 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Nomor WhatsApp Anda</label>
                    <Input 
                      type="tel" 
                      placeholder="08123456789" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="bg-black/40 border-white/10 text-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 text-center">
                  Setelah transfer, klik tombol di bawah untuk mengirim bukti ke Admin. Anda akan menerima <strong>Kode Aktivasi</strong> yang dikirim otomatis ke WA Anda.
                </div>
                <Button 
                  onClick={handleWhatsAppConfirm}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-900/20 text-md font-bold"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Konfirmasi via WhatsApp
                </Button>
                <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 mr-1 text-green-400" /> Transaksi Aman & Terverifikasi
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
