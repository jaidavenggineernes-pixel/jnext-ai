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

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { invoiceId, action } = await req.json();

    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice || invoice.status !== "PENDING") {
      return NextResponse.json({ error: "Invoice not found or already processed" }, { status: 400 });
    }

    if (action === "REJECT") {
      await prisma.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: { status: "FAILED" }
      });
      return NextResponse.json({ success: true, message: "Payment rejected" });
    }

    if (action === "APPROVE") {
      const tier = invoice.invoiceUrl.split("-")[1] || "PLUS"; // Fallback to PLUS if parse fails

      await prisma.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" }
      });

      await prisma.user.update({
        where: { id: invoice.userId },
        data: {
          tier: tier,
          dailyWordCount: 0,
          dailyImageCount: 0,
          lastUsageReset: new Date()
        }
      });

      await prisma.subscription.upsert({
        where: { userId: invoice.userId },
        update: {
          status: "active",
          updatedAt: new Date(),
        },
        create: {
          userId: invoice.userId,
          status: "active",
          interval: "month",
          gateway: "MANUAL",
        }
      });

      return NextResponse.json({ success: true, message: "Payment approved and user upgraded" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
