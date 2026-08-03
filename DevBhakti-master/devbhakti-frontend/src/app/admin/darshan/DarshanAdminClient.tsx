"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/apiConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Loader2, Calendar, Ticket, IndianRupee, Users } from "lucide-react";
import { format } from "date-fns";

export default function DarshanAdminClient() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("staff_token");
      let url = `${API_URL}/admin/darshan/tickets?page=${page}&limit=20&`;
      if (filterDate) url += `date=${filterDate}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      
      const [resTickets, resStats] = await Promise.all([
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/darshan/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resTickets.ok) {
        const json = await resTickets.json();
        setTickets(json.tickets || []);
        setTotalPages(json.totalPages || 1);
      }
      if (resStats.ok) {
        const statsJson = await resStats.json();
        setStats(statsJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'USED': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Scanned</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      case 'EXPIRED': return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Darshan Management</h1>
          <p className="text-muted-foreground mt-1">Overview of all Darshan bookings across all temples.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalRevenue || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fee</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{(stats.totalPlatformFee || 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Temples</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTemples}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by Ticket ID, Name or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-10">Search</Button>
        </form>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-sm text-muted-foreground">Date:</Label>
          <Input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-auto h-10"
          />
          {filterDate && (
            <Button variant="ghost" onClick={() => { setFilterDate(""); setPage(1); }} className="h-10 px-2 text-muted-foreground">Clear</Button>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-lg">No tickets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Temple</TableHead>
                  <TableHead>Visitor Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Total Amt</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono font-medium text-xs">
                      {ticket.displayId || ticket.id.substring(0,8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-semibold">{ticket.temple?.name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{ticket.visitorName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.visitorPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{format(new Date(ticket.slot.date), "dd MMM yyyy")}</div>
                      <div className="text-xs text-muted-foreground">{ticket.slot.startTime}</div>
                    </TableCell>
                    <TableCell>{ticket.visitorCount}</TableCell>
                    <TableCell className="font-medium">₹{ticket.totalAmount}</TableCell>
                    <TableCell className="font-medium text-green-600">₹{ticket.platformFee}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="p-4 border-t flex justify-between items-center bg-gray-50/50">
              <Button 
                variant="outline" 
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button 
                variant="outline" 
                disabled={page >= totalPages} 
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
