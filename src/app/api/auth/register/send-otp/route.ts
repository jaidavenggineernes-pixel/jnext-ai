import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Nama, Email, dan Password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Periksa apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar. Silakan login." },
        { status: 400 }
      );
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Simpan OTP sementara di database
    await prisma.userOTP.create({
      data: {
        email: email.toLowerCase().trim(),
        code: otpCode,
        expiresAt: expiresAt,
      }
    });

    // Kirim Email via Nodemailer
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      // Fallback jika belum di-setting (untuk simulasi/development)
      console.log("\n========================================");
      console.log(`🔐 [SIMULASI EMAIL] OTP PENDAFTARAN JNEXT`);
      console.log(`Ke: ${email}`);
      console.log(`Kode: ${otpCode}`);
      console.log("========================================\n");
      
      // Tetap kembalikan success agar UI bisa lanjut ke layar OTP
      return NextResponse.json({ 
        message: "OTP berhasil dibuat. (Cek log server karena SMTP belum di-setting)" 
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    const mailOptions = {
      from: `"JNext AI" <${smtpEmail}>`,
      to: email,
      subject: "Kode Verifikasi JNext Anda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Selamat datang di JNext!</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Terima kasih telah mendaftar di JNext. Untuk menyelesaikan proses pendaftaran Anda, silakan gunakan kode verifikasi (OTP) berikut:</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #111827;">${otpCode}</h1>
          </div>
          <p>Kode ini hanya berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6B7280; text-align: center;">Jika Anda tidak merasa mendaftar di JNext, abaikan email ini.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "OTP berhasil dikirim ke email Anda." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat mengirim OTP." },
      { status: 500 }
    );
  }
}
