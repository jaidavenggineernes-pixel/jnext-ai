import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Users, DollarSign, TrendingUp, CheckCircle, XCircle, FileText } from "lucide-react";
import { revalidatePath } from "next/cache";

async function verifyStudent(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const action = formData.get("action") as string; // 'approve' or 'reject'
  
  if (!id || !action) return;

  const verif = await prisma.studentVerification.findUnique({ where: { id } });
  if (!verif) return;

  if (action === "approve") {
    await prisma.studentVerification.update({
      where: { id },
      data: { status: "VERIFIED", reviewedAt: new Date() }
    });
    // Set user studentStatus and upgrade to STUDENT tier optionally or just let them buy it
    await prisma.user.update({
      where: { id: verif.userId },
      data: { studentStatus: "VERIFIED" }
    });
  } else {
    await prisma.studentVerification.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() }
    });
    await prisma.user.update({
      where: { id: verif.userId },
      data: { studentStatus: "REJECTED" }
    });
  }

  revalidatePath("/dashboard/admin/subscriptions");
}

export default async function AdminSubscriptionsPage() {
  const session = await getServerSession(authOptions);
  
  // Note: Add strict Admin check here in production
  // if (session?.user?.email !== "admin@jnext.com") return <p>Unauthorized</p>;

  // Fetch Stats
  const totalUsers = await prisma.user.count();
  const premiumUsers = await prisma.user.count({ where: { tier: { not: "FREE" } } });
  
  // Fetch Pending Verifications
  const pendingVerifs = await prisma.studentVerification.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { appliedAt: "asc" }
  });

  // Fetch recent subscriptions
  const recentSubs = await prisma.user.findMany({
    where: { tier: { not: "FREE" } },
    select: { id: true, name: true, email: true, tier: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 10
  });

  // Mock MRR Calculation (assuming standard prices)
  const tierPrices: any = { "STUDENT": 3, "PLUS": 8, "PRO": 14, "EXPERT": 21, "PREMIUM": 29 };
  let mrr = 0;
  const allSubs = await prisma.user.findMany({ where: { tier: { not: "FREE" } }, select: { tier: true } });
  allSubs.forEach(sub => { mrr += (tierPrices[sub.tier] || 0); });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Subscription Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage revenue, plans, and verifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 bg-gradient-to-br from-green-500/10 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</p>
              <h3 className="text-3xl font-bold mt-1 text-green-400">${mrr.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl"><DollarSign className="w-5 h-5 text-green-500" /></div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Paid Subscribers</p>
              <h3 className="text-3xl font-bold mt-1 text-blue-400">{premiumUsers.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl"><Users className="w-5 h-5 text-blue-500" /></div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-500/10 to-transparent">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <h3 className="text-3xl font-bold mt-1 text-orange-400">
                {totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0}%
              </h3>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-xl"><TrendingUp className="w-5 h-5 text-orange-500" /></div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Student Verification Queue */}
        <GlassCard className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Student Verifications Queue</h3>
            <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-bold">{pendingVerifs.length} Pending</span>
          </div>

          {pendingVerifs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
              <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>Queue is empty. Great job!</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {pendingVerifs.map(verif => (
                <div key={verif.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{verif.user.name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">{verif.user.email}</p>
                      <a href={verif.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">View Document</a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={verifyStudent}>
                      <input type="hidden" name="id" value={verif.id} />
                      <input type="hidden" name="action" value="approve" />
                      <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 px-3 h-8">Approve</Button>
                    </form>
                    <form action={verifyStudent}>
                      <input type="hidden" name="id" value={verif.id} />
                      <input type="hidden" name="action" value="reject" />
                      <Button type="submit" size="sm" variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10 px-3 h-8">Reject</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent Subscriptions */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-6">Recent Premium Upgrades</h3>
          {recentSubs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No premium users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-white/5">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">User</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3 rounded-r-lg">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubs.map(sub => (
                    <tr key={sub.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{sub.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{sub.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                          {sub.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(sub.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
