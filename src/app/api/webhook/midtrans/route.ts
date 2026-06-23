import { NextResponse } from "next/server";
import { coreApi } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // Verify the notification signature using Midtrans core API
    const statusResponse = await coreApi.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    const targetTier = statusResponse.custom_field1; // We passed the Tier in custom_field1

    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        // TODO: handle challenge logic
      } else if (fraudStatus === "accept") {
        await processUpgrade(orderId, targetTier);
      }
    } else if (transactionStatus === "settlement") {
      await processUpgrade(orderId, targetTier);
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      await processFailure(orderId);
    } else if (transactionStatus === "pending") {
      // Pending
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Midtrans Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function processUpgrade(orderId: string, tier: string) {
  // Find the pending invoice
  const invoice = await prisma.subscriptionInvoice.findFirst({
    where: { invoiceUrl: orderId, status: "PENDING" }
  });

  if (!invoice || !tier) return;

  // Mark invoice as PAID
  await prisma.subscriptionInvoice.update({
    where: { id: invoice.id },
    data: { status: "PAID" }
  });

  // Upgrade the user
  await prisma.user.update({
    where: { id: invoice.userId },
    data: {
      tier: tier,
      dailyWordCount: 0,
      dailyImageCount: 0,
      lastUsageReset: new Date()
    }
  });

  // Update subscription active status
  await prisma.subscription.upsert({
    where: { userId: invoice.userId },
    update: {
      status: "active",
      updatedAt: new Date(),
    },
    create: {
      userId: invoice.userId,
      status: "active",
      interval: "month", // simplified for webhook
      gateway: "MIDTRANS",
    }
  });
}

async function processFailure(orderId: string) {
  const invoice = await prisma.subscriptionInvoice.findFirst({
    where: { invoiceUrl: orderId }
  });

  if (!invoice) return;

  await prisma.subscriptionInvoice.update({
    where: { id: invoice.id },
    data: { status: "FAILED" }
  });
}
