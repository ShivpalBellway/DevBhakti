"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL, BASE_URL } from "@/config/apiConfig";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  User,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { fetchPublicTempleById } from "@/api/publicController";
import { parseLocalizedValue } from '@/utils/textUtils';

function DarshanBookingFlow() {
  const params = useParams();
  const templeId = params?.templeId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();

  const [temple, setTemple] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [darshanPrice, setDarshanPrice] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    visitorCount: "1",
  });

  const [platformFee, setPlatformFee] = useState(0);

  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

  useEffect(() => {
    const fetchTemple = async () => {
      if (!templeId) return;
      try {
        const data = await fetchPublicTempleById(templeId, language);
        if (data) {
          setTemple(data);
          if (data.darshanPrice !== undefined) {
             setDarshanPrice(data.darshanPrice);
          }
        }
      } catch (err) {
        console.error("Error fetching temple", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemple();
  }, [templeId, language]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setFormData(prev => ({
          ...prev,
          name: prev.name || parsedUser.name || "",
          phone: prev.phone || parsedUser.phone || "",
          email: prev.email || parsedUser.email || "",
        }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !templeId) return;
      try {
        const res = await fetch(`${API_URL}/darshan/slots/${templeId}?date=${selectedDate}`);
        const json = await res.json();
        if (res.ok) {
          setAvailableSlots(json.slots || []);
          setDarshanPrice(json.price || 0);
          setSelectedSlot(null);
        } else {
          toast({ title: "Error", description: json.error || "Failed to fetch slots", variant: "destructive" });
        }
      } catch (err) {
        console.error("Error fetching slots", err);
      }
    };
    fetchSlots();
  }, [selectedDate, templeId, toast]);

  useEffect(() => {
    const fetchFee = async () => {
      const totalAmount = darshanPrice * parseInt(formData.visitorCount || "1", 10);
      if (totalAmount <= 0) {
        setPlatformFee(0);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/bookings/calculate-commission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            vendorType: 'TEMPLE',
            vendorId: templeId,
            category: 'DARSHAN'
          })
        });
        const data = await response.json();
        if (data.success) {
          setPlatformFee(data.data.platformFee || data.data.totalCommission || 0);
        }
      } catch (err) {
        console.error("Fee calculation error:", err);
      }
    };

    fetchFee();
  }, [darshanPrice, formData.visitorCount, templeId]);

  const totalAmount = (darshanPrice * parseInt(formData.visitorCount || "1", 10)) + platformFee;

  const handleNext = () => {
    if (step === 1) {
      if (!selectedDate) {
        toast({ title: "Please select a date", variant: "destructive" });
        return;
      }
      if (!selectedSlot) {
        toast({ title: "Please select a time slot", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!formData.name || !formData.phone || !formData.visitorCount) {
        toast({ title: "Please fill all required fields", variant: "destructive" });
        return;
      }

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        if (!token || !parsedUser) {
          toast({ title: "Please login to book darshan", variant: "destructive" });
          const redirectUrl = `${window.location.pathname}${window.location.search}`;
          router.push(`/auth?redirect=${encodeURIComponent(redirectUrl)}`);
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const handleConfirmBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const bookingData = {
        slotId: selectedSlot.id,
        templeId: templeId,
        visitorName: formData.name,
        visitorPhone: formData.phone,
        visitorEmail: formData.email,
        visitorCount: parseInt(formData.visitorCount || "1", 10),
      };

      const response = await fetch(`${API_URL}/darshan/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const res = await response.json();

      if (response.ok) {
        if (res.order) {
           const options = {
            key: RAZORPAY_KEY,
            amount: res.order.amount,
            currency: res.order.currency,
            name: "DevBhakti Darshan",
            description: "Darshan Ticket Booking",
            order_id: res.order.id,
            handler: async function (responseData: any) {
              setIsPaymentLoading(true);
              try {
                const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    razorpay_order_id: responseData.razorpay_order_id,
                    razorpay_payment_id: responseData.razorpay_payment_id,
                    razorpay_signature: responseData.razorpay_signature,
                    orderType: "DARSHAN",
                    referenceId: res.ticket.id, 
                  })
                });

                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                  setIsPaymentLoading(false);
                  router.push(`/darshan/ticket/${res.ticket.id}`);
                } else {
                  setIsPaymentLoading(false);
                  toast({
                    title: "Payment verification failed",
                    description: verifyData.message,
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error("Verification error:", error);
                setIsPaymentLoading(false);
              }
            },
            prefill: {
              name: formData.name,
              contact: formData.phone,
              email: formData.email,
            },
            theme: { color: "#794A05" },
            modal: {
              ondismiss: function () {
                setIsPaymentLoading(false);
                toast({ title: "Payment Cancelled" });
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
           toast({ title: "Booking Confirmed", variant: "success" });
           router.push(`/darshan/ticket/${res.ticket.id}`);
        }
      } else {
         toast({ title: "Booking failed", description: res.error, variant: "destructive" });
      }

    } catch (err: any) {
       console.error("Booking error", err);
       toast({ title: "Error", description: "An error occurred during booking.", variant: "destructive" });
    }
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

  if (!temple || !temple.isDarshanActive) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <p className="text-xl text-muted-foreground">Darshan booking is currently not available for this temple.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f6] font-sans text-base">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl pt-24">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#5c3a21]">Book Darshan</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {parseLocalizedValue(temple.name, language)}
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4">
          <div className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${step >= 1 ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">1</span>
            Date & Time
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${step >= 2 ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">2</span>
            Details
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${step >= 3 ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">3</span>
            Payment
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            
            {step === 1 && (
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#5c3a21]">
                      <Calendar className="w-5 h-5 text-primary" /> Select Date
                    </h2>
                    <div className="bg-orange-50/50 p-4 rounded-xl inline-block border border-orange-100">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate ? parseISO(selectedDate.split('T')[0]) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const yyyy = date.getFullYear();
                              const mm = String(date.getMonth() + 1).padStart(2, '0');
                              const dd = String(date.getDate()).padStart(2, '0');
                              setSelectedDate(`${yyyy}-${mm}-${dd}`);
                            } else {
                              setSelectedDate("");
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            return date < today;
                          }}
                          className="bg-transparent"
                        />
                    </div>
                  </div>

                  {selectedDate && (
                    <div>
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#5c3a21]">
                        <Clock className="w-5 h-5 text-primary" /> Select Time Slot
                      </h2>
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {availableSlots.map((slot) => {
                             const isAvailable = slot.remainingCapacity > 0 && !slot.isClosed;
                             return (
                                <button
                                  key={slot.id}
                                  disabled={!isAvailable}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={cn(
                                    "p-3 rounded-xl border text-center transition-all",
                                    !isAvailable && "opacity-50 cursor-not-allowed bg-gray-50",
                                    selectedSlot?.id === slot.id 
                                      ? "border-primary bg-primary/10 text-primary font-bold shadow-inner" 
                                      : "border-gray-200 hover:border-primary/50"
                                  )}
                                >
                                  <div className="text-sm font-semibold">{slot.startTime} - {slot.endTime}</div>
                                  {/* <div className="text-xs mt-1 text-muted-foreground">{isAvailable ? `${slot.remainingCapacity} available` : "Full"}</div> */}
                                </button>
                             );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No slots available for this date.</p>
                      )}
                    </div>
                  )}
                  
                  <Button className="w-full h-12 rounded-xl text-lg font-bold shadow-md" onClick={handleNext}>Continue</Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                   <h2 className="text-xl font-bold flex items-center gap-2 text-[#5c3a21]">
                      <User className="w-5 h-5 text-primary" /> Visitor Details
                   </h2>
                   <div className="space-y-4">
                     <div>
                       <Label className="text-muted-foreground font-semibold">Full Name *</Label>
                       <Input 
                          placeholder="Lead visitor's name" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-12 rounded-xl mt-1"
                       />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground font-semibold">Phone Number *</Label>
                          <Input 
                              placeholder="10-digit number" 
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="h-12 rounded-xl mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-muted-foreground font-semibold">Email Address</Label>
                          <Input 
                              type="email"
                              placeholder="For ticket confirmation" 
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="h-12 rounded-xl mt-1"
                          />
                        </div>
                     </div>
                     <div>
                       <Label className="text-muted-foreground font-semibold">Number of Visitors *</Label>
                       <Input 
                          type="number"
                          min="1"
                          max={selectedSlot?.remainingCapacity || 500}
                          value={formData.visitorCount}
                          onChange={(e) => setFormData({...formData, visitorCount: e.target.value})}
                          className="h-12 rounded-xl mt-1 w-full md:w-1/3"
                       />
                       <p className="text-xs text-muted-foreground mt-1">Maximum allowed per booking is based on slot availability.</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-4">
                     <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setStep(1)}>Back</Button>
                     <Button className="flex-[2] h-12 rounded-xl font-bold shadow-md" onClick={handleNext}>Proceed to Payment</Button>
                   </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
               <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                   <h2 className="text-xl font-bold flex items-center gap-2 text-[#5c3a21]">
                      <IndianRupee className="w-5 h-5 text-primary" /> Payment Summary
                   </h2>
                   
                   <div className="bg-primary/5 rounded-xl p-5 space-y-4 border border-primary/10">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Darshan Pass Fee (x{formData.visitorCount})</span>
                       <span className="font-semibold">₹{darshanPrice * parseInt(formData.visitorCount || "1", 10)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm border-b border-primary/10 pb-4">
                       <span className="text-muted-foreground">Platform Fee</span>
                       <span className="font-semibold">₹{platformFee.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-lg font-black text-primary pt-2">
                       <span>Total Amount</span>
                       <span>₹{totalAmount.toFixed(2)}</span>
                     </div>
                   </div>

                   <p className="text-xs text-muted-foreground text-center">
                     By proceeding, you agree to the temple's rules and regulations for Darshan.
                   </p>

                   <div className="flex gap-4">
                     <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setStep(2)}>Back</Button>
                     <Button 
                        className="flex-[2] h-12 rounded-xl font-bold shadow-md" 
                        onClick={handleConfirmBooking}
                        disabled={isPaymentLoading}
                     >
                       {isPaymentLoading ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                       ) : (
                          `Pay ₹${totalAmount.toFixed(2)} securely`
                       )}
                     </Button>
                   </div>
                </CardContent>
              </Card>
            )}

          </div>

          <div className="md:col-span-1">
             <Card className="border-none shadow-sm rounded-2xl sticky top-24 bg-white/80 backdrop-blur-md">
                <CardContent className="p-6 space-y-6">
                   <h3 className="font-bold text-lg border-b pb-3 text-[#5c3a21]">Booking Overview</h3>
                   
                   <div className="space-y-4">
                     <div className="flex gap-3 items-start">
                        <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground font-semibold">Temple</p>
                          <p className="font-medium leading-tight mt-0.5">{parseLocalizedValue(temple.name, language)}</p>
                        </div>
                     </div>
                     
                     {selectedDate && (
                       <div className="flex gap-3 items-start">
                          <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-semibold">Date</p>
                            <p className="font-medium mt-0.5">{format(parseISO(selectedDate.split('T')[0]), "EEEE, dd MMMM yyyy")}</p>
                          </div>
                       </div>
                     )}

                     {selectedSlot && (
                       <div className="flex gap-3 items-start">
                          <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-semibold">Time Slot</p>
                            <p className="font-medium mt-0.5">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                          </div>
                       </div>
                     )}

                     {step > 1 && formData.visitorCount && (
                       <div className="flex gap-3 items-start">
                          <User className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground font-semibold">Visitors</p>
                            <p className="font-medium mt-0.5">{formData.visitorCount} Person(s)</p>
                          </div>
                       </div>
                     )}
                   </div>
                </CardContent>
             </Card>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DarshanBookingClientWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <DarshanBookingFlow />
    </Suspense>
  );
}
