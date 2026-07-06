import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan Password wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Cek User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    // 2. Verifikasi Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    // 3. Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // 4. Simpan OTP di database
    await prisma.userOTP.create({
      data: {
        email: email.toLowerCase().trim(),
        code: otpCode,
        expiresAt: expiresAt,
      }
    });

    // 5. Kirim Email via Nodemailer
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      console.log("\n========================================");
      console.log(`🔐 [SIMULASI EMAIL] OTP LOGIN JNEXT`);
      console.log(`Ke: ${email}`);
      console.log(`Kode: ${otpCode}`);
      console.log("========================================\n");
      
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
      subject: "Kode Verifikasi Login JNext Anda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Konfirmasi Login JNext</h2>
          <p>Halo <strong>${user.name || "Pengguna"}</strong>,</p>
          <p>Seseorang mencoba masuk ke akun JNext Anda. Jika ini adalah Anda, silakan gunakan kode verifikasi (OTP) berikut untuk melanjutkan login:</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #111827;">${otpCode}</h1>
          </div>
          <p>Kode ini hanya berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6B7280; text-align: center;">Jika Anda tidak merasa melakukan aktivitas login ini, abaikan email ini dan pertimbangkan untuk mengganti kata sandi Anda segera.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "OTP berhasil dikirim ke email Anda." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending login OTP:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat mengirim OTP." },
      { status: 500 }
    );
  }
}
