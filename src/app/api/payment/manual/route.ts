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

    const { tier, amount, isYearly, planName } = await req.json();

    if (!tier || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const amountInIDR = Math.round(amount * 16000);
    // Use manual prefix to distinguish from midtrans
    const orderId = `MANUAL-${tier}-${Date.now()}`;

    // Create a pending invoice in our database
    await prisma.subscriptionInvoice.create({
      data: {
        userId: user.id,
        amount: amountInIDR,
        currency: "IDR",
        status: "PENDING",
        gateway: "MANUAL",
        invoiceUrl: orderId, // We use invoiceUrl column to store the orderId temporarily
      }
    });

    return NextResponse.json({ success: true, orderId });

  } catch (error: any) {
    console.error("Manual Payment Error:", error);
    return NextResponse.json({ error: "Gagal membuat invoice manual" }, { status: 500 });
  }
}
