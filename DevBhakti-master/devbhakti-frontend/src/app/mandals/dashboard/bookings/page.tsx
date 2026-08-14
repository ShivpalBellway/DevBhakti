"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Filter, Loader2, Search, Phone, Mail, Eye, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseLocalizedValue } from "@/utils/textUtils";
import { fetchMyMandalBookings, deleteMandalBooking, fetchMandalBookingById } from "@/api/mandalAdminController";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function MandalBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetchMyMandalBookings();
      if (res.success) {
        setBookings(res.data || []);
      } else {
        toast({ title: "Error", description: res.message || "Failed to load bookings", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to load mandal bookings", error);
      toast({ title: "Error", description: "Failed to load mandal bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = !search ||
        (booking.devoteeName || "").toLowerCase().includes(search.toLowerCase()) ||
        (booking.devoteePhone || "").toLowerCase().includes(search.toLowerCase()) ||
        (booking.pooja?.name ? parseLocalizedValue(booking.pooja.name).toLowerCase() : "").includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const handleView = async (booking: any) => {
    setViewLoading(true);
    try {
      const res = await fetchMandalBookingById(booking.id);
      if (res.success) {
        setViewBooking(res.data);
      } else {
        // fallback: use data we already have
        setViewBooking(booking);
      }
    } catch {
      // fallback: use data we already have
      setViewBooking(booking);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteMandalBooking(deleteId);
      if (res.success) {
        toast({ title: "Deleted", description: "Booking deleted successfully" });
        fetchBookings();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.response?.data?.message || "Could not delete booking", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const exportCSV = () => {
    if (!filteredBookings.length) {
      toast({ title: "No data", description: "There are no bookings to export", variant: "destructive" });
      return;
    }

    const rows = filteredBookings.map((booking) => ({
      BookingID: booking.displayId || booking.id,
      Devotee: booking.devoteeName || "N/A",
      Phone: booking.devoteePhone || "N/A",
      Email: booking.devoteeEmail || "N/A",
      Pooja: booking.pooja ? parseLocalizedValue(booking.pooja.name) : "N/A",
      Package: booking.packageName || "N/A",
      Date: booking.bookingDate || "N/A",
      Status: booking.status || "N/A",
      Amount: booking.packagePrice || 0,
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mandal-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-amber-700" />
        <span className="text-slate-600">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Mandal Bookings</h1>
          <p className="text-slate-500 text-sm">Users who booked poojas for this mandal</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border border-orange-100 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by devotee, phone, pooja..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="BOOKED">Booked</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-orange-100 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Devotee</th>
                <th className="px-4 py-3 text-left font-semibold">Pooja</th>
                <th className="px-4 py-3 text-left font-semibold">Package</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No bookings found for this filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">{booking.devoteeName || "N/A"}</div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{booking.devoteePhone || "N/A"}</span>
                        </div>
                        {booking.devoteeEmail && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="break-all">{booking.devoteeEmail}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-800">
                        {booking.pooja ? parseLocalizedValue(booking.pooja.name) : "N/A"}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="text-slate-700">{booking.packageName || "Standard"}</div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <span>{booking.bookingDate || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <Badge className={`border ${statusColors[booking.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {booking.status || "BOOKED"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-amber-700">₹{Number(booking.packagePrice || 0).toLocaleString("en-IN")}</div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(booking)} title="View Booking" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(booking.id)} title="Delete Booking" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Booking Modal */}
      {viewBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewBooking(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-serif font-bold text-slate-900">Booking Details</h2>
              <button onClick={() => setViewBooking(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Devotee Name</p>
                  <p className="text-sm font-medium text-slate-900">{viewBooking.devoteeName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                  <p className="text-sm font-medium text-slate-900">{viewBooking.devoteePhone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                  <p className="text-sm font-medium text-slate-900">{viewBooking.devoteeEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                  <Badge className={`border mt-1 ${statusColors[viewBooking.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {viewBooking.status || "BOOKED"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Pooja</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewBooking.pooja ? parseLocalizedValue(viewBooking.pooja.name) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Package</p>
                  <p className="text-sm font-medium text-slate-900">{viewBooking.packageName || "Standard"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Booking Date</p>
                  <p className="text-sm font-medium text-slate-900">{viewBooking.bookingDate || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Amount</p>
                  <p className="text-sm font-bold text-amber-700">₹{Number(viewBooking.packagePrice || 0).toLocaleString("en-IN")}</p>
                </div>
                {viewBooking.displayId && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Booking ID</p>
                    <p className="text-sm font-medium text-slate-900">{viewBooking.displayId}</p>
                  </div>
                )}
                {viewBooking.paymentMethod && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Payment Method</p>
                    <p className="text-sm font-medium text-slate-900">{viewBooking.paymentMethod}</p>
                  </div>
                )}
                {viewBooking.gotra && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Gotra</p>
                    <p className="text-sm font-medium text-slate-900">{viewBooking.gotra}</p>
                  </div>
                )}
                {viewBooking.nakshatra && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Nakshatra</p>
                    <p className="text-sm font-medium text-slate-900">{viewBooking.nakshatra}</p>
                  </div>
                )}
              </div>
              {viewBooking.specialInstructions && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Special Instructions</p>
                  <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg">{viewBooking.specialInstructions}</p>
                </div>
              )}
              {viewBooking.createdAt && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Created At</p>
                  <p className="text-sm text-slate-700">{new Date(viewBooking.createdAt).toLocaleString("en-IN")}</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t">
              <Button variant="outline" className="w-full" onClick={() => setViewBooking(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Booking?</h3>
              <p className="text-sm text-slate-500">This action cannot be undone. The booking will be permanently deleted.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
