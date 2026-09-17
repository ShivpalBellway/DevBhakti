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
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTempleExpenseStats } from "@/api/templeAdminController";

export default function TempleExpenseDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  // Search & Pagination States
  const [categorySearch, setCategorySearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [memPage, setMemPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchTempleExpenseStats({
        ...dateRange,
        categorySearch: categorySearch.trim(),
        memberSearch: memberSearch.trim(),
      });
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
    const timer = setTimeout(() => {
      loadStats();
    }, 300);
    return () => clearTimeout(timer);
  }, [dateRange, categorySearch, memberSearch]);

  // Reset pagination when search changes
  useEffect(() => {
    setCatPage(1);
  }, [categorySearch]);

  useEffect(() => {
    setMemPage(1);
  }, [memberSearch]);

  // Paginated Data
  const categoriesList = stats?.categoryBreakdown || [];
  const catTotalPages = Math.ceil(categoriesList.length / ITEMS_PER_PAGE) || 1;
  const paginatedCategories = categoriesList.slice((catPage - 1) * ITEMS_PER_PAGE, catPage * ITEMS_PER_PAGE);

  const membersList = stats?.memberBreakdown || [];
  const memTotalPages = Math.ceil(membersList.length / ITEMS_PER_PAGE) || 1;
  const paginatedMembers = membersList.slice((memPage - 1) * ITEMS_PER_PAGE, memPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 text-white p-6 rounded-2xl shadow-lg border border-amber-800/30">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" /> Sacred Temple Financial Accounting
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white">Temple Expense Dashboard</h1>
          <p className="text-amber-100/90 text-sm mt-1">
            Track temple maintenance, pooja samagri, staff allowances, and net operational balance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-md">
            <Link href="/temples/dashboard/expenses/list">
              <PlusCircle className="w-4 h-4 mr-2" /> + Record New Expense
            </Link>
          </Button>
          <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-medium border border-amber-300/40 backdrop-blur-sm shadow-sm">
            <Link href="/temples/dashboard/expenses/categories">
              Category Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <Card className="border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-900/10 text-amber-900 flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              ₹{(stats?.totalExpenses || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Total Expenses
            </p>
          </CardContent>
        </Card>

        {/* Total Entries */}
        <Card className="border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats?.totalRecords || 0}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Total Entries
            </p>
          </CardContent>
        </Card>

        {/* Staff Spent */}
        <Card className="border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats?.memberBreakdown?.length || 0}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Staff Spent
            </p>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <PieIcon className="w-6 h-6" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats?.categoryBreakdown?.length || 0}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Expenses Card */}
        <Card className="border-amber-100 shadow-sm bg-amber-50/20 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-amber-950 font-serif">
                  Category-wise Expenses
                </CardTitle>
                <Link
                  href="/temples/dashboard/expenses/categories"
                  className="text-xs font-semibold text-amber-900 hover:text-amber-700 transition-colors"
                >
                  Manage Categories →
                </Link>
              </div>

              {/* Search Category */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search Category..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-amber-200/80 rounded-lg focus-visible:ring-amber-500"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">Loading category stats...</div>
              ) : paginatedCategories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No category expenses found.
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedCategories.map((item: any, idx: number) => {
                    const iconBgColors = [
                      "bg-rose-100 text-rose-700",
                      "bg-sky-100 text-sky-700",
                      "bg-amber-100 text-amber-700",
                      "bg-emerald-100 text-emerald-700",
                      "bg-indigo-100 text-indigo-700",
                    ];
                    const bgClass = iconBgColors[idx % iconBgColors.length];

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100/80 shadow-2xs hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center font-bold text-sm shrink-0`}>
                            <PieIcon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">
                            {item.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 text-sm">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-800 font-bold text-xs">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>

          {/* Pagination Controls */}
          {categoriesList.length > ITEMS_PER_PAGE && (
            <div className="p-4 pt-0 flex items-center justify-between border-t border-amber-100/60 mt-2">
              <span className="text-xs text-slate-500">
                Page {catPage} of {catTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={catPage === 1}
                  onClick={() => setCatPage(prev => Math.max(1, prev - 1))}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={catPage >= catTotalPages}
                  onClick={() => setCatPage(prev => Math.min(catTotalPages, prev + 1))}
                  className="h-8 px-2 text-xs"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Member-wise Expenses Card */}
        <Card className="border-amber-100 shadow-sm bg-amber-50/20 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-amber-950 font-serif">
                  Staff / Member Expenses
                </CardTitle>
                <Link
                  href="/temples/dashboard/expenses/list"
                  className="text-xs font-semibold text-amber-900 hover:text-amber-700 transition-colors"
                >
                  View All Entries →
                </Link>
              </div>

              {/* Search Member */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search Staff/Member Name..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-amber-200/80 rounded-lg focus-visible:ring-amber-500"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">Loading member stats...</div>
              ) : paginatedMembers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No member spending records found.
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedMembers.map((item: any, idx: number) => {
                    const avatarBgColors = [
                      "bg-orange-200 text-orange-800",
                      "bg-amber-200 text-amber-900",
                      "bg-stone-300 text-stone-800",
                      "bg-yellow-200 text-yellow-900",
                    ];
                    const avatarBg = avatarBgColors[idx % avatarBgColors.length];

                    const initials = item.paidByName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() || "MB";

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100/80 shadow-2xs hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${avatarBg} font-bold text-sm flex items-center justify-center shrink-0`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.paidByName}</p>
                            <p className="text-xs text-muted-foreground">{item.count} entries</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-sm">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </div>

          {/* Pagination Controls */}
          {membersList.length > ITEMS_PER_PAGE && (
            <div className="p-4 pt-0 flex items-center justify-between border-t border-amber-100/60 mt-2">
              <span className="text-xs text-slate-500">
                Page {memPage} of {memTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={memPage === 1}
                  onClick={() => setMemPage(prev => Math.max(1, prev - 1))}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={memPage >= memTotalPages}
                  onClick={() => setMemPage(prev => Math.min(memTotalPages, prev + 1))}
                  className="h-8 px-2 text-xs"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
