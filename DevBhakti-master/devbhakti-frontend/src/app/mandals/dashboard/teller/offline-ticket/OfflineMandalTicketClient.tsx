"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, CheckCircle2, User, Phone, Printer, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalProfile } from "@/api/mandalAdminController";
import { parseLocalizedValue } from "@/utils/textUtils";
import { useRouter } from "next/navigation";
import { printDarshanPassReceipt } from "@/utils/darshanReceipt";
import { formatSlotTime } from "@/utils/textUtils";
import { Calendar, Clock, Users, Plus } from "lucide-react";

export default function OfflineMandalTicketClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [mandalProfile, setMandalProfile] = useState<any>(null);
  const [mandalName, setMandalName] = useState<string>("Mandal");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  
  // Slots state
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form fields
  const [visitorName, setVisitorName] = useState<string>("");
  const [visitorPhone, setVisitorPhone] = useState<string>("");
  const [visitorEmail, setVisitorEmail] = useState<string>("");
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [ticketType, setTicketType] = useState<string>("GENERAL_DARSHAN");
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("");
  
  // Ticket result state for confirmation & printing
  const [issuedTicket, setIssuedTicket] = useState<any | null>(null);

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
    fetchSlots(selectedDate);
  }, [selectedDate]);

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
          ticketType,
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-900">
              Offline Ticket Booking (Teller Counter)
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Issue Darshan Passes / Counter Tickets for Devotees visiting {mandalName}
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/mandals/dashboard/darshan/slots")}
          className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl shadow-sm text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Manage Darshan Slots
        </Button>
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
                      <Input
                        id="visitorPhone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-11 text-sm font-medium"
                        required
                      />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-slate-500">Pass Type</Label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value)}
                      className="w-full h-11 px-3 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-[#7b4623]"
                    >
                      <option value="GENERAL_DARSHAN">General Darshan Pass (Free)</option>
                      <option value="VIP_DARSHAN">VIP Fast-Track Pass</option>
                      <option value="SPECIAL_EVENT">Special Event Entry Ticket</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase font-bold text-slate-500">Ticket Price per Person (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
                      className="rounded-xl h-11"
                    />
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
                          onClick={() => !isFull && setSelectedSlotId(slot.id)}
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
                              {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                            </span>
                            <Badge variant={available > 0 ? "outline" : "destructive"} className="text-[10px]">
                              {available} left
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="text-slate-600">
                              Booked: <strong className="text-slate-800">{slot.bookedCount}</strong>/{slot.maxCapacity}
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
            <CardHeader className="border-b bg-amber-100/40">
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

      {/* Issued Mandal Offline Tickets History Table */}
      {ticketsList.length > 0 && (
        <Card className="border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#7b4623]" /> Issued Offline Passes History
              </CardTitle>
              <CardDescription className="text-xs">Counter tickets issued in this session</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100/70 text-slate-700 font-semibold uppercase text-xs border-b">
                  <tr>
                    <th className="p-3.5 pl-5">Pass ID</th>
                    <th className="p-3.5">Devotee Name</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Visitors</th>
                    <th className="p-3.5">Pass Type</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketsList.map((t, idx) => (
                    <tr key={t.displayId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-[#7b4623]">
                        {t.displayId}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{t.visitorName}</td>
                      <td className="p-3.5 text-slate-600">{t.visitorPhone}</td>
                      <td className="p-3.5 font-medium">{t.visitorCount} Person(s)</td>
                      <td className="p-3.5 uppercase text-xs font-semibold text-slate-600">
                        {t.ticketType?.replace(/_/g, " ") || "GENERAL"}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">₹{t.totalAmount}</td>
                      <td className="p-3.5 text-right pr-5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(t)}
                          className="h-8 border-[#7b4623] text-[#7b4623] hover:bg-amber-50"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" /> Print Pass
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
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
                  onClick={() => setIssuedTicket(null)}
                  className="flex-1 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl h-11"
                >
                  Done / Next Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
