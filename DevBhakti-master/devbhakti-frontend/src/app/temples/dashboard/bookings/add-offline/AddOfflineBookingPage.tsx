"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/config/apiConfig";
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
  Printer,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { generatePoojaReceiptHTML, downloadPoojaReceiptPDF } from '@/utils/poojaReceipt';
import { fetchMyPoojas, createOfflineBookingTemple, lookupDevoteeByPhoneTemple } from '@/api/templeAdminController';
import { parseLocalizedValue } from '@/utils/textUtils';


export default function AddOfflineBookingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();
  const language = "en";
  const t = (key: string) => key.split(".").pop()?.replace(/_/g, " ") || key;

  // Always start at Step 1 to allow data to load and normalize correctly
  const initialStep = 1;
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  
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
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isPrasadRequested, setIsPrasadRequested] = useState(false);
  const requestedPoojaParam = searchParams.get("pooja");

  const handlePhoneLookup = async (phoneVal: string) => {
    const cleaned = phoneVal.replace(/\D/g, "");
    if (cleaned.length < 10) return;
    try {
      setIsLookupLoading(true);
      const res = await lookupDevoteeByPhoneTemple(phoneVal);
      if (res.success && res.exists && res.data) {
        setFormData(prev => ({
          ...prev,
          name: res.data.name || prev.name,
          email: res.data.email || prev.email,
          gothra: res.data.gothra || prev.gothra,
          kuldevi: res.data.kuldevi || prev.kuldevi,
          kuldevta: res.data.kuldevta || prev.kuldevta,
          address: res.data.address || prev.address,
          dob: res.data.dob || prev.dob,
          anniversary: res.data.anniversary || prev.anniversary,
          nativePlace: res.data.nativePlace || prev.nativePlace,
        }));
        toast({
          title: "Devotee Details Auto-Filled",
          description: `Existing record found for ${res.data.name || 'devotee'}.`,
        });
      }
    } catch (err) {
      console.error("Phone lookup error", err);
    } finally {
      setIsLookupLoading(false);
    }
  };



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
        const savedUser = localStorage.getItem("user");
        let ownerId = "";
        
        if (savedUser) {
          const user = JSON.parse(savedUser);
          ownerId = user.ownerId;
          setSelectedTemple(user.ownerId);
          setFormData(prev => ({
            ...prev,
            name: parseLocalizedValue(user.name, language) || "",
            phone: (user.phone || "").replace(/\D/g, "").slice(-10),
            email: user.email || "",
          }));
        }

        const poojasRaw = await fetchMyPoojas();
        const poojasData = Array.isArray(poojasRaw) ? poojasRaw : (poojasRaw?.data || []);
        setAllPoojas(poojasData);

        if (poojaIdInUrl) {
          setSelectedPooja(poojaIdInUrl);
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

  const availablePoojas = allPoojas;

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
  const selectedSourceKey = selectedTemple || (selectedPoojaData && (selectedPoojaData.isMaster || selectedPoojaData.templeId === null) ? "platform" : "");

  // If selected pooja is a Master Pooja or Platform copy, show DevBhakti as the platform instead of temple dropdown
  const isMasterPoojaSelected = selectedPoojaData && (selectedPoojaData.isMaster || (selectedPoojaData.templeId === null && !selectedPoojaData.isMaster));

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
        name: selectedPoojaData?.name ? `${parseLocalizedValue(selectedPoojaData.name, language)} (Standard)` : t("booking_client.package_standard"), 
        price: selectedPoojaData?.price || 0, 
        description: selectedPoojaData?.description?.[0] ? parseLocalizedValue(selectedPoojaData.description[0], language) : t("booking_client.standard_puja_description") 
      }
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
    const name = parseLocalizedValue(selectedPackageData.name, language).toLowerCase() || "";
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
      if (isPrasadRequested && (!formData.prasadStreet || !formData.prasadCity || !formData.prasadState || !formData.prasadPincode)) {
        toast({ title: t("booking_client.toast_fill_fields"), description: t("booking_client.prasad_address_required"), variant: "destructive" });
        return;
      }

      
    }
    setStep(step + 1);
  };

  const handleConfirmBooking = async () => {
    try {
      setIsPaymentLoading(true);
      const rawPackageName = selectedPackageData?.name || selectedPoojaData?.name || "Standard";
      const safePackageName = typeof rawPackageName === 'string'
        ? rawPackageName
        : parseLocalizedValue(rawPackageName) || "Standard";

      const bookingData = {
        poojaId: selectedPooja,
        templeId: selectedTemple || undefined,
        packageName: safePackageName,
        packagePrice: basePrice,
        devoteeName: parseLocalizedValue(formData.name) || formData.name,
        devoteePhone: formData.phone,
        devoteeEmail: formData.email || undefined,
        bookingDate: selectedDate || undefined,
        address: formData.address || undefined,
        prasadStreet: formData.prasadStreet || undefined,
        prasadCity: formData.prasadCity || undefined,
        prasadState: formData.prasadState || undefined,
        prasadPincode: formData.prasadPincode || undefined,
        specialRequests: formData.specialRequests || undefined,
        gothra: formData.gothra || undefined,
        kuldevi: formData.kuldevi || undefined,
        kuldevta: formData.kuldevta || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        anniversary: formData.anniversary || undefined,
        nativePlace: formData.nativePlace || undefined,
        additionalDevotees: formData.additionalDevotees,
        paymentMethod: paymentMethod,
        transactionRef: transactionRef || undefined,
        adminNotes: adminNotes || undefined,
        isPrasadRequested: isPrasadRequested,
      };

      const res = await createOfflineBookingTemple(bookingData);

      if (res.success) {
        setBookingId(res.data.id);
        setCreatedBooking(res.data);
        setStep(5);
        toast({
          title: "Booking Confirmed",
          description: "Offline booking has been created successfully.",
          variant: "success"
        });
      } else {
        toast({ title: "Booking Failed", description: res.message || "Could not submit booking.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({ title: "Error", description: error?.response?.data?.message || "Failed to create booking", variant: "destructive" });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const getReceiptBookingData = () => {
    if (!createdBooking) return null;
    return {
      id: createdBooking.id || `OFF-${Date.now()}`,
      devoteeName: createdBooking.devoteeName || formData.name || "Devotee",
      devoteePhone: createdBooking.devoteePhone || formData.phone || "N/A",
      devoteeEmail: createdBooking.devoteeEmail || formData.email || "",
      poojaName: createdBooking.poojaName || createdBooking.pooja?.name || parseLocalizedValue(selectedPoojaData?.name, language) || "Pooja Service",
      templeName: createdBooking.templeName || createdBooking.temple?.name || parseLocalizedValue(allTemples.find((t: any) => t.id === selectedTemple)?.name, language) || "DevBhakti",
      packageName: createdBooking.packageName || selectedPackageData?.name || "Standard Package",
      packagePrice: Number(createdBooking.packagePrice ?? createdBooking.amount ?? basePrice ?? 0),
      platformFee: Number(createdBooking.platformFee ?? platformFee ?? 0),
      totalAmount: Number(createdBooking.totalAmount ?? createdBooking.amount ?? totalAmount ?? 0),
      status: createdBooking.status || "CONFIRMED",
      bookingDate: createdBooking.bookingDate || createdBooking.date || selectedDate || new Date().toISOString(),
      createdAt: createdBooking.createdAt || new Date().toISOString(),
      gothra: createdBooking.gothra || formData.gothra,
      kuldevi: createdBooking.kuldevi || formData.kuldevi,
      kuldevta: createdBooking.kuldevta || formData.kuldevta,
      dob: createdBooking.dob || formData.dob,
      anniversary: createdBooking.anniversary || formData.anniversary,
      nativePlace: createdBooking.nativePlace || formData.nativePlace,
      additionalDevotees: createdBooking.additionalDevotees || formData.additionalDevotees,
      ...createdBooking,
    };
  };

  const handlePrintReceipt = () => {
    const bookingForReceipt = getReceiptBookingData();
    if (!bookingForReceipt) return;

    const html = generatePoojaReceiptHTML(bookingForReceipt as any, t);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    }
  };

  const handleDownloadReceipt = () => {
    const bookingForReceipt = getReceiptBookingData();
    if (!bookingForReceipt) return;
    downloadPoojaReceiptPDF(bookingForReceipt as any, t);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        
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

      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-slate-50/50 text-sm">
        <Link href="/temples/dashboard/teller" className="flex items-center gap-1.5 text-slate-600 hover:text-amber-800 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Teller Module
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-800">Add Offline Pooja Booking</span>
      </div>

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-amber-100/60 via-orange-50/40 to-background py-8 border-b">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
            {selectedPoojaData ? `Book ${parseLocalizedValue(selectedPoojaData.name, language)}` : "Book Offline Pooja"}
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            {selectedPoojaData ? `Complete offline pooja booking for ${parseLocalizedValue(selectedPoojaData.name, language)}` : "Complete offline pooja booking details for devotee"}
          </p>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="w-full max-w-7xl mx-auto px-4 py-8">
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

        <div className="w-full max-w-7xl mx-auto">
          {/* Step 1: Select Pooja */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-serif font-bold text-slate-800 mb-1">Select Pooja Service</h2>
                <p className="text-muted-foreground text-sm">Choose the ritual to book for the devotee.</p>
              </div>

              {searchParams.get("pooja") && selectedPoojaData && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-amber-800" />
                      Selected Pooja Ritual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="flex items-center justify-between p-4 rounded-xl border border-amber-800 bg-amber-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full border border-amber-800 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-amber-800" />
                        </div>
                        <div>
                          <Label className="font-semibold text-slate-900">
                            {parseLocalizedValue(selectedPoojaData.name, language)}
                          </Label>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {(parseLocalizedValue(selectedPoojaData.description?.[0] || selectedPoojaData.about, language) || "").replace(/<[^>]*>?/gm, '').trim()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-800 font-bold text-lg">
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
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-amber-800" />
                      Select Pooja Ritual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedPooja} onValueChange={setSelectedPooja} className="space-y-3">
                      {availablePoojas.map((pooja) => (
                        <div
                          key={pooja.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${selectedPooja === pooja.id
                            ? "border-amber-800 bg-amber-50/40 shadow-sm"
                            : "border-border hover:border-amber-800/50"
                            }`}
                          onClick={() => setSelectedPooja(pooja.id)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={pooja.id} id={pooja.id} />
                            <div>
                              <Label htmlFor={pooja.id} className="font-semibold text-slate-900 cursor-pointer">
                                {parseLocalizedValue(pooja.name, language)}
                              </Label>
                              <p className="text-sm text-slate-500 line-clamp-1">
                                {(parseLocalizedValue(pooja.description?.[0] || pooja.about, language) || "").replace(/<[^>]*>?/gm, '').trim()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-800 font-bold text-lg">
                            <IndianRupee className="h-4 w-4" />
                            {pooja.price}
                          </div>
                        </div>
                      ))}
                      {availablePoojas.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground italic">
                          No poojas available for selection
                        </div>
                      )}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}
            </motion.div>
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
                              {parseLocalizedValue(pkg.name, language)}
                            </Label>
                            <p className="text-sm text-muted-foreground">{parseLocalizedValue(pkg.description, language)}</p>
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
                {!isPrasadRequested && (
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

                {/* Structured Prasad Delivery Address — only shown when prasad is requested */}
                {isPrasadRequested && (
                  <div className="mt-4 p-4 rounded-2xl border border-orange-200 bg-orange-50/40 space-y-4">
                    <p className="text-sm font-bold text-[#794A05] flex items-center gap-2">
                      📦 {t("booking_client.prasad_delivery_title")}
                      <span className="text-xs font-normal text-slate-500">({t("booking_client.prasad_delivery_subtitle")})</span>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="prasadStreet">{t("booking_client.prasad_field_street")} <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="prasadStreet"
                        placeholder={t("booking_client.prasad_placeholder_street")}
                        value={formData.prasadStreet}
                        onChange={(e) => setFormData({ ...formData, prasadStreet: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="prasadCity">{t("booking_client.prasad_field_city")} <span className="text-red-500">*</span></Label>
                        <input
                          id="prasadCity"
                          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none"
                          placeholder={t("booking_client.prasad_placeholder_city")}
                          value={formData.prasadCity}
                          onChange={(e) => setFormData({ ...formData, prasadCity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prasadState">{t("booking_client.prasad_field_state")} <span className="text-red-500">*</span></Label>
                        <input
                          id="prasadState"
                          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none"
                          placeholder={t("booking_client.prasad_placeholder_state")}
                          value={formData.prasadState}
                          onChange={(e) => setFormData({ ...formData, prasadState: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prasadPincode">{t("booking_client.prasad_field_pincode")} <span className="text-red-500">*</span></Label>
                        <input
                          id="prasadPincode"
                          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-orange-400 focus:outline-none"
                          placeholder={t("booking_client.prasad_placeholder_pincode")}
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
                <div className="space-y-2">
                  <Label htmlFor="requests">{t("booking_client.field_special_requests")}</Label>
                  <Textarea
                    id="requests"
                    placeholder={t("booking_client.placeholder_special_requests")}
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  />
                </div>

                {/* Free Prasad Option */}
                {selectedPoojaData?.hasPrasad && (
                  <div className="mt-6 p-4 border rounded-xl bg-orange-50/50 border-orange-100">
                    <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      🙏 {t("booking_client.prasad_question")}
                    </Label>
                    <RadioGroup
                      value={isPrasadRequested ? "yes" : "no"}
                      onValueChange={(val) => setIsPrasadRequested(val === "yes")}
                      className="flex gap-6 mt-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="prasad-yes" />
                        <Label htmlFor="prasad-yes" className="cursor-pointer font-normal">{t("booking_client.prasad_yes")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="prasad-no" />
                        <Label htmlFor="prasad-no" className="cursor-pointer font-normal">{t("booking_client.prasad_no")}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

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
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-[#794A05] border-b pb-4">
                  <div className="p-2 bg-[#794A05]/10 rounded-lg">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-semibold">Payment & Confirmation</h2>
                </div>

                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionRef">Transaction Ref / Receipt No.</Label>
                  <Input
                    id="transactionRef"
                    placeholder="e.g. UPI-987654321 / Counter Receipt #1042"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Internal Temple Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add internal notes for this offline booking..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                  />
                </div>


                    <div className="flex justify-between">
                      <span className="text-slate-600">Pooja</span>
                      <span className="font-medium text-right">{parseLocalizedValue(selectedPoojaData?.name, language)}</span>
                    </div>
{selectedTemple && (
  <div className="flex justify-between">
    <span className="text-slate-600">Temple</span>
    <span className="font-medium text-right">
      {parseLocalizedValue(allTemples.find(t => t.id === selectedTemple)?.name, language) || ''}
    </span>
  </div>
)}
<div className="flex justify-between">
  <span className="text-slate-600">Package</span>
  <span className="font-medium text-right">
    {parseLocalizedValue(selectedPackageData?.name, language)}
  </span>
</div>
                <div className="flex gap-4 pt-6">
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1" disabled={isPaymentLoading}>
                    Back
                  </Button>
                  <Button onClick={handleConfirmBooking} className="flex-1 bg-[#794A05] hover:bg-[#794A05]/90 text-white" disabled={isPaymentLoading}>
                    {isPaymentLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Confirm Booking
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Booking Confirmed!</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                The offline pooja booking has been created successfully.
              </p>
              
              <div className="flex gap-4 justify-center pt-8">
                <Button 
                    onClick={() => router.push('/temples/dashboard/bookings')} 
                    variant="outline" 
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Bookings
                </Button>
                
                {createdBooking && (
                  <>
                    <Button 
                      onClick={handlePrintReceipt}
                      className="gap-2 bg-[#794A05] hover:bg-[#794A05]/90 text-white shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      Print Receipt
                    </Button>
                    <Button 
                      onClick={handleDownloadReceipt}
                      variant="outline"
                      className="gap-2 border-[#794A05] text-[#794A05] hover:bg-[#794A05]/10"
                    >
                      <Download className="w-4 h-4" />
                      Download Receipt
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
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
              {step < 4 && (
                <Button onClick={handleNext}>
                  {t("booking_client.btn_next_step")}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
