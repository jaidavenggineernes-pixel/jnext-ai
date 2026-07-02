import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Kode aktivasi tidak valid" }, { status: 400 });
    }

    // Find the activation code
    const activationCode = await prisma.activationCode.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!activationCode) {
      return NextResponse.json({ error: "Kode aktivasi tidak ditemukan" }, { status: 404 });
    }

    if (activationCode.isUsed) {
      return NextResponse.json({ error: "Kode aktivasi sudah pernah digunakan" }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transaction: Mark code as used AND update user tier AND reset limits
    await prisma.$transaction([
      prisma.activationCode.update({
        where: { id: activationCode.id },
        data: {
          isUsed: true,
          usedById: user.id,
          usedAt: new Date()
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          tier: activationCode.tier,
          dailyWordCount: 0,
          dailyImageCount: 0,
          lastUsageReset: new Date()
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil! Akun Anda telah di-upgrade ke tier ${activationCode.tier}`,
      newTier: activationCode.tier
    });
  } catch (error) {
    console.error("Error redeeming code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
