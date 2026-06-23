import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";

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

    // Since midtrans accepts Rupiah, and our pricing is in USD, we should convert it.
    // For this implementation, we will use a fixed rate of Rp 16,000 = $1
    const amountInIDR = Math.round(amount * 16000);
    const orderId = `JNEXT-${user.id}-${Date.now()}`;

    // Create a pending invoice in our database
    await prisma.subscriptionInvoice.create({
      data: {
        userId: user.id,
        amount: amountInIDR,
        currency: "IDR",
        status: "PENDING",
        gateway: "MIDTRANS",
        invoiceUrl: orderId, // We use invoiceUrl column to store the orderId temporarily
      }
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amountInIDR,
      },
      customer_details: {
        first_name: user.name || "JNext User",
        email: user.email,
      },
      item_details: [
        {
          id: tier,
          price: amountInIDR,
          quantity: 1,
          name: `JNext ${planName} (${isYearly ? "Tahunan" : "Bulanan"})`,
        }
      ],
      custom_field1: tier, // We pass the requested tier here so the webhook knows what to upgrade to
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });

  } catch (error: any) {
    console.error("Midtrans Snap error:", error);
    // If the error is due to missing Server Key, gracefully inform the user
    if (error.message?.includes("serverKey") || error.message?.includes("401")) {
      return NextResponse.json({ 
        error: "Server Key Midtrans belum dikonfigurasi. Silakan tambahkan MIDTRANS_SERVER_KEY di file .env Anda." 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal membuat transaksi Midtrans" }, { status: 500 });
  }
}
