import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
