"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Camera,
    Calendar,
    Clock,
    MapPin,
    CheckCircle,
    Download,
    Info,
    FileText,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { BASE_URL } from "@/config/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { getLocalized, getLocalizedArray } from "@/utils/localization";
import { formatSlotTime } from "@/utils/textUtils";
import { useLanguage } from "@/context/LanguageContext";
import QRCode from "qrcode";

export default function PhotographyBookingPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { language } = useLanguage();

    const templeId = params?.id as string;

    const [temple, setTemple] = useState<any>(null);
    const [loadingTemple, setLoadingTemple] = useState(true);

    const [photoStep, setPhotoStep] = useState(1);

    // Dynamic data
    const [photoPackages, setPhotoPackages] = useState<any[]>([]);
    const [allowedAreas, setAllowedAreas] = useState<string[]>([]);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Selected state
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [selectedPhotoArea, setSelectedPhotoArea] = useState("");
    const [selectedPhotoDate, setSelectedPhotoDate] = useState("");
    const [selectedPhotoSlot, setSelectedPhotoSlot] = useState<any>(null);
    const [agreedToRules, setAgreedToRules] = useState(false);

    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [bookingError, setBookingError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Temple & Packages
    useEffect(() => {
        if (!templeId) return;

        const loadTempleData = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/temples/${templeId}?lang=${language}`);
                const json = await res.json();
                if (json.success && json.data) {
                    setTemple(json.data);

                    if (json.data.allowedPhotoAreas) {
                        try {
                            const areas = typeof json.data.allowedPhotoAreas === 'string'
                                ? JSON.parse(json.data.allowedPhotoAreas)
                                : json.data.allowedPhotoAreas;
                            setAllowedAreas(Array.isArray(areas) ? areas : []);
                        } catch (e) {
                            setAllowedAreas([]);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load temple data:", err);
            } finally {
                setLoadingTemple(false);
            }
        };

        const loadPackages = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/temples/photography/${templeId}/packages?lang=${language}`);
                const json = await res.json();
                if (json.success && json.data) {
                    const activePackages = json.data.filter((p: any) => p.isActive);
                    setPhotoPackages(activePackages);
                    if (activePackages.length > 0) {
                        setSelectedPackage(activePackages[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to load packages:", err);
            }
        };

        loadTempleData();
        loadPackages();
    }, [templeId, language]);

    // Fetch Slot Availability
    useEffect(() => {
        if (!selectedPhotoDate || !templeId) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const res = await fetch(`${BASE_URL}/api/temples/photography/slots/availability?templeId=${templeId}&date=${selectedPhotoDate}`);
                const json = await res.json();
                if (json.success && json.data) {
                    setAvailableSlots(json.data);
                    const firstAvail = json.data.find((s: any) => s.available);
                    setSelectedPhotoSlot(firstAvail || null);
                }
            } catch (err) {
                console.error("Failed to load slots:", err);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedPhotoDate, templeId]);

    const handlePhotoSubmit = async () => {
        if (photoStep === 1 && !selectedPackage) {
            toast({ title: "Error", description: "Please select a package first.", variant: "destructive" });
            return;
        }
        if (photoStep === 2 && !selectedPhotoDate) {
            toast({ title: "Error", description: "Please choose a date.", variant: "destructive" });
            return;
        }
        if (photoStep === 2 && !selectedPhotoSlot) {
            toast({ title: "Error", description: "No time slot selected or available.", variant: "destructive" });
            return;
        }
        if (photoStep === 3 && !selectedPhotoArea) {
            toast({ title: "Error", description: "Please select an allowed area.", variant: "destructive" });
            return;
        }

        if (photoStep === 5) {
            // Payment Step -> Trigger Razorpay Checkout
            try {
                setIsSubmitting(true);
                setBookingError("");

                const savedUserStr = localStorage.getItem("user");
                const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

                const bookingRes = await fetch(`${BASE_URL}/api/temples/photography/book`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        templeId: temple.id,
                        packageId: selectedPackage.id,
                        slotId: selectedPhotoSlot.id,
                        selectedArea: selectedPhotoArea,
                        bookingDate: selectedPhotoDate,
                        userId: savedUser?.id,
                        devoteeName: savedUser?.name || "Guest Devotee",
                        devoteePhone: savedUser?.phone || "9999999999",
                        devoteeEmail: savedUser?.email || "devotee@devbhakti.in"
                    })
                });

                const json = await bookingRes.json();
                if (!json.success) {
                    setBookingError(json.message || "Booking failed.");
                    setIsSubmitting(false);
                    return;
                }

                const { razorpayOrderId, bookingId, displayId, amount, platformFee, packagePrice } = json.data;

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    name: "DevBhakti Photography Pass",
                    description: `Pass for ${getLocalized(selectedPackage, 'name', language)}`,
                    order_id: razorpayOrderId,
                    handler: async function (response: any) {
                        try {
                            const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderType: "PHOTOGRAPHY",
                                    referenceId: bookingId
                                })
                            });
                            const verifyJson = await verifyRes.json();

                            if (verifyJson.success) {
                                const vData = verifyJson.data || {};
                                const finalBookingId = vData.bookingId || bookingId;

                                setBookingDetails({
                                    bookingId: finalBookingId,
                                    displayId: vData.displayId || displayId,
                                    devoteeName: savedUser?.name || "Guest Devotee",
                                    packageName: vData.packageName || getLocalized(selectedPackage, 'name', language),
                                    bookingDate: vData.bookingDate || selectedPhotoDate,
                                    timeSlot: vData.timeSlot || selectedPhotoSlot.slotName,
                                    totalAmount: vData.totalAmount || amount,
                                    packagePrice: vData.packagePrice || packagePrice,
                                    platformFee: vData.platformFee || platformFee
                                });

                                try {
                                    const qrUrl = `${window.location.origin}/temples/dashboard/verify-photo-ticket/${finalBookingId}`;
                                    const dataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 });
                                    setQrCodeUrl(dataUrl);
                                } catch (e) {
                                    console.error("QR Error", e);
                                }

                                setPhotoStep(6);
                                toast({
                                    title: "Pass Confirmed! 🎉",
                                    description: "Your photography pass has been generated successfully.",
                                    variant: "success"
                                });
                            } else {
                                setBookingError(verifyJson.message || "Payment verification failed.");
                                toast({
                                    title: "Verification Failed",
                                    description: verifyJson.message || "Payment verification failed.",
                                    variant: "destructive"
                                });
                            }
                        } catch (err: any) {
                            console.error("Verification Error:", err);
                            setBookingError("Error verifying payment.");
                        } finally {
                            setIsSubmitting(false);
                        }
                    },
                    prefill: {
                        name: savedUser?.name || "Guest",
                        email: savedUser?.email || "devotee@devbhakti.in",
                        contact: savedUser?.phone || "9999999999"
                    },
                    theme: {
                        color: "#7c4624"
                    },
                    modal: {
                        ondismiss: function () {
                            setIsSubmitting(false);
                            toast({
                                title: "Payment Cancelled",
                                description: "You closed the payment window. Try again whenever ready.",
                                variant: "default"
                            });
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    setIsSubmitting(false);
                    setBookingError("Payment failed. Please try again.");
                });
                rzp.open();

            } catch (err: any) {
                console.error("Booking Error:", err);
                setBookingError(err.message || "An error occurred during booking.");
                setIsSubmitting(false);
            }
            return;
        }

        if (photoStep < 6) setPhotoStep(photoStep + 1);
    };

    if (loadingTemple) {
        return (
            <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#7c4624] animate-spin" />
            </div>
        );
    }

    if (!temple) {
        return (
            <div className="min-h-screen bg-[#faf8f6] flex flex-col items-center justify-center p-4">
                <p className="text-[#3c2a21] font-bold">Temple not found.</p>
                <Button onClick={() => router.push("/temples")} className="mt-4 bg-[#7c4624]">Back to Temples</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf8f6] text-[#3c2a21] flex flex-col justify-between">
            <Navbar />

            <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
                {/* Back button & Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => photoStep > 1 && photoStep < 6 ? setPhotoStep(photoStep - 1) : router.back()} className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-[#7c4624]" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-[#5c3a21]">Photography Pass Booking</h1>
                        <p className="text-xs text-muted-foreground">{getLocalized(temple, "name", language)}</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 mb-6 flex items-center justify-between overflow-x-auto">
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${photoStep >= s ? "bg-[#7c4624] text-white" : "bg-gray-100 text-gray-400"}`}>
                                {s}
                            </div>
                            {s < 6 && <div className={`w-6 md:w-10 h-0.5 mx-1 ${photoStep > s ? "bg-[#7c4624]" : "bg-gray-200"}`} />}
                        </div>
                    ))}
                    <span className="text-xs font-bold text-[#7c4624] uppercase ml-2">Step {photoStep}/6</span>
                </div>

                {/* Card container */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-orange-100">

                    {/* Step 1: Select Package */}
                    {photoStep === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Step 1: Select Package</h2>
                            {photoPackages.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-400">No photography packages configured for this temple.</div>
                            ) : (
                                photoPackages.map((opt) => (
                                    <div
                                        key={opt.id}
                                        onClick={() => setSelectedPackage(opt)}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${selectedPackage?.id === opt.id ? "bg-orange-50/60 border-[#7c4624] shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50"}`}
                                    >
                                        <div className="space-y-1">
                                            <p className="font-serif font-bold text-base text-[#5c3a21]">{getLocalized(opt, 'name', language)}</p>
                                            <p className="text-xs text-muted-foreground">{getLocalized(opt, 'description', language) || 'Photography Seva Pass'}</p>
                                        </div>
                                        <span className="font-serif font-black text-lg text-[#7c4624]">₹{opt.price}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Step 2: Date & Slot */}
                    {photoStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Step 2: Choose Date & Time Slot</h2>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Select Date</label>
                                <input
                                    type="date"
                                    value={selectedPhotoDate}
                                    onChange={(e) => setSelectedPhotoDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="w-full p-4 rounded-2xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#7c4624]"
                                />
                            </div>

                            {selectedPhotoDate && (
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700">Select Time Slot</label>
                                    {loadingSlots ? (
                                        <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-[#7c4624]" /> Loading slots...
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-4 text-xs text-gray-400">No slots available for this date.</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    type="button"
                                                    disabled={!slot.available}
                                                    onClick={() => setSelectedPhotoSlot(slot)}
                                                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed ${selectedPhotoSlot?.id === slot.id ? "bg-[#7c4624] text-white border-transparent shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50 text-[#3c2a21]"}`}
                                                >
                                                    {formatSlotTime(slot.slotName)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Select Area */}
                    {photoStep === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Step 3: Select Allowed Area</h2>
                            {allowedAreas.length === 0 ? (
                                <div className="text-center py-6 text-sm text-gray-400">General photography areas permitted.</div>
                            ) : (
                                <div className="flex flex-wrap gap-2.5">
                                    {allowedAreas.map((area, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedPhotoArea(area)}
                                            className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${selectedPhotoArea === area ? "bg-[#7c4624] text-white border-transparent shadow-sm" : "bg-white border-gray-200 text-slate-700 hover:bg-gray-50"}`}
                                        >
                                            {area}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Rules & Guidelines */}
                    {photoStep === 4 && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Step 4: Photography Guidelines</h2>
                            <div className="bg-orange-50/50 p-5 rounded-2xl space-y-3 text-xs text-[#5c3a21] leading-relaxed border border-orange-100">
                                {getLocalizedArray(temple, 'photographyRules', language).length > 0 ? (
                                    <ul className="list-disc pl-4 space-y-2">
                                        {getLocalizedArray(temple, 'photographyRules', language).map((rule, idx) => (
                                            <li key={idx}>{rule}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <>
                                        <div className="flex gap-2"><Camera className="h-4 w-4 text-[#7c4624] shrink-0 mt-0.5" /><span>Photography allowed only in designated campus areas.</span></div>
                                        <div className="flex gap-2"><Info className="h-4 w-4 text-[#7c4624] shrink-0 mt-0.5" /><span>No tripods or flash photography inside the sanctum.</span></div>
                                        <div className="flex gap-2"><FileText className="h-4 w-4 text-[#7c4624] shrink-0 mt-0.5" /><span>Pass is valid only for the selected slot and date.</span></div>
                                    </>
                                )}
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer p-1">
                                <input type="checkbox" checked={agreedToRules} onChange={(e) => setAgreedToRules(e.target.checked)} className="h-5 w-5 rounded accent-[#7c4624]" />
                                <span className="text-xs font-bold text-[#3c2a21]">I agree to follow temple photography guidelines</span>
                            </label>
                        </div>
                    )}

                    {/* Step 5: Payment Summary */}
                    {photoStep === 5 && (
                        <div className="space-y-5">
                            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Step 5: Booking Summary & Payment</h2>

                            <div className="bg-orange-50/40 p-5 rounded-2xl border border-orange-100 space-y-3 text-xs">
                                <div className="flex justify-between py-1 border-b border-orange-100">
                                    <span className="font-bold">Package:</span>
                                    <span className="text-slate-700">{getLocalized(selectedPackage, 'name', language)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-orange-100">
                                    <span className="font-bold">Date & Slot:</span>
                                    <span className="text-slate-700">{selectedPhotoDate} ({selectedPhotoSlot?.slotName ? formatSlotTime(selectedPhotoSlot.slotName) : ''})</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-orange-100">
                                    <span className="font-bold">Permitted Area:</span>
                                    <span className="text-slate-700">{selectedPhotoArea || 'General Campus'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-orange-100">
                                    <span className="font-bold">Package Price:</span>
                                    <span className="text-slate-700">₹{selectedPackage?.price}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-orange-100">
                                    <span className="font-bold">Platform Fee:</span>
                                    <span className="text-slate-700">₹25</span>
                                </div>
                                <div className="flex justify-between py-2 text-sm font-black text-[#7c4624]">
                                    <span>Total Payable:</span>
                                    <span>₹{(selectedPackage?.price || 0) + 25}</span>
                                </div>
                            </div>

                            {bookingError && (
                                <div className="p-3 text-xs bg-red-50 text-red-600 rounded-xl text-center font-semibold">{bookingError}</div>
                            )}
                        </div>
                    )}

                    {/* Step 6: Confirmation Screen */}
                    {photoStep === 6 && bookingDetails && (
                        <div className="text-center py-4 space-y-5">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="h-10 w-10" />
                            </div>

                            <div>
                                <h2 className="font-serif font-bold text-2xl text-[#5c3a21]">🎉 Pass Confirmed!</h2>
                                <p className="text-xs text-muted-foreground mt-1">Your photography pass is generated. Show QR at temple entry.</p>
                            </div>

                            {/* Scannable Pass Card */}
                            <div className="bg-white p-5 rounded-2xl border-2 border-[#7c4624] shadow-md max-w-sm mx-auto space-y-3">
                                <div className="bg-gradient-to-r from-[#7c4624] to-[#5c3a21] text-white p-3 rounded-xl">
                                    <p className="text-[10px] uppercase font-semibold tracking-widest opacity-80">Photography Pass</p>
                                    <p className="text-xl font-mono font-black">{bookingDetails.displayId}</p>
                                </div>

                                <div className="bg-[#f8f4f1] p-4 rounded-xl flex justify-center border border-orange-100">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="Live QR Pass" className="h-44 w-44 object-contain" />
                                    ) : (
                                        <div className="h-44 w-44 bg-white border border-[#7c4624] rounded-xl flex items-center justify-center">
                                            <Camera className="h-8 w-8 text-[#7c4624]" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-left text-xs space-y-1 bg-orange-50/60 p-3 rounded-xl border border-orange-100">
                                    <p><span className="font-bold text-[#5c3a21]">Service:</span> Pooja & Photography Service</p>
                                    <p><span className="font-bold text-[#5c3a21]">Devotee Name:</span> {bookingDetails.devoteeName || "Devotee"}</p>
                                    <p><span className="font-bold text-[#5c3a21]">Package:</span> {bookingDetails.packageName}</p>
                                    <p><span className="font-bold text-[#5c3a21]">Date:</span> {bookingDetails.bookingDate}</p>
                                    <p><span className="font-bold text-[#5c3a21]">Slot:</span> {formatSlotTime(bookingDetails.timeSlot)}</p>
                                    <p><span className="font-bold text-[#5c3a21]">Area:</span> {selectedPhotoArea}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2.5 max-w-sm mx-auto pt-2">
                                <Button
                                    onClick={() => {
                                        const token = localStorage.getItem("token");
                                        if (token && bookingDetails.bookingId) {
                                            toast({ title: "Downloading...", description: "Preparing receipt PDF." });
                                            fetch(`${BASE_URL}/api/bookings/${bookingDetails.bookingId}/receipt`, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            })
                                            .then(res => res.blob())
                                            .then(blob => {
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `Photography-Pass-${bookingDetails.displayId}.pdf`;
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                window.URL.revokeObjectURL(url);
                                                toast({ title: "Receipt Downloaded", description: "Your pass has been downloaded." });
                                            })
                                            .catch(err => {
                                                console.error(err);
                                                toast({ title: "Download Failed", description: "Failed to download receipt.", variant: "destructive" });
                                            });
                                        }
                                    }}
                                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Pass PDF
                                </Button>

                                <Button
                                    onClick={() => router.push('/profile/bookings')}
                                    className="w-full h-11 bg-[#7c4624] hover:bg-[#5c3a21] text-white font-bold text-xs rounded-xl"
                                >
                                    View in Profile
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step Navigation Button */}
                    {photoStep < 6 && (
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                            <Button
                                onClick={handlePhotoSubmit}
                                disabled={isSubmitting || (photoStep === 4 && !agreedToRules)}
                                className="h-12 px-8 bg-[#7c4624] hover:bg-[#5c3a21] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {photoStep === 5 ? "Pay Now" : "Continue"}
                            </Button>
                        </div>
                    )}

                </div>
            </div>

            <Footer />
        </div>
    );
}
