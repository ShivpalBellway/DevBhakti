"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";
import {
  Home,
  Building2,
  ImagePlus,
  X,
  CheckCircle2,
  Info,
  ArrowLeft,
  Trophy,
  ShieldCheck,
  Lock,
  UserCheck,
  Sparkles,
  Share2,
  Loader2,
} from "lucide-react";

type ParticipantType = "home" | "mandal";

interface UserProfile {
  id?: string;
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
}

import { useRouter } from "next/navigation";

export default function MazaGaneshaFormClient({
  slug = "maza-ganesha",
  isThankYouPage = false,
}: {
  slug?: string;
  isThankYouPage?: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Form states
  const [participantType, setParticipantType] = useState<ParticipantType>("home");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmittedEntry, setAlreadySubmittedEntry] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Form field states
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [campaignInfo, setCampaignInfo] = useState<any | null>(null);

  // Check auth and existing submission on load
  useEffect(() => {
    // Fetch campaign title for header
    axios.get(`${API_URL}/campaigns/info/${slug}`).then(res => {
      if (res.data.success && res.data.data) {
        setCampaignInfo(res.data.data);
      }
    }).catch(() => {});

    const savedUserStr = localStorage.getItem("user");
    const token = localStorage.getItem("token") || localStorage.getItem("user_token");

    if (savedUserStr || token) {
      try {
        const parsed = savedUserStr ? JSON.parse(savedUserStr) : { name: "Devotee" };
        setUser(parsed);
        setIsLoggedIn(true);

        if (parsed.name) setName(parsed.name);
        if (parsed.city) setCity(parsed.city);
        if (parsed.address) setAddress(parsed.address);

        // Fetch existing entry from API
        axios
          .get(`${API_URL}/campaigns/my-entry`, {
            params: { phone: parsed.phone, userId: parsed.id, slug },
          })
          .then((res) => {
            if (res.data.success && res.data.data) {
              setAlreadySubmittedEntry(res.data.data);
              if (!isThankYouPage) {
                router.replace(`/campaigns/${slug}/thank-you`);
              }
            } else if (isThankYouPage) {
              router.replace(`/campaigns/${slug}/participate`);
            }
          })
          .catch(() => {
            if (isThankYouPage) {
              router.replace(`/campaigns/${slug}/participate`);
            }
          });
      } catch (e) {
        setIsLoggedIn(false);
        router.push(`/campaigns/${slug}/auth?redirect=/campaigns/${slug}/participate`);
      }
    } else {
      setIsLoggedIn(false);
      router.push(`/campaigns/${slug}/auth?redirect=/campaigns/${slug}/participate`);
    }
    setCheckingAuth(false);
  }, [slug, router, isThankYouPage]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => (prev.length < 3 ? [...prev, ev.target?.result as string] : prev));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        campaignSlug: slug,
        participantType,
        name,
        city,
        address,
        images,
        caption,
        userPhone: user.phone,
        userId: user.id,
      };

      const res = await axios.post(`${API_URL}/campaigns/entries`, payload);

      if (res.data.success) {
        const createdData = res.data.data;
        const userKey = user.id || user.phone || "user_default";
        localStorage.setItem(`maza_ganesha_entry_${userKey}`, JSON.stringify(createdData));
        setAlreadySubmittedEntry(createdData);
        router.push(`/campaigns/${slug}/thank-you`);
      } else {
        setSubmitError(res.data.message || "Failed to submit entry.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError(err.response?.data?.message || "Error submitting entry to server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="pt-32 pb-20 text-center text-[#88542B]">
        <p className="font-bold text-base">Loading Contest Form...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 xl:pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Back Link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link
            href={`/campaigns/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#88542B] hover:text-[#CA9E52] bg-white px-4 py-2 rounded-full border border-orange-200/60 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {campaignInfo?.title || "Contest"}
          </Link>
        </motion.div>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#CA9E52]/20 border border-[#CA9E52]/50 rounded-full px-4 py-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-[#88542B]" />
            <span className="text-[#88542B] text-xs font-bold uppercase tracking-widest">
              {campaignInfo?.title ? `${campaignInfo.title} Entry` : "Contest Entry"}
            </span>
          </div>
          <h1 className="text-3xl xl:text-5xl font-black text-[#3d1a10] mb-3">
            {campaignInfo?.name || campaignInfo?.title ? `Join ${campaignInfo.name || campaignInfo.title}` : "Tell Us About Your Ganpati"}
          </h1>
          <p className="text-[#88542B]/75 text-base">
            {campaignInfo?.description || "Share your home or Mandal Ganesha photo with millions of devotees across India."}
          </p>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            SCENARIO 1: NOT LOGGED IN -> Show Login Guard
        ══════════════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════
            SCENARIO 1: NOT LOGGED IN -> Redirecting handled in useEffect
        ══════════════════════════════════════════════════════════════ */}
        {!isLoggedIn && (
           <div className="pt-20 text-center text-[#88542B]">
             <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
             <p className="font-bold">Redirecting to Login...</p>
           </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SCENARIO 2: LOGGED IN & ALREADY SUBMITTED -> Show Existing Entry
        ══════════════════════════════════════════════════════════════ */}
        {isLoggedIn && alreadySubmittedEntry && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-8 xl:p-10 shadow-xl border border-orange-100 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              Entry Saved in Database (1 Per Person)
            </div>

            <h2 className="text-2xl xl:text-3xl font-black text-[#3d1a10] mb-2">
              Your Entry is Live in {campaignInfo?.title || "our gallery"}! 🙏
            </h2>
            <p className="text-[#88542B]/75 text-sm mb-6 leading-relaxed">
              Your details &amp; photos are saved in the DevBhakti database and displayed in the public contest gallery.
            </p>

            {/* Submitted Entry Card Preview */}
            <div className="bg-[#fdf8f0] rounded-2xl p-5 border border-orange-200/80 text-left mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#88542B]">
                  {alreadySubmittedEntry.participantType === "mandal" ? "Mandal Entry" : "Home Ganpati Entry"}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(alreadySubmittedEntry.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-base text-[#3d1a10]">
                {alreadySubmittedEntry.name} — {alreadySubmittedEntry.city}
              </h3>
              {alreadySubmittedEntry.caption && (
                <p className="text-xs text-slate-600 italic">
                  {alreadySubmittedEntry.caption}
                </p>
              )}
              {alreadySubmittedEntry.images && alreadySubmittedEntry.images.length > 0 && (
                <div className="flex gap-2 pt-2">
                  {alreadySubmittedEntry.images.map((imgSrc: string, i: number) => (
                    <img key={i} src={imgSrc} alt="" className="w-16 h-16 rounded-xl object-cover border border-orange-200" />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/campaigns/${slug}`}
                className="flex-1 bg-[#88542B] hover:bg-[#CA9E52] text-white font-bold py-3.5 px-6 rounded-2xl transition-all text-center text-sm"
              >
                View in Public Gallery
              </Link>
              <button
                onClick={async () => {
                  const targetUrl = window.location.origin + `/campaigns/${slug}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `${campaignInfo?.title || "Contest"} Entry`,
                        text: `Check out ${alreadySubmittedEntry.name}'s entry on DevBhakti!`,
                        url: targetUrl,
                      });
                    } catch (err) {}
                  } else {
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(targetUrl);
                      alert("Entry link copied to clipboard!");
                    } else {
                      alert(`Please share this link manually: ${targetUrl}`);
                    }
                  }
                }}
                className="flex-1 bg-orange-50 hover:bg-orange-100 text-[#88542B] font-bold py-3.5 px-6 rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share My Entry Link
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SCENARIO 3: LOGGED IN & NO PREVIOUS ENTRY -> Show Participation Form
        ══════════════════════════════════════════════════════════════ */}
        {isLoggedIn && !alreadySubmittedEntry && (
          <div className="max-w-2xl mx-auto">
            {/* Main Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 xl:p-10 shadow-lg border border-orange-100/80"
            >
              {/* Logged in User Bar */}
              <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Logged in DevBhakti Devotee
                    </p>
                    <p className="text-sm font-black text-[#3d1a10] truncate">
                      {user?.name || "DevBhakti User"} ({user?.phone})
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-200/60 text-emerald-900 font-bold px-2.5 py-1 rounded-full shrink-0">
                  1 Entry Allowed
                </span>
              </div>

              {submitError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Participant Type */}
                <div>
                  <label className="block text-sm font-bold text-[#3d1a10] mb-2">
                    Participant Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: "home", label: "Home Ganpati", icon: Home, desc: "Family Ganpati at home" },
                      { key: "mandal", label: "Ganpati Mandal", icon: Building2, desc: "Public/Community Mandal" },
                    ] as const).map(({ key, label, icon: Icon, desc }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setParticipantType(key)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                          participantType === key
                            ? "border-[#88542B] bg-[#88542B]/5 shadow-sm"
                            : "border-slate-200 hover:border-[#CA9E52]/60 bg-white"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            participantType === key ? "bg-[#88542B] text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p
                            className={`font-bold text-sm ${
                              participantType === key ? "text-[#88542B]" : "text-slate-700"
                            }`}
                          >
                            {label}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Family / Mandal Name */}
                <div>
                  <label className="block text-sm font-bold text-[#3d1a10] mb-1.5">
                    {participantType === "mandal" ? "Mandal Name" : "Family Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      participantType === "mandal"
                        ? "e.g. Shri Siddhivinayak Mandal"
                        : "e.g. Pednekar Family"
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#88542B] focus:ring-2 focus:ring-[#88542B]/10 transition-all"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-bold text-[#3d1a10] mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#88542B] focus:ring-2 focus:ring-[#88542B]/10 transition-all"
                  />
                </div>

                {/* Full Address */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-[#3d1a10]">
                      Full Address <span className="text-red-500">*</span>
                    </label>
                    <span className="flex items-center gap-1 text-[10px] text-[#88542B] font-semibold bg-[#88542B]/8 px-2.5 py-0.5 rounded-full">
                      <Info className="w-3 h-3" /> Pre-filled from profile
                    </span>
                  </div>
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="e.g. Flat No. 4B, Sunrise Apartment, MG Road"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#88542B] focus:ring-2 focus:ring-[#88542B]/10 transition-all resize-none"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-[#3d1a10]">
                      Upload Ganesha Photo(s) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400 font-medium">{images.length}/3 photos</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {images.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-orange-200 shadow-sm">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-[#CA9E52]/60 hover:border-[#88542B] bg-[#fdf8f0] hover:bg-[#88542B]/5 flex flex-col items-center justify-center gap-2 transition-all group"
                      >
                        <ImagePlus className="w-8 h-8 text-[#CA9E52] group-hover:text-[#88542B] transition-colors" />
                        <span className="text-xs font-bold text-[#88542B]/70 group-hover:text-[#88542B]">
                          Add Photo
                        </span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Upload up to 3 high-resolution images of your Ganesha idol or Mandal decoration.
                  </p>
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-bold text-[#3d1a10] mb-1.5">
                    Caption / Devotional Story{" "}
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    maxLength={200}
                    placeholder="Tell us something special about your Ganesha worship..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#88542B] focus:ring-2 focus:ring-[#88542B]/10 transition-all resize-none"
                  />
                  <p className="text-right text-xs text-slate-400 mt-1">{caption.length}/200</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#88542B] to-[#CA9E52] hover:from-[#3d1a10] hover:to-[#88542B] text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-900/20 hover:shadow-xl transition-all duration-300 text-base tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving Entry...
                    </>
                  ) : (
                    "Submit My Entry 🙏"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
