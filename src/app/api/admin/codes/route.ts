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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { tier } = await req.json();

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

    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
