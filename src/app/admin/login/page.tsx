"use client";

import { useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [email, setEmail] = useState("jaidav.enggineernes@gmail.com");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone })
      });
      const data = await res.json();

      if (res.ok) {
        setStep("otp");
      } else {
        setError(data.error || "Gagal mengirim OTP");
      }
    } catch (err) {
      setError("Kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard/admin/codes");
        router.refresh();
      } else {
        setError(data.error || "Kode OTP tidak valid");
      }
    } catch (err) {
      setError("Kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-black to-black">
      <div className="w-full max-w-md relative z-10">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <GlassCard className="p-8 border-white/10 relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
            <p className="text-sm text-muted-foreground mt-2">Masuk ke ruang kendali JNext</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Admin</label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="bg-white/5 border-white/10 text-white/50 h-12 cursor-not-allowed"
                  disabled
                  readOnly
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nomor WhatsApp</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <Input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="bg-white/5 border-white/10 text-white pl-10 h-12"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center pt-2">Kode rahasia akan dikirimkan ke WhatsApp Anda.</p>
              </div>

              <Button 
                type="submit"
                disabled={isLoading || !email || !phone}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl mt-4"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Kode OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Masukkan kode 6 digit yang telah dikirim ke WA</p>
                <p className="font-bold text-white mt-1">{phone}</p>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                ))}
              </div>

              <Button 
                type="submit"
                disabled={isLoading || otp.join("").length < 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center">Verifikasi & Masuk <ArrowRight className="w-4 h-4 ml-2" /></span>}
              </Button>

              <button 
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Ganti Email/Nomor WA
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
