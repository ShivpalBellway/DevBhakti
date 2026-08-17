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
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

import { fetchPublicTemples, fetchPublicPoojas, fetchPublicPoojaById } from "@/api/publicController";
import { notifyFailedPayment } from "@/api/adminController";
import { generatePoojaReceiptHTML } from "@/utils/poojaReceipt";
import { parseLocalizedValue } from '@/utils/textUtils';


function BookingForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const { t, language } = useLanguage();

  // Always start at Step 1 to allow data to load and normalize correctly
  const initialStep = 1;
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
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
    additionalDevotees: [] as { name: string; gothra: string; kuldevi: string; kuldevta: string }[],
  });

  const [availabilityStatus, setAvailabilityStatus] = useState<{ available: boolean, message: string } | null>(null);
  const [platformFee, setPlatformFee] = useState(0);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [prasadSelection, setPrasadSelection] = useState<"FREE" | "PAID" | "NONE">("NONE");
  const [prasadQuantity, setPrasadQuantity] = useState(1);
  const requestedPoojaParam = searchParams.get("pooja");


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
        const templeIdFromUrl = searchParams.get("temple"); // Temple passed from temple detail page event modal
        const poojasData = await fetchPublicPoojas({ lang: language });
        const requestedPooja = poojaIdInUrl
          ? poojasData.find((p: any) => p.id === poojaIdInUrl || p.slug === poojaIdInUrl)
          : null;
        const poojaFamilyId = requestedPooja?.isMaster
          ? requestedPooja.id
          : requestedPooja?.masterPoojaId || poojaIdInUrl || undefined;

        // Fetch ALL temples so the dropdown is always fully populated, regardless of pooja selection.
        const templesData = await fetchPublicTemples({
          lang: language
        });
        setAllTemples(templesData);
        setAllPoojas(poojasData);

        // Pre-fill user data
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setFormData(prev => ({
            ...prev,
            name: parseLocalizedValue(user.name, language) || "",
            phone: (user.phone || "").replace(/\D/g, "").slice(-10),
            email: user.email || "",
            gothra: user.gothra || "",
            kuldevi: user.kuldevi || "",
            kuldevta: user.kuldevta || "",
            dob: user.dob || "",
            anniversary: user.anniversary || "",
            nativePlace: user.nativePlace || "",
          }));
        }

        // If a pooja is selected via URL, normalize slug → ID and set temple
        if (poojaIdInUrl) {
          const pooja = requestedPooja;
          if (pooja) {
            // Priority: URL temple param > pooja's own templeId
            let resolvedTempleId = pooja.templeId;
            if (templeIdFromUrl) {
              const matchedTemple = templesData.find((t: any) => t.id === templeIdFromUrl || t.slug === templeIdFromUrl);
              resolvedTempleId = matchedTemple ? matchedTemple.id : templeIdFromUrl;
            }
            if (resolvedTempleId) {
              setSelectedTemple(resolvedTempleId);
            }
            
            // Normalize selectedPooja to actual ID if slug was used
            if (pooja.id !== poojaIdInUrl) {
              console.log(`Normalizing pooja slug "${poojaIdInUrl}" to ID "${pooja.id}"`);
              setSelectedPooja(pooja.id);
            }
          }
        } else if (templeIdFromUrl) {
          const matchedTemple = templesData.find((t: any) => t.id === templeIdFromUrl || t.slug === templeIdFromUrl);
          setSelectedTemple(matchedTemple ? matchedTemple.id : templeIdFromUrl);
        }
      } catch (error) {
        console.error("Failed to load booking data:", error);
        toast({ title: t("booking_client.toast_loading_error"), variant: "destructive" });
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
      if (!selectedTemple || loading) return;

      try {
        const response = await fetch(`${API_URL}/temples/poojas?templeId=${selectedTemple}`);
        const data = await response.json();
        if (data.success) {
          setAllPoojas(prev => {
            const others = prev.filter(p => String(p.templeId) !== String(selectedTemple));
            return [...others, ...data.data];
          });
        }
      } catch (error) {
        console.error("Failed to load temple poojas:", error);
      }
    };

    loadTemplePoojas();
  }, [selectedTemple, loading]);

  // ID Resolution: When temple changes or poojas are loaded, sync the selected pooja with its temple-specific version
  useEffect(() => {
    const currentPoojaData = allPoojas.find(p => p.id === selectedPooja || p.slug === selectedPooja);
    if (!currentPoojaData) return;

    // Resolve master ID (it's either the pooja itself if it'sMaster, or its masterPoojaId)
    const masterId = currentPoojaData.isMaster ? currentPoojaData.id : currentPoojaData.masterPoojaId;
    if (!masterId) return;

    if (!selectedTemple) {
      const platformCopy = allPoojas.find(p => p.masterPoojaId === masterId && p.templeId === null && !p.isMaster);
      if (platformCopy) {
        if (platformCopy.id !== selectedPooja) {
          setSelectedPooja(platformCopy.id);
        }
      } else {
        const masterPooja = allPoojas.find(p => p.id === masterId);
        if (masterPooja && masterPooja.id !== selectedPooja) {
          setSelectedPooja(masterPooja.id);
        }
      }
      return;
    }

    // If it's already a temple-specific pooja for the CORRECT temple, do nothing
    if (String(currentPoojaData.templeId) === String(selectedTemple)) return;

    // Look for this master pooja's copy in the currently selected temple
    const templeSpecificPooja = allPoojas.find(p => String(p.templeId) === String(selectedTemple) && String(p.masterPoojaId) === String(masterId));
    
    if (templeSpecificPooja && templeSpecificPooja.id !== selectedPooja) {
      console.log(`Switching selection to temple-specific pooja: ${templeSpecificPooja.id}`);
      setSelectedPooja(templeSpecificPooja.id);
    } else if (!templeSpecificPooja) {
      // No temple-specific copy found. Prefer platform copy (if same master), else fallback to master pooja.
      const platformCopy = allPoojas.find(p => String(p.masterPoojaId) === String(masterId) && (p.templeId === null || p.templeId === undefined));
      if (platformCopy && platformCopy.id !== selectedPooja) {
        console.log(`Falling back to platform copy: ${platformCopy.id}`);
        setSelectedPooja(platformCopy.id);
      } else {
        const masterPooja = allPoojas.find(p => p.id === masterId);
        if (masterPooja && masterPooja.id !== selectedPooja) {
          console.log(`Falling back to master pooja: ${masterPooja.id}`);
          setSelectedPooja(masterPooja.id);
        } else if (!platformCopy && !masterPooja) {
          // If nothing matches, clear selection so user explicitly chooses a pooja for this temple
          setSelectedPooja("");
        }
      }
    }
  }, [selectedTemple, selectedPooja, allPoojas]);

  const availablePoojas = selectedTemple
    ? allPoojas.filter(p => String(p.templeId) === String(selectedTemple))
    : allPoojas.filter(p => p.isMaster);

  const selectedPoojaData = allPoojas.find(p => p.id === selectedPooja || p.slug === selectedPooja);
  const poojaFamilyId = selectedPoojaData?.isMaster
    ? selectedPoojaData.id
    : selectedPoojaData?.masterPoojaId || null;
  const platformPoojaOption = React.useMemo(() => {
    if (!poojaFamilyId) return null;
    // 1. Search for platform copy
    const platformCopy = allPoojas.find((p: any) => p.masterPoojaId === poojaFamilyId && p.templeId === null && !p.isMaster);
    if (platformCopy) return platformCopy;
    // 2. Fallback to master template
    return allPoojas.find((p: any) => p.id === poojaFamilyId && p.isMaster) || null;
  }, [allPoojas, poojaFamilyId]);
  const sourceOptions = React.useMemo(() => {
    if (!requestedPoojaParam || !selectedPoojaData) return [];

    const options: Array<{
      key: string;
      label: string;
      description: string;
      templeId: string;
      poojaId: string | null;
      isPlatform: boolean;
    }> = [];

    if (platformPoojaOption) {
      options.push({
        key: "platform",
        label: "DevBhakti (Platform Pooja)",
        description: "This pooja is managed directly by the DevBhakti platform",
        templeId: "",
        poojaId: platformPoojaOption.id,
        isPlatform: true,
      });
    }

    allTemples.forEach((temple: any) => {
      const templeSpecificPooja = allPoojas.find((p: any) => {
        if (p.templeId !== temple.id) return false;
        if (poojaFamilyId) {
          return p.masterPoojaId === poojaFamilyId || p.id === poojaFamilyId;
        }
        return p.id === selectedPoojaData.id;
      });

      options.push({
        key: temple.id,
        label: parseLocalizedValue(temple.name, language),
        description: parseLocalizedValue(temple.location || temple.fullAddress || temple.city || temple.category, language),
        templeId: temple.id,
        poojaId: templeSpecificPooja?.id || null,
        isPlatform: false,
      });
    });

    return options;
  }, [allPoojas, allTemples, language, platformPoojaOption, poojaFamilyId, requestedPoojaParam, selectedPoojaData]);
  const selectedSourceKey = selectedTemple || (selectedPoojaData && (selectedPoojaData.isMaster || selectedPoojaData.templeId === null || selectedPoojaData.mandalId) ? "platform" : "");

  // If selected pooja is a Master Pooja, Mandal pooja, or Platform copy, show DevBhakti as the platform instead of temple dropdown
  const isMasterPoojaSelected = selectedPoojaData && (selectedPoojaData.isMaster || (selectedPoojaData.templeId === null && !selectedPoojaData.isMaster) || Boolean(selectedPoojaData.mandalId));

  const handleSourceSelect = (option: {
    templeId: string;
    poojaId: string | null;
    isPlatform: boolean;
  }) => {
    setSelectedDate("");
    setSelectedPackage("");
    setAvailabilityStatus(null);

    if (option.isPlatform) {
      setSelectedTemple("");
      if (option.poojaId) {
        setSelectedPooja(option.poojaId);
        router.push(`/booking?pooja=${option.poojaId}`);
      } else {
        setSelectedPooja("");
        router.push(`/booking`);
      }
      return;
    }

    setSelectedTemple(option.templeId);
    if (option.poojaId) {
      setSelectedPooja(option.poojaId);
      router.push(`/booking?pooja=${option.poojaId}&temple=${option.templeId}`);
    } else {
      setSelectedPooja("");
      router.push(`/booking?temple=${option.templeId}`);
    }
  };

  const resolvedPackages = selectedPoojaData?.packages || platformPoojaOption?.packages;
  const poojaPackages = resolvedPackages ?
    (typeof resolvedPackages === 'string' ? JSON.parse(resolvedPackages) : resolvedPackages)
    : [
      { 
        id: "default", 
        name: selectedPoojaData?.name ? `${selectedPoojaData.name} (Standard)` : t("booking_client.package_standard_name") || "Standard Package", 
        price: selectedPoojaData?.price || 0, 
        description: selectedPoojaData?.about || "Standard Pooja Service" 
      }
    ];

  const selectedPackageData = poojaPackages.find((p: any) => (p.id === selectedPackage || p.name === selectedPackage));

  // Calculate Base Price and Total Amount (inclusive of platform fee)
  const basePrice = selectedPackageData?.price || selectedPoojaData?.price || 0;
  const selectedTempleData = allTemples.find(t => String(t.id) === String(selectedTemple));
  
  const prasadPrice = selectedTempleData?.prasadPrice || 0;
  const isPaidPrasadActive = prasadPrice > 0;
  const isFreePrasadActive = selectedPoojaData?.hasPrasad === true;

  const prasadTotal = prasadSelection === "PAID" ? (prasadPrice * prasadQuantity) : 0;
  const totalAmount = basePrice + (platformFee || 0) + prasadTotal;

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
        toast({ title: t("booking_client.toast_select_pooja"), variant: "destructive" });
        return;
      }

      const isMaster = selectedPoojaData?.isMaster;
      const isPlatform = selectedPoojaData?.templeId === null || selectedPoojaData?.templeId === undefined;

      if (!selectedTemple && !isMaster && !isPlatform) {
        toast({ title: t("booking_client.toast_select_temple"), variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!selectedDate || !selectedPackage) {
        toast({ title: t("booking_client.toast_select_date_package"), variant: "destructive" });
        return;
      }
      if (availabilityStatus && !availabilityStatus.available) {
        toast({ title: t("booking_client.toast_date_unavailable"), description: availabilityStatus.message, variant: "destructive" });
        return;
      }
    }
    if (step === 3) {
      if (!formData.name || !formData.phone) {
        toast({ title: t("booking_client.toast_fill_fields"), description: t("booking_client.toast_fill_fields_desc"), variant: "destructive" });
        return;
      }

      // If prasad is requested, delivery address fields are required
      if (prasadSelection !== "NONE" && (!formData.prasadStreet || !formData.prasadCity || !formData.prasadState || !formData.prasadPincode)) {
        toast({ title: t("booking_client.toast_fill_fields"), description: t("booking_client.prasad_address_required"), variant: "destructive" });
        return;
      }

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;

        if (!token || !parsedUser || parsedUser.role !== "DEVOTEE") {
          toast({ title: t("booking_client.toast_login_required"), variant: "destructive" });
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
        toast({ title: t("booking_client.toast_login_to_book"), variant: "destructive" });
        router.push("/auth");
        return;
      }

      const bookingData = {
        poojaId: selectedPooja,
        templeId: selectedTemple || undefined,
        packageName: selectedPackageData?.name || "Standard",
        packagePrice: basePrice,
        devoteeName: formData.name,
        devoteePhone: formData.phone,
        devoteeEmail: formData.email,
        bookingDate: selectedDate,
        address: formData.address,
        prasadStreet: formData.prasadStreet,
        prasadCity: formData.prasadCity,
        prasadState: formData.prasadState,
        prasadPincode: formData.prasadPincode,
        specialRequests: formData.specialRequests,
        gothra: formData.gothra,
        kuldevi: formData.kuldevi,
        kuldevta: formData.kuldevta,
        dob: formData.dob,
        gender: formData.gender,
        anniversary: formData.anniversary,
        nativePlace: formData.nativePlace,
        additionalDevotees: formData.additionalDevotees,
        platformFee: platformFee, // Send platform fee to backend
        isPrasadRequested: prasadSelection !== "NONE",
        prasadSelectionType: prasadSelection,
        prasadQuantity: prasadSelection === "PAID" ? prasadQuantity : 0,
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
          name: t("booking_client.razorpay_name"),
          description: t("booking_client.razorpay_description"),
          order_id: res.razorpayOrder.id,
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
                  orderType: "POOJA",
                  referenceId: res.data.id, // The backend expects referenceId
                  orderData: { ...bookingData, bookingId: res.data.id },
                  userId: parsedUser.id

                })
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                setBookingId(res.data.id);
                setIsPaymentLoading(false);
                setStep(5); // Show confirmation
                toast({ 
                  title: t("booking_client.toast_booking_confirmed"), 
                  description: t("booking_client.toast_booking_confirmed_desc"),
                  variant: "success"
                });
              } else {
                setIsPaymentLoading(false);
                toast({
                  title: t("booking_client.toast_verification_failed"),
                  description: verifyData.message || t("booking_client.toast_verification_failed_desc"),
                  variant: "destructive",
                });
              }

            } catch (error) {
              console.error("Verification error:", error);
              toast({
                title: t("booking_client.toast_verification_failed"),
                description: t("booking_client.toast_verification_failed_desc"),
                variant: "destructive",
              });
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
              if (rzp && typeof rzp.close === "function") {
                rzp.close();
              }
              setIsPaymentLoading(false);
              toast({
                title: t("booking_client.toast_payment_cancelled") || "Payment Cancelled",
                description: t("booking_client.toast_payment_cancelled_desc") || "You have cancelled the payment. You can try again whenever you are ready.",
                variant: "default",
              });
              console.log("Payment modal dismissed");
              notifyFailedPayment({
                orderType: "POOJA",
                referenceId: res.data.id,
                phone: formData.phone,
                userName: formData.name,
              }).catch(console.error);
            }
          }
        };

        let rzp: any = new (window as any).Razorpay(options);

        rzp.on('payment.failed', function (response: any) {
          if (rzp && typeof rzp.close === "function") {
            rzp.close();
          }
          setIsPaymentLoading(false);
          toast({
            title: t("booking_client.toast_payment_failed") || "Payment Failed",
            description: t("booking_client.toast_payment_failed_desc") || "Your payment could not be completed. Please try again or use another payment method.",
            variant: "destructive",
          });
          console.error("Payment failed event:", response.error);
          notifyFailedPayment({
            orderType: "POOJA",
            referenceId: res.data.id,
            phone: formData.phone,
            userName: formData.name,
            error: response.error
          }).catch(console.error);
        });

        rzp.open();
      } else {
        toast({ title: t("booking_client.toast_booking_failed"), description: res.message || t("booking_client.summary_total"), variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({ title: t("booking_client.toast_error"), description: t("booking_client.toast_error_desc"), variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground animate-pulse">{t("booking_client.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isPaymentLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-background px-8 py-7 text-center shadow-2xl border border-border">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">Loading Payment</p>
              <p className="mt-1 text-sm text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
          </div>
        </div>
      )}
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/20 to-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Link href={searchParams.get("pooja") ? "/poojas" : "/temples"} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {searchParams.get("pooja") ? t("booking_client.back_to_poojas") : t("booking_client.back_to_temples")}
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {selectedPoojaData ? t("booking_client.book_prefix") + selectedPoojaData.name : t("booking_client.book_default")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {selectedPoojaData ? t("booking_client.complete_prefix") + selectedPoojaData.name : t("booking_client.complete_default")}
          </p>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: t("booking_client.step_select_service") },
            { num: 2, label: t("booking_client.step_choose_date") },
            { num: 3, label: t("booking_client.step_your_details") },
            { num: 4, label: t("booking_client.step_payment") },
            { num: 5, label: t("booking_client.step_confirmation") },
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
                    {t("booking_client.select_temple")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* When temple is pre-specified from URL (temple event modal flow):
                      Show ALL temples dropdown with that temple pre-selected.
                      User can change to any other temple. */}
                  {searchParams.get("temple") ? (
                    <Select
                      value={selectedTemple}
                      onValueChange={(val) => {
                        setSelectedTemple(val);
                        setSelectedPooja("");
                        setSelectedDate("");
                        setSelectedPackage("");
                        setAvailabilityStatus(null);
                        router.push(`/booking?temple=${val}`);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("booking_client.choose_temple")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allTemples.map((temple: any) => (
                          <SelectItem key={temple.id} value={temple.id}>
                            {parseLocalizedValue(temple.name, language)} {temple.location ? `- ${parseLocalizedValue(temple.location, language)}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : requestedPoojaParam && sourceOptions.length > 0 ? (
                    <Select
                      value={selectedSourceKey}
                      onValueChange={(value) => {
                        const option = sourceOptions.find((item) => item.key === value);
                        if (option) {
                          handleSourceSelect(option);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("booking_client.choose_temple")} />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : isMasterPoojaSelected ? (
                    // Master Pooja — show only DevBhakti as the platform option
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-primary/5">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">DB</span>
                      </div>
                      <div>
                        <p className="font-semibold text-primary text-sm">DevBhakti (Platform Pooja)</p>
                        <p className="text-xs text-muted-foreground">This pooja is managed directly by the DevBhakti platform</p>
                      </div>
                    </div>
                  ) : (
                    <Select value={selectedTemple} onValueChange={(val) => {
                        setSelectedTemple(val);
                        setSelectedPooja("");
                        setSelectedDate("");
                        setSelectedPackage("");
                        setAvailabilityStatus(null);
                      }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("booking_client.choose_temple")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allTemples.map((temple) => (
                          <SelectItem key={temple.id} value={temple.id}>
                            {temple.name} - {temple.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              {searchParams.get("pooja") && selectedPoojaData && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {t("booking_client.select_pooja_service")}
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
                          <div 
                            className="text-sm text-muted-foreground line-clamp-1"
                            dangerouslySetInnerHTML={{ __html: parseLocalizedValue(selectedPoojaData.description?.[0] || selectedPoojaData.about) || "" }}
                          />
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
                      {t("booking_client.select_pooja_service")}
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
                                {parseLocalizedValue(pooja.name)}
                              </Label>
                              <div 
                                className="text-sm text-muted-foreground line-clamp-1" 
                                dangerouslySetInnerHTML={{ __html: parseLocalizedValue(pooja.description?.[0] || pooja.about) || "" }} 
                              />
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
                          {t("booking_client.no_poojas_available")}
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
                    {t("booking_client.select_date")}
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
                          {selectedDate ? format(new Date(selectedDate), "PPP") : <span>{t("booking_client.pick_a_date")}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selectedDateShape="circle"
                          showOutsideDays={false}
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
                          <p className="font-bold">{t("booking_client.date_unavailable_title")}</p>
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
                    {t("booking_client.select_package")}
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
                <CardTitle>{t("booking_client.devotee_info_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("booking_client.field_full_name")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder={t("booking_client.placeholder_name")}
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("booking_client.field_phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder={t("booking_client.placeholder_phone")}
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("booking_client.field_email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("booking_client.placeholder_email")}
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="gothra">{t("booking_client.field_gothra")}</Label>
                    <Input
                      id="gothra"
                      placeholder={t("booking_client.placeholder_gothra")}
                      value={formData.gothra}
                      onChange={(e) => setFormData({ ...formData, gothra: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="kuldevi">{t("booking_client.field_kuldevi")}</Label>
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline font-bold"
                        onClick={() => setFormData({ ...formData, kuldevi: "Dont Know" })}
                      >
                        {t("booking_client.dont_know")}
                      </button>
                    </div>
                    <Input
                      id="kuldevi"
                      placeholder={t("booking_client.placeholder_kuldevi")}
                      value={formData.kuldevi}
                      onChange={(e) => setFormData({ ...formData, kuldevi: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="kuldevta">{t("booking_client.field_kuldevta")}</Label>
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline font-bold"
                        onClick={() => setFormData({ ...formData, kuldevta: "Dont Know" })}
                      >
                        {t("booking_client.dont_know")}
                      </button>
                    </div>
                    <Input
                      id="kuldevta"
                      placeholder={t("booking_client.placeholder_kuldevta")}
                      value={formData.kuldevta}
                      onChange={(e) => setFormData({ ...formData, kuldevta: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">{t("booking_client.field_dob")}</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nativePlace">{t("booking_client.field_native_place")}</Label>
                    <Input
                      id="nativePlace"
                      placeholder={t("booking_client.placeholder_native_place")}
                      value={formData.nativePlace}
                      onChange={(e) => setFormData({ ...formData, nativePlace: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anniversary">{t("booking_client.field_anniversary")}</Label>
                    <Input
                      id="anniversary"
                      type="date"
                      value={formData.anniversary}
                      onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t("booking_client.field_gender")}</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(val) => setFormData({ ...formData, gender: val })}
                      className="flex gap-4 pt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="gender-male" />
                        <Label htmlFor="gender-male" className="cursor-pointer font-normal">{t("booking_client.gender_male")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="gender-female" />
                        <Label htmlFor="gender-female" className="cursor-pointer font-normal">{t("booking_client.gender_female")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Non Binary" id="gender-nonbinary" />
                        <Label htmlFor="gender-nonbinary" className="cursor-pointer font-normal">{t("booking_client.gender_non_binary")}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* General address — hidden when prasad delivery address is filled */}
                {prasadSelection === "NONE" && (
                  <div className="space-y-2 border-t pt-4 mt-4">
                    <Label htmlFor="address">{t("booking_client.field_address")}</Label>
                    <Textarea
                      id="address"
                      placeholder={t("booking_client.placeholder_address")}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                )}

                {/* International FCRA Notice for Prasad */}
                {(() => {
                  const raw = formData.phone.trim();
                  const hasExplicitPlus = raw.startsWith('+');
                  const cleaned = raw.replace(/\D/g, '');
                  const isInternational = hasExplicitPlus && !cleaned.startsWith('91');
                  
                  if (isInternational && (isPaidPrasadActive || isFreePrasadActive)) {
                    return (
                      <div className="mt-6 p-4 border border-amber-200 rounded-xl bg-amber-50 text-amber-800 text-sm font-medium">
                        ℹ️ Physical Prasad delivery is only available within India. Your Pooja service booking will be conducted globally as requested!
                      </div>
                    );
                  }

                  if (!isInternational && (isPaidPrasadActive || isFreePrasadActive)) {
                    return (
                      <div className="mt-6 p-4 border rounded-xl bg-orange-50/50 border-orange-100">
                        <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          🙏 Prasad Selection
                        </Label>
                        <p className="text-xs text-slate-600 mb-4 mt-1">
                          Choose if you would like Prasad delivered to your home.
                        </p>
                        
                        <div className="space-y-3">
                          <RadioGroup
                            value={prasadSelection}
                            onValueChange={(val: any) => {
                              setPrasadSelection(val);
                              if (val === "PAID" && prasadQuantity < 1) setPrasadQuantity(1);
                            }}
                            className="flex flex-col gap-4"
                          >
                            {isFreePrasadActive && (
                              <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white shadow-sm cursor-pointer hover:border-orange-200 transition-colors">
                                <RadioGroupItem value="FREE" id="prasad-free" className="mt-1" />
                                <div className="flex-1">
                                  <Label htmlFor="prasad-free" className="cursor-pointer font-bold text-slate-800 text-sm">
                                    Free Prasad
                                  </Label>
                                  <p className="text-xs text-slate-500 mt-1">Included with this pooja • ₹0</p>
                                </div>
                              </div>
                            )}
                            
                            {isPaidPrasadActive && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-white shadow-sm cursor-pointer hover:border-orange-200 transition-colors gap-3">
                                <div className="flex items-start space-x-3">
                                  <RadioGroupItem value="PAID" id="prasad-paid" className="mt-1" />
                                  <div>
                                    <Label htmlFor="prasad-paid" className="cursor-pointer font-bold text-slate-800 text-sm">
                                      Paid Prasad
                                    </Label>
                                    <p className="text-xs text-slate-500 mt-1">₹{prasadPrice} per packet</p>
                                  </div>
                                </div>
                                
                                {prasadSelection === "PAID" && (
                                  <div className="flex items-center gap-3 pl-7 sm:pl-0">
                                    <span className="text-sm font-semibold text-slate-700">Quantity:</span>
                                    <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-slate-50 shadow-xs">
                                      <button 
                                        type="button"
                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 transition font-bold text-slate-700"
                                        onClick={(e) => { e.preventDefault(); setPrasadQuantity(Math.max(1, prasadQuantity - 1)); }}
                                      >
                                        <Minus className="w-4 h-4 text-slate-600" />
                                      </button>
                                      <span className="w-10 text-center text-sm font-bold select-none text-slate-900 bg-white py-1">{prasadQuantity}</span>
                                      <button 
                                        type="button"
                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 transition font-bold text-slate-700"
                                        onClick={(e) => { e.preventDefault(); setPrasadQuantity(Math.min(10, prasadQuantity + 1)); }}
                                      >
                                        <Plus className="w-4 h-4 text-slate-600" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-start space-x-3 p-3 border rounded-lg bg-white shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                              <RadioGroupItem value="NONE" id="prasad-none" className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor="prasad-none" className="cursor-pointer font-bold text-slate-800 text-sm">
                                  No Prasad
                                </Label>
                                <p className="text-xs text-slate-500 mt-1">I do not wish to receive Prasad</p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Structured Prasad Delivery Address — only shown when prasad is requested */}
                        {prasadSelection !== "NONE" && (
                          <div className="mt-6 pt-4 border-t border-orange-200/60 space-y-4">
                            <p className="text-sm font-bold text-[#794A05] flex items-center gap-2">
                              📦 Delivery Address
                              <span className="text-xs font-normal text-slate-500">(Prasad will be sent to this address)</span>
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="prasadStreet">Street / House No. <span className="text-red-500">*</span></Label>
                              <Textarea
                                id="prasadStreet"
                                placeholder="Enter street name, house number, landmark"
                                value={formData.prasadStreet}
                                onChange={(e) => setFormData({ ...formData, prasadStreet: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="prasadCity">City <span className="text-red-500">*</span></Label>
                                <input
                                  id="prasadCity"
                                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none"
                                  placeholder="Enter city"
                                  value={formData.prasadCity}
                                  onChange={(e) => setFormData({ ...formData, prasadCity: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="prasadState">State <span className="text-red-500">*</span></Label>
                                <input
                                  id="prasadState"
                                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none"
                                  placeholder="Enter state"
                                  value={formData.prasadState}
                                  onChange={(e) => setFormData({ ...formData, prasadState: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="prasadPincode">Pincode <span className="text-red-500">*</span></Label>
                                <input
                                  id="prasadPincode"
                                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none"
                                  placeholder="6-digit pincode"
                                  maxLength={6}
                                  value={formData.prasadPincode}
                                  onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setFormData({ ...formData, prasadPincode: v });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })()}

                <div className="space-y-2 mt-4">
                  <Label htmlFor="requests">{t("booking_client.field_special_requests")}</Label>
                  <Textarea
                    id="requests"
                    placeholder={t("booking_client.placeholder_special_requests")}
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  />
                </div>

                {/* Dynamic Additional Devotee Fields */}
                {formData.additionalDevotees.length > 0 && (
                  <div className="space-y-6 pt-6 border-t mt-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {t("booking_client.add_devotee_title")}
                    </h3>
                    {formData.additionalDevotees.map((devotee, index) => (
                      <div key={index} className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <Label className="text-primary font-bold">{t("booking_client.devotee_label")} {index + 2}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>{t("booking_client.field_devotee_name")}</Label>
                            <Input
                              id={`name-${index}`}
                              placeholder={t("booking_client.placeholder_devotee_name")}
                              value={devotee.name}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].name = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`gothra-${index}`}>{t("booking_client.field_devotee_gothra")}</Label>
                            <Input
                              id={`gothra-${index}`}
                              placeholder={t("booking_client.placeholder_devotee_gothra")}
                              value={devotee.gothra}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].gothra = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`kuldevi-${index}`}>{t("booking_client.field_devotee_kuldevi")}</Label>
                            <Input
                              id={`kuldevi-${index}`}
                              placeholder={t("booking_client.placeholder_devotee_kuldevi")}
                              value={devotee.kuldevi}
                              onChange={(e) => {
                                const newDevotees = [...formData.additionalDevotees];
                                newDevotees[index].kuldevi = e.target.value;
                                setFormData({ ...formData, additionalDevotees: newDevotees });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`kuldevta-${index}`}>{t("booking_client.field_devotee_kuldevta")}</Label>
                            <Input
                              id={`kuldevta-${index}`}
                              placeholder={t("booking_client.placeholder_devotee_kuldevta")}
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
                  <CardTitle>{t("booking_client.booking_summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_temple")}</span>
                    <div className="text-right">
                      <span className="font-medium">{allTemples.find(t => t.id === selectedTemple)?.name || t("booking_client.default_temple")}</span>
                      {allTemples.find(t => t.id === selectedTemple) && (
                        <p className="text-xs text-muted-foreground">
                          {parseLocalizedValue(allTemples.find(t => t.id === selectedTemple)?.location || allTemples.find(t => t.id === selectedTemple)?.fullAddress || allTemples.find(t => t.id === selectedTemple)?.city, language)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_service")}</span>
                    <span className="font-medium">{selectedPoojaData?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_date")}</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_package")}</span>
                    <span className="font-medium">{selectedPackageData?.name}</span>
                  </div>
                  {(isPaidPrasadActive || isFreePrasadActive) && prasadSelection !== "NONE" && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Prasad Requested</span>
                      <span className="font-medium flex items-center flex-col items-end">
                        {prasadSelection === "FREE" && <span>Free Prasad (Included)</span>}
                        {prasadSelection === "PAID" && <span>Paid Prasad: {prasadQuantity} x ₹{prasadPrice}</span>}
                      </span>
                    </div>
                  )}
                  {(isPaidPrasadActive || isFreePrasadActive) && prasadSelection === "NONE" && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Prasad Requested</span>
                      <span className="font-medium">No</span>
                    </div>
                  )}
                  {/* <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_service_price")}</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />{selectedPoojaData?.price}
                    </span>
                  </div> */}
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_package_price")}</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />{basePrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border text-primary font-semibold">
                    <span className="flex items-center gap-1">{t("booking_client.summary_platform_fee")} </span>
                    <span className="flex items-center">
                      + <IndianRupee className="h-4 w-4" />{platformFee}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span>{t("booking_client.summary_total")}</span>
                    <span className="text-primary flex items-center">
                      <IndianRupee className="h-5 w-5" />{totalAmount}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>{t("booking_client.payment_method")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 p-4 border-2 border-primary bg-primary/5 rounded-lg cursor-pointer">
                    <div className="w-5 h-5 rounded-full border-4 border-primary"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{t("booking_client.online_payment")}</span>
                        <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="w-5 h-5 grayscale opacity-70" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t("booking_client.pay_via")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <Card className="border-border/50 text-center">
              <CardContent className="py-12">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t("booking_client.confirmed_title")}</h2>
                {/* <p className="text-muted-foreground mb-6">
                  Your booking reference number is <span className="font-bold text-foreground">DBK{Date.now().toString().slice(-8)}</span>
                </p> */}

                <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto text-left space-y-3 mb-8">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_temple")}</span>
                    <span className="font-medium">{allTemples.find(t => t.id === selectedTemple)?.name || t("booking_client.default_temple")}</span>

                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_service")}</span>
                    <span className="font-medium">{selectedPoojaData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_devotee")}</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_phone")}</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_date")}</span>
                    <span className="font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_package")}</span>
                    <span className="font-medium">{selectedPackageData?.name}</span>
                  </div>
                  {(isPaidPrasadActive || isFreePrasadActive) && prasadSelection !== "NONE" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prasad Requested</span>
                      <span className="font-medium flex items-center flex-col items-end">
                        {prasadSelection === "FREE" && <span>Free Prasad (Included)</span>}
                        {prasadSelection === "PAID" && <span>Paid Prasad: {prasadQuantity} x ₹{prasadPrice}</span>}
                      </span>
                    </div>
                  )}
                  {(isPaidPrasadActive || isFreePrasadActive) && prasadSelection === "NONE" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prasad Requested</span>
                      <span className="font-medium">No</span>
                    </div>
                  )}
                  {formData.nativePlace && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("booking_client.confirmed_native_place")}</span>
                      <span className="font-medium">{formData.nativePlace}</span>
                    </div>
                  )}
                    <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">{t("booking_client.summary_package_price")}</span>
                    <span className="font-medium flex items-center">
                      <IndianRupee className="h-4 w-4" />{basePrice}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("booking_client.confirmed_platform_fee")}</span>
                    <span className="font-medium text-primary">₹{platformFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground font-bold">{t("booking_client.confirmed_total")}</span>
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
                        templeName: allTemples.find(t => t.id === selectedTemple)?.name || t("common.platform_name"),

                        bookingDate: selectedDate,
                        packageName: selectedPackageData?.name || "",
                        packagePrice: basePrice,
                        platformFee: platformFee,
                        prasadTotal: prasadTotal,
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
                      }, t);
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
                    {t("booking_client.btn_download_receipt")}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">{t("booking_client.btn_view_bookings")}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/temples">{t("booking_client.btn_book_another")}</Link>
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
                {t("booking_client.btn_previous")}
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext}>
                  {t("booking_client.btn_next_step")}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleConfirmBooking} className="bg-green-600 hover:bg-green-700">
                  {t("booking_client.btn_confirm_pay")} <IndianRupee className="h-4 w-4 ml-1" />{totalAmount}
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
  const { t, language } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif text-xl text-primary/60 animate-pulse">{t("common.loading")}</div>}>
      <BookingForm />
    </Suspense>
  );
}
