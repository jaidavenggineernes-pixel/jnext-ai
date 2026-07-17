"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Users, Activity, CreditCard, HardDrive, AlertTriangle, Ticket, Check, X, Shield } from "lucide-react";

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/admin/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleVerify = async (invoiceId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action} this payment?`)) return;

    try {
      const res = await fetch("/api/admin/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, action }),
      });

      if (res.ok) {
        alert(`Payment ${action}D successfully.`);
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to verify payment");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing request");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users, subscriptions, and platform settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-muted-foreground">Total Users</h3>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">12,483</p>
          <p className="text-sm text-green-500 mt-2">+14% from last month</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-muted-foreground">Pending Payments</h3>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">{invoices.filter(i => i.status === "PENDING").length}</p>
          <p className="text-sm text-orange-500 mt-2">Needs verification</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-muted-foreground">API Requests (24h)</h3>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">1.2M</p>
          <p className="text-sm text-red-500 mt-2">-2% from yesterday</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-muted-foreground">Storage Used</h3>
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">4.8 TB</p>
          <p className="text-sm text-muted-foreground mt-2">75% of capacity</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" /> 
          Manual Payment Approvals
        </h2>
        
        {isLoading ? (
          <div className="animate-pulse h-20 bg-white/5 rounded-xl"></div>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground">No pending manual payments right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Target Plan</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{inv.user?.name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{inv.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      Rp {(inv.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-bold">
                        {inv.invoiceUrl.split("-")[1] || "Unknown Tier"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === 'PENDING' ? 'bg-orange-500/20 text-orange-400' : 
                        inv.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === "PENDING" && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-8 px-3 text-white"
                            onClick={() => handleVerify(inv.id, "APPROVE")}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8 px-3"
                            onClick={() => handleVerify(inv.id, "REJECT")}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-6 h-96 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="text-center z-10 space-y-4">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Ticket className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white">Sistem Kode Aktivasi</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Cetak dan kelola voucher JNext untuk pelanggan yang melakukan pembayaran manual via transfer.
            </p>
            <a href="/dashboard/admin/codes" className="inline-block mt-4">
              <div className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95">
                Buka Pabrik Voucher
              </div>
            </a>
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-4">System Alerts</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-500">High Server Load</p>
                <p className="text-xs text-red-400 mt-1">Server CPU utilization exceeded 90% in US-East region.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">API Key Deprecation</p>
                <p className="text-xs text-yellow-400 mt-1">OpenAI old embeddings API deprecation approaching.</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
