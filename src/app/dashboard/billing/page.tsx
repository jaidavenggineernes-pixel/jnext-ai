import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CreditCard, GraduationCap, HardDrive, MessageSquare, Zap, Upload, CheckCircle2, XCircle, Clock, Ticket } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { RedeemCodeForm } from "@/components/payment/RedeemCodeForm";

async function submitStudentVerification(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return;

  const url = formData.get("documentUrl") as string;
  if (!url) return;

  // Create verification request
  await prisma.studentVerification.upsert({
    where: { userId: user.id },
    update: { documentUrl: url, status: "PENDING", appliedAt: new Date() },
    create: { userId: user.id, documentUrl: url, status: "PENDING" }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { studentStatus: "PENDING" }
  });

  revalidatePath("/dashboard/billing");
}

export default async function BillingDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscriptions: true,
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
      studentVerifs: { orderBy: { appliedAt: 'desc' }, take: 1 }
    }
  });

  if (!user) return null;

  // Define tier limits to calculate percentage
  const tierLimits: any = {
    "FREE": { words: 300, storage: 1 }, // 1GB
    "STUDENT": { words: 5500, storage: 10 },
    "PLUS": { words: 8900, storage: 25 },
    "PRO": { words: 11000, storage: 50 },
    "EXPERT": { words: 15000, storage: 100 },
    "PREMIUM": { words: 19000, storage: 250 },
  };

  const limits = tierLimits[user.tier] || tierLimits["FREE"];
  const wordPercent = Math.min(100, Math.round((user.dailyWordCount / limits.words) * 100));
  const storagePercent = Math.min(100, Math.round((user.storageUsed / limits.storage) * 100));
  
  const studentVerif = user.studentVerifs[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-sm text-muted-foreground">Manage your plan, usage, and payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Plan Card */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Ticket className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Punya Kode Aktivasi?</h3>
                  <p className="text-sm text-muted-foreground">Tukar kode dari Admin untuk Upgrade otomatis</p>
                </div>
              </div>
              
              <RedeemCodeForm />
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Zap className="w-48 h-48" />
            </div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <p className="text-sm font-medium text-orange-400 mb-1">CURRENT PLAN</p>
                <h2 className="text-3xl font-bold">JNext {user.tier}</h2>
              </div>
              <div className="text-right">
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-green-500/30">
                  Active
                </span>
              </div>
            </div>

            <div className="flex gap-4 relative z-10">
              <Link href="/pricing">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Upgrade Plan
                </Button>
              </Link>
              {user.tier !== "FREE" && (
                <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                  Cancel Subscription
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-blue-400" /> Daily Words</h3>
                <span className="text-xs text-muted-foreground">Resets at midnight</span>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span>{user.dailyWordCount.toLocaleString()}</span>
                <span className="text-muted-foreground">{limits.words.toLocaleString()} limit</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${wordPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${wordPercent}%` }}
                />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center"><HardDrive className="w-4 h-4 mr-2 text-purple-400" /> Cloud Storage</h3>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span>{user.storageUsed.toFixed(2)} GB</span>
                <span className="text-muted-foreground">{limits.storage} GB limit</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${storagePercent > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Student Verification */}
          <GlassCard className="p-6">
            <h3 className="font-semibold flex items-center mb-4">
              <GraduationCap className="w-5 h-5 mr-2 text-green-400" /> 
              Student Status
            </h3>
            
            {user.studentStatus === "NONE" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Verify your student status to unlock the $3/month GO Student plan.</p>
                <form action={submitStudentVerification} className="space-y-4">
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center">
                    <input type="url" name="documentUrl" placeholder="Link to Student ID (GDrive, etc)" className="w-full bg-transparent border-b border-white/20 text-sm p-2 focus:outline-none focus:border-green-400 mb-2" required />
                    <p className="text-xs text-muted-foreground">Paste a URL to your student ID or document</p>
                  </div>
                  <Button type="submit" className="w-full bg-green-500 hover:bg-green-600">Submit for Review</Button>
                </form>
              </div>
            )}

            {user.studentStatus === "PENDING" && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start gap-3 text-yellow-500">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Verification Pending</p>
                  <p className="opacity-80">Our team is reviewing your document. This usually takes 24 hours.</p>
                </div>
              </div>
            )}

            {user.studentStatus === "VERIFIED" && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-start gap-3 text-green-400">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Verified Student</p>
                  <p className="opacity-80">You are eligible for the GO Student plan. Valid until next year.</p>
                </div>
              </div>
            )}

            {user.studentStatus === "REJECTED" && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3 text-red-400">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Verification Rejected</p>
                  <p className="opacity-80 mb-2">Your document was invalid or unclear.</p>
                  <form action={submitStudentVerification}>
                    <input type="url" name="documentUrl" placeholder="Try again with a new link" className="w-full bg-black/40 border border-red-500/30 rounded p-1 text-xs mb-2" required />
                    <Button type="submit" variant="outline" size="sm" className="w-full border-red-500/30">Re-submit</Button>
                  </form>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Payment History */}
          <GlassCard className="p-6">
            <h3 className="font-semibold flex items-center mb-4">
              <CreditCard className="w-5 h-5 mr-2 text-zinc-400" /> 
              Recent Invoices
            </h3>
            
            {user.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payment history yet.</p>
            ) : (
              <div className="space-y-3">
                {user.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                    <div>
                      <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
