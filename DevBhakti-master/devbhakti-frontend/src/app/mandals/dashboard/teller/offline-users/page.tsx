"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  IndianRupee, 
  Plus, 
  Heart,
  CheckCircle2, 
  Printer, 
  UserCheck, 
  Loader2,
  RefreshCw,
  Eye,
  MapPin,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalOfflinePoojaLeads } from "@/api/mandalAdminController";
import { generatePoojaReceiptHTML } from "@/utils/poojaReceipt";
import { generateReceiptHTML } from "@/utils/donationReceipt";
import { printDarshanPassReceipt } from "@/utils/darshanReceipt";
import { parseLocalizedValue } from "@/utils/textUtils";

export default function MandalOfflineUsersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    totalLeads: 0, 
    totalBookings: 0, 
    totalDonations: 0,
    totalRevenue: 0 
  });
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchMandalOfflinePoojaLeads({ search });
      if (res.success) {
        setLeads(res.data || []);
        setStats({
          totalLeads: res.totalLeads || 0,
          totalBookings: res.totalBookingsCount || 0,
          totalDonations: res.totalDonationsCount || 0,
          totalRevenue: res.totalRevenue || 0
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch mandal offline users", err);
      toast({ title: "Error", description: "Failed to load mandal offline users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePrintPoojaReceipt = (item: any) => {
    const html = generatePoojaReceiptHTML({
      id: item.displayId || item.id,
      devoteeName: selectedLead?.name || "Devotee",
      devoteePhone: selectedLead?.phone || "",
      devoteeEmail: selectedLead?.email || "",
      poojaName: parseLocalizedValue(item.poojaName || item.title, 'en') || 'Pooja',
      templeName: 'Mandal Office',
      bookingDate: item.bookingDate || item.createdAt,
      packageName: item.packageName || 'Standard Package',
      packagePrice: item.packagePrice || item.amount || 0,
      platformFee: 0,
      totalAmount: item.packagePrice || item.amount || 0,
      status: item.status || 'BOOKED',
      createdAt: item.createdAt,
      gothra: selectedLead?.gothra,
      kuldevi: selectedLead?.kuldevi,
      kuldevta: selectedLead?.kuldevta
    }, (k: string) => k);

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  };

  const handlePrintDonationReceipt = (item: any) => {
    const html = generateReceiptHTML({
      id: item.id,
      displayId: item.displayId || item.id,
      donorName: selectedLead?.name || "Donor",
      donorPhone: selectedLead?.phone || "",
      donorEmail: selectedLead?.email || item.donorEmail || "",
      amount: item.amount || 0,
      templeName: 'Mandal Office',
      paymentMethod: item.paymentMethod || 'CASH',
      status: item.status || 'SUCCESS',
      createdAt: item.createdAt,
      panNumber: item.panNumber || undefined,
      address: selectedLead?.address || item.address || undefined
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-[#7b4623]" />
            Mandal Offline Users & Devotees Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track all devotees whose accounts were auto-created / linked when booking offline services at your Mandal counter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadLeads} disabled={loading} className="gap-2 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
          <Link href="/mandals/dashboard/teller/offline-pooja">
            <Button className="bg-[#7b4623] hover:bg-[#5d351a] text-white gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              New Offline Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm bg-gradient-to-br from-amber-50/60 to-orange-50/30 rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Offline Devotees</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats.totalLeads}</h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">Auto-created / Linked Devotees</p>
            </div>
            <div className="p-3 bg-amber-100/80 text-[#7b4623] rounded-xl">
              <UserCheck className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-blue-50/60 to-indigo-50/30 rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Offline Poojas</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats.totalBookings}</h3>
              <p className="text-xs text-blue-700 font-medium mt-1">Counter Pooja Bookings</p>
            </div>
            <div className="p-3 bg-blue-100/80 text-blue-700 rounded-xl">
              <Calendar className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-rose-50/60 to-pink-50/30 rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Offline Donations</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stats.totalDonations}</h3>
              <p className="text-xs text-rose-700 font-medium mt-1">Manual Donation Entries</p>
            </div>
            <div className="p-3 bg-rose-100/80 text-rose-700 rounded-xl">
              <Heart className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-emerald-50/60 to-teal-50/30 rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Counter Revenue</p>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">Donations + Poojas</p>
            </div>
            <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-xl">
              <IndianRupee className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devotee by name, phone number, email..."
              className="pl-10 h-11 text-sm rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Offline Users Table */}
      <Card className="border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-slate-50/70 px-6 py-4">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7b4623]" /> Devotees List ({leads.length})
            </span>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-lg text-slate-800">No Offline Devotees Found</p>
              <p className="text-sm mt-1 max-w-md mx-auto">
                When you issue offline poojas, donations, or tickets at your Mandal teller counter, devotee records will be auto-created and displayed here.
              </p>
              <Link href="/mandals/dashboard/teller/offline-pooja" className="inline-block mt-4">
                <Button className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl">
                  Issue Counter Booking
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100/70 text-slate-700 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="px-6 py-3.5">Devotee Name</th>
                    <th className="px-6 py-3.5">Phone Number</th>
                    <th className="px-6 py-3.5">Email / Details</th>
                    <th className="px-6 py-3.5 text-center">Pooja Bookings</th>
                    <th className="px-6 py-3.5 text-right">Total Amount</th>
                    <th className="px-6 py-3.5">Registered Date</th>
                    <th className="px-6 py-3.5">Account Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {lead.name || "Offline Devotee"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {lead.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {lead.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {lead.email}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-[#7b4623] border-amber-200">
                          {lead.totalBookings || 0} Bookings
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700">
                        ₹{(lead.totalSpent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {lead.lastBookingDate ? new Date(lead.lastBookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {lead.userId ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 text-xs font-semibold whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Auto Registered ({lead.userDisplayId || 'Active'})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-xs">
                            Counter Linked
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsHistoryOpen(true);
                          }}
                          className="gap-1 text-xs rounded-lg border-[#7b4623] text-[#7b4623] hover:bg-amber-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          History ({lead.bookings?.length || 0})
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

      {/* User Combined History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between border-b pb-3 font-serif">
              <div>
                <span>{selectedLead?.name}&apos;s Counter Activity History</span>
                <p className="text-xs font-normal text-slate-500 mt-1 font-sans">
                  Phone: {selectedLead?.phone} | Email: {selectedLead?.email || 'N/A'}
                </p>
              </div>
              <Badge className="bg-amber-100 text-[#7b4623] text-sm px-3 py-1 font-mono">
                Total: ₹{selectedLead?.totalSpent}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {selectedLead?.bookings && selectedLead.bookings.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-[#7b4623] border-amber-200 text-xs font-bold">
                      OFFLINE POOJA
                    </Badge>
                    <span className="font-bold text-slate-900 font-mono text-sm">{item.displayId}</span>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {item.paymentMethod || 'CASH'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {parseLocalizedValue(item.poojaName || item.title, 'en')} {item.packageName ? `- ${item.packageName}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date: {item.bookingDate || new Date(item.createdAt).toLocaleDateString()} | Status: {item.status}
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Amount</span>
                    <span className="text-base font-bold text-slate-900">₹{item.packagePrice || item.amount}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handlePrintPoojaReceipt(item)}
                    className="gap-1.5 text-xs border-[#7b4623] text-[#7b4623] hover:bg-amber-50 rounded-lg"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Receipt
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
