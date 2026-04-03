"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/config/apiConfig";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { fetchPublicTemples, fetchPublicPoojas, fetchPublicPoojaById } from "@/api/publicController";
import { notifyFailedPayment } from "@/api/adminController";
import { generatePoojaReceiptHTML } from "@/utils/poojaReceipt";


function BookingForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();

  // Skip Step 1 if temple and pooja are already in the URL
  const initialStep = (searchParams.get("temple") && searchParams.get("pooja")) ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(true);
  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

  const [allTemples, setAllTemples] = useState<any[]>([]);
  const [allPoojas, setAllPoojas] = useState<any[]>([]);

  const [selectedTemple, setSelectedTemple] = useState(searchParams.get("temple") || "");
  const [selectedPooja, setSelectedPooja] = useState(searchParams.get("pooja") || "");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [devoteeCount, setDevoteeCount] = useState("1");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    specialRequests: "",
    gothra: "",
    kuldevi: "",
    kuldevta: "",
    dob: "",
    anniversary: "",
    nativePlace: "",
    additionalDevotees: [] as { name: string; gothra: string; kuldevi: string; kuldevta: string }[],
  });

  const [availabilityStatus, setAvailabilityStatus] = useState<{ available: boolean, message: string } | null>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [bookingId, setBookingId] = useState("");


  useEffect(() => {
    const fetchUnavailable = async () => {
      if (!selectedTemple) {
        setUnavailableDates([]);
        return;
      }
      try {
        const query = new URLSearchParams({
          templeId: selectedTemple,
          ...(selectedPooja ? { poojaId: selectedPooja } : {})
        });
        const response = await fetch(`${API_URL}/bookings/unavailable-dates?${query}`);
        const data = await response.json();
        if (data.success) {
          setUnavailableDates(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch unavailable dates", error);
      }
    };

    fetchUnavailable();
  }, [selectedTemple, selectedPooja]);

  useEffect(() => {
    const checkDate = async () => {
      if (!selectedDate) {
        setAvailabilityStatus(null);
        return;
      }

      if (!selectedTemple) {
        setAvailabilityStatus({ available: true, message: "Slot available" });
        return;
      }

      try {
        const query = new URLSearchParams({
          templeId: selectedTemple,
          date: selectedDate,
          ...(selectedPooja ? { poojaId: selectedPooja } : {})
        });

        const response = await fetch(`${API_URL}/bookings/check-availability?${query}`);
        const data = await response.json();

        if (data.success) {
          setAvailabilityStatus({ available: data.available, message: data.message });
        }
      } catch (error) {
        console.error("Availability check failed", error);
      }
    };

    const timeoutId = setTimeout(() => {
      checkDate();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedDate, selectedTemple, selectedPooja]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const poojaIdInUrl = searchParams.get("pooja");
        const [templesData, poojasData] = await Promise.all([
          fetchPublicTemples(poojaIdInUrl ? { poojaId: poojaIdInUrl } : undefined),
          fetchPublicPoojas()
        ]);
        setAllTemples(templesData);
        setAllPoojas(poojasData);

        // Pre-fill user data
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setFormData(prev => ({
            ...prev,
            name: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
            gothra: user.gothra || "",
            kuldevi: user.kuldevi || "",
            kuldevta: user.kuldevta || "",
            dob: user.dob || "",
            anniversary: user.anniversary || "",
            nativePlace: user.nativePlace || "",
          }));
        }

        // If a pooja is selected via URL, try to auto-select its temple
        const poojaId = searchParams.get("pooja");
        if (poojaId) {
          const pooja = poojasData.find((p: any) => p.id === poojaId);
          if (pooja && pooja.templeId) {
            setSelectedTemple(pooja.templeId);
          }
        }
      } catch (error) {
        console.error("Failed to load booking data:", error);
        toast({ title: "Error loading services", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [searchParams]);

  // Filter poojas based on selected temple
  // We've updated the backend to return temple-specific poojas if templeId is provided
  useEffect(() => {
    const loadTemplePoojas = async () => {
      if (!selectedTemple) return;

      try {
        const response = await fetch(`${API_URL}/temples/poojas?templeId=${selectedTemple}`);
        const data = await response.json();
        if (data.success) {
          // Merge or replace? For the selector, we just need the ones for this temple
          setAllPoojas(prev => {
            // Filter out existing poojas for this temple to avoid duplicates
            const others = prev.filter(p => p.templeId !== selectedTemple);
            return [...others, ...data.data];
          });
        }
      } catch (error) {
        console.error("Failed to load temple poojas:", error);
      }
    };

    loadTemplePoojas();
  }, [selectedTemple]);

  const availablePoojas = selectedTemple
    ? allPoojas.filter(p => p.templeId === selectedTemple)
    : allPoojas.filter(p => p.isMaster);

  const selectedPoojaData = allPoojas.find(p => p.id === selectedPooja);

  // Extract packages from pooja data if available, or use defaults
  const poojaPackages = selectedPoojaData?.packages ?
    (typeof selectedPoojaData.packages === 'string' ? JSON.parse(selectedPoojaData.packages) : selectedPoojaData.packages)
    : [
      { id: "p1", name: "Basic Package", price: selectedPoojaData?.price || 501, description: "Standard ritual with digital certificate" },
      { id: "p2", name: "Standard Package", price: (selectedPoojaData?.price || 501) + 600, description: "Detailed ritual with prasad delivery" },
      { id: "p3", name: "Premium Package", price: (selectedPoojaData?.price || 501) + 1600, description: "Grand ritual with live stream and special prasad" },
    ];

  const selectedPackageData = poojaPackages.find((p: any) => (p.id === selectedPackage || p.name === selectedPackage));

  // Calculate Base Price and Total Amount (inclusive of platform fee)
  const basePrice = selectedPackageData?.price || selectedPoojaData?.price || 0;
  const totalAmount = basePrice + (platformFee || 0);

  // Helper to determine max persons allowed in the package
  const getMaxPersons = () => {
    if (!selectedPackageData) return 1;
    if (selectedPackageData.maxPersons) return selectedPackageData.maxPersons;

    // Fallback mapping for older pooja packages that don't have maxPersons
    const name = selectedPackageData.name?.toLowerCase() || "";
    if (name.includes("couple")) return 2;
    if (name.includes("family")) return 5;
    if (name.includes("group") && !name.includes("big")) return 8;
    if (name.includes("big group")) return 25;
    if (name.includes("small business")) return 50;
    if (name.includes("large business")) return 100;
    if (name.includes("corporate")) return 500;
    return 1; // Default for "Single" or unknown
  };

  const additionalDevoteeCount = Math.max(0, getMaxPersons() - 1);

  // Sync additionalDevotees array length with additionalDevoteeCount
  useEffect(() => {
    setFormData(prev => {
      const currentCount = prev.additionalDevotees.length;
      if (currentCount === additionalDevoteeCount) return prev;

      let newDevotees = [...prev.additionalDevotees];
      if (currentCount < additionalDevoteeCount) {
        // Add more fields
        for (let i = currentCount; i < additionalDevoteeCount; i++) {
          newDevotees.push({ name: "", gothra: "", kuldevi: "", kuldevta: "" });
        }
      } else {
        // Remove extra fields
        newDevotees = newDevotees.slice(0, additionalDevoteeCount);
      }
      return { ...prev, additionalDevotees: newDevotees };
    });
  }, [additionalDevoteeCount]);

  // Fetch Commission Slab based Platform Fee
  useEffect(() => {
    const fetchFee = async () => {
      if (!basePrice) {
        setPlatformFee(0);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/bookings/calculate-commission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: basePrice,
            vendorType: selectedTemple ? 'TEMPLE' : 'GLOBAL',
            vendorId: selectedTemple || undefined,
            category: 'POOJA'
          })
        });
        const data = await response.json();
        if (data.success) {
          setPlatformFee(data.data.totalCommission);
        }
      } catch (err) {
        console.error("Fee calculation error:", err);
      }
    };

    fetchFee();
  }, [basePrice, selectedTemple]);

  const handleNext = () => {
    if (step === 1) {
      if (!selectedPooja) {
        toast({ title: "Please select a pooja service", variant: "destructive" });
        return;
      }

      const isMaster = selectedPoojaData?.isMaster;

      if (!selectedTemple && !isMaster) {
        toast({ title: "Please select a temple", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!selectedDate || !selectedPackage) {
        toast({ title: "Please select date and package", variant: "destructive" });
        return;
      }
      if (availabilityStatus && !availabilityStatus.available) {
        toast({ title: "Selected date is unavailable", description: availabilityStatus.message, variant: "destructive" });
        return;
      }
    }
    if (step === 3) {
      if (!formData.name || !formData.phone || !formData.email || !formData.gothra || !formData.kuldevi || !formData.kuldevta || !formData.dob || !formData.nativePlace) {
        toast({ title: "Please fill all compulsory fields", description: "Name, Phone, Email, Gothra, Kuldevi, Kuldevta, DOB, and Native Place are required.", variant: "destructive" });
        return;
      }

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
          toast({ title: "Please login as devotee to continue booking", variant: "destructive" });
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
      const savedUser = localStorage.getItem("user");
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;

      if (!token || !parsedUser) {
        toast({ title: "Please login to book", variant: "destructive" });
        router.push("/auth");
        return;
      }

      const bookingData = {
        poojaId: selectedPooja,
        packageName: selectedPackageData?.name || "Standard",
        packagePrice: totalAmount,
        devoteeName: formData.name,
        devoteePhone: formData.phone,
        devoteeEmail: formData.email,
        bookingDate: selectedDate,
        address: formData.address,
        specialRequests: formData.specialRequests,
        gothra: formData.gothra,
        kuldevi: formData.kuldevi,
        kuldevta: formData.kuldevta,
        dob: formData.dob,
        anniversary: formData.anniversary,
        nativePlace: formData.nativePlace,
        additionalDevotees: formData.additionalDevotees,
        platformFee: platformFee, // Send platform fee to backend
      };

      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const res = await response.json();

      if (res.success && res.razorpayOrder) {
        const options = {
          key: RAZORPAY_KEY,
          amount: res.razorpayOrder.amount,
          currency: res.razorpayOrder.currency,
          name: "DevBhakti",
          description: "Pooja Booking Payment",
          order_id: res.razorpayOrder.id,
          handler: async function (responseData: any) {
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
                  orderType: "POOJA",
                  referenceId: res.data.id, // The backend expects referenceId
                  orderData: { ...bookingData, bookingId: res.data.id },
                  userId: parsedUser.id

                })
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                setBookingId(res.data.id);
                setStep(5); // Show confirmation
                toast({ title: "Booking Confirmed!", description: "You will receive confirmation via email and SMS." });
              }

            } catch (error) {
              console.error("Verification error:", error);
              toast({
                title: "Verification Failed",
                description: "Please contact support if amount was deducted.",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: formData.email,
          },
          theme: { color: "#794A05" },
        };

        const rzp = new (window as any).Razorpay(options);

        rzp.on('payment.failed', function (response: any) {
          console.error("Payment failed event:", response.error);
          notifyFailedPayment({
            orderType: "POOJA",
            referenceId: res.data.id,
            phone: formData.phone,
            userName: formData.name,
            error: response.error
          }).catch(console.error);
        });

        rzp.on('modal.dismiss', function () {
          console.log("Payment modal dismissed");
          notifyFailedPayment({
            orderType: "POOJA",
            referenceId: res.data.id,
            phone: formData.phone,
            userName: formData.name,
          }).catch(console.error);
        });

        rzp.open();
      } else {
        toast({ title: "Booking Failed", description: res.message || "Something went wrong", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({ title: "Error", description: "Failed to confirm booking. Please try again.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading Sacred Services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/20 to-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link href={searchParams.get("pooja") ? "/poojas" : "/temples"} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {searchParams.get("pooja") ? "Poojas" : "Temples"}
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {selectedPoojaData ? `Book ${selectedPoojaData.name}` : "Book Pooja Service"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {selectedPoojaData ? `Complete your booking for ${selectedPoojaData.name}` : "Complete your spiritual journey with easy online booking"}
          </p>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: "Select Service" },
            { num: 2, label: "Choose Date" },
            { num: 3, label: "Your Details" },
            { num: 4, label: "Payment" },
            { num: 5, label: "Confirmation" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${step >= s.num
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden md:block">{s.label}</span>
              </div>
              {idx < 4 && (
                <div className={`w-12 md:w-24 h-1 mx-2 rounded ${step > s.num ? "bg-primary" : "bg-muted"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step 1: Select Temple & Pooja */}
          {step === 1 && (
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Select Temple
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedTemple} onValueChange={setSelectedTemple}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a temple" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTemples.map((temple) => (
                        <SelectItem key={temple.id} value={temple.id}>
                          {temple.name} - {temple.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {searchParams.get("pooja") && selectedPoojaData && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Select Pooja Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="flex items-center justify-between p-4 rounded-lg border transition-colors border-primary bg-primary/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div>
                          <Label className="font-semibold">
                            {selectedPoojaData.name}
                          </Label>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {selectedPoojaData.description?.[0] || selectedPoojaData.about}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-primary font-bold text-lg">
                        <IndianRupee className="h-4 w-4" />
                        {selectedPoojaData.price}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!searchParams.get("pooja") && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Select Pooja Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedPooja} onValueChange={setSelectedPooja} className="space-y-3">
                      {availablePoojas.map((pooja) => (
                        <div
                          key={pooja.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${selectedPooja === pooja.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                            }`}
                          onClick={() => setSelectedPooja(pooja.id)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={pooja.id} id={pooja.id} />
                            <div>
                              <Label htmlFor={pooja.id} className="font-semibold cursor-pointer">
                                {pooja.name}
                              </Label>
                              <p className="text-sm text-muted-foreground line-clamp-1">{pooja.description?.[0] || pooja.about}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-primary font-bold text-lg">
                            <IndianRupee className="h-4 w-4" />
                            {pooja.price}
                          </div>
                        </div>
                      ))}
                      {availablePoojas.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground italic">
                          No pooja services available for the selected temple.
                        </div>
                      )}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate ? new Date(selectedDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const localDate = format(date, "yyyy-MM-dd");
                              setSelectedDate(localDate);
                              setIsCalendarOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            const dateString = format(date, "yyyy-MM-dd");
                            return date < new Date(new Date().setHours(0, 0, 0, 0)) || unavailableDates.includes(dateString);
                          }}
                          initialFocus
                          modifiers={{
                            unavailable: (date) => {
                              const dateString = format(date, "yyyy-MM-dd");
                              return unavailableDates.includes(dateString);
                            }
                          }}
                          modifiersClassNames={{
                            unavailable: "relative text-muted-foreground opacity-50 cursor-not-allowed"
                          }}
                          components={{
                            DayContent: ({ date }) => {
                              const dateString = format(date, "yyyy-MM-dd");
                              const isUnavailable = unavailableDates.includes(dateString);

                              return (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <span className="relative z-0">{date.getDate()}</span>
                                  {isUnavailable && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                      <X className="h-6 w-6 text-red-600 opacity-100" strokeWidth={3.5} />
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {availabilityStatus && !availabilityStatus.available && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                        <div className="mt-0.5">⚠️</div>
                        <div>
                          <p className="font-bold">Date Unavailable</p>
                          <p>{availabilityStatus.message}</p>
                        </div>
                      </div>
                    )}
                    {availabilityStatus && availabilityStatus.available && selectedDate && (
                      <div className="text-green-600 text-sm flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        {availabilityStatus.message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary text-primary">P</Badge>
                    Select Package
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-3">
                    {poojaPackages.map((pkg: any) => (
                      <div
                        key={pkg.id || pkg.name}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${selectedPackage === (pkg.id || pkg.name)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                          }`}
                        onClick={() => setSelectedPackage(pkg.id || pkg.name)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={pkg.id || pkg.name} id={pkg.id || pkg.name} />
                          <div>
                            <Label htmlFor={pkg.id || pkg.name} className="font-semibold cursor-pointer">
                              {pkg.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-primary font-bold text-lg">
                          <IndianRupee className="h-4 w-4" />
                          {pkg.price}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Hiding Time Slot and Devotee Count as per user request */}
              {/* 
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Number of Devotees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={devoteeCount} onValueChange={setDevoteeCount}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "Person" : "People"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              */}
            </div>
          )}

          {/* Step 3: Devotee Details */}
          {step === 3 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Devotee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="Enter phone"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="gothra">Gothra *</Label>
                    <Input
                      id="gothra"
                      placeholder="e.g. Kashyap"
                      value={formData.gothra}
                      onChange={(e) => setFormData({ ...formData, gothra: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="kuldevi">Kuldevi *</Label>
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline font-bold"
                        onClick={() => setFormData({ ...formData, kuldevi: "Dont Know" })}
                      >
                        Don't Know?
                      </button>
                    </div>
                    <Input
                      id="kuldevi"
                      placeholder="Enter Kuldevi"
                      value={formData.kuldevi}
                      onChange={(e) => setFormData({ ...formData, kuldevi: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="kuldevta">Kuldevta *</Label>
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline font-bold"
                        onClick={() => setFormData({ ...formData, kuldevta: "Dont Know" })}
                      >
                        Don't Know?
                      </button>
                    </div>
                    <Input
                      id="kuldevta"
                      placeholder="Enter Kuldevta"
                      value={formData.kuldevta}
                      onChange={(e) => setFormData({ ...formData, kuldevta: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nativePlace">Native Place *</Label>
                    <Input
                      id="nativePlace"
                      placeholder="E.g. Ayodhya"
                      value={formData.nativePlace}
                      onChange={(e) => setFormData({ ...formData, nativePlace: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anniversary">Anniversary (Optional)</Label>
                    <Input
                      id="anniversary"
                      type="date"
                      value={formData.anniversary}
                      onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4 mt-4">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your address (optional)"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requests">Special Requests</Label>
                  <Textarea
                    id="requests"
                    placeholder="Any special requests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  />
                </div>

                {/* Dynamic Additional Devotee Fields */}
                {formData.additionalDevotees.length > 0 && (
                  <div className="space-y-6 pt-6 border-t mt-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Additional Devotee Information (Optional)
                    </h3>
                    {formData.additionalDevotees.map((devotee, index) => (
                      <div key={index} className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <Label className="text-primary font-bold">Devotee {index + 2}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>Full Name</Label>
                            <Input
                              id={`name-${index}`}
                              placeholder="Enter name"
                              value={devotee.name}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].name = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`gothra-${index}`}>Gothra</Label>
                            <Input
                              id={`gothra-${index}`}
                              placeholder="Enter Gothra"
                              value={devotee.gothra}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].gothra = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`kuldevi-${index}`}>Kuldevi</Label>
                            <Input
                              id={`kuldevi-${index}`}
                              placeholder="Enter Kuldevi"
                              value={devotee.kuldevi}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].kuldevi = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`kuldevta-${index}`}>Kuldevta</Label>
                            <Input
                              id={`kuldevta-${index}`}
                              placeholder="Enter Kuldevta"
                              value={devotee.kuldevta}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].kuldevta = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Temple</span>
                    <span className="font-medium">{allTemples.find(t => t.id === selectedTemple)?.name || "DevBhakti Sacred Services"}</span>

                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedPoojaData?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium">{selectedPackageData?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Service Price</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />{selectedPoojaData?.price}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Package Price</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />{basePrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border text-primary font-semibold">
                    <span className="flex items-center gap-1">Platform Fee <Badge variant="outline" className="text-[10px] h-4 py-0">Slab-based</Badge></span>
                    <span className="flex items-center">
                      + <IndianRupee className="h-4 w-4" />{platformFee}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary flex items-center">
                      <IndianRupee className="h-5 w-5" />{totalAmount}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 p-4 border-2 border-primary bg-primary/5 rounded-lg cursor-pointer">
                    <div className="w-5 h-5 rounded-full border-4 border-primary"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">Online Payment</span>
                        <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="w-5 h-5 grayscale opacity-70" />
                      </div>
                      {/* <p className="text-sm text-muted-foreground">Pay via UPI, Cards, or Net Banking</p> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <Card className="border-border/50 text-center">
              <CardContent className="py-12">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Booking Confirmed!</h2>
                {/* <p className="text-muted-foreground mb-6">
                  Your booking reference number is <span className="font-bold text-foreground">DBK{Date.now().toString().slice(-8)}</span>
                </p> */}

                <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto text-left space-y-3 mb-8">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temple</span>
                    <span className="font-medium">{allTemples.find(t => t.id === selectedTemple)?.name || "DevBhakti Sacred Services"}</span>

                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedPoojaData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Devotee</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium">{selectedPackageData?.name}</span>
                  </div>
                  {formData.nativePlace && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Native Place</span>
                      <span className="font-medium">{formData.nativePlace}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="font-medium text-primary">₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground font-bold">Total Amount</span>
                    <span className="font-bold flex items-center text-primary"><IndianRupee className="h-4 w-4" />{totalAmount}</span>
                  </div>
                </div>

                {/* <p className="text-sm text-muted-foreground mb-6">
                  Confirmation details have been sent to {formData.email}
                </p> */}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="border-primary/20 text-primary hover:bg-primary/5"
                    onClick={() => {
                      const html = generatePoojaReceiptHTML({
                        id: bookingId,
                        devoteeName: formData.name,
                        devoteePhone: formData.phone,
                        devoteeEmail: formData.email,
                        poojaName: selectedPoojaData?.name || "",
                        templeName: allTemples.find(t => t.id === selectedTemple)?.name || "DevBhakti Sacred Services",

                        bookingDate: selectedDate,
                        packageName: selectedPackageData?.name || "",
                        packagePrice: basePrice,
                        platformFee: platformFee,
                        totalAmount: totalAmount,
                        status: "BOOKED",
                        createdAt: new Date().toISOString(),
                        gothra: formData.gothra,
                        kuldevi: formData.kuldevi,
                        kuldevta: formData.kuldevta,
                        dob: formData.dob,
                        anniversary: formData.anniversary,
                        nativePlace: formData.nativePlace,
                        additionalDevotees: formData.additionalDevotees
                      });
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(html);
                        printWindow.document.close();
                        setTimeout(() => {
                          printWindow.print();
                        }, 500);
                      }
                    }}
                  >
                    Download Receipt
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">View My Bookings</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/temples">Book Another Pooja</Link>
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext}>
                  Next Step
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleConfirmBooking} className="bg-green-600 hover:bg-green-700">
                  Confirm & Pay <IndianRupee className="h-4 w-4 ml-1" />{totalAmount}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function BookingClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingForm />
    </Suspense>
  );
}
