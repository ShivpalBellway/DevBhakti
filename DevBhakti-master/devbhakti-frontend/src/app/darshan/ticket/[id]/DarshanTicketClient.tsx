"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QRCode from "qrcode";
import { format, parseISO } from "date-fns";
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Download, 
  Printer, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { parseLocalizedValue } from '@/utils/textUtils';
import {useLanguage } from "@/context/LanguageContext";

import { Label } from "@/components/ui/label";
export default function DarshanTicketClient() {
  const params = useParams();
  const ticketId = params?.id as string;
  const router = useRouter();
  const { language } = useLanguage();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const fetchTicket = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/darshan/ticket/${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTicket(data);
          
          try {
            // QR code contains a link to scan the ticket in the admin dashboard
            const verifyUrl = `${window.location.origin}/temples/dashboard/darshan/scan/${data.qrToken}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 250, color: { dark: '#5c3a21', light: '#ffffff' } });
            setQrCodeUrl(qrDataUrl);
          } catch (e) {
            console.error("QR Code generation error", e);
          }
        } else {
          console.error("Failed to fetch ticket");
        }
      } catch (err) {
        console.error("Error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-20">
          <p className="text-xl text-muted-foreground mb-4">Ticket not found or access denied.</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isExpired = ticket.status === 'EXPIRED';
  const isUsed = ticket.status === 'USED';

  return (
    <div className="min-h-screen bg-[#faf8f6] font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl pt-24 pb-20">
        {/* <Button variant="ghost" className="mb-6 print:hidden" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button> */}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 print:hidden">
          <h1 className="text-3xl font-serif font-bold text-[#5c3a21]">Your Darshan Pass</h1>
          <div className="flex gap-3 mt-4 md:mt-0">
             <Button variant="outline" onClick={handlePrint} className="gap-2 font-bold rounded-xl h-10 border-primary/20 text-primary hover:bg-primary/5">
                <Printer className="w-4 h-4" /> Print Ticket
             </Button>
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white print:shadow-none">
          {/* Header Banner */}
          <div className="bg-[#5c3a21] text-white p-6 md:p-8 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/mandala-pattern.png')] bg-repeat"></div>
             <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3 relative z-10" />
             <h2 className="text-2xl font-black uppercase tracking-widest relative z-10">Booking Confirmed</h2>
             <p className="text-white/80 font-medium relative z-10 mt-1">Ticket ID: {ticket.displayId || ticket.id.substring(0,8).toUpperCase()}</p>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center relative">
             {/* Divider for print/styling */}
             <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-gray-200 border-dashed border-l"></div>
             
             {/* Details Section */}
             <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Temple</p>
                  <p className="text-xl font-bold text-[#3c2a21] leading-tight">{parseLocalizedValue(ticket.temple.name, language)}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{parseLocalizedValue(ticket.temple.fullAddress, language)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</p>
                     <p className="font-semibold">{format(parseISO(ticket.slot.date.split('T')[0]), "dd MMM yyyy")}</p>
                  </div>
                  <div>
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time Slot</p>
                     <p className="font-semibold">{ticket.slot.startTime}</p>
                  </div>
                  <div className="col-span-2">
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Visitors</p>
                     <p className="font-semibold text-lg">{ticket.visitorCount} Person(s)</p>
                  </div>
                  <div className="col-span-2">
                     <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">Primary Visitor</p>
                     <p className="font-semibold">{ticket.visitorName}</p>
                     <p className="text-sm text-muted-foreground">{ticket.visitorPhone}</p>
                  </div>
                </div>
             </div>

             {/* QR Code Section */}
             <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 mb-4 relative">
                  {isUsed && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                       <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-black uppercase tracking-widest rotate-12 border-2 border-green-500 shadow-lg">
                          Used
                       </div>
                    </div>
                  )}
                  {isExpired && !isUsed && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                       <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-black uppercase tracking-widest -rotate-12 border-2 border-red-500 shadow-lg">
                          Expired
                       </div>
                    </div>
                  )}
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Ticket QR Code" className="w-48 h-48 mx-auto" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-xl"></div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium max-w-[200px]">
                  Please present this QR code at the temple entrance.
                </p>
             </div>
          </div>

          <div className="bg-orange-50 p-4 text-center text-xs text-orange-800 font-medium">
             Important: Arrive at least 15 minutes before your time slot. Carry a valid photo ID matching the name on this ticket.
          </div>
        </Card>
      </main>
      
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
