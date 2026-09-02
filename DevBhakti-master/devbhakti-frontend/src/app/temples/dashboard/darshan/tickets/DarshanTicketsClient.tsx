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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Loader2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Label } from "@/components/ui/label";

export default function DarshanTicketsClient() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/temple-admin/darshan/tickets?`;
      if (filterDate) url += `date=${filterDate}&`;
      if (searchTerm) url += `search=${searchTerm}&`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setTickets(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
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
          <h1 className="text-3xl font-bold tracking-tight">Darshan Tickets</h1>
          <p className="text-muted-foreground mt-1">View and manage booked Darshan passes.</p>
        </div>
      </div>

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
            <Button variant="ghost" onClick={() => setFilterDate("")} className="h-10 px-2 text-muted-foreground">Clear</Button>
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
                  <TableHead>Visitor Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono font-medium text-xs">
                      {ticket.displayId || ticket.id.substring(0,8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{ticket.visitorName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.visitorPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{format(parseISO(ticket.slot.date.split('T')[0]), "dd MMM yyyy")}</div>
                      <div className="text-xs text-muted-foreground">{ticket.slot.startTime}</div>
                    </TableCell>
                    <TableCell>{ticket.visitorCount}</TableCell>
                    <TableCell className="font-medium text-[#7c4624]">{ticket.totalAmount}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
