"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, CheckCircle2, User, Phone, Calendar, Clock, Printer, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printDarshanPassReceipt } from "@/utils/darshanReceipt";

export default function OfflineDarshanClient() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form fields
  const [visitorName, setVisitorName] = useState<string>("");
  const [visitorPhone, setVisitorPhone] = useState<string>("");
  const [visitorEmail, setVisitorEmail] = useState<string>("");
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // Generated Ticket Result for modal/print
  const [issuedTicket, setIssuedTicket] = useState<any | null>(null);

  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/temple-admin/darshan/slots?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSlots(Array.isArray(json) ? json : []);
      } else {
        toast({ title: "Error", description: json.error || "Failed to load slots", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchIssuedTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/temple-admin/darshan/tickets`, {
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
    fetchSlots(selectedDate);
    fetchIssuedTickets();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      toast({ title: "Validation Error", description: "Please select a Darshan slot", variant: "destructive" });
      return;
    }
    if (!visitorName.trim() || !visitorPhone.trim()) {
      toast({ title: "Validation Error", description: "Visitor name and phone number are required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/temple-admin/darshan/offline-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slotId: selectedSlotId,
          visitorName: visitorName.trim(),
          visitorPhone: visitorPhone.trim(),
          visitorEmail: visitorEmail.trim() || undefined,
          visitorCount,
          paymentMode,
          paymentReference: paymentReference.trim() || undefined
        })
      });

      const json = await res.json();
      if (res.ok && json.ticket) {
        setIssuedTicket(json.ticket);
        toast({ title: "Success!", description: "Offline Darshan Ticket issued successfully.", variant: "success" });
        // Reset form
        setVisitorName("");
        setVisitorPhone("");
        setVisitorEmail("");
        setVisitorCount(1);
        setPaymentReference("");
        fetchSlots(selectedDate);
        fetchIssuedTickets();
      } else {
        toast({ title: "Booking Failed", description: json.error || "Failed to issue ticket", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (ticket: any) => {
    printDarshanPassReceipt(ticket);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Issue Offline Darshan Ticket</h1>
        <p className="text-muted-foreground mt-1">Issue counter entry passes for devotees visiting the temple directly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <User className="w-5 h-5 text-[#7c4624]" /> Devotee & Booking Details
              </CardTitle>
              <CardDescription>Enter visitor information for the Darshan Pass.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitorName">Visitor / Devotee Name *</Label>
                    <Input
                      id="visitorName"
                      placeholder="e.g. Ramesh Kumar"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitorPhone">Phone Number *</Label>
                    <Input
                      id="visitorPhone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visitorEmail">Email (Optional)</Label>
                    <Input
                      id="visitorEmail"
                      type="email"
                      placeholder="devotee@example.com"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitorCount">Number of Visitors *</Label>
                    <Input
                      id="visitorCount"
                      type="number"
                      min={1}
                      max={20}
                      value={visitorCount}
                      onChange={(e) => setVisitorCount(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Payment Mode *</Label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full h-10 px-3 border rounded-md bg-white text-sm"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / QR</option>
                      <option value="CARD">Debit / Credit Card</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentReference">Reference / Txn ID (Optional)</Label>
                    <Input
                      id="paymentReference"
                      placeholder="UPI Ref / Receipt No"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={submitting || !selectedSlotId}
                    className="w-full h-12 text-base font-bold bg-[#7c4624] hover:bg-[#5d351b] text-white rounded-lg shadow-sm"
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

        {/* Right Column: Slot Selector */}
        <div className="space-y-4">
          <Card className="border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Calendar className="w-5 h-5 text-[#7c4624]" /> Select Slot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotId("");
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Available Time Slots
                </Label>
                {loadingSlots ? (
                  <div className="flex justify-center p-6">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7c4624]" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground p-4 bg-slate-50 rounded-lg border">
                    No slots created for this date.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const available = Math.max(0, slot.maxCapacity - slot.bookedCount);
                      const isSelected = slot.id === selectedSlotId;
                      const isFull = available < visitorCount || slot.isClosed;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => !isFull && setSelectedSlotId(slot.id)}
                          className={`p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#7c4624] bg-amber-50/60 shadow-sm font-semibold"
                              : isFull
                              ? "opacity-50 cursor-not-allowed bg-gray-100"
                              : "hover:border-[#7c4624]/50 bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#7c4624]" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <Badge variant={available > 0 ? "outline" : "destructive"} className="text-xs">
                              {available} left
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Issued Tickets History List Table */}
      <Card className="border shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#7c4624]" /> Recently Issued Offline Tickets
            </CardTitle>
            <CardDescription className="text-xs">History of counter darshan passes issued</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchIssuedTickets} disabled={loadingTickets}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loadingTickets ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingTickets ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#7c4624]" />
            </div>
          ) : ticketsList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No tickets issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100/70 text-slate-700 font-semibold uppercase text-xs border-b">
                  <tr>
                    <th className="p-3.5 pl-5">Pass ID</th>
                    <th className="p-3.5">Devotee Name</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Persons</th>
                    <th className="p-3.5">Slot Time</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketsList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-[#7c4624]">
                        {t.displayId || t.id}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{t.visitorName}</td>
                      <td className="p-3.5 text-slate-600">{t.visitorPhone}</td>
                      <td className="p-3.5 font-medium">{t.visitorCount} Person(s)</td>
                      <td className="p-3.5 text-slate-600">
                        {t.slot ? `${t.slot.date || ""} (${t.slot.startTime} - ${t.slot.endTime})` : "General"}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">₹{t.totalAmount}</td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                          {t.status || "CONFIRMED"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(t)}
                          className="h-8 border-[#7c4624] text-[#7c4624] hover:bg-amber-50"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" /> Print Pass
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Success Confirmation Modal / Card */}
      {issuedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border-2 border-[#7c4624] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#7c4624] text-white text-center py-5">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-1 text-emerald-300 animate-bounce" />
              <CardTitle className="text-xl font-serif">Ticket Issued Successfully!</CardTitle>
              <CardDescription className="text-amber-100 text-xs font-mono">
                ID: {issuedTicket.displayId}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 border-b pb-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Devotee Name:</span>
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
                  <span className="text-muted-foreground">Slot Time:</span>
                  <span className="font-bold text-[#7c4624]">
                    {issuedTicket.slot?.startTime} - {issuedTicket.slot?.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-emerald-700">₹{issuedTicket.totalAmount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handlePrint(issuedTicket)}
                  variant="outline"
                  className="flex-1 border-[#7c4624] text-[#7c4624] rounded-xl h-11"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Pass
                </Button>
                <Button
                  onClick={() => setIssuedTicket(null)}
                  className="flex-1 bg-[#7c4624] hover:bg-[#5d351b] text-white rounded-xl h-11"
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
