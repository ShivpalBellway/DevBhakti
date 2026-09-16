"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingDown,
  PieChart as PieIcon,
  Users,
  PlusCircle,
  ArrowUpRight,
  DollarSign,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchTempleExpenseStats } from "@/api/templeAdminController";

export default function TempleExpenseDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchTempleExpenseStats(dateRange);
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to load temple expense stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-800 via-amber-900 to-yellow-950 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" /> Sacred Temple Financial Accounting
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif">Temple Expense Dashboard</h1>
          <p className="text-amber-100/80 text-sm mt-1">
            Track temple maintenance, pooja samagri, staff allowances, and net operational balance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="bg-white text-amber-900 hover:bg-amber-100 font-semibold shadow-md">
            <Link href="/temples/dashboard/expenses/list">
              <PlusCircle className="w-4 h-4 mr-2" /> + Record New Expense
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-amber-400/40 text-white hover:bg-amber-800/50">
            <Link href="/temples/dashboard/expenses/categories">
              Category Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-amber-200/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Expenses
            </CardTitle>
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">
              ₹{(stats?.totalExpenses || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats?.totalRecords || 0} expense entries recorded
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Revenue
            </CardTitle>
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              ₹{(stats?.totalGrossEarnings || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bookings, Donations & Orders combined
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Withdrawn
            </CardTitle>
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              ₹{(stats?.totalWithdrawn || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approved / Processed bank payouts
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Operational Balance
            </CardTitle>
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.netOperationalBalance || 0) >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
              ₹{(stats?.netOperationalBalance || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              (Earnings - Expenses - Withdrawals)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-amber-200/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-base font-bold">Category-wise Expenses</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-amber-800 hover:text-amber-900">
                <Link href="/temples/dashboard/expenses/categories">Manage Categories →</Link>
              </Button>
            </div>
            <CardDescription className="text-xs">
              Spending distribution across heads (Poojas, Maintenance, Prasad, Staff, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading category stats...</div>
            ) : !stats?.categoryBreakdown || stats.categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No expense entries logged yet.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.categoryBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{item.categoryName}</span>
                      <span className="font-medium text-rose-700">
                        ₹{item.totalAmount.toLocaleString('en-IN')} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-rose-600 rounded-full"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-right">{item.count} transaction(s)</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member-wise Breakdown */}
        <Card className="border-amber-200/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                <CardTitle className="text-base font-bold">Staff / Member Spending</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-amber-800 hover:text-amber-900">
                <Link href="/temples/dashboard/expenses/list">View All Entries →</Link>
              </Button>
            </div>
            <CardDescription className="text-xs">
              Attribution of who paid out-of-pocket on behalf of the Temple
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading member stats...</div>
            ) : !stats?.memberBreakdown || stats.memberBreakdown.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No member spending records found.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.memberBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-amber-50/40 hover:bg-amber-50/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-800 text-white font-bold flex items-center justify-center text-sm">
                        {item.paidByName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{item.paidByName}</p>
                        <p className="text-xs text-muted-foreground">{item.count} expense(s) paid</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-700">₹{item.totalAmount.toLocaleString('en-IN')}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 font-medium">
                        {item.percentage}% of total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
