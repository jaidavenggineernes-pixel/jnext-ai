"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Activity, CreditCard, HardDrive, AlertTriangle, Ticket } from "lucide-react";

export default function AdminDashboard() {
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
            <h3 className="font-medium text-muted-foreground">Active Subscriptions</h3>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">4,192</p>
          <p className="text-sm text-green-500 mt-2">+7% from last month</p>
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
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-3xl font-bold">4.8 TB</p>
          <p className="text-sm text-muted-foreground mt-2">75% of capacity</p>
        </GlassCard>
      </div>

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
