"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  CreditCard,
  Printer,
  Download,
  Flame,
  Receipt,
  Award,
  Globe,
  Building2,
  RefreshCw,
  Clock,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchMandalFinancialReport, fetchMandalProfile } from "@/api/mandalAdminController";
import { generateMandalReceiptHTML, downloadMandalReceiptPDF, openPrintPDFWindow, MandalReceiptData } from "@/utils/mandalReceiptTemplate";
import { BASE_URL } from "@/config/apiConfig";

const getFullImageUrl = (pathStr: string) => {
    if (!pathStr) return "";
    if (pathStr.startsWith("http") || pathStr.startsWith("blob:")) return pathStr;
    const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function MandalReportsPage() {
  const [period, setPeriod] = useState<string>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [category, setCategory] = useState<string>("ALL");
  const [channel, setChannel] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);
  const [mandalProfile, setMandalProfile] = useState<any>(null);

  const loadProfile = async () => {
    try {
      const res = await fetchMandalProfile();
      if (res.success && res.data) {
        setMandalProfile(res.data);
      }
    } catch (e) {
      console.error("Failed to load mandal profile for reports:", e);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        period,
        page,
        limit: 10,
        category,
        channel,
        search
      };
      if (period === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await fetchMandalFinancialReport(params);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Failed to load mandal financial report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period, page, category, channel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadReport();
  };

  const handleCustomSearch = () => {
    if (period === "custom") {
      setPage(1);
      loadReport();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!reportData) return;

    const periodLabel = reportData?.dateRange?.formattedRange || period;
    const lines: string[] = [];

    lines.push(`"MANDAL FINANCIAL & COLLECTION REPORT"`);
    lines.push(`"Period: ${periodLabel}"`);
    lines.push(`"Generated Date: ${new Date().toLocaleString("en-IN")}"`);
    lines.push("");

    lines.push(`"OVERVIEW"`);
    lines.push(`"Total Collection","Total Transactions","Avg Transaction Value"`);
    lines.push(
      `"${reportData?.overview?.totalCollection || 0}","${reportData?.overview?.totalTransactions || 0}","${reportData?.overview?.avgTransactionValue || 0}"`
    );
    lines.push("");

    lines.push(`"COLLECTION CHANNEL BREAKDOWN"`);
    lines.push(`"Channel","Amount (INR)","Transaction Count","Percentage"`);
    lines.push(
      `"Online","${reportData?.channelSummary?.online?.amount || 0}","${reportData?.channelSummary?.online?.count || 0}","${reportData?.channelSummary?.online?.percentage || 0}%"`
    );
    lines.push(
      `"Offline","${reportData?.channelSummary?.offline?.amount || 0}","${reportData?.channelSummary?.offline?.count || 0}","${reportData?.channelSummary?.offline?.percentage || 0}%"`
    );
    lines.push(
      `"Total","${reportData?.channelSummary?.total?.amount || 0}","${reportData?.channelSummary?.total?.count || 0}","100%"`
    );
    lines.push("");

    lines.push(`"CATEGORY SUMMARY"`);
    lines.push(`"Category Name","Amount (INR)","Percentage"`);
    (reportData?.categorySummary || []).forEach((cat: any) => {
      lines.push(`"${cat.name}","${cat.amount || 0}","${cat.percentage || 0}%"`);
    });
    lines.push("");

    lines.push(`"TODAY PAYMENT MODE SUMMARY"`);
    lines.push(`"Payment Mode","Amount (INR)"`);
    (reportData?.paymentModeSummary || []).forEach((pm: any) => {
      lines.push(`"${pm.label}","${pm.amount || 0}"`);
    });
    lines.push("");

    lines.push(`"DETAILED TRANSACTIONS LIST"`);
    lines.push(`"Date & Time","Receipt No","Devotee Name","Devotee Phone","Devotee Email","Service Title","Category","Channel","Payment Mode","Amount (INR)"`);
    (reportData?.transactions?.list || []).forEach((tx: any) => {
      const dateStr = new Date(tx.createdAt).toLocaleString("en-IN");
      const receipt = `#${tx.receiptNo || tx.id.slice(-6)}`;
      const name = tx.devotee?.name || "Devotee";
      const phone = tx.devotee?.phone || "";
      const email = tx.devotee?.email || "";
      const title = tx.title || "";
      const cat = tx.categoryName || "";
      const ch = tx.channel || "";
      const mode = tx.paymentMode || "";
      const amt = tx.amount || 0;

      lines.push(
        `"${dateStr}","${receipt}","${name.replace(/"/g, '""')}","${phone}","${email}","${title.replace(/"/g, '""')}","${cat}","${ch}","${mode}","${amt}"`
      );
    });

    const csvContent = lines.join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mandal_financial_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildTxReceiptData = (tx: any): MandalReceiptData => {
    const config = mandalProfile?.receiptConfig || mandalProfile?.receiptSettings || {};
    const headerBanner = config.headerBanner ? getFullImageUrl(config.headerBanner) : null;
    const sponsors = (config.sponsors || []).map((sp: any) => ({
      ...sp,
      imageUrl: getFullImageUrl(sp.imageUrl)
    }));

    return {
      receiptNo: tx.receiptNo || tx.id.slice(-8).toUpperCase(),
      dateTime: tx.createdAt 
        ? new Date(tx.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      paymentMode: tx.paymentMode || "CASH",
      transactionId: tx.id,
      mandalName: mandalProfile?.name_en || mandalProfile?.name || "DevBhakti Mandal",
      mandalAddress: mandalProfile?.address ? `${mandalProfile.address}, ${mandalProfile.city || ''}` : "India",
      mandalSlug: mandalProfile?.slug || mandalProfile?.id,
      headerBanner,
      sponsors,
      customThankYouNote: config.customThankYouNote,
      items: [
        {
          description: tx.title || tx.categoryName || "Contribution / Booking",
          quantity: 1,
          amount: Number(tx.amount || 0)
        }
      ],
      totalAmount: Number(tx.amount || 0),
      devoteeName: tx.devotee?.name || "Devotee",
      devoteePhone: tx.devotee?.phone || ""
    };
  };

  const handlePrintTxReceipt = (tx: any) => {
    const data = buildTxReceiptData(tx);
    openPrintPDFWindow(generateMandalReceiptHTML(data));
  };

  const handleDownloadTxReceipt = (tx: any) => {
    const data = buildTxReceiptData(tx);
    downloadMandalReceiptPDF(data);
  };

  const formatCurrency = (val?: number) => {
    return `₹ ${(val || 0).toLocaleString("en-IN")}`;
  };

  const todayDateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const txPagination = reportData?.transactions?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const txList = reportData?.transactions?.list || [];

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            Collection Reports & Analytics
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Real-time breakdown of Online, Offline, Pooja, Donation, & Marketplace collections.
          </p>
        </div>

        {/* Filter Period Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-xl text-xs font-semibold">
          {[
            { key: "today", label: "Today" },
            { key: "this_week", label: "This Week" },
            { key: "this_month", label: "This Month" },
            { key: "last_month", label: "Last Month" },
            { key: "custom", label: "Custom Range" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setPeriod(tab.key);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                period === tab.key
                  ? "bg-amber-900 text-white shadow-md shadow-amber-900/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Controls */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100 print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Button
            onClick={handleCustomSearch}
            size="sm"
            className="bg-amber-900 hover:bg-amber-800 text-white text-xs px-4 h-8"
          >
            Apply Filter
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-600">Generating Financial Report...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT PANEL: TODAY'S SUMMARY */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Today's Summary
                    <span className="text-xs font-normal text-gray-500">({todayDateStr})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                    <p className="text-[11px] font-medium text-gray-500">Pooja & Seva</p>
                    <p className="text-base font-bold text-gray-900 mt-1">
                      {formatCurrency(reportData?.todaysSummary?.poojaAndSeva)}
                    </p>
                  </div>
                  <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                    <p className="text-[11px] font-medium text-gray-500">Donations</p>
                    <p className="text-base font-bold text-gray-900 mt-1">
                      {formatCurrency(reportData?.todaysSummary?.donations)}
                    </p>
                  </div>
                  <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                    <p className="text-[11px] font-medium text-gray-500">Sacred Items</p>
                    <p className="text-base font-bold text-gray-900 mt-1">
                      {formatCurrency(reportData?.todaysSummary?.sacredItems)}
                    </p>
                  </div>
                  <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                    <p className="text-[11px] font-medium text-gray-500">Ticketing</p>
                    <p className="text-base font-bold text-gray-900 mt-1">
                      {formatCurrency(reportData?.todaysSummary?.ticketing)}
                    </p>
                  </div>
                </div>

                {/* Today's Total Collection Card */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/60 mb-5">
                  <p className="text-xs font-semibold text-amber-900">Total Collection</p>
                  <p className="text-2xl font-black text-rose-700 mt-1">
                    {formatCurrency(reportData?.todaysSummary?.totalCollection)}
                  </p>
                </div>

                {/* Payment Mode Summary for Today */}
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                    Payment Mode Summary
                  </p>
                  <div className="space-y-2 text-xs">
                    {reportData?.paymentModeSummary?.map((pm: any) => (
                      <div
                        key={pm.mode}
                        className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <span className="font-medium text-gray-600 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          {pm.label}
                        </span>
                        <span className="font-bold text-gray-900">{formatCurrency(pm.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-4 italic">
                    All amounts are in INR (₹)
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: OVERVIEW, CATEGORY, MODE & ONLINE/OFFLINE BREAKDOWN */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                {/* Date Header Display */}
                <div className="flex items-center justify-between bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-amber-900">
                    <CalendarIcon className="w-4 h-4 text-amber-700" />
                    <span>{reportData?.dateRange?.formattedRange || "Selected Period"}</span>
                  </div>
                  <span className="text-[11px] font-semibold bg-amber-200/60 text-amber-900 px-2.5 py-1 rounded-full uppercase">
                    {reportData?.filterPeriod?.replace("_", " ")}
                  </span>
                </div>

                {/* OVERVIEW CARDS */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Overview
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-gray-500">Total Collection</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(reportData?.overview?.totalCollection)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-gray-500">Total Transactions</p>
                        <p className="text-lg font-bold text-gray-900">
                          {(reportData?.overview?.totalTransactions || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-gray-500">Avg. Transaction Value</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(reportData?.overview?.avgTransactionValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CATEGORY SUMMARY */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Category Summary
                  </h4>
                  <div className="space-y-2.5">
                    {reportData?.categorySummary?.map((cat: any) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100"
                      >
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-gray-900">{formatCurrency(cat.amount)}</span>
                          <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ONLINE vs OFFLINE CHANNEL SUMMARY */}
                <div className="bg-gradient-to-br from-amber-900 to-amber-950 text-white p-5 rounded-2xl shadow-md">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    Collection Channel Breakdown (Online vs Offline)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* ONLINE */}
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Online Collection
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          {reportData?.channelSummary?.online?.percentage}%
                        </span>
                      </div>
                      <p className="text-xl font-black text-white">
                        {formatCurrency(reportData?.channelSummary?.online?.amount)}
                      </p>
                      <p className="text-[11px] text-amber-200/80 mt-1">
                        {reportData?.channelSummary?.online?.count || 0} Transactions
                      </p>
                    </div>

                    {/* OFFLINE */}
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          Offline Collection
                        </span>
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                          {reportData?.channelSummary?.offline?.percentage}%
                        </span>
                      </div>
                      <p className="text-xl font-black text-white">
                        {formatCurrency(reportData?.channelSummary?.offline?.amount)}
                      </p>
                      <p className="text-[11px] text-amber-200/80 mt-1">
                        {reportData?.channelSummary?.offline?.count || 0} Transactions
                      </p>
                    </div>

                    {/* TOTAL */}
                    <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                          Total Collection
                        </span>
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                          100%
                        </span>
                      </div>
                      <p className="text-xl font-black text-amber-400">
                        {formatCurrency(reportData?.channelSummary?.total?.amount)}
                      </p>
                      <p className="text-[11px] text-amber-200/80 mt-1">
                        {reportData?.channelSummary?.total?.count || 0} Total Transactions
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS (Print & Download Report) */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 print:hidden">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="default"
                    className="border-amber-900/30 text-amber-900 hover:bg-amber-50 font-bold text-xs gap-2 px-5 h-11 rounded-xl"
                  >
                    <Printer className="w-4 h-4" />
                    Print Report
                  </Button>

                  <Button
                    onClick={handleDownload}
                    size="default"
                    className="bg-gradient-to-r from-amber-900 to-amber-950 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs gap-2 px-6 h-11 rounded-xl shadow-md shadow-amber-900/20"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED TRANSACTIONS LIST WITH DEVOTEE USER INFO & PAGINATION */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  Detailed Transaction History
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  View individual devotee payments, service category, channel, & payment modes for the selected period.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search name, phone, receipt..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 md:w-56"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </form>

                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="POOJA_SEVA">Pooja & Seva</option>
                  <option value="DONATIONS">Donations</option>
                  <option value="SACRED_ITEMS">Sacred Items</option>
                  <option value="TICKETING">Ticketing</option>
                </select>

                <select
                  value={channel}
                  onChange={(e) => {
                    setChannel(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Channels</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Receipt / ID</th>
                    <th className="py-3 px-3">Devotee / User Info</th>
                    <th className="py-3 px-3">Service / Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {txList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400 italic">
                        No transactions found for the selected filter and period.
                      </td>
                    </tr>
                  ) : (
                    txList.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                          <span className="text-[10px] text-gray-400 block">
                            {new Date(tx.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-900 whitespace-nowrap">
                          {tx.receiptNo
                            ? (tx.receiptNo.length > 20
                                ? `#${tx.receiptNo.slice(-6).toUpperCase()}`
                                : (tx.receiptNo.startsWith('#') ? tx.receiptNo : `#${tx.receiptNo}`))
                            : `#${tx.id.slice(-6).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            {tx.devotee?.name || "Devotee"}
                          </div>
                          {tx.devotee?.phone && (
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {tx.devotee.phone}
                            </div>
                          )}
                          {tx.devotee?.email && (
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {tx.devotee.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800">
                          {tx.title}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {tx.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {tx.channel === "ONLINE" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <Globe className="w-3 h-3" /> Online
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
                              <Building2 className="w-3 h-3" /> Offline
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-700 whitespace-nowrap">
                          {tx.paymentMode}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900 text-right whitespace-nowrap">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 rounded-lg"
                              onClick={() => handlePrintTxReceipt(tx)}
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 rounded-lg"
                              onClick={() => handleDownloadTxReceipt(tx)}
                              title="Download Receipt PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>
                Showing {txList.length ? (txPagination.page - 1) * txPagination.limit + 1 : 0} to{" "}
                {Math.min(txPagination.page * txPagination.limit, txPagination.total)} of {txPagination.total} transactions
              </span>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={txPagination.page <= 1}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>
                <span className="font-semibold text-gray-700 px-2">
                  Page {txPagination.page} of {txPagination.totalPages}
                </span>
                <Button
                  onClick={() => setPage((p) => Math.min(txPagination.totalPages, p + 1))}
                  disabled={txPagination.page >= txPagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
