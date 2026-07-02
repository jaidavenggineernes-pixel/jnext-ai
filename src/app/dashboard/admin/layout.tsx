import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) {
    redirect("/admin/login");
  }

  // Validate session in DB
  const validSession = await prisma.adminSession.findUnique({
    where: { token: sessionToken }
  });

  if (!validSession || validSession.expiresAt < new Date()) {
    // Session invalid or expired
    redirect("/admin/login");
  }

  // Verify that the user still has ADMIN role in main User table just to be super safe
  const user = await prisma.user.findUnique({
    where: { email: validSession.email }
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
