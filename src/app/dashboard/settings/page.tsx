import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { User, Mail, Shield, CreditCard, Key } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="p-8 text-center text-muted-foreground mt-20">
        <p>Please log in to view your settings.</p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return (
      <div className="p-8 text-center text-muted-foreground mt-20">
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile, billing, and API preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <div className="bg-primary/10 p-6 flex flex-col items-center justify-center border-b border-glass-border/40">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">{user.name || "JNext User"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              
              <div className="mt-4 px-3 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full uppercase tracking-wider">
                {user.tier} TIER
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="flex items-center"><User className="w-4 h-4 mr-3 text-muted-foreground" /> Profile</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="flex items-center"><CreditCard className="w-4 h-4 mr-3 text-muted-foreground" /> Billing</span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="flex items-center"><Key className="w-4 h-4 mr-3 text-muted-foreground" /> API Keys</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b border-glass-border/40 pb-4">Personal Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Full Name</label>
                  <p className="font-medium">{user.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted-foreground">Account Role</label>
                  <p className="font-medium capitalize flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                    {user.role.toLowerCase()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-muted-foreground">Email Address</label>
                <p className="font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {user.email}
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-glass-border/40">
              <Button variant="outline">Edit Profile</Button>
            </div>
          </GlassCard>
          
          <GlassCard className="p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b border-glass-border/40 pb-4">Subscription</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan: {user.tier}</p>
                <p className="text-sm text-muted-foreground mt-1">You are currently on the {user.tier.toLowerCase()} tier.</p>
              </div>
              <Button variant="glass" className="bg-gradient-to-r from-primary to-accent border-0 text-white hover:opacity-90">
                Upgrade Plan
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
