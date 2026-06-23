import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, gateway, amount, isYearly } = await req.json();

    if (!tier) {
      return NextResponse.json({ error: "Tier is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user's tier and reset usage to give them immediate access to new limits
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        tier: tier,
        dailyWordCount: 0,
        dailyImageCount: 0,
        lastUsageReset: new Date()
      }
    });

    // Create a mock invoice for the payment history
    await prisma.subscriptionInvoice.create({
      data: {
        userId: user.id,
        amount: amount || 0,
        currency: "USD",
        status: "PAID",
        gateway: gateway || "Mock Gateway",
        invoiceUrl: "#mock-invoice"
      }
    });

    // Create or update subscription record
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: "active",
        interval: isYearly ? "year" : "month",
        gateway: gateway || "Mock Gateway",
        updatedAt: new Date(),
        stripeCurrentPeriodEnd: new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000)
      },
      create: {
        userId: user.id,
        status: "active",
        interval: isYearly ? "year" : "month",
        gateway: gateway || "Mock Gateway",
        stripeCurrentPeriodEnd: new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({ success: true, message: `Successfully upgraded to ${tier} tier!` });

  } catch (error: any) {
    console.error("Mock payment error:", error);
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
