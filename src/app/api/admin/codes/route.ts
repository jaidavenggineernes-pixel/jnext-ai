import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Function to generate a random code like JNEXT-PRO-ABC123XYZ
const generateRandomCode = (tier: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < 8; i++) {
    randomString += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JNEXT-${tier.toUpperCase()}-${randomString}`;
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== "jaidav.enggineernes@gmail.com") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    const codes = await prisma.activationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usedBy: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Error fetching codes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email !== "jaidav.enggineernes@gmail.com") {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: `Forbidden: Admin access required. Logged in as: ${session.user.email}` }, { status: 403 });
      }
    }

    const { tier, phone } = await req.json();

    if (!tier || !['STUDENT', 'PLUS', 'PRO', 'EXPERT', 'PREMIUM'].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier provided" }, { status: 400 });
    }

    const codeString = generateRandomCode(tier);

    const newCode = await prisma.activationCode.create({
      data: {
        code: codeString,
        tier: tier,
      }
    });

    // AUTO DELIVERY VIA WHATSAPP (FONNTE)
    if (phone) {
      const fonnteToken = process.env.FONNTE_TOKEN || "GtBGmrsbzusnuSGXDyhG";
      if (fonnteToken) {
        // Clean phone number (remove non-digits)
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        
        const waMessage = `🎉 *PEMBAYARAN BERHASIL!* 🎉

Halo Kak! Terima kasih telah berlangganan paket *${tier}* di JNext. 

Berikut adalah *Kode Aktivasi* rahasia Anda:
👉 *${codeString}*

*Cara Menggunakannya:*
1. Buka website JNext dan Login.
2. Pergi ke menu *Billing* di Dashboard.
3. Masukkan kode di atas pada kolom "Punya Kode Aktivasi?".
4. Klik Klaim, dan akun Anda akan otomatis ter-upgrade! 🚀

Selamat menikmati fitur premium JNext! ✨`;

        await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": fonnteToken,
          },
          body: new URLSearchParams({
            target: cleanPhone,
            message: waMessage,
            countryCode: "62",
          })
        }).catch(err => console.error("Fonnte delivery error:", err));
      }
    }

    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
