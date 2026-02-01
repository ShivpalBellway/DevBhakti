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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { fetchPublicTemples, fetchPublicPoojas, fetchPublicPoojaById } from "@/api/publicController";

function BookingForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

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
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [templesData, poojasData] = await Promise.all([
          fetchPublicTemples(),
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

  // Filter poojas based on selected temple, or show all if no temple selected (for selection)
  const availablePoojas = selectedTemple
    ? allPoojas.filter(p => p.templeId === selectedTemple)
    : allPoojas;

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
  const totalAmount = selectedPackageData?.price || selectedPoojaData?.price || 0;

  const handleNext = () => {
    if (step === 1 && (!selectedTemple || !selectedPooja)) {
      toast({ title: "Please select temple and pooja service", variant: "destructive" });
      return;
    }
    if (step === 2 && (!selectedDate || !selectedPackage)) {
      toast({ title: "Please select date and package", variant: "destructive" });
      return;
    }
    if (step === 3 && (!formData.name || !formData.phone || !formData.email)) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const handleConfirmBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
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

      if (res.success) {
        setStep(5); // Show confirmation
        toast({ title: "Booking Confirmed!", description: "You will receive confirmation via email and SMS." });
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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Book Pooja Service</h1>
          <p className="text-muted-foreground mt-2">Complete your spiritual journey with easy online booking</p>
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
                            <Badge variant="secondary" className="mt-1">{pooja.duration}</Badge>
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
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="max-w-xs"
                  />
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your full name"
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
                        placeholder="Enter phone number"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
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
                    placeholder="Any special requests or gotra details"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  />
                </div>
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
                    <span className="font-medium">{allTemples.find(t => t.id === selectedTemple)?.name}</span>
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
                      <IndianRupee className="h-4 w-4" />{selectedPackageData?.price}
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
                  <RadioGroup defaultValue="upi" className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="cursor-pointer flex-1">
                        <span className="font-semibold">UPI Payment</span>
                        <p className="text-sm text-muted-foreground">Pay using Google Pay, PhonePe, Paytm etc.</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="cursor-pointer flex-1">
                        <span className="font-semibold">Credit/Debit Card</span>
                        <p className="text-sm text-muted-foreground">Visa, Mastercard, RuPay</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="netbanking" id="netbanking" />
                      <Label htmlFor="netbanking" className="cursor-pointer flex-1">
                        <span className="font-semibold">Net Banking</span>
                        <p className="text-sm text-muted-foreground">All major banks supported</p>
                      </Label>
                    </div>
                  </RadioGroup>
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
                <p className="text-muted-foreground mb-6">
                  Your booking reference number is <span className="font-bold text-foreground">DBK{Date.now().toString().slice(-8)}</span>
                </p>

                <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto text-left space-y-3 mb-8">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temple</span>
                    <span className="font-medium">{allTemples.find(t => t.id === selectedTemple)?.name}</span>
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
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground font-bold">Total Amount</span>
                    <span className="font-bold flex items-center text-primary"><IndianRupee className="h-4 w-4" />{totalAmount}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Confirmation details have been sent to {formData.email}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
