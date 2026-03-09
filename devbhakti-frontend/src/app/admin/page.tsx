"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Calendar,
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  Video,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Package,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronRight,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAdminDashboardStats } from "@/api/adminController";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminDashboardStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityClick = (activity: any) => {
    const { type, id } = activity;
    if (type === 'booking') {
      router.push(`/admin/pooja-bookings?id=${id}&q=${encodeURIComponent(activity.title)}`);
    } else if (type === 'user') {
      router.push(`/admin/users/${id}`);
    } else if (type === 'temple' || type === 'institution') {
      router.push(`/admin/temples/${id}`);
    } else if (type === 'product') {
      router.push(`/admin/products`);
    } else if (type === 'withdrawal' || type === 'payout') {
      router.push(`/admin/finance/withdrawals`);
    } else if (type === 'pooja') {
      router.push(`/admin/poojas`);
    }
  };

  const handlePendingItemClick = (item: any) => {
    const type = item.type.toLowerCase();
    const id = item.id;
    const name = encodeURIComponent(item.name);

    if (type === 'temple') {
      router.push(`/admin/temples?id=${id}&q=${name}`);
    } else if (type === 'product') {
      router.push(`/admin/products?id=${id}&q=${name}`);
    } else if (type === 'payout' || type === 'withdrawal') {
      router.push('/admin/finance/withdrawals');
    } else if (type === 'pooja') {
      router.push(`/admin/poojas?id=${id}&q=${name}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-primary font-medium font-serif italic">Loading Admin Universe...</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Temples",
      value: data?.stats?.totalTemples || 0,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      description: "Total temples",
      path: "/admin/temples"
    },
    {
      title: "Active Devotees",
      value: data?.stats?.totalUsers || 0,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      description: "Total devotees ",
      path: "/admin/users"
    },
    {
      title: "Total Bookings",
      value: data?.stats?.totalBookings || 0,
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Poojas & Product orders",
      path: "/admin/pooja-bookings"
    },
    {
      title: "Gross Revenue",
      value: data?.stats?.totalRevenue || 0,
      icon: IndianRupee,
      isCurrency: true,
      color: "text-[#794A05]",
      bg: "bg-[#794A05]/10",
      description: "Platform wide earnings",
      path: "/admin/finance/ledger"
    },
  ];

  return (
    <div className="space-y-8 pb-32">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Admin Intelligence
          </h1>
          <p className="text-dark-500 mt-1 font-medium">
            Dynamic overview of DevBhakti's spiritual and financial ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={loadDashboardData}>
            Refresh Data
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold shadow-lg shadow-primary/20" onClick={() => router.push('/admin/temples/create')}>
            Add New Temple
          </Button>
        </div>
      </div>

      {/* Stats Grid - Premium Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="cursor-pointer"
            onClick={() => router.push((stat as any).path)}
          >
            <Card className="border-none shadow-xl rounded-[1.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300 bg-white border border-slate-100 hover:shadow-primary/5">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  {/* <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500 uppercase tracking-widest">Live</Badge> */}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center truncate">
                    {stat.isCurrency && <IndianRupee className="w-4 h-4 mr-0.5 opacity-50 shrink-0" strokeWidth={3} />}
                    <span className="truncate">
                      {stat.isCurrency ? stat.value.toLocaleString() : stat.value}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-sm font-bold text-slate-900">{stat.title}</p>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-slate-400 hover:text-primary transition-colors cursor-help">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8} className="bg-slate-900 z-50 text-white border-slate-800 rounded-xl p-3 shadow-2xl max-w-xs break-words">
                          <p className="text-xs font-medium leading-relaxed">{stat.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Spiritual Activity
            </h3>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-lg" onClick={() => router.push('/admin/pooja-bookings')}>
              View full list
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white max-h-[600px] flex flex-col">
            <CardContent className="p-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-1">
                {data?.activities?.length > 0 ? (
                  data.activities.map((activity: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer"
                      onClick={() => handleActivityClick(activity)}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-colors shadow-sm",
                        activity.type === 'booking' ? "bg-amber-50 text-amber-600" :
                          activity.type === 'user' ? "bg-emerald-50 text-emerald-600" :
                            "bg-blue-50 text-blue-600"
                      )}>
                        {activity.type === 'booking' ? <Calendar className="w-5 h-5" /> :
                          activity.type === 'user' ? <Users className="w-5 h-5" /> :
                            <Building2 className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">{activity.description}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">


                        <span className="text-[15px] font-bold text-slate-800 uppercase tracking-tighter">
                          {format(new Date(activity.time), "hh:mm a  dd-MM-yyyy")}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center flex flex-col items-center gap-5 opacity-30">
                    <AlertCircle className="w-12 h-12" />
                    <p className="font-serif font-bold italic">No recent activities recorded.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals & Quick Stats */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Pending Approvals
            </h3>

            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">Priority Review</CardDescription>
                  <Badge className="bg-destructive/10 text-destructive border-none font-bold text-[10px] rounded-lg">
                    {data?.pending?.total || 0} Action Items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {data?.pendingApprovals?.length > 0 ? (
                  <div className="space-y-3">
                    {data.pendingApprovals.map((item: any) => (
                      <div key={item.id} className="p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-amber-50/30 transition-all cursor-pointer group" onClick={() => handlePendingItemClick(item)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 group-hover:text-primary transition-colors">{item.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{item.location}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-extrabold uppercase bg-white">{item.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-800">Clear! No Pending Approvals</p>
                    <p className="text-[10px] text-emerald-600 font-medium uppercase mt-1">Everything is verified</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => router.push('/admin/temples')}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Temples</p>
                    <p className="text-xl font-extrabold text-slate-900">{data?.pending?.temples || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-amber-50/50 cursor-pointer transition-colors" onClick={() => router.push('/admin/products')}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Products</p>
                    <p className="text-xl font-extrabold text-slate-900">{data?.pending?.products || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-emerald-50/50 cursor-pointer transition-colors" onClick={() => router.push('/admin/finance/withdrawals')}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Payouts</p>
                    <p className="text-xl font-extrabold text-slate-900">{data?.pending?.withdrawals || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-purple-50/50 cursor-pointer transition-colors" onClick={() => router.push('/admin/poojas')}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Poojas</p>
                    <p className="text-xl font-extrabold text-slate-900">{data?.pending?.poojas || 0}</p>
                  </div>
                </div>

                <Button variant="ghost" className="w-full rounded-xl font-bold text-primary group" onClick={() => router.push('/admin/pending-requests')}>
                  Review All Requests
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Platform Health Quick Insight */}
          {/* <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Platform Health: Optimal</span>
              </div>
              <h4 className="text-xl font-serif font-bold italic mb-6">"Digital spiritualism is blooming."</h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs text-slate-400 font-medium">Server Status</span>
                  <span className="text-xs font-bold text-emerald-400">99.9% Uptime</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Active Streams</span>
                  <span className="text-xs font-bold text-blue-400">12 Darshans</span>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Quick Navigation Cards - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FDFCF6]/95 backdrop-blur-sm border-t border-slate-200 py-4 px-6 z-40 md:pl-72 pl-24 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
        <h3 className="text-[14px] font-serif font-bold text-slate-900 mb-2.5 tracking-tight flex items-center gap-2">System Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: "Pooja & Sev Booking", icon: Calendar, path: "/admin/pooja-bookings", color: "text-amber-600 bg-amber-50" },
            { label: "Withdrawal Requests", icon: Wallet, path: "/admin/finance/withdrawals", color: "text-emerald-600 bg-emerald-50" },
            { label: "Product Inventory", icon: Package, path: "/admin/products", color: "text-blue-600 bg-blue-50" },
            { label: "Donation", icon: AlertCircle, path: "/admin/donation", color: "text-slate-600 bg-slate-100" }
          ].map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3.5 rounded-[1rem] bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.98]"
              onClick={() => router.push(action.path)}
            >
              <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0", action.color)}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[13px] font-extrabold text-slate-800 tracking-tight leading-tight">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
