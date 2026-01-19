"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const temples = [
  { id: "1", name: "Kashi Vishwanath Temple", location: "Varanasi, UP" },
  { id: "2", name: "Tirupati Balaji Temple", location: "Tirupati, AP" },
  { id: "3", name: "Siddhivinayak Temple", location: "Mumbai, MH" },
  { id: "4", name: "Meenakshi Temple", location: "Madurai, TN" },
  { id: "5", name: "Jagannath Temple", location: "Puri, Odisha" },
  { id: "6", name: "Somnath Temple", location: "Gujarat" },
];

const poojaServices = [
  { id: "1", name: "Mangala Aarti", price: 251, duration: "30 mins", description: "Early morning blessing aarti" },
  { id: "2", name: "Bhog Aarti", price: 501, duration: "45 mins", description: "Mid-day offering aarti" },
  { id: "3", name: "Sandhya Aarti", price: 351, duration: "30 mins", description: "Evening prayer aarti" },
  { id: "4", name: "Shringar Aarti", price: 751, duration: "1 hour", description: "Special decoration aarti" },
  { id: "5", name: "Rudrabhishek", price: 1100, duration: "2 hours", description: "Sacred abhishekam ritual" },
  { id: "6", name: "Satyanarayan Pooja", price: 2100, duration: "3 hours", description: "Complete pooja ceremony" },
  { id: "7", name: "Ganesh Pooja", price: 551, duration: "1 hour", description: "Lord Ganesha worship" },
  { id: "8", name: "Lakshmi Pooja", price: 1501, duration: "2 hours", description: "Goddess Lakshmi worship" },
];

const timeSlots = [
  "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
];

function BookingForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemple, setSelectedTemple] = useState(searchParams.get("temple") || "");
  const [selectedPooja, setSelectedPooja] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [devoteeCount, setDevoteeCount] = useState("1");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    specialRequests: "",
  });

  const selectedPoojaData = poojaServices.find(p => p.id === selectedPooja);
  const totalAmount = selectedPoojaData ? selectedPoojaData.price * parseInt(devoteeCount || "1") : 0;

  const handleNext = () => {
    if (step === 1 && (!selectedTemple || !selectedPooja)) {
      toast({ title: "Please select temple and pooja service", variant: "destructive" });
      return;
    }
    if (step === 2 && (!selectedDate || !selectedTime)) {
      toast({ title: "Please select date and time slot", variant: "destructive" });
      return;
    }
    if (step === 3 && (!formData.name || !formData.phone || !formData.email)) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const handleConfirmBooking = () => {
    setStep(5); // Show confirmation
    toast({ title: "Booking Confirmed!", description: "You will receive confirmation via email and SMS." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/20 to-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link href="/temples" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Temples
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
                      {temples.map((temple) => (
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
                    {poojaServices.map((pooja) => (
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
                            <p className="text-sm text-muted-foreground">{pooja.description}</p>
                            <Badge variant="secondary" className="mt-1">{pooja.duration}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center text-primary font-bold text-lg">
                          <IndianRupee className="h-4 w-4" />
                          {pooja.price}
                        </div>
                      </div>
                    ))}
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
                    <span className="font-medium">{temples.find(t => t.id === selectedTemple)?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedPoojaData?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-medium">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Devotees</span>
                    <span className="font-medium">{devoteeCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Price per person</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />{selectedPoojaData?.price}
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
                    <span className="font-medium">{temples.find(t => t.id === selectedTemple)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedPoojaData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-medium">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-medium flex items-center"><IndianRupee className="h-4 w-4" />{totalAmount}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Confirmation details have been sent to {formData.email}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="#dashboard">View My Bookings</Link>
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
