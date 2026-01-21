"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  IndianRupee,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Building2,
  Gift,
  ArrowLeft,
  Sparkles,
  FileText,
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

const donationPurposes = [
  { id: "general", name: "General Donation", icon: Heart, description: "Support temple operations and maintenance" },
  { id: "annadaan", name: "Annadaan (Food Seva)", icon: Gift, description: "Feed devotees and the needy" },
  { id: "gauseva", name: "Gau Seva", icon: Sparkles, description: "Support cow welfare programs" },
  { id: "education", name: "Education Fund", icon: FileText, description: "Support vedic education initiatives" },
  { id: "renovation", name: "Temple Renovation", icon: Building2, description: "Help maintain and beautify the temple" },
];

const suggestedAmounts = [101, 251, 501, 1001, 2101, 5001, 11001, 21001];

function DonationForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemple, setSelectedTemple] = useState(searchParams.get("temple") || "");
  const [selectedPurpose, setSelectedPurpose] = useState("general");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [is80GRequired, setIs80GRequired] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    pan: "",
    address: "",
    message: "",
  });

  const finalAmount = customAmount || amount;

  const handleNext = () => {
    if (step === 1 && !selectedTemple) {
      toast({ title: "Please select a temple", variant: "destructive" });
      return;
    }
    if (step === 2 && !finalAmount) {
      toast({ title: "Please enter donation amount", variant: "destructive" });
      return;
    }
    if (step === 3 && !isAnonymous && (!formData.name || !formData.phone || !formData.email)) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (step === 3 && is80GRequired && !formData.pan) {
      toast({ title: "PAN is required for 80G receipt", variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const handleConfirmDonation = () => {
    setStep(5);
    toast({ title: "Donation Successful!", description: "Thank you for your generous contribution." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-secondary/30 via-primary/10 to-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link href="/temples" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Temples
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Make a Donation</h1>
          </div>
          <p className="text-muted-foreground mt-2">Your contribution helps preserve our sacred traditions</p>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: "Select Temple" },
            { num: 2, label: "Amount" },
            { num: 3, label: "Your Details" },
            { num: 4, label: "Payment" },
            { num: 5, label: "Receipt" },
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
          {/* Step 1: Select Temple */}
          {step === 1 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Select Temple to Donate
                </CardTitle>
                <CardDescription>Choose the temple you wish to support</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedTemple} onValueChange={setSelectedTemple} className="space-y-3">
                  {temples.map((temple) => (
                    <div
                      key={temple.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${selectedTemple === temple.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setSelectedTemple(temple.id)}
                    >
                      <RadioGroupItem value={temple.id} id={`temple-${temple.id}`} />
                      <Label htmlFor={`temple-${temple.id}`} className="cursor-pointer flex-1">
                        <span className="font-semibold">{temple.name}</span>
                        <p className="text-sm text-muted-foreground">{temple.location}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Amount & Purpose */}
          {step === 2 && (
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Donation Purpose
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPurpose} onValueChange={setSelectedPurpose} className="grid md:grid-cols-2 gap-3">
                    {donationPurposes.map((purpose) => (
                      <div
                        key={purpose.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${selectedPurpose === purpose.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                          }`}
                        onClick={() => setSelectedPurpose(purpose.id)}
                      >
                        <RadioGroupItem value={purpose.id} id={purpose.id} className="mt-1" />
                        <div>
                          <Label htmlFor={purpose.id} className="cursor-pointer font-semibold flex items-center gap-2">
                            <purpose.icon className="h-4 w-4 text-primary" />
                            {purpose.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{purpose.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    Donation Amount
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {suggestedAmounts.map((amt) => (
                      <Button
                        key={amt}
                        variant={amount === amt.toString() && !customAmount ? "default" : "outline"}
                        onClick={() => {
                          setAmount(amt.toString());
                          setCustomAmount("");
                        }}
                        className="w-full"
                      >
                        ₹{amt.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Or enter custom amount</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        className="pl-10"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setAmount("");
                        }}
                      />
                    </div>
                  </div>
                  {finalAmount && (
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">You are donating</p>
                      <p className="text-3xl font-bold text-primary flex items-center justify-center">
                        <IndianRupee className="h-6 w-6" />
                        {parseInt(finalAmount).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Donor Details */}
          {step === 3 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Donor Information</CardTitle>
                <CardDescription>Please provide your details for the donation receipt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Make this donation anonymous
                  </Label>
                </div>

                {!isAnonymous && (
                  <>
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

                    <div className="flex items-center space-x-2 p-4 border border-secondary rounded-lg bg-secondary/10">
                      <Checkbox
                        id="80g"
                        checked={is80GRequired}
                        onCheckedChange={(checked) => setIs80GRequired(checked as boolean)}
                      />
                      <Label htmlFor="80g" className="cursor-pointer">
                        <span className="font-semibold">I need 80G Tax Exemption Receipt</span>
                        <p className="text-sm text-muted-foreground">PAN card details required for tax benefit</p>
                      </Label>
                    </div>

                    {is80GRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN Number *</Label>
                        <Input
                          id="pan"
                          placeholder="Enter PAN number (e.g., ABCDE1234F)"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                          maxLength={10}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="address">Address (Optional)</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message / Prayer Request (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message or prayer request"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
                  <CardTitle>Donation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Temple</span>
                    <span className="font-medium">{temples.find(t => t.id === selectedTemple)?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Purpose</span>
                    <span className="font-medium">{donationPurposes.find(p => p.id === selectedPurpose)?.name}</span>
                  </div>
                  {!isAnonymous && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Donor Name</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                  )}
                  {is80GRequired && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">80G Receipt</span>
                      <Badge variant="secondary">Yes - PAN: {formData.pan}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span>Donation Amount</span>
                    <span className="text-primary flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {parseInt(finalAmount).toLocaleString()}
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

          {/* Step 5: Receipt */}
          {step === 5 && (
            <Card className="border-border/50 text-center">
              <CardContent className="py-12">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-green-600 fill-green-600" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Thank You for Your Generosity!</h2>
                <p className="text-muted-foreground mb-6">
                  Your donation reference number is <span className="font-bold text-foreground">DON{Date.now().toString().slice(-8)}</span>
                </p>

                <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto text-left space-y-3 mb-8">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temple</span>
                    <span className="font-medium">{temples.find(t => t.id === selectedTemple)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose</span>
                    <span className="font-medium">{donationPurposes.find(p => p.id === selectedPurpose)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Donated</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      {parseInt(finalAmount).toLocaleString()}
                    </span>
                  </div>
                  {is80GRequired && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">80G Receipt</span>
                      <Badge className="bg-green-600">Will be sent via email</Badge>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Receipt has been sent to {formData.email || "your registered email"}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="#dashboard">View Donation History</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/temples">Make Another Donation</Link>
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
                </Button>
              ) : (
                <Button onClick={handleConfirmDonation} className="bg-green-600 hover:bg-green-700">
                  Complete Donation <IndianRupee className="h-4 w-4 ml-1" />{parseInt(finalAmount).toLocaleString()}
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

export default function DonationClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DonationForm />
    </Suspense>
  );
}
