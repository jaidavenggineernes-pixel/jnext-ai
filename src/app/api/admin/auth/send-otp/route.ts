import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();

    if (!email || !phone) {
      return NextResponse.json({ error: "Email dan Nomor WhatsApp wajib diisi" }, { status: 400 });
    }

    // Cek apakah user adalah ADMIN di database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akun ini tidak memiliki akses Admin" }, { status: 403 });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Simpan OTP ke database
    await prisma.adminOTP.create({
      data: {
        email: user.email!,
        phone: phone.replace(/[^0-9]/g, ""),
        code: otpCode,
        expiresAt: expiresAt,
      }
    });

    // TODO: Ganti bagian ini dengan panggilan API Fonnte / WABlas asli
    // Simulasi pengiriman WA
    console.log(`\n========================================`);
    console.log(`🔐 [SIMULASI WA] OTP ADMIN JNEXT`);
    console.log(`Mengirim ke WA: ${phone}`);
    console.log(`KODE OTP: ${otpCode}`);
    console.log(`Berlaku 5 menit.`);
    console.log(`========================================\n`);

    /*
    // Contoh implementasi Fonnte asli (uncomment jika sudah ada token)
    const fonnteToken = process.env.FONNTE_TOKEN;
    if (fonnteToken) {
      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteToken,
        },
        body: new URLSearchParams({
          target: phone,
          message: `*JNEXT ADMIN LOGIN*\n\nKode OTP Anda adalah: *${otpCode}*\n\nBerlaku selama 5 menit. Jangan berikan kode ini kepada siapapun!`,
          countryCode: "62",
        })
      });
    }
    */

    return NextResponse.json({ success: true, message: "OTP berhasil dikirim ke WhatsApp Anda" });

  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
