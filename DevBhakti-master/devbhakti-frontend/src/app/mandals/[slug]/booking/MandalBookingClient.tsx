"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config/apiConfig";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { notifyFailedPayment } from "@/api/adminController";

interface MandalBookingClientProps {
  slug: string;
}

export default function MandalBookingClient({ slug }: MandalBookingClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // States
  const [step, setStep] = useState(1); // Step 1: Select Pooja, Step 2: Date & Details, Step 3: Review
  const [loading, setLoading] = useState(true);
  const [mandal, setMandal] = useState<any>(null);
  const [mandalPoojas, setMandalPoojas] = useState<any[]>([]);
  const [selectedPooja, setSelectedPooja] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    devoteeName: "",
    devoteePhone: "",
    devoteeEmail: "",
    bookingDate: "",
    address: "",
    prasadStreet: "",
    prasadCity: "",
    prasadState: "",
    prasadPincode: "",
    specialRequests: "",
    gothra: "",
    kuldevi: "",
    kuldevta: "",
    dob: "",
    gender: "",
    anniversary: "",
    nativePlace: "",
  });

  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    message: string;
  } | null>(null);

  const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load mandal and poojas
  useEffect(() => {
    const loadMandalData = async () => {
      setLoading(true);
      try {
        // Fetch mandal details
        const mandalRes = await fetch(`${API_URL}/mandals/${slug}`);
        const mandalData = await mandalRes.json();

        if (mandalData.success) {
          setMandal(mandalData.data);

          if (mandalData.data?.isActive !== true || String(mandalData.data?.status || "").toUpperCase() !== "APPROVED") {
            toast({
              title: "Bookings Disabled",
              description: "Pooja bookings are enabled only for approved and active mandals.",
              variant: "destructive",
            });
            router.push(`/mandals/${slug}`);
            return;
          }

          // Fetch mandal's poojas
          const poojasRes = await fetch(
            `${API_URL}/temples/poojas?mandalId=${mandalData.data.id}&lang=${language}`
          );
          const poojasData = await poojasRes.json();

          if (poojasData.success) {
            setMandalPoojas(poojasData.data);
          }
        } else {
          toast({
            title: t("common.error"),
            description: "Failed to load mandal details",
            variant: "destructive",
          });
          router.push("/mandals");
        }

        // Pre-fill user data
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setFormData((prev) => ({
            ...prev,
            devoteeName: user.name || "",
            devoteePhone: (user.phone || "").replace(/\D/g, "").slice(-10),
            devoteeEmail: user.email || "",
            gothra: user.gothra || "",
            kuldevi: user.kuldevi || "",
            kuldevta: user.kuldevta || "",
            dob: user.dob || "",
            anniversary: user.anniversary || "",
            nativePlace: user.nativePlace || "",
          }));
        }
      } catch (error) {
        console.error("Error loading mandal data:", error);
        toast({
          title: t("common.error"),
          description: "Failed to load mandal",
          variant: "destructive",
        });
        router.push("/mandals");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadMandalData();
    }
  }, [slug, language]);

  // Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.bookingDate || !selectedPooja) {
        setAvailabilityStatus(null);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/bookings/check-availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            poojaId: selectedPooja.id,
            date: formData.bookingDate,
          }),
        });
        const data = await response.json();
        setAvailabilityStatus(data);
      } catch (error) {
        console.error("Availability check error:", error);
      }
    };

    checkAvailability();
  }, [formData.bookingDate, selectedPooja]);

  // Calculate platform fee
  useEffect(() => {
    const calculateFee = async () => {
      if (!selectedPackage) {
        setPlatformFee(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/bookings/calculate-commission`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: selectedPackage.price || selectedPooja?.price || 0,
              vendorType: "MANDAL",
              vendorId: mandal?.id,
              category: "POOJA",
            }),
          }
        );
        const data = await response.json();
        if (data.success) {
          setPlatformFee(data.data.totalCommission);
        }
      } catch (error) {
        console.error("Fee calculation error:", error);
      }
    };

    calculateFee();
  }, [selectedPackage, mandal, selectedPooja]);

  const getPackageOptions = () => {
    if (!selectedPooja) return [];

    const packages = Array.isArray(selectedPooja.packages)
      ? selectedPooja.packages
      : selectedPooja.packages && typeof selectedPooja.packages === "string"
        ? JSON.parse(selectedPooja.packages)
        : [];

    if (packages.length > 0) return packages;

    return [
      {
        id: "default",
        name: getLocalized(selectedPooja, "name") || "Standard",
        price: Number(selectedPooja.price || 0),
        description: selectedPooja.about || "Standard Pooja Service",
      },
    ];
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedPooja) {
        toast({
          title: "Select Pooja",
          description: "Please select a pooja to continue",
          variant: "destructive",
        });
        return;
      }
      if (!selectedPackage) {
        toast({
          title: "Select Package",
          description: "Please select a package",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.bookingDate) {
        toast({
          title: "Select Date",
          description: "Please choose a booking date",
          variant: "destructive",
        });
        return;
      }
      if (!formData.devoteeName || !formData.devoteePhone) {
        toast({
          title: "Fill Required Fields",
          description: "Please enter name and phone number",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirmBooking = async () => {
    setIsPaymentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      const parsedUser = user ? JSON.parse(user) : null;

      if (!token || !parsedUser) {
        toast({
          title: "Login Required",
          description: "Please login to complete the booking",
          variant: "destructive",
        });
        router.push("/auth");
        setIsPaymentLoading(false);
        return;
      }

      const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";

      const bookingData = {
        poojaId: selectedPooja?.id,
        mandalId: mandal?.id,
        packageName: selectedPackage?.name || "Standard",
        packagePrice: selectedPackage?.price || selectedPooja?.price || 0,
        devoteeName: formData.devoteeName,
        devoteePhone: formData.devoteePhone.replace(/\D/g, "").slice(0, 10),
        devoteeEmail: formData.devoteeEmail,
        bookingDate: formData.bookingDate,
        address: formData.address,
        specialRequests: formData.specialRequests,
        gothra: formData.gothra,
        gender: formData.gender,
        platformFee: platformFee,
      };

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const res = await response.json();

      if (res.success && res.razorpayOrder) {
        const options = {
          key: RAZORPAY_KEY,
          amount: res.razorpayOrder.amount,
          currency: res.razorpayOrder.currency,
          name: "DevBhakti",
          description: `${selectedPooja?.name || "Pooja"} Booking`,
          order_id: res.razorpayOrder.id,
          handler: async function (responseData: any) {
            setIsPaymentLoading(true);
            try {
              const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: responseData.razorpay_order_id,
                  razorpay_payment_id: responseData.razorpay_payment_id,
                  razorpay_signature: responseData.razorpay_signature,
                  orderType: "POOJA",
                  referenceId: res.data.id,
                  orderData: { ...bookingData, bookingId: res.data.id },
                  userId: parsedUser.id,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                setIsPaymentLoading(false);
                setBookingSuccess(true);
                setConfirmedBookingId(res.data.id);
                setStep(4);
                toast({
                  title: "Booking Confirmed!",
                  description: "Your pooja has been booked successfully.",
                  variant: "success" as any,
                });
              } else {
                setIsPaymentLoading(false);
                toast({
                  title: "Verification Failed",
                  description: verifyData.message || "Payment verification failed. Please contact support.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Verification error:", error);
              setIsPaymentLoading(false);
              toast({
                title: "Verification Failed",
                description: "Could not verify payment. Please contact support.",
                variant: "destructive",
              });
            }
          },
          prefill: {
            name: formData.devoteeName,
            contact: formData.devoteePhone,
            email: formData.devoteeEmail,
          },
          theme: { color: "#794A05" },
          modal: {
            ondismiss: function () {
              if (rzp && typeof rzp.close === "function") {
                rzp.close();
              }
              setIsPaymentLoading(false);
              toast({
                title: "Payment Cancelled",
                description: "You cancelled the payment. You can try again whenever you are ready.",
                variant: "default",
              });
              notifyFailedPayment({
                orderType: "POOJA",
                referenceId: res.data.id,
                phone: formData.devoteePhone,
                userName: formData.devoteeName,
              }).catch(console.error);
            },
          },
        };

        let rzp: any = new (window as any).Razorpay(options);

        rzp.on("payment.failed", function (response: any) {
          if (rzp && typeof rzp.close === "function") {
            rzp.close();
          }
          setIsPaymentLoading(false);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be completed. Please try again.",
            variant: "destructive",
          });
          notifyFailedPayment({
            orderType: "POOJA",
            referenceId: res.data.id,
            phone: formData.devoteePhone,
            userName: formData.devoteeName,
            error: response.error,
          }).catch(console.error);
        });

        rzp.open();
      } else {
        setIsPaymentLoading(false);
        toast({
          title: "Booking Failed",
          description: res.message || "Failed to create booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
      setIsPaymentLoading(false);
      toast({
        title: "Error",
        description: "Failed to process booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p>{t("common.loading")}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!mandal) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Mandal not found</p>
            <Button onClick={() => router.push("/mandals")}>Back to Mandals</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const packageOptions = getPackageOptions();
  const totalAmount = (selectedPackage?.price || selectedPooja?.price || 0) + platformFee;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="gap-2 mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            {mandal.image && (
              <img
                src={
                  mandal.image.startsWith("http")
                    ? mandal.image
                    : `${API_URL.replace("/api", "")}${mandal.image}`
                }
                alt={mandal.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {getLocalized(mandal, "name", language)}
              </h1>
              <p className="text-muted-foreground">Book a Pooja</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                    step >= s
                      ? s === 4 && bookingSuccess
                        ? "bg-emerald-600 text-white"
                        : "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s === 4 && bookingSuccess ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      "flex-1 h-1 transition-all duration-300",
                      step > s ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Select Pooja</span>
            <span>Details</span>
            <span>Review & Pay</span>
            <span className={bookingSuccess ? "text-emerald-600 font-semibold" : ""}>Confirmed</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Select Pooja */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Select a Pooja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {mandalPoojas.length > 0 ? (
                    mandalPoojas.map((pooja) => (
                      <button
                        key={pooja.id}
                        onClick={() => {
                          setSelectedPooja(pooja);
                          setSelectedPackage(null);
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border-2 transition-all",
                          selectedPooja?.id === pooja.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {getLocalized(pooja, "name", language)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {pooja.category || "Pooja Service"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary flex items-center gap-1">
                              <IndianRupee className="w-4 h-4" />
                              {pooja.price}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No poojas available
                    </p>
                  )}
                </div>

                {selectedPooja && packageOptions.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Choose Package
                    </Label>
                    {packageOptions.map((pkg) => (
                      <button
                        key={pkg.id || pkg.name}
                        onClick={() => setSelectedPackage(pkg)}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border-2 transition-all",
                          selectedPackage?.id === pkg.id ||
                            selectedPackage?.name === pkg.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{pkg.name}</h3>
                            {pkg.description && (
                              <p className="text-sm text-muted-foreground">
                                {pkg.description}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-primary flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {pkg.price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleNext}
                  disabled={!selectedPooja || !selectedPackage}
                  className="w-full"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Booking Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Booking Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.bookingDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {formData.bookingDate
                          ? format(new Date(formData.bookingDate), "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          formData.bookingDate
                            ? new Date(formData.bookingDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            bookingDate: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        disabled={(date) =>
                          date < new Date() ||
                          date.getDay() === 0 ||
                          date.getDay() === 6
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {availabilityStatus && !availabilityStatus.available && (
                    <p className="text-sm text-destructive">
                      {availabilityStatus.message}
                    </p>
                  )}
                </div>

                {/* Devotee Details */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={formData.devoteeName}
                        onChange={(e) =>
                          setFormData({ ...formData, devoteeName: e.target.value })
                        }
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        value={formData.devoteePhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            devoteePhone: e.target.value.replace(/\D/g, "").slice(0, 10),
                          })
                        }
                        placeholder="10-digit phone"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.devoteeEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, devoteeEmail: e.target.value })
                      }
                      placeholder="Email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Address"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Gothra</Label>
                      <Input
                        value={formData.gothra}
                        onChange={(e) =>
                          setFormData({ ...formData, gothra: e.target.value })
                        }
                        placeholder="Gothra"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(val) =>
                          setFormData({ ...formData, gender: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Requests / Sankalp</Label>
                    <Textarea
                      value={formData.specialRequests}
                      onChange={(e) =>
                        setFormData({ ...formData, specialRequests: e.target.value })
                      }
                      placeholder="Any special requirements..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handlePrevious} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Payment */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Pooja:</span>
                      <span className="font-semibold">
                        {getLocalized(selectedPooja, "name", language)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span className="font-semibold">
                        {selectedPackage?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-semibold">
                        {format(new Date(formData.bookingDate), "PPP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Devotee:</span>
                      <span className="font-semibold">{formData.devoteeName}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Pooja Price:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {selectedPackage?.price || selectedPooja?.price}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Platform Fee:
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {platformFee}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg">
                      <span className="font-bold">Total Amount:</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <IndianRupee className="w-5 h-5" />
                        {totalAmount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Devotee Details Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Devotee Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.devoteeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{formData.devoteePhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{formData.devoteeEmail || "N/A"}</span>
                  </div>
                  {formData.bookingDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Date:</span>
                      <span>{format(new Date(formData.bookingDate), "PPP")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrevious} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isPaymentLoading}
                  className="flex-1"
                >
                  {isPaymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Booking
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Booking Success */}
          {step === 4 && bookingSuccess && (
            <div className="space-y-6">
              {/* Success Animation */}
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="pt-8 pb-6">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-800">Booking Confirmed!</h2>
                    <p className="text-emerald-600 text-sm">Your pooja has been booked successfully.</p>
                 
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Pooja</span>
                    <span className="font-semibold">{getLocalized(selectedPooja, "name", language)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-semibold">{selectedPackage?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Devotee</span>
                    <span className="font-semibold">{formData.devoteeName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-semibold">{formData.bookingDate ? format(new Date(formData.bookingDate), "PPP") : "-"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-bold">Total Paid</span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {totalAmount}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/profile/bookings`)}
                  className="w-full h-12 bg-varient-pri hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Booking
                </Button>
              
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

import { Sparkles } from "lucide-react";
