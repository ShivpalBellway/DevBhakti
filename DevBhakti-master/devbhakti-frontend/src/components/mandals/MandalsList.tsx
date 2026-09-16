"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MapPin,
  Star,
  Heart,
  Calendar,
  Filter,
  X,
  ChevronsUpDown,
  Check,
  Building2,
  ArrowRight,
  Sliders,
  Share2,
  Users,
  Sparkles,
  BadgeCheck,
  Compass,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { API_URL } from "@/config/apiConfig";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { stripHtml, parseLocalizedValue } from "@/utils/textUtils";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { fetchMandalRegistrationStatus } from "@/api/publicController";

type MandalNewsItem = {
  id: string;
  title: string;
  description?: string;
  publishedAt?: string;
  createdAt?: string;
};

export function MandalsList() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");
  const [mandals, setMandals] = useState<any[]>([]);
  const [allMandals, setAllMandals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { language, t } = useLanguage();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mandalSettings, setMandalSettings] = useState<any>(null);
  const [mandalNews, setMandalNews] = useState<MandalNewsItem[]>([]);
  const featuredScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollFeatured = (direction: "left" | "right") => {
    if (featuredScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      featuredScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user, favorites, and Admin Mandal Registration settings
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        loadFavorites();
      }
    } catch (e) {
      console.error("Error reading local user storage", e);
    }
    fetchInitialOptions();
    loadMandalSettings();
    loadMandalNews();
  }, [language]);

  const loadMandalSettings = async () => {
    try {
      const res = await fetchMandalRegistrationStatus();
      if (res && res.success) {
        setMandalSettings(res.settings || res);
      }
    } catch (error) {
      console.error("Error fetching mandal registration settings:", error);
    }
  };

  const fetchInitialOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/mandals?all=true&lang=${language}`);
      const data = await response.json();
      if (data && data.success) {
        setAllMandals(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching mandals:", error);
    }
  };

  const loadMandalNews = async () => {
    try {
      const response = await fetch(`${API_URL}/mandal-news`);
      const data = await response.json();
      if (data?.success) {
        setMandalNews((data.data || []).slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching mandal news:", error);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await fetchUserFavorites();
      if (res && res.success) {
        setFavorites(res.data || []);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load mandals with filters
  useEffect(() => {
    loadMandals();
  }, [searchQuery, selectedCategory, selectedLocation, selectedArea, userCoords, language]);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setIsLocating(false);
        toast({
          title: "📍 Location Detected!",
          description: "Showing mandals nearest to your current location.",
          className: "bg-emerald-50 text-emerald-900 border border-emerald-200",
        });
      },
      (error) => {
        setIsLocating(false);
        console.warn("Geolocation error:", error);
        toast({
          title: "Location Access Denied",
          description: "Please allow location permission in your browser or select your city from the dropdown.",
          variant: "destructive",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const loadMandals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedLocation !== "All") params.append("location", selectedLocation);
      if (selectedArea !== "All") params.append("area", selectedArea);
      if (userCoords) {
        params.append("lat", userCoords.lat.toString());
        params.append("lng", userCoords.lng.toString());
      }
      params.append("lang", language);
      params.append("all", "true");

      const response = await fetch(`${API_URL}/mandals?${params.toString()}`);
      const data = await response.json();
      if (data && data.success) {
        setMandals(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching mandals:", error);
      toast({
        title: "Error",
        description: "Failed to load mandals",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_URL.replace("/api", "")}${path}`;
  };

  const toggleFavorite = async (e: React.MouseEvent, mandalId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to login to add favorites.",
        variant: "destructive",
      });
      return;
    }

    const isFav = favorites.some((f) => f && f.mandalId === mandalId);
    try {
      if (isFav) {
        await removeFavorite({ mandalId });
        setFavorites(favorites.filter((f) => f && f.mandalId !== mandalId));
        toast({
          title: "Removed from Favorites",
          description: "Mandal removed from your favorites.",
        });
      } else {
        await addFavorite({ mandalId });
        setFavorites([...favorites, { mandalId }]);
        toast({
          title: "❤️ Added to Favorites",
          description: "Mandal added to your favorites!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  // Get unique categories, locations, and areas from mandals
  const categories = ["All", ...new Set(allMandals.map((m) => m?.mandalType).filter(Boolean))];
  const locations = ["All", ...new Set(allMandals.map((m) => m?.city).filter(Boolean))];
  const areas = ["All", ...new Set(allMandals.map((m) => m?.address || m?.area).filter(Boolean))];

  const isDummyText = (text?: string | null) => {
    if (!text || !text.trim()) return true;
    const lower = text.trim().toLowerCase();
    return (
      /^ganesh utsav \d*$/i.test(lower) ||
      /^ganesh utsav registration$/i.test(lower) ||
      lower === "test" ||
      lower === "registration" ||
      lower.includes("browse mandal") ||
      lower.includes("browse sacred mandals") ||
      lower.includes("explore and support devotional mandals") ||
      lower.includes("maharashtra & beyond") ||
      lower.includes("thousands of mandals")
    );
  };

  // Dynamically extract popular searches keywords from actual mandal data
  const dynamicPopularSearches = Array.from(
    new Set(
      allMandals
        .flatMap((m) => [m?.area, m?.city, m?.mandalType, m?.presiding_deity])
        .filter(Boolean)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !isDummyText(s))
    )
  ).slice(0, 6);

  const popularSearches = dynamicPopularSearches;

  // Fuzzy search suggestions
  const getFuzzySuggestions = (query: string) => {
    if (!query || query.length < 2) return [];
    const matches: any[] = [];
    allMandals.forEach((mandal) => {
      const name = getLocalized(mandal, "name", language) || "";
      if (name.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          title: name,
          type: mandal.mandalType,
          city: mandal.city,
        });
      }
    });
    return matches.slice(0, 5);
  };

  useEffect(() => {
    if (searchInput.trim() && isSearchFocused) {
      setSuggestions(getFuzzySuggestions(searchInput));
    } else {
      setSuggestions([]);
    }
  }, [searchInput, isSearchFocused, allMandals]);

  // Helpers for Admin Settings parsing
  const activeFestival = mandalSettings?.activeFestival || mandalSettings; // Fallback to settings directly if legacy format

  const activeFestivalName =
    typeof activeFestival?.name === "string" ? activeFestival.name.trim() : "";

  const getLocalizedSettingText = (field: "title" | "subtitle") => {
    if (!activeFestival?.[field]) return null;
    const val = activeFestival[field];
    let res: string | null = null;
    if (typeof val === "string") {
      res = val.trim() || null;
    } else if (typeof val === "object" && val !== null) {
      const text = val[language] || val["en"] || val["hi"] || val["mr"] || null;
      res = typeof text === "string" ? text.trim() || null : null;
    }
    return res;
  };

  const settingTitle = getLocalizedSettingText("title");
  const settingSubtitle = getLocalizedSettingText("subtitle");

  const heroTitle =
    settingTitle ||
    (activeFestivalName && !isDummyText(activeFestivalName) ? activeFestivalName : null) ||
    (mounted && t("mandal_list.title") && !isDummyText(t("mandal_list.title")) ? t("mandal_list.title") : null);

  const heroSubtitle =
    settingSubtitle ||
    (mounted && t("mandal_list.subtitle") && !isDummyText(t("mandal_list.subtitle")) ? t("mandal_list.subtitle") : null);

  // Date range formatting
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatNewsDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  let festivalDateDisplay = "";
  if (activeFestival?.startDate && activeFestival?.endDate) {
    const sFormatted = formatDateStr(activeFestival.startDate);
    const eFormatted = formatDateStr(activeFestival.endDate);
    const endYear = activeFestival.endDate.split("-")[0] || "";
    festivalDateDisplay = `${sFormatted} - ${eFormatted} ${endYear}`.trim();
  } else if (activeFestival?.startDate) {
    festivalDateDisplay = formatDateStr(activeFestival.startDate);
  }

  const mainFestivalDay = activeFestival?.startDate
    ? `${activeFestivalName ? activeFestivalName + ", " : ""}${formatDateStr(activeFestival.startDate)}`
    : activeFestivalName || "";

  const adminBannerImage = activeFestival?.image
    ? getFullImageUrl(activeFestival.image)
    : "";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 flex flex-col justify-between">
      {/* Solid Navbar matching screenshot style */}
      <Navbar isSolid={true} />

      {/* ─── HERO BANNER SECTION (MATCHING BRAND THEME COLOR) ──────────────── */}
      <section className="relative bg-gradient-to-r from-[#7c4624] via-[#69391b] to-[#5c3a21] text-white pt-32 pb-24 lg:pt-36 lg:pb-28 border-b border-amber-900/30 overflow-hidden min-h-[560px] lg:min-h-[620px] flex flex-col justify-center">
        {/* Ambient Glow & Subtle Pattern Grid Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(#7c4624_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-amber-700/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-orange-800/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
            
            {/* CONTENT (lg:col-span-7) */}
            <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center space-y-6">
              {/* Top Divine Mantra */}
              <div className="inline-flex items-center gap-2 text-amber-300 font-serif text-sm sm:text-base tracking-wider font-semibold drop-shadow-sm">
                <span>
                  || {activeFestivalName ? (activeFestivalName.toLowerCase().includes("जय") || activeFestivalName.toLowerCase().includes("गणपती") ? activeFestivalName : `जय ${activeFestivalName}`) : "गणपती बाप्पा मोरया"} ||
                </span>
              </div>

              {/* Dynamic Title */}
              {heroTitle ? (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
                  {heroTitle}
                </h1>
              ) : null}

              {/* Dynamic Subtitle */}
              {heroSubtitle ? (
                <p className="text-base sm:text-lg text-amber-100/90 font-light leading-relaxed max-w-2xl">
                  {heroSubtitle}
                </p>
              ) : null}

              {/* Dynamic Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 1. Festival Dates */}
                {festivalDateDisplay ? (
                  <div className="flex items-center gap-3.5 bg-black/30 backdrop-blur-md border border-[#DEB887]/50 p-3.5 rounded-2xl min-w-0 shadow-md shadow-black/20">
                    <div className="p-2.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-amber-300 shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-amber-300/90 leading-tight">
                        {t("mandal_list.festival_dates")}
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-white leading-tight mt-0.5 break-words">
                        {festivalDateDisplay}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 2. Location Info */}
                {locations.filter((l) => l !== "All").length > 0 ? (
                  <div className="flex items-center gap-3.5 bg-black/30 backdrop-blur-md border border-[#DEB887]/50 p-3.5 rounded-2xl min-w-0 shadow-md shadow-black/20">
                    <div className="p-2.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-amber-300 shrink-0">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-amber-300/90 leading-tight">
                        {t("mandal_list.celebrated_across")}
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-white leading-tight mt-0.5 break-words truncate">
                        {locations.filter((l) => l !== "All").slice(0, 3).join(", ")}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 3. Mandal Info */}
                {allMandals.length > 0 ? (
                  <div className="flex items-center gap-3.5 bg-black/30 backdrop-blur-md border border-[#DEB887]/50 p-3.5 rounded-2xl min-w-0 shadow-md shadow-black/20">
                    <div className="p-2.5 bg-amber-500/15 border border-amber-400/40 rounded-xl text-amber-300 shrink-0">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-amber-300/90 leading-tight">
                        {allMandals.length} {t("mandal_list.mandals")}
                      </div>
                      <div className="text-[11px] sm:text-xs font-bold text-white leading-tight mt-0.5 break-words">
                        {t("mandal_list.one_divine_celebration")}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <Button
                  onClick={() => {
                    const el = document.getElementById("mandals-search-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-[#FFE8CF] hover:bg-[#FCD8B0] text-[#80380B] font-bold px-8 h-12 rounded-full text-base shadow-lg shadow-black/15 border border-[#DEB887] flex items-center gap-2.5 group transition-all hover:scale-[1.02] active:scale-95"
                >
                  {t("mandal_list.explore_mandals")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#D97706]" />
                </Button>
              </div>
            </div>

            {/* HERO IMAGE CARD */}
            {adminBannerImage ? (
              <div className="order-1 lg:order-2 lg:col-span-5 relative w-full aspect-[4/3] max-w-[540px] lg:max-w-none mx-auto rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 group bg-zinc-900">
                <img
                  src={adminBannerImage}
                  alt={heroTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      const fallbackDiv = parent.querySelector(".banner-fallback-bg");
                      if (fallbackDiv) (fallbackDiv as HTMLElement).style.display = "flex";
                    }
                  }}
                />
                <div className="banner-fallback-bg hidden absolute inset-0 bg-gradient-to-br from-[#3e2413] via-[#5c3a21] to-[#251308] flex-col items-center justify-center p-6 text-center text-amber-100">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  {activeFestivalName && (
                    <Badge className="bg-[#7c4624] text-amber-100 font-bold text-xs mb-2 border border-amber-500/30">
                      {activeFestivalName}
                    </Badge>
                  )}
                  <div className="text-base font-serif font-bold text-white drop-shadow">{heroTitle}</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                  {activeFestivalName && (
                    <Badge className="bg-[#7c4624] text-amber-100 font-bold text-xs mb-1.5 border border-amber-500/30">
                      {activeFestivalName}
                    </Badge>
                  )}
                  <div className="text-sm font-semibold truncate text-white drop-shadow">{heroTitle}</div>
                </div>
              </div>
            ) : (
              <div className="order-1 lg:order-2 lg:col-span-5 relative w-full aspect-[4/3] max-w-[540px] lg:max-w-none mx-auto rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 bg-gradient-to-br from-[#3e2413] via-[#5c3a21] to-[#251308] flex flex-col items-center justify-center p-6 text-center text-amber-100">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                {activeFestivalName && (
                  <Badge className="bg-[#7c4624] text-amber-100 font-bold text-xs mb-2 border border-amber-500/30">
                    {activeFestivalName}
                  </Badge>
                )}
                <div className="text-lg font-serif font-bold text-white drop-shadow max-w-xs">{heroTitle}</div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ─── FLOATING SEARCH & FILTER BAR ─────────────────────────────────── */}
      <div id="mandals-search-section" className="container mx-auto px-4 -mt-10 md:-mt-14 relative z-30">
        <div className="bg-white dark:bg-card rounded-3xl p-5 md:p-7 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          {/* Main Controls Grid matching design screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (6 cols - Spacious Search Bar) */}
            <div className="lg:col-span-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder={t("mandal_list.search_placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchQuery(searchInput);
                    setIsSearchFocused(false);
                  }
                }}
                className="w-full pl-12 pr-4 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-zinc-800 dark:text-zinc-100"
              />

              {/* Suggestions Dropdown */}
              {isSearchFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-60 overflow-y-auto z-50">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 flex items-center gap-3 transition-colors text-sm"
                      onClick={() => {
                        setSearchInput(suggestion.title);
                        setSearchQuery(suggestion.title);
                        setIsSearchFocused(false);
                      }}
                    >
                      <Search className="w-4 h-4 text-primary/50" />
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {suggestion.title}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {suggestion.type && `${suggestion.type} • `}
                          {suggestion.city && suggestion.city}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown: Locations (3 cols) */}
            <div className="lg:col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-semibold px-3 rounded-xl"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {selectedLocation === "All" ? t("mandal_list.all_locations") : selectedLocation}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 text-zinc-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 rounded-xl">
                  <Command>
                    <CommandInput placeholder="Search location..." className="h-9 text-xs" />
                    <CommandList>
                      <CommandEmpty className="py-2 text-xs text-center text-zinc-500">
                        No location found
                      </CommandEmpty>
                      <CommandGroup>
                        {locations.map((loc) => (
                          <CommandItem
                            key={loc}
                            value={loc}
                            onSelect={() => setSelectedLocation(loc)}
                            className="py-2 text-xs cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5 text-primary",
                                selectedLocation === loc ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {loc === "All" ? t("mandal_list.all_locations") : loc}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Buttons: Near Me & Search (3 cols) */}
            <div className="lg:col-span-3 flex items-center gap-2">
              {/* <Button
                type="button"
                onClick={handleNearMe}
                disabled={isLocating}
                className={`h-12 flex-1 font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  userCoords
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                    : "bg-white dark:bg-zinc-900 hover:bg-amber-50 text-slate-700 dark:text-slate-200 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Compass className={`w-4 h-4 text-amber-600 ${isLocating ? "animate-spin" : ""}`} />
                <span className="text-xs sm:text-sm">
                  {isLocating ? t("mandal_list.locating") : userCoords ? t("mandal_list.near_me_active") : t("mandal_list.near_me")}
                </span>
              </Button> */}

              <Button
                onClick={() => {
                  setSearchQuery(searchInput);
                }}
                className="h-12 flex-1 bg-gradient-to-r from-[#7c4624] to-[#5c3a21] hover:from-[#5c3a21] hover:to-[#3e2413] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#7c4624]/20"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs sm:text-sm">{t("mandal_list.search")}</span>
              </Button>
            </div>
          </div>

          {/* Popular Searches Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-500 mr-1">{t("mandal_list.popular_searches")}</span>
            {popularSearches.map((term, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchInput(term);
                  setSearchQuery(term);
                }}
                className={`px-3 py-1 rounded-full border transition-all text-xs font-medium ${
                  searchInput === term
                    ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                    : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {term}
              </button>
            ))}
            {(selectedCategory !== "All" ||
              selectedLocation !== "All" ||
              selectedArea !== "All" ||
              userCoords !== null ||
              searchQuery !== "") && (
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedLocation("All");
                  setSelectedArea("All");
                  setUserCoords(null);
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="ml-auto text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                {t("mandal_list.reset_filters")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── FEATURED MANDALS SECTION ───────────────────────────────────────── */}
      <section className="py-12 container mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
              {t("mandal_list.featured_mandals")}
            </h2>
          </div>
        </div>

        {/* Mandals Horizontal Carousel (Matching Screenshot Cards & Scroll Buttons) */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-600 border-t-transparent" />
          </div>
        ) : mandals.length > 0 ? (
          <div className="relative group/carousel">
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={() => scrollFeatured("left")}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xl flex items-center justify-center hover:bg-amber-50 dark:hover:bg-zinc-700 hover:scale-110 active:scale-95 transition-all"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-6 h-6 text-zinc-700 dark:text-zinc-200" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={featuredScrollRef}
              className="flex overflow-x-auto gap-5 pb-4 pt-1 px-1 scroll-smooth no-scrollbar snap-x"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {mandals.map((mandal) => {
                if (!mandal) return null;
                const localizedName = getLocalized(mandal, "name", language) || (mandal.name ? parseLocalizedValue(mandal.name, language) : "Mandal");
                const isFav = favorites.some((f) => f && f.mandalId === mandal.id);
                const isVerifiedMandal = mandal.isActive === true && String(mandal.status || "").toUpperCase() === "APPROVED";

                return (
                  <div
                    key={mandal.id}
                    onClick={() => router.push(`/mandals/${mandal.slug || mandal.id}`)}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer w-[260px] sm:w-[280px] md:w-[300px] shrink-0 snap-start select-none"
                  >
                    {/* Standardized 4:3 Landscape Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                      {getFullImageUrl(mandal.image) ? (
                        <img
                          src={getFullImageUrl(mandal.image)}
                          alt={localizedName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              const fallbackDiv = parent.querySelector(".mandal-card-fallback-bg");
                              if (fallbackDiv) (fallbackDiv as HTMLElement).style.display = "flex";
                            }
                          }}
                        />
                      ) : null}

                      {/* Dynamic Emblem Header when no image or image load error */}
                      <div
                        className="mandal-card-fallback-bg absolute inset-0 bg-gradient-to-br from-[#5c2d13] via-[#7c4624] to-[#3a1b0b] flex flex-col items-center justify-center p-4 text-center text-amber-100"
                        style={{ display: getFullImageUrl(mandal.image) ? "none" : "flex" }}
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-2">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold font-serif line-clamp-2 drop-shadow text-amber-200">
                          {localizedName}
                        </span>
                      </div>

                      {/* LIVE badge */}
                      {mandal.isLive && (
                        <Badge className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          LIVE
                        </Badge>
                      )}

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(e, mandal.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/70 transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFav ? "fill-red-500 text-red-500" : "text-white"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#7c4624] transition-colors">
                            {localizedName}
                          </h3>
                          {isVerifiedMandal && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF4E6] dark:bg-[#2C1810] border border-[#DEB887]/30 shrink-0 mt-0.5">
                              <BadgeCheck className="w-3.5 h-3.5 text-[#D97706] fill-white dark:fill-[#2C1810]" />
                              <span className="text-[10px] font-bold text-[#92400E] dark:text-[#FCD34D] uppercase tracking-wider">
                                {t("mandal_list.verified")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">
                            {[mandal.city, mandal.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mandal.distanceKm !== undefined && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                            <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                            {mandal.distanceKm} {t("mandal_list.km_away")}
                          </span>
                        )}
                        {mandal.isLive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                            {t("mandal_list.live_darshan")}
                          </span>
                        )}
                        {mandal.presiding_deity && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                            {mandal.presiding_deity}
                          </span>
                        )}
                        {mandal.mandalType && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                            {mandal.mandalType}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetSlug = mandal.slug || mandal.id;
                            console.log("Navigating to mandal detail:", targetSlug);
                            router.push(`/mandals/${targetSlug}`);
                          }}
                          className="text-xs font-bold text-[#7c4624] dark:text-amber-400 hover:underline flex items-center gap-1 group/link"
                        >
                          {t("mandal_list.explore_mandal")}
                          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={() => scrollFeatured("right")}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xl flex items-center justify-center hover:bg-amber-50 dark:hover:bg-zinc-700 hover:scale-110 active:scale-95 transition-all"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-6 h-6 text-zinc-700 dark:text-zinc-200" />
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 p-8">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
              {t("mandal_list.no_mandals")}
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
              {t("mandal_list.try_adjusting")}
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedLocation("All");
                setSelectedArea("All");
                setSearchInput("");
                setSearchQuery("");
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2 rounded-xl"
            >
              {t("mandal_list.reset_filters")}
            </Button>
          </div>
        )}
      </section>

      {/* ─── EXPLORE BY LOCATION SECTION ───────────────────────────────────── */}
      <section className="pt-2 pb-4 container mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
              {t("mandal_list.explore_by_location")}
            </h3>
          </div>
          {/* <button
            type="button"
            onClick={() => {
              setSelectedLocation("All");
              const el = document.getElementById("mandals-search-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs md:text-sm font-bold text-[#6B0F1A] dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            View All Locations
            <ArrowRight className="w-4 h-4" />
          </button> */}
        </div>

        {/* Dynamic City Cards Grid derived from allMandals */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(() => {
            // Count mandals per city dynamically
            const cityCounts: Record<string, number> = {};
            allMandals.forEach((m) => {
              if (m && m.city) {
                const cName = m.city.trim();
                cityCounts[cName] = (cityCounts[cName] || 0) + 1;
              }
            });

            // Get top cities sorted by count descending
            const topCityEntries = Object.entries(cityCounts)
              .sort((a, b) => b[1] - a[1]);

            // Sacred Icons pool: Swastik (#2), Tilak (#7), Tripundra (#8), Damru (#6), Agni (#17), Sun (#24), Dhwaja (#25)
            const sacredIcons = [
              /* 2. Swastik */
              <svg key="swastik" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="50" y1="20" x2="50" y2="80" />
                <line x1="20" y1="50" x2="80" y2="50" />
                <line x1="50" y1="20" x2="75" y2="20" />
                <line x1="80" y1="50" x2="80" y2="75" />
                <line x1="50" y1="80" x2="25" y2="80" />
                <line x1="20" y1="50" x2="20" y2="25" />
                <circle cx="35" cy="35" r="2.5" fill="#9A532C" stroke="none" />
                <circle cx="65" cy="35" r="2.5" fill="#9A532C" stroke="none" />
                <circle cx="35" cy="65" r="2.5" fill="#9A532C" stroke="none" />
                <circle cx="65" cy="65" r="2.5" fill="#9A532C" stroke="none" />
              </svg>,
              /* 7. Tilak (Vaishnav) */
              <svg key="tilak" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 32 20 L 32 60 C 32 75 68 75 68 60 L 68 20" />
                <path d="M 50 25 L 50 78" strokeWidth="6" />
                <circle cx="50" cy="85" r="4" fill="#9A532C" />
              </svg>,
              /* 8. Tripundra (Shiva) */
              <svg key="tripundra" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="5" strokeLinecap="round">
                <line x1="20" y1="38" x2="80" y2="38" />
                <line x1="20" y1="50" x2="80" y2="50" />
                <line x1="20" y1="62" x2="80" y2="62" />
                <circle cx="50" cy="50" r="5" fill="#9A532C" stroke="none" />
              </svg>,
              /* 6. Damru */
              <svg key="damru" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 25 25 L 75 25 L 50 50 L 75 75 L 25 75 L 50 50 Z" fill="#9A532C" fillOpacity="0.1" />
                <ellipse cx="50" cy="25" rx="25" ry="6" />
                <ellipse cx="50" cy="75" rx="25" ry="6" />
                <line x1="50" y1="50" x2="20" y2="40" strokeWidth="3" />
                <line x1="50" y1="50" x2="80" y2="60" strokeWidth="3" />
                <circle cx="20" cy="40" r="3" fill="#9A532C" />
                <circle cx="80" cy="60" r="3" fill="#9A532C" />
              </svg>,


                    /* 19. Rudraksha Mala (exact reference image #19 match) */
              <svg key="rudraksha" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] fill-[#9A532C]" stroke="#9A532C" strokeWidth="2">
                <circle cx="50" cy="22" r="5" />
                <circle cx="64" cy="26" r="5" />
                <circle cx="74" cy="36" r="5" />
                <circle cx="78" cy="50" r="5" />
                <circle cx="74" cy="64" r="5" />
                <circle cx="64" cy="74" r="5" />
                <circle cx="50" cy="78" r="6" fillOpacity="0.8" />
                <circle cx="36" cy="74" r="5" />
                <circle cx="26" cy="64" r="5" />
                <circle cx="22" cy="50" r="5" />
                <circle cx="26" cy="36" r="5" />
                <circle cx="36" cy="26" r="5" />
                {/* Tassel / Bindu at bottom */}
                <path d="M 50 84 L 46 94 L 54 94 Z" />
              </svg>,



              /* 10. Lotus (exact reference image #10 match) */
              <svg key="lotus" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 50 20 C 35 40 40 70 50 75 C 60 70 65 40 50 20 Z" fill="#9A532C" fillOpacity="0.15" />
                <path d="M 50 35 C 30 45 20 65 30 75 C 45 75 48 65 50 55" />
                <path d="M 50 35 C 70 45 80 65 70 75 C 55 75 52 65 50 55" />
                <path d="M 50 50 C 20 55 10 72 20 78 C 35 80 45 75 50 65" />
                <path d="M 50 50 C 80 55 90 72 80 78 C 65 80 55 75 50 65" />
                <path d="M 30 82 C 45 86 55 86 70 82" strokeWidth="4" />
              </svg>,
             


                 <svg key="sun" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="4" strokeLinecap="round">
                <circle cx="50" cy="50" r="16" fill="#9A532C" fillOpacity="0.2" />
                <circle cx="50" cy="50" r="4" fill="#9A532C" stroke="none" />
                <path d="M 50 18 L 50 26 M 50 74 L 50 82 M 18 50 L 26 50 M 74 50 L 82 50 M 27 27 L 33 33 M 67 67 L 73 73 M 27 73 L 33 67 M 67 33 L 73 27" strokeWidth="4" />
                <path d="M 50 12 L 46 22 L 54 22 Z M 50 88 L 46 78 L 54 78 Z M 12 50 L 22 46 L 22 54 Z M 88 50 L 78 46 L 78 54 Z" fill="#9A532C" stroke="none" />
              </svg>,



              <svg key="agni" viewBox="0 0 100 100" className="w-16 h-16 text-[#9A532C] stroke-[#9A532C]" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="25" y="75" width="50" height="10" rx="2" fill="#9A532C" fillOpacity="0.2" />
                <path d="M 30 75 C 30 55 45 45 40 25 C 55 35 60 50 55 60 C 65 45 65 30 65 20 C 80 40 75 65 70 75 Z" fill="#9A532C" fillOpacity="0.15" />
                <path d="M 40 75 C 40 65 50 60 48 45 C 55 52 58 62 55 75 Z" fill="#9A532C" />
              </svg>,
              /* 24. Sun (Surya) */
              
           
            ];

            const top5 = topCityEntries.slice(0, 5).map(([name, count]) => ({ name, count }));

            if (top5.length === 0) {
              return (
                <div className="col-span-full py-8 text-center text-zinc-500 text-sm font-medium">
                  {t("mandal_list.no_locations_available") || "No locations available"}
                </div>
              );
            }

            const cardsList = [
              ...top5.map((item, idx) => ({
                name: item.name,
                count: item.count === 1 ? t("mandal_list.mandal_count_one", { count: item.count }) : t("mandal_list.mandal_count_many", { count: item.count }),
                icon: sacredIcons[idx % sacredIcons.length],
                isMore: false,
              })),
              {
                name: t("mandal_list.explore_by_location"),
                count: t("mandal_list.view_all_locations"),
                isMore: true,
                icon: (
                  <div className="flex items-center gap-1.5 text-[#9A532C] py-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9A532C]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9A532C]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9A532C]" />
                  </div>
                ),
              }
            ];

            return cardsList.map((city, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (city.isMore) {
                    setSelectedLocation("All");
                  } else {
                    setSelectedLocation(city.name);
                  }
                  const el = document.getElementById("mandals-search-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 text-center flex flex-col items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-300 group ${
                  selectedLocation === city.name
                    ? "border-[#9A532C] ring-2 ring-[#9A532C]/20 bg-amber-50/40"
                    : "border-zinc-200/80 dark:border-zinc-800 hover:border-[#9A532C]/50"
                }`}
              >
                {/* Icon direct render (without circular border wrapper) */}
                <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300 py-1">
                  {city.icon}
                </div>

                {/* Title & Count */}
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-[#6B0F1A] transition-colors">
                    {city.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {city.count}
                  </p>
                </div>
              </button>
            ));
          })()}
        </div>
      </section>



      {/* ─── NEWS & FESTIVAL INFORMATION CARDS SECTION ─────────────────────── */}
      <section className="pt-2 pb-8 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: News Updates */}
          <div className="bg-[#FAF7F2] dark:bg-zinc-900/90 border border-[#F0E6D8] dark:border-zinc-800 rounded-2xl md:rounded-3xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-[#F0E6D8] dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-700 dark:text-red-400">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2C1810] dark:text-zinc-100">
                    {t("mandal_list.news_updates")}
                  </h3>
                </div>
              </div>

              {/* News List Container with Auto Scrollbar */}
              <div className="max-h-[300px] overflow-y-auto space-y-3 md:space-y-4 pr-2 custom-scrollbar">
                {(() => {
                  if (!mandalNews || mandalNews.length === 0) {
                    return (
                      <div className="py-8 text-center text-zinc-500 text-xs md:text-sm font-medium">
                        {t("mandal_list.no_news_available") || "No news updates available at this time."}
                      </div>
                    );
                  }

                  const displayNews = mandalNews.map((item) => ({
                    id: item.id,
                    title: parseLocalizedValue(item.title, language),
                    date: formatNewsDate(item.publishedAt || item.createdAt) || "",
                  }));

                  return displayNews.map((item, idx) => (
                    <Link
                      key={item.id || idx}
                      href={item.id ? `/mandals/news/${item.id}` : "/mandals/news"}
                      className="group flex items-center justify-between gap-4 py-2 border-b border-[#F0E6D8]/70 dark:border-zinc-800/80 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                        <p className="text-xs md:text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </p>
                      </div>
                      {item.date && (
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                          {item.date}
                        </span>
                      )}
                    </Link>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Card 2: Festival Information */}
          <div className="bg-[#FAF7F2] dark:bg-zinc-900/90 border border-[#F0E6D8] dark:border-zinc-800 rounded-2xl md:rounded-3xl p-6 md:p-7 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#F0E6D8] dark:border-zinc-800">
                <div className="w-9 h-9 rounded-full bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-700/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2C1810] dark:text-zinc-100">
                  {t("mandal_list.festival_information")}
                </h3>
              </div>

              {/* Items List */}
              <div className="space-y-3 md:space-y-4">
                {/* Row 1: Festival Dates */}
                {festivalDateDisplay ? (
                  <div className="flex items-start sm:items-center gap-3 py-2 border-b border-[#F0E6D8]/70 dark:border-zinc-800/80">
                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs md:text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[160px]">
                        {t("mandal_list.festival_dates_label")}
                      </span>
                      <span className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {festivalDateDisplay}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Row 2: Main Festival Day */}
                {mainFestivalDay ? (
                  <div className="flex items-start sm:items-center gap-3 py-2 border-b border-[#F0E6D8]/70 dark:border-zinc-800/80">
                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs md:text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[160px]">
                        {t("mandal_list.main_festival_day")}
                      </span>
                      <span className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {mainFestivalDay}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Row 3: Ganesh Aarti Timings */}
                <div className="flex items-start sm:items-center gap-3 py-2 border-b border-[#F0E6D8]/70 dark:border-zinc-800/80">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs md:text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[160px]">
                      {t("mandal_list.ganesh_aarti_timings")}
                    </span>
                    <span className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("mandal_list.timings_desc")}
                    </span>
                  </div>
                </div>

                {/* Row 4: Visarjan Guidance */}
                <div className="flex items-start sm:items-center gap-3 py-2 border-b border-[#F0E6D8]/70 dark:border-zinc-800/80">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs md:text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[160px]">
                      {t("mandal_list.visarjan_guidance")}
                    </span>
                    <span className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("mandal_list.visarjan_desc")}
                    </span>
                  </div>
                </div>

                {/* Row 5: Emergency Help */}
                <div className="flex items-start sm:items-center gap-3 py-2">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs md:text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[160px]">
                      {t("mandal_list.emergency_help")}
                    </span>
                    <span className="text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {t("mandal_list.emergency_desc")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 container mx-auto px-4">
        <div className="bg-gradient-to-r from-[#24080A] via-[#3B0E12] to-[#200608] rounded-3xl p-6 md:p-8 border border-amber-500/25 shadow-2xl relative overflow-hidden text-white">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
            
            {/* Left: Ganesha Emblem + Text + Action Button (7 cols) */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-5 text-center sm:text-left">
              {/* Golden Ganesha Emblem */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8 2 5 5 5 9C5 12 7 14 9 15C10 15.5 11 16 11 17V20C11 20.6 11.4 21 12 21C12.6 21 13 20.6 13 20V17C13 16 14 15.5 15 15C17 14 19 12 19 9C19 5 16 2 12 2Z" />
                  <circle cx="12" cy="7" r="1.5" fill="currentColor" />
                  <path d="M7 11C7 11 9 13 12 13C15 13 17 11 17 11" />
                </svg>
              </div>

              {/* Text content */}
              <div className="space-y-1 flex-1">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">
                  Is Your Mandal Listed?
                </h3>
                <p className="text-xs md:text-sm text-amber-100/80 font-light">
                  {t("mandal_list.support_mandals_devotion")}
                </p>
              </div>

              {/* Button linking to /register-mandal */}
              <div className="shrink-0 pt-2 sm:pt-0">
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-6 h-12 rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 group transition-transform hover:scale-105"
                >
                  <Link href="/register-mandal">
                    Claim / Add Your Mandal
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: 3 Highlights (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-amber-500/20 pt-6 lg:pt-0 lg:pl-6">
              
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-amber-100/90 leading-tight">
                  Manage Your Mandal Page
                </span>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center space-y-2 border-x border-amber-500/20 px-2 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-amber-100/90 leading-tight">
                  Share Updates & Events
                </span>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-amber-100/90 leading-tight">
                  Reach Devotees Easily
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
