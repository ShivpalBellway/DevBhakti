"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Card } from "@/components/ui/card";
import { Search, Download, Loader2, Calendar, FileText, Upload, Plus, Ticket } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Label } from "@/components/ui/label";
import { formatSlotTime } from "@/utils/textUtils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export default function DarshanTicketsClient() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      } else {
        toast({ title: "Failed to Fetch", description: "Could not fetch tickets from server.", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Network Error", description: "Failed to connect to the server.", variant: "destructive" });
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
      case 'CONFIRMED': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-bold tracking-widest px-3 py-1">Confirmed</Badge>;
      case 'USED': return <Badge className="bg-slate-100 text-slate-800 border-slate-200 uppercase text-[10px] font-bold tracking-widest px-3 py-1">Scanned</Badge>;
      case 'CANCELLED': return <Badge variant="destructive" className="uppercase text-[10px] font-bold tracking-widest px-3 py-1">Cancelled</Badge>;
      case 'EXPIRED': return <Badge variant="secondary" className="uppercase text-[10px] font-bold tracking-widest px-3 py-1">Expired</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-widest px-3 py-1">{status}</Badge>;
    }
  };

  const currentDisplayTickets = tickets.filter(t => 
       (!searchTerm || t.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) || t.displayId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const downloadTemplate = () => {
    const templateData = [
      {
        "Visitor Name": "John Doe",
        "Phone Number": "9876543210",
        "Date (YYYY-MM-DD)": "2024-12-01",
        "Visitor Count": "2",
        "Amount Paid": "100",
        "Slot Time (e.g. 10:00 AM)": "10:00 AM"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ticket Template");
    XLSX.writeFile(wb, "Darshan_Ticket_Import_Template.xlsx");
  };

  const handleExportExcel = () => {
    if (tickets.length === 0) {
      toast({ title: "No Data", description: "There are no tickets to export.", variant: "destructive" });
      return;
    }

    const exportData = tickets.map(t => ({
      "Ticket ID": t.displayId || t.id,
      "Visitor Name": t.visitorName || "N/A",
      "Phone": t.visitorPhone || "N/A",
      "Date": t.slot?.date ? format(parseISO(t.slot.date.split('T')[0]), "dd MMM yyyy") : "N/A",
      "Time": t.slot?.startTime ? formatSlotTime(t.slot.startTime) : "N/A",
      "Count": t.visitorCount,
      "Amount Paid": t.totalAmount,
      "Status": t.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Darshan Tickets");
    XLSX.writeFile(wb, `Darshan_Tickets_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (!jsonData || jsonData.length === 0) {
        throw new Error("The uploaded Excel file is empty or cannot be read.");
      }

      // Basic Validation - Provide User Friendly Error Messages
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row["Visitor Name"] || !row["Phone Number"] || !row["Visitor Count"]) {
           throw new Error(`Invalid data on row ${i + 1}: Missing required fields ('Visitor Name', 'Phone Number', or 'Visitor Count').`);
        }
      }

      const token = localStorage.getItem("token");
      // Fallback bulk API endpoint which properly wraps and alerts user based on Backend state.
      const res = await fetch(`${API_URL}/temple-admin/darshan/tickets/import`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tickets: jsonData })
      });

      const responseJson = await res.json().catch(() => ({}));

      if (res.ok) {
          toast({
              title: "Import Successful",
              description: `Successfully imported ${jsonData.length} darshan tickets.`,
              variant: "success",
              className: "bg-emerald-50 border-emerald-200 text-emerald-900"
          });
          fetchTickets();
      } else {
          toast({
              title: "Import Failed",
              description: responseJson.message || "Failed to import tickets. Ensure backend supports the bulk import endpoint.",
              variant: "destructive"
          });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Invalid File Format",
        description: error.message || "Please use the provided template format, without altering column headers.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      // Reset input so identical file uploads trigger onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen bg-slate-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b4623]/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-100 pointer-events-none" />
          <div className="relative z-10 w-full md:w-auto">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-serif mb-2 flex items-center gap-3">
                  <Ticket className="w-8 h-8 text-[#7b4623]" />
                  Darshan Tickets
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl">
                  View, manage, and seamlessly process booked Darshan passes for devotees.
              </p>
          </div>
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-3 w-full md:w-auto relative z-10">
              <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="flex-1 md:flex-none border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 rounded-xl font-semibold transition-colors"
                  disabled={isImporting}
              >
                  <FileText className="w-4 h-4 mr-2 text-slate-500" />
                  Template
              </Button>
              <div className="relative flex-1 md:flex-none">
                  <input
                      type="file"
                      accept=".xlsx, .xls"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImportExcel}
                  />
                  <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 rounded-xl font-semibold transition-colors disabled:opacity-70"
                      disabled={isImporting}
                  >
                      {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-500" /> : <Upload className="w-4 h-4 mr-2 text-slate-500" />}
                      {isImporting ? "Importing..." : "Import"}
                  </Button>
              </div>
              <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  className="flex-1 md:flex-none border-slate-200 hover:bg-slate-50 text-slate-700 h-11 px-4 rounded-xl font-semibold transition-colors disabled:opacity-70"
                  disabled={isLoading || isImporting}
              >
                  <Download className="w-4 h-4 mr-2 text-slate-500" />
                  Export
              </Button>
          </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-3 md:p-4 rounded-[1.5rem] border border-slate-100/80 shadow-sm relative z-10">
        <form onSubmit={handleSearch} className="flex-1 w-full flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search by Ticket ID, Visitor Name or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 md:h-14 bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-[#7b4623] hover:bg-white transition-all rounded-xl text-base font-medium"
            />
          </div>
          <Button type="submit" className="h-12 md:h-14 px-8 rounded-xl bg-[#7b4623] hover:bg-[#5d351a] text-white font-bold shadow-md shadow-[#7b4623]/20 transition-all hover:scale-105 hidden sm:flex">
             Search
          </Button>
        </form>
        
        <div className="flex w-full xl:w-auto items-center gap-3">
          <div className="relative w-full xl:w-[220px]">
             <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
               type="date"
               value={filterDate}
               onChange={(e) => setFilterDate(e.target.value)}
               className="pl-11 h-12 md:h-14 bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-[#7b4623] rounded-xl font-bold text-slate-700"
             />
          </div>
          {(filterDate || searchTerm) && (
            <Button 
               variant="ghost" 
               onClick={() => { setFilterDate(""); setSearchTerm(""); fetchTickets(); }} 
               className="h-12 md:h-14 px-6 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors"
            >
               Clear
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-slate-100/50 rounded-[2rem] overflow-hidden bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24">
            <Loader2 className="w-12 h-12 animate-spin text-[#7b4623] mb-4" />
            <p className="text-slate-500 font-medium">Fetching Sacred Tickets...</p>
          </div>
        ) : currentDisplayTickets.length === 0 ? (
          <div className="text-center p-24 bg-white">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-100">
               <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-2xl font-black font-serif text-slate-900 mb-2">No tickets found</p>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">There are currently no Darshan tickets matching your search filters in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto premium-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-5 pl-8 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Ticket ID</TableHead>
                  <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Visitor Details</TableHead>
                  <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Date & Time</TableHead>
                  <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Count</TableHead>
                  <TableHead className="py-5 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Amount (₹)</TableHead>
                  <TableHead className="py-5 pr-8 font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDisplayTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="py-5 pl-8">
                      <span className="font-bold text-[#7b4623] text-sm">
                        {ticket.displayId || ticket.id.substring(0,8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="font-black text-slate-900 text-sm">{ticket.visitorName}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1">{ticket.visitorPhone}</div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="font-bold text-slate-800 text-sm">
                         {ticket.slot?.date ? format(parseISO(ticket.slot.date.split('T')[0]), "dd MMM yyyy") : "N/A"}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">
                        {ticket.slot?.startTime ? formatSlotTime(ticket.slot.startTime) : ""} {ticket.slot?.endTime ? `- ${formatSlotTime(ticket.slot.endTime)}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                       <Badge className="bg-slate-100 text-slate-700 text-sm font-black px-3 py-1 radius-xl border-none shadow-none">{ticket.visitorCount}</Badge>
                    </TableCell>
                    <TableCell className="py-5 font-black text-[#7b4623] text-base">₹{ticket.totalAmount}</TableCell>
                    <TableCell className="py-5 pr-8">{getStatusBadge(ticket.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
