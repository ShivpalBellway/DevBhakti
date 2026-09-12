"use client";

import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Ticket,
  CheckCircle2,
  User,
  Phone,
  Printer,
  ArrowLeft,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Eye,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalProfile, lookupDevoteeByPhoneMandal } from "@/api/mandalAdminController";
import { parseLocalizedValue, formatSlotTime } from "@/utils/textUtils";
import { useRouter } from "next/navigation";
import { printDarshanPassReceipt } from "@/utils/darshanReceipt";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function OfflineMandalTicketClient() {
  const { toast } = useToast();
  const router = useRouter();
  
  // View mode: "list" for history/overview, "add" for issuing form
  const [viewMode, setViewMode] = useState<"list" | "add">("list");

  const [mandalProfile, setMandalProfile] = useState<any>(null);
  const [mandalName, setMandalName] = useState<string>("Mandal");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  
  // Table search, filter, pagination
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // View ticket details modal
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any | null>(null);

  // Slots state (for "add" view)
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form fields
  const [visitorName, setVisitorName] = useState<string>("");
  const [visitorPhone, setVisitorPhone] = useState<string>("");
  const [visitorEmail, setVisitorEmail] = useState<string>("");
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [ticketType, setTicketType] = useState<string>("General Darshan Pass");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("");
  
  // Ticket result state for confirmation modal
  const [issuedTicket, setIssuedTicket] = useState<any | null>(null);

  // Lookup loading state
  const [isLookupLoading, setIsLookupLoading] = useState<boolean>(false);

  // Auto-fill devotee info when phone is entered
  const handlePhoneLookup = async (digits: string) => {
    if (digits.length < 10) return;
    try {
      setIsLookupLoading(true);
      const res = await lookupDevoteeByPhoneMandal(`+${digits}`);
      if (res.success && res.exists && res.data) {
        if (res.data.name) setVisitorName(res.data.name);
        if (res.data.email) setVisitorEmail(res.data.email);
        toast({
          title: "Devotee Details Auto-Filled",
          description: `Existing record found for ${res.data.name || 'devotee'}.`,
        });
      }
    } catch (err) {
      console.error("Phone lookup error", err);
    } finally {
      setIsLookupLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetchMandalProfile();
      if (res.success && res.data) {
        setMandalProfile(res.data);
        setMandalName(parseLocalizedValue(res.data.name) || "Mandal");
      }
    } catch (err) {
      console.error("Failed to load Mandal profile", err);
    }
  };

  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/mandal-admin/darshan-bookings/slots?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSlots(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error("Failed to fetch slots", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchIssuedTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/mandal-admin/darshan-bookings/tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setTicketsList(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets list", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadProfile();
    fetchIssuedTickets();
  }, []);

  useEffect(() => {
    if (viewMode === "add") {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, viewMode]);

  // Statistics calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let todayCount = 0;
    let todayTotal = 0;
    let grandTotal = 0;

    ticketsList.forEach((t) => {
      const amount = Number(t.totalAmount || t.amount || 0);
      grandTotal += amount;

      const tDate = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : "";
      if (tDate === todayStr) {
        todayCount += (t.visitorCount || 1);
        todayTotal += amount;
      }
    });

    return {
      totalTickets: ticketsList.length,
      todayCount,
      todayTotal,
      grandTotal,
    };
  }, [ticketsList]);

  // Filtered tickets list
  const filteredTickets = useMemo(() => {
    return ticketsList.filter((t) => {
      const name = (t.visitorName || "").toLowerCase();
      const phone = (t.visitorPhone || "").toLowerCase();
      const id = (t.displayId || t.id || "").toLowerCase();
      const passType = (t.ticketType || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || name.includes(query) || phone.includes(query) || id.includes(query) || passType.includes(query);
      const matchesPayment = paymentFilter === "ALL" || (t.paymentMethod || "").toUpperCase() === paymentFilter.toUpperCase();

      return matchesSearch && matchesPayment;
    });
  }, [ticketsList, searchQuery, paymentFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const paginatedTickets = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTickets, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorPhone.trim()) {
      toast({ title: "Validation Error", description: "Visitor name and phone number are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/mandal-admin/darshan-bookings/offline-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slotId: selectedSlotId || undefined,
          visitorName: visitorName.trim(),
          visitorPhone: visitorPhone.trim(),
          visitorEmail: visitorEmail.trim() || undefined,
          visitorCount,
          ticketType: ticketType || "General Darshan Pass",
          amount: ticketPrice * visitorCount,
          paymentMode,
          paymentReference: paymentReference.trim() || undefined
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate pass");

      const ticketData = json.ticket || json.data || {
        displayId: `MND-TK-${Date.now().toString().slice(-6)}`,
        visitorName,
        visitorPhone,
        visitorCount,
        ticketType,
        totalAmount: ticketPrice * visitorCount,
        paymentMode,
        createdAt: new Date().toISOString()
      };
      
      setIssuedTicket(ticketData);
      setTicketsList((prev) => [ticketData, ...prev]);
      toast({ title: "Success!", description: "Offline Mandal Darshan Pass issued successfully.", variant: "success" });
      
      // Reset Form
      setVisitorName("");
      setVisitorPhone("");
      setVisitorEmail("");
      setVisitorCount(1);
      setPaymentReference("");
      fetchSlots(selectedDate);
      fetchIssuedTickets();
    } catch (err: any) {
      console.error("Issue Offline Ticket Error", err);
      toast({ title: "Error", description: err.message || "Failed to generate pass", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (ticket: any) => {
    printDarshanPassReceipt({
      ...ticket,
      mandalName
    });
  };

  const handleExportExcel = () => {
    if (filteredTickets.length === 0) {
      toast({ title: "No Data", description: "There are no tickets to export.", variant: "destructive" });
      return;
    }

    const exportData = filteredTickets.map((t: any) => ({
      "Pass ID": t.displayId || t.id?.slice(-8) || "N/A",
      "Devotee Name": t.visitorName || "Devotee",
      "Phone": t.visitorPhone || "N/A",
      "Visitors": t.visitorCount || 1,
      "Pass Type": t.ticketType ? t.ticketType.replace(/_/g, " ") : "General Pass",
      "Darshan Date": t.slot?.date ? new Date(t.slot.date).toLocaleDateString("en-IN") : t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "N/A",
      "Amount (₹)": Number(t.totalAmount || t.amount || 0),
      "Payment": t.paymentMethod || t.paymentMode || "CASH"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offline Tickets");
    XLSX.writeFile(wb, `Mandal_Offline_Tickets_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 px-2 sm:px-0">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/mandals/dashboard/teller" className="hover:text-[#7b4623] flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Teller Module
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">
            {viewMode === "list" ? "Offline Ticket Management" : "Issue Offline Pass"}
          </span>
        </div>

        {viewMode === "list" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleExportExcel} variant="outline" className="border-[#7b4623]/20 hover:bg-[#7b4623]/5 text-[#7b4623] shadow-sm rounded-xl font-bold">
              <Download className="w-4 h-4 mr-2" /> Export Excel
            </Button>
            <Button onClick={() => setViewMode("add")} className="bg-[#7b4623] hover:bg-[#5d351a] text-white shadow-md rounded-xl font-bold">
              <Plus className="w-4 h-4 mr-2" /> Record Offline Ticket
            </Button>
          </div>
        ) : (
          <Button onClick={() => setViewMode("list")} variant="outline" className="border-slate-300 rounded-xl font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets List
          </Button>
        )}
      </div>

      {viewMode === "list" ? (
        <>
          {/* Header Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Offline Darshan Tickets</h1>
            <p className="text-sm text-slate-500">View, manage, and record manual entry passes for devotees at counter.</p>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Passes Issued</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTickets}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{stats.todayCount} visitors today</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Ticket className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Today's Revenue</p>
                  <h3 className="text-2xl font-bold text-emerald-700 mt-1">₹{stats.todayTotal.toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Offline pass collection today</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Collection</p>
                  <h3 className="text-2xl font-bold text-blue-700 mt-1">₹{stats.grandTotal.toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cumulative ticket revenue</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Search Bar */}
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by devotee name, phone, pass ID, or type..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 rounded-xl border-slate-200 focus:border-[#7b4623]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={paymentFilter}
                    onChange={(e) => {
                      setPaymentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List Table */}
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-semibold">Pass ID</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Devotee Name</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Phone</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Visitors</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Pass Type / Slot</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Date</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3.5 text-left font-semibold">Payment</th>
                    <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingTickets ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-[#7b4623]" />
                          <span>Loading offline tickets history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        <p className="font-medium text-base text-slate-700">No offline tickets found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or payment filter.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket, idx) => (
                      <tr key={ticket.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#7b4623]">
                          {ticket.displayId || ticket.id?.slice(-8) || "N/A"}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {ticket.visitorName || "Devotee"}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {ticket.visitorPhone || "N/A"}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {ticket.visitorCount || 1} Person(s)
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {ticket.ticketType ? ticket.ticketType.replace(/_/g, " ") : "General Pass"}
                        </td>
                         <td className="px-4 py-3.5 text-slate-600">
                           {ticket.slot?.date
                             ? new Date(ticket.slot.date).toLocaleDateString("en-IN")
                             : ticket.createdAt
                             ? new Date(ticket.createdAt).toLocaleDateString("en-IN")
                             : "N/A"}
                         </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-700">
                          ₹{Number(ticket.totalAmount || ticket.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                           <Badge variant="outline" className="uppercase text-xs font-semibold bg-slate-50 text-slate-700">
                             {ticket.paymentMethod || ticket.paymentMode || "CASH"}
                           </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedTicketDetails(ticket)}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              title="View Ticket Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(ticket)}
                              className="h-8 w-8 text-[#7b4623] hover:bg-amber-50"
                              title="Print Pass"
                            >
                              <Printer className="w-4 h-4" />
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
            {filteredTickets.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                  <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</strong> of{" "}
                  <strong className="text-slate-800">{filteredTickets.length}</strong> tickets
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-lg text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </Button>

                  <span className="text-xs font-semibold px-2 text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 rounded-lg text-xs"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : (
        /* "add" Mode: Record/Issue Offline Ticket Form */
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
              Record Offline Ticket (Teller Counter)
            </h1>
            <p className="text-sm text-slate-500">
              Issue Darshan Passes / Counter Entry Tickets for Devotees visiting {mandalName}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#7b4623]" /> Devotee Information
                  </CardTitle>
                  <CardDescription>Enter visitor details to generate offline entry pass</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="visitorName" className="text-xs uppercase font-bold text-slate-500">
                          Devotee Name *
                        </Label>
                        <Input
                          id="visitorName"
                          placeholder="e.g. Ramesh Patel"
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          className="rounded-xl h-11"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="visitorPhone" className="text-xs uppercase font-bold text-slate-500">
                          Phone Number *
                        </Label>
                        <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#7b4623]/20 focus-within:border-[#7b4623] transition-all">
                          <span className="bg-slate-100/90 px-3 py-2.5 border-r border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 shrink-0">
                            🇮🇳 +91
                          </span>
                          <div className="relative flex-1">
                            <Input
                              id="visitorPhone"
                              type="tel"
                              placeholder="10-digit mobile number"
                              value={visitorPhone}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setVisitorPhone(digits);
                                if (digits.length === 10) handlePhoneLookup(digits);
                              }}
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-11 text-sm font-medium pr-8"
                              required
                            />
                            {isLookupLoading && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="visitorEmail" className="text-xs uppercase font-bold text-slate-500">
                          Email (Optional)
                        </Label>
                        <Input
                          id="visitorEmail"
                          type="email"
                          placeholder="devotee@example.com"
                          value={visitorEmail}
                          onChange={(e) => setVisitorEmail(e.target.value)}
                          className="rounded-xl h-11"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="visitorCount" className="text-xs uppercase font-bold text-slate-500">
                          Number of Persons *
                        </Label>
                        <Input
                          id="visitorCount"
                          type="number"
                          min={1}
                          max={50}
                          value={visitorCount}
                          onChange={(e) => setVisitorCount(parseInt(e.target.value) || 1)}
                          className="rounded-xl h-11"
                          required
                        />
                      </div>
                    </div>

                    {/* Auto-selected Pass & Price Info Card */}
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase">Selected Pass Type:</span>
                        <span className="font-extrabold text-[#7b4623] text-sm">
                          {ticketType ? ticketType.replace(/_/g, " ") : "General Darshan Pass"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200/60">
                        <span className="text-slate-500 font-bold uppercase">Price Per Head:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          ₹{ticketPrice} / person
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-bold text-slate-500">Payment Mode</Label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value)}
                          className="w-full h-11 px-3 border rounded-xl bg-white text-sm"
                        >
                          <option value="CASH">Cash</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="CARD">Debit / Credit Card</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-bold text-slate-500">Txn / Receipt Ref (Optional)</Label>
                        <Input
                          placeholder="Receipt / UPI Ref No"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-12 text-base font-bold bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl shadow-md"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Issuing Ticket...
                          </>
                        ) : (
                          <>
                            <Ticket className="w-5 h-5 mr-2" /> Issue & Print Darshan Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Slot Selector & Ticket Summary Box */}
            <div className="space-y-6">
              {/* Slot Selection Card */}
              <Card className="border shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3.5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#7b4623]" /> Select Darshan Slot
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {slots.length} available
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="slotDate" className="text-xs uppercase font-bold text-slate-500">
                      Select Date
                    </Label>
                    <Input
                      id="slotDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlotId("");
                      }}
                      className="rounded-xl h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-slate-500">Available Slots</Label>
                    {loadingSlots ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#7b4623]" />
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="text-xs text-center text-muted-foreground p-4 bg-slate-50 rounded-xl border border-dashed">
                        No slots created for this date.
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => router.push("/mandals/dashboard/darshan/slots")}
                          className="text-[#7b4623] text-xs h-auto p-0 ml-1 font-bold"
                        >
                          + Create Slot
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {slots.map((slot) => {
                          const available = Math.max(0, slot.maxCapacity - slot.bookedCount);
                          const isSelected = slot.id === selectedSlotId;
                          const isFull = available < visitorCount || slot.isClosed;

                          const offlineCountForSlot = ticketsList
                            .filter((t) => t.slotId === slot.id || t.slot?.id === slot.id)
                            .reduce((acc, t) => acc + (t.visitorCount || 1), 0);

                          return (
                            <div
                              key={slot.id}
                              onClick={() => {
                                if (!isFull) {
                                  setSelectedSlotId(slot.id);
                                  setTicketType(slot.title || "General Darshan Pass");
                                  setTicketPrice(slot.price || 0);
                                }
                              }}
                              className={`p-3 rounded-xl border text-sm transition-all cursor-pointer space-y-2 ${
                                isSelected
                                  ? "border-[#7b4623] bg-amber-50/80 shadow-sm font-semibold ring-1 ring-[#7b4623]"
                                  : isFull
                                  ? "opacity-50 cursor-not-allowed bg-gray-100 border-slate-200"
                                  : "hover:border-[#7b4623]/50 bg-white"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                                  <Clock className="w-3.5 h-3.5 text-[#7b4623]" />
                                  {slot.title || "Darshan Pass"} ({formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)})
                                </span>
                                <Badge variant={available > 0 ? "outline" : "destructive"} className="text-[10px]">
                                  {available} left
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                <span className="font-extrabold text-[#7b4623]">
                                  ₹{slot.price || 0} / person
                                </span>
                                <span className="font-semibold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                  <Ticket className="w-3 h-3 text-amber-700" /> Offline: {offlineCountForSlot}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ticket Summary Box */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50/50 to-white border">
                <CardHeader className="border-b bg-amber-100/40 py-3.5">
                  <CardTitle className="text-sm font-bold text-[#7b4623] uppercase tracking-wider flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> Ticket Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Mandal:</span>
                      <span className="font-bold text-slate-800">{mandalName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Pass Type:</span>
                      <Badge variant="outline" className="font-semibold text-xs uppercase">
                        {ticketType.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Persons:</span>
                      <span className="font-bold text-slate-900">{visitorCount}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Price per Head:</span>
                      <span className="font-medium">₹{ticketPrice}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-base font-extrabold text-[#7b4623]">
                      <span>Total Amount:</span>
                      <span>₹{ticketPrice * visitorCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Details Modal */}
      {selectedTicketDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedTicketDetails(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-serif font-bold text-slate-900">Offline Ticket Details</h2>
              <button onClick={() => setSelectedTicketDetails(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Pass ID</p>
                  <p className="font-mono font-bold text-[#7b4623]">{selectedTicketDetails.displayId || selectedTicketDetails.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Payment Mode</p>
                  <Badge variant="outline" className="uppercase text-xs mt-0.5">{selectedTicketDetails.paymentMode || "CASH"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Devotee Name</p>
                  <p className="font-semibold text-slate-900">{selectedTicketDetails.visitorName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                  <p className="font-semibold text-slate-900">{selectedTicketDetails.visitorPhone || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Visitors Count</span>
                  <span className="font-semibold text-slate-900">{selectedTicketDetails.visitorCount} Person(s)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Pass Type</span>
                  <span className="font-semibold text-slate-900">{selectedTicketDetails.ticketType?.replace(/_/g, " ") || "General Pass"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Issued Date</span>
                  <span className="font-semibold text-slate-900">{selectedTicketDetails.createdAt ? new Date(selectedTicketDetails.createdAt).toLocaleString("en-IN") : "N/A"}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="font-medium text-slate-700">Total Ticket Amount</span>
                <span className="text-xl font-bold text-[#7b4623]">₹{Number(selectedTicketDetails.totalAmount || selectedTicketDetails.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3">
              <Button onClick={() => handlePrint(selectedTicketDetails)} variant="outline" className="flex-1 border-[#7b4623] text-[#7b4623] rounded-xl">
                <Printer className="w-4 h-4 mr-2" /> Print Pass
              </Button>
              <Button onClick={() => setSelectedTicketDetails(null)} className="flex-1 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal After Submission */}
      {issuedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-2 border-[#7b4623] rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-[#7b4623] text-white text-center py-5">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-1 text-emerald-300 animate-bounce" />
              <CardTitle className="text-xl font-serif">Mandal Darshan Ticket Issued!</CardTitle>
              <CardDescription className="text-amber-100 text-xs font-mono">
                {issuedTicket.displayId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 border-b pb-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mandal:</span>
                  <span className="font-bold">{mandalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Devotee:</span>
                  <span className="font-bold">{issuedTicket.visitorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{issuedTicket.visitorPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visitors:</span>
                  <span className="font-bold">{issuedTicket.visitorCount} Person(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-bold text-[#7b4623]">₹{issuedTicket.totalAmount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handlePrint(issuedTicket)}
                  variant="outline"
                  className="flex-1 border-[#7b4623] text-[#7b4623] rounded-xl h-11"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Pass
                </Button>
                <Button
                  onClick={() => {
                    setIssuedTicket(null);
                    setViewMode("list");
                  }}
                  className="flex-1 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl h-11"
                >
                  Done / View List
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
