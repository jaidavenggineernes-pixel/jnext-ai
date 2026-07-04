import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!email || !password || !name || !otp) {
      return NextResponse.json(
        { error: "Nama, email, password, dan OTP wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // 1. Verifikasi OTP
    const validOTP = await prisma.userOTP.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        code: otp.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() } // Masih berlaku
      },
      orderBy: { createdAt: "desc" }
    });

    if (!validOTP) {
      return NextResponse.json(
        { error: "Kode OTP salah atau sudah kedaluwarsa." },
        { status: 400 }
      );
    }

    // 2. Cek ulang apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User dengan email ini sudah ada." },
        { status: 400 }
      );
    }

    // Tandai OTP sebagai digunakan
    await prisma.userOTP.update({
      where: { id: validOTP.id },
      data: { isUsed: true }
    });

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
