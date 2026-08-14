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
  MapPin
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
import { fetchTempleOfflinePoojaLeads } from "@/api/templeAdminController";
import { generatePoojaReceiptHTML } from "@/utils/poojaReceipt";
import { generateReceiptHTML } from "@/utils/donationReceipt";
import { parseLocalizedValue } from "@/utils/textUtils";

export default function TempleOfflineUsersPage() {
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
      const res = await fetchTempleOfflinePoojaLeads({ search });
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
      console.error("Failed to fetch temple offline users", err);
      toast({ title: "Error", description: "Failed to load temple offline users", variant: "destructive" });
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
      templeName: 'Temple Office',
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
      templeName: 'Temple Office',
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
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-[#794A05]" />
            Temple Offline Users & Devotees
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Devotees who made offline donations or booked offline poojas at your temple counter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadLeads} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/temples/dashboard/bookings/add-offline">
            <Button className="bg-[#794A05] hover:bg-[#794A05]/90 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Offline Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offline Users</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalLeads}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Auto-created / linked accounts</p>
            </div>
            <div className="p-3 bg-amber-100 text-[#794A05] rounded-xl">
              <UserCheck className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pooja Bookings</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalBookings}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">Offline Counter Poojas</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Calendar className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-rose-50/50 to-pink-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Offline Donations</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalDonations}</h3>
              <p className="text-xs text-rose-600 font-medium mt-1">Manual Donation Entries</p>
            </div>
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <Heart className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spent</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Donations + Poojas</p>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <IndianRupee className="w-7 h-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search offline user by name, phone, email, address..."
              className="pl-10 h-11 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Offline Users Table */}
      <Card className="border-border/60">
        <CardHeader className="border-b bg-slate-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Offline Users List ({leads.length})</span>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-lg">No Offline Users Found</p>
              <p className="text-sm mt-1">Offline donations or pooja bookings will automatically create & list users here.</p>
              <Link href="/temples/dashboard/bookings/add-offline" className="inline-block mt-4">
                <Button className="bg-[#794A05] text-white">Add Counter Offline Booking</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="px-6 py-3">User Name</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3 text-center">Donations</th>
                    <th className="px-6 py-3 text-center">Pooja Bookings</th>
                    <th className="px-6 py-3 text-right">Total Spent</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Account Sync</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 text-base">
                        {lead.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
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
                      <td className="px-6 py-4 text-slate-600 text-xs max-w-[200px] truncate">
                        {lead.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border-rose-200">
                          {lead.totalDonations || 0}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-[#794A05] border-amber-200">
                          {lead.totalBookings || 0}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 text-base">
                        ₹{(lead.totalSpent || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {lead.userId ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 gap-1 text-xs whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Synced ({lead.userDisplayId || 'Active'})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 text-xs">
                            Auto Linked
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
                          className="gap-1.5 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          History ({lead.history?.length || 0})
                        </Button>
                        <Link href={`/temples/dashboard/bookings/add-offline?phone=${encodeURIComponent(lead.phone)}`}>
                          <Button size="sm" className="bg-[#794A05] text-white hover:bg-[#794A05]/90 gap-1 text-xs">
                            <Plus className="w-3.5 h-3.5" />
                            Book / Donate
                          </Button>
                        </Link>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between border-b pb-3">
              <div>
                <span>{selectedLead?.name}&apos;s Offline Activity History</span>
                <p className="text-xs font-normal text-slate-500 mt-1">
                  Phone: {selectedLead?.phone} | Email: {selectedLead?.email || 'N/A'} | Address: {selectedLead?.address || 'N/A'}
                </p>
              </div>
              <Badge className="bg-amber-100 text-[#794A05] text-sm px-3 py-1">Total Spent: ₹{selectedLead?.totalSpent}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {selectedLead?.history && selectedLead.history.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={item.itemType === 'DONATION' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-[#794A05] border-amber-200'}>
                      {item.itemType === 'DONATION' ? 'OFFLINE DONATION' : 'OFFLINE POOJA'}
                    </Badge>
                    <span className="font-bold text-slate-900">{item.displayId}</span>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {item.paymentMethod || 'CASH'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.itemType === 'DONATION' ? 'Offline Sacred Donation' : `${parseLocalizedValue(item.poojaName || item.title, 'en')} - ${item.packageName || ''}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date: {item.bookingDate || new Date(item.createdAt).toLocaleDateString()} | Status: {item.status}
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Amount</span>
                    <span className="text-lg font-bold text-slate-900">₹{item.amount || item.packagePrice}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => item.itemType === 'DONATION' ? handlePrintDonationReceipt(item) : handlePrintPoojaReceipt(item)}
                    className="gap-1.5 text-xs border-[#794A05] text-[#794A05] hover:bg-[#794A05]/10"
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
