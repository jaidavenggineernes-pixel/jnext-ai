import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email dan Kode OTP wajib diisi" }, { status: 400 });
    }

    // Cari OTP terbaru yang belum expired dan belum dipakai
    const validOTP = await prisma.adminOTP.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        code: code.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() } // Masih berlaku
      },
      orderBy: { createdAt: "desc" }
    });

    if (!validOTP) {
      return NextResponse.json({ error: "Kode OTP salah atau sudah kedaluwarsa" }, { status: 400 });
    }

    // Tandai OTP sebagai digunakan
    await prisma.adminOTP.update({
      where: { id: validOTP.id },
      data: { isUsed: true }
    });

    // Buat Sesi Admin Eksklusif (Token Acak)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Jam

    await prisma.adminSession.create({
      data: {
        email: validOTP.email,
        token: sessionToken,
        expiresAt: sessionExpiresAt
      }
    });

    // Set HttpOnly Cookie untuk keamanan ekstra
    cookies().set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionExpiresAt,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Verifikasi berhasil" });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
