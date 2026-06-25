"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Star, Zap, Code, Terminal, Shield, ArrowRight, GraduationCap, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// Declare global snap object
declare global {
  interface Window {
    snap: any;
  }
}

const plans = [
  {
    name: "JNext Basic",
    tier: "FREE",
    label: "Mulai Gratis",
    price: { monthly: 0, yearly: 0 },
    description: "Pengguna baru yang ingin mencoba JNext",
    features: [
      "AI Chat standar",
      "Coding Assistant standar",
      "Generate gambar max 3 kali/hari",
      "Riwayat chat maksimal 30 hari",
      "Penyimpanan cloud maksimal 1 GB",
      "Maksimal 1.000 kata/hari",
      "Maksimal 10 percakapan aktif"
    ],
    missing: ["Tidak dapat generate video"],
    icon: <Star className="w-6 h-6 text-slate-400" />,
    color: "from-slate-400 to-slate-600"
  },
  {
    name: "JNext GO Student",
    tier: "STUDENT",
    label: "Pilihan Terbaik untuk Pelajar",
    price: { monthly: 3, yearly: 2.4 }, // 20% off
    description: "Khusus Pelajar dan Mahasiswa terverifikasi",
    features: [
      "AI Chat untuk pendidikan",
      "Coding Assistant untuk pembelajaran",
      "Generate gambar",
      "Generate video dasar",
      "AI Tutor Mode & Pembuat Quiz",
      "Maksimal 5.500 kata/hari",
      "Penyimpanan cloud 10 GB"
    ],
    missing: [],
    icon: <GraduationCap className="w-6 h-6 text-green-400" />,
    color: "from-green-400 to-emerald-600"
  },
  {
    name: "JNext AI Plus",
    tier: "PLUS",
    label: "Paling Populer",
    popular: true,
    price: { monthly: 8, yearly: 6.4 },
    description: "Untuk pengguna umum dan freelancer",
    features: [
      "AI Chat lebih pintar",
      "Coding Assistant tingkat lanjut",
      "Generate gambar kualitas 2K",
      "Generate video HD",
      "Riwayat tanpa batas",
      "Maksimal 8.900 kata/hari",
      "Penyimpanan cloud 25 GB"
    ],
    missing: [],
    icon: <Zap className="w-6 h-6 text-orange-400" />,
    color: "from-orange-400 to-red-500"
  },
  {
    name: "JNext AI Pro",
    tier: "PRO",
    label: "Untuk Kreator Profesional",
    price: { monthly: 14, yearly: 11.2 },
    description: "Developer dan Kreator Konten",
    features: [
      "AI Chat Premium",
      "Coding Assistant Professional",
      "Generate gambar hingga 4K",
      "Generate video hingga 2K 60 FPS",
      "AI Website & App Builder",
      "Maksimal 11.000 kata/hari",
      "Penyimpanan cloud 50 GB"
    ],
    missing: [],
    icon: <Code className="w-6 h-6 text-blue-400" />,
    color: "from-blue-400 to-indigo-600"
  },
  {
    name: "JNext AI Expert",
    tier: "EXPERT",
    label: "Untuk Developer Profesional",
    price: { monthly: 21, yearly: 16.8 },
    description: "Developer Profesional",
    features: [
      "Semua fitur paket Pro",
      "Coding Assistant tingkat Expert",
      "Workspace Developer & Integrasi IDE",
      "AI Code Review & Project Refactor",
      "Maksimal 15.000 kata/hari",
      "Penyimpanan cloud 100 GB"
    ],
    missing: [],
    icon: <Terminal className="w-6 h-6 text-purple-400" />,
    color: "from-purple-400 to-fuchsia-600"
  },
  {
    name: "JNext AI Premium",
    tier: "PREMIUM",
    label: "Ultimate Experience",
    price: { monthly: 29, yearly: 23.2 },
    description: "Perusahaan, Startup, dan Power User",
    features: [
      "Semua fitur Expert",
      "Prioritas server tertinggi",
      "Generate gambar 4K Ultra Quality",
      "Generate video 2K 120 FPS",
      "API Access & Team Collaboration",
      "Maksimal 19.000 kata/hari",
      "Penyimpanan cloud 250 GB"
    ],
    missing: [],
    icon: <Shield className="w-6 h-6 text-amber-400" />,
    color: "from-amber-400 to-yellow-600"
  }
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const handleSubscribe = (plan: any) => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }
    setCheckoutPlan(plan);
  };

  const handlePayment = async () => {
    if (!checkoutPlan) return;
    setIsProcessing(true);

    try {
      const amount = isYearly ? checkoutPlan.price.yearly * 12 : checkoutPlan.price.monthly;
      
      const res = await fetch("/api/payment/midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: checkoutPlan.tier,
          amount: amount,
          isYearly: isYearly,
          planName: checkoutPlan.name
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Payment failed");

      // Trigger Midtrans Snap Popup
      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          console.log("Success:", result);
          alert("Pembayaran Berhasil! Sistem mendeteksi dana Anda. Harap refresh halaman.");
          await updateSession();
          router.push("/dashboard/billing");
          router.refresh();
        },
        onPending: function (result: any) {
          console.log("Pending:", result);
          alert("Menunggu pembayaran Anda...");
          setCheckoutPlan(null);
          setIsProcessing(false);
        },
        onError: function (result: any) {
          console.log("Error:", result);
          alert("Pembayaran Gagal.");
          setCheckoutPlan(null);
          setIsProcessing(false);
        },
        onClose: function () {
          alert("Anda menutup jendela pembayaran sebelum menyelesaikan transaksi.");
          setCheckoutPlan(null);
          setIsProcessing(false);
        }
      });
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan saat membuat transaksi Midtrans.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-hidden relative pb-32">
      <Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "YOUR_CLIENT_KEY"} strategy="beforeInteractive" />
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation (Simple) */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <img src="/logo.png" alt="JNext Logo" className="w-8 h-8 object-contain rounded-md drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">JNext</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" className="border-white/10 hover:bg-white/5">Go to Dashboard</Button>
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-16 lg:mt-24">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight"
          >
            Pilih Paket Kekuatan <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">JNext AI</span> Anda.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Dari pengguna biasa hingga perusahaan besar, JNext memiliki paket yang dirancang khusus untuk memenuhi kebutuhan kreativitas dan pengembangan Anda.
          </motion.p>
          
          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mt-8 gap-4"
          >
            <span className={`text-sm ${!isYearly ? "text-white font-medium" : "text-muted-foreground"}`}>Bulanan</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-8 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20 border border-white/5"
            >
              <motion.div 
                className="w-6 h-6 bg-orange-500 rounded-full"
                layout
                initial={false}
                animate={{ x: isYearly ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm flex items-center ${isYearly ? "text-white font-medium" : "text-muted-foreground"}`}>
              Tahunan <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 py-0.5 px-2 rounded-full border border-orange-500/30">Hemat 20%</span>
            </span>
          </motion.div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col transition-all hover:border-white/20 hover:bg-white/[0.07] ${plan.popular ? 'ring-2 ring-orange-500/50 shadow-[0_0_40px_-15px_rgba(249,115,22,0.3)] lg:-translate-y-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-lg">
                  Paling Populer
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${plan.color} bg-opacity-10`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.label}</p>
                </div>
              </div>
              
              <div className="mt-4 mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                    ${isYearly ? plan.price.yearly.toFixed(2) : plan.price.monthly}
                  </span>
                  <span className="text-muted-foreground text-sm">/ {isYearly ? "bulan" : "bulan"}</span>
                </div>
                {isYearly && plan.price.monthly > 0 && (
                  <p className="text-sm text-green-400 mt-2 font-medium">Ditagih ${ (plan.price.yearly * 12).toFixed(2) } per tahun</p>
                )}
                {!isYearly && plan.price.monthly > 0 && (
                  <p className="text-sm text-transparent mt-2 select-none">&nbsp;</p>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <p className="text-sm font-medium text-white border-b border-white/10 pb-4">{plan.description}</p>
                <ul className="space-y-3 pt-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-5 h-5 text-green-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.missing.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <X className="w-5 h-5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={() => handleSubscribe(plan)}
                className={`w-full mt-8 h-12 text-md font-medium ${
                  plan.popular 
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25" 
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/5"
                }`}
              >
                {plan.price.monthly === 0 ? "Mulai Gratis" : "Pilih Paket"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutPlan && checkoutPlan.price.monthly > 0 && checkoutPlan.tier !== "STUDENT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
          >
            <button onClick={() => !isProcessing && setCheckoutPlan(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-white" disabled={isProcessing}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-2">Upgrade to {checkoutPlan.name}</h2>
            <p className="text-muted-foreground text-sm mb-6">Pilih metode pembayaran (Midtrans)</p>
            
            <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5">
              <div className="flex justify-between mb-2 text-sm">
                <span>Paket {checkoutPlan.name} ({isYearly ? 'Tahunan' : 'Bulanan'})</span>
                <span>${isYearly ? (checkoutPlan.price.yearly * 12).toFixed(2) : checkoutPlan.price.monthly.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10 mt-2">
                <span>Total Tagihan</span>
                <span>${isYearly ? (checkoutPlan.price.yearly * 12).toFixed(2) : checkoutPlan.price.monthly.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={() => handlePayment()} disabled={isProcessing} className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold shadow-lg shadow-orange-500/25">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Bayar Sekarang (Midtrans)"}
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              *Aplikasi mendukung GoPay, ShopeePay, DANA, QRIS, Virtual Account, dan Kartu Kredit.
            </p>
          </motion.div>
        </div>
      )}
      
      {/* Student Verification Modal */}
      {checkoutPlan && checkoutPlan.tier === "STUDENT" && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
         >
           <button onClick={() => setCheckoutPlan(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
             <X className="w-5 h-5" />
           </button>
           <h2 className="text-2xl font-bold mb-2">Verifikasi Pelajar</h2>
           <p className="text-muted-foreground text-sm mb-6">Paket JNext GO Student membutuhkan verifikasi. Silakan unggah dokumen Anda melalui Dasbor Billing.</p>
           <Link href="/dashboard/billing">
             <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white">
               Pergi ke Dasbor Billing
             </Button>
           </Link>
         </motion.div>
       </div>
      )}
    </div>
  );
}
