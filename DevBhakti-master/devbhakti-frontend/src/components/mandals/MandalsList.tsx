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
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { fetchMandalRegistrationStatus } from "@/api/publicController";

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
      const response = await fetch(`${API_URL}/mandals`);
      const data = await response.json();
      if (data && data.success) {
        setAllMandals(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching mandals:", error);
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
    if (!path) return "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200";
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

  // Popular search keywords
  const popularSearches = [
    "Lalbaugcha Raja",
    "Ganesh Galli",
    "Andhericha Raja",
    "GSB Seva Mandal",
    "Khetwadi",
    "Parel",
  ];

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
  const getLocalizedSettingText = (field: "title" | "subtitle") => {
    if (!mandalSettings?.[field]) return null;
    const val = mandalSettings[field];
    if (typeof val === "string") return val;
    return val[language] || val["en"] || val["hi"] || val["mr"] || null;
  };

  const heroTitle =
    getLocalizedSettingText("title") ||
    (mounted ? t("mandal_list.title") : "Ganeshotsav 2026");

  const heroSubtitle =
    getLocalizedSettingText("subtitle") ||
    (mounted
      ? t("mandal_list.subtitle")
      : "Celebrate Devotion. Experience Divinity.");

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

  let festivalDateDisplay = "27 Aug - 6 Sep 2026";
  if (mandalSettings?.startDate && mandalSettings?.endDate) {
    const sFormatted = formatDateStr(mandalSettings.startDate);
    const eFormatted = formatDateStr(mandalSettings.endDate);
    const endYear = mandalSettings.endDate.split("-")[0] || "2026";
    festivalDateDisplay = `${sFormatted} - ${eFormatted} ${endYear}`;
  } else if (mandalSettings?.startDate) {
    festivalDateDisplay = formatDateStr(mandalSettings.startDate);
  }

  const adminBannerImage = mandalSettings?.image
    ? getFullImageUrl(mandalSettings.image)
    : "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900">
      {/* Solid Navbar matching screenshot style */}
      <Navbar isSolid={true} />

      {/* ─── HERO BANNER SECTION (WIDE FULL WIDTH 50-50 SPLIT) ──────────────── */}
      <section className="relative bg-gradient-to-r from-[#1A0502] via-[#2A0C06] to-[#140402] text-white pt-32 pb-24 px-4 md:px-8 lg:px-12 overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[1700px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            
            {/* LEFT HALF (50%): CONTENT */}
            <div className="space-y-6 flex flex-col justify-center pr-0 lg:pr-4">
              {/* Top Divine Mantra */}
              <div className="inline-flex items-center gap-2 text-amber-400 font-serif text-base tracking-wider font-semibold">
                <span>|| गणपति बाप्पा मोरया ||</span>
              </div>

              {/* Dynamic Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1]">
                {heroTitle}
              </h1>

              {/* Dynamic Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-amber-100/90 font-light leading-relaxed max-w-2xl">
                {heroSubtitle}
              </p>

              {/* Dynamic Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 1. Festival Dates */}
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-300 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200/70 truncate">
                      Festival Dates
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      {festivalDateDisplay}
                    </div>
                  </div>
                </div>

                {/* 2. Location Info */}
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-300 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200/70 truncate">
                      Celebrated Across
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      Maharashtra & Beyond
                    </div>
                  </div>
                </div>

                {/* 3. Mandal Info */}
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-300 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-200/70 truncate">
                      Thousands of Mandals
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      One Divine Celebration
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <Button
                  onClick={() => {
                    const el = document.getElementById("mandals-search-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 h-12 rounded-xl text-base shadow-lg shadow-amber-500/20 flex items-center gap-2 group transition-all"
                >
                  Explore Mandals
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* RIGHT HALF (50%): FULL IMAGE */}
            <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] xl:h-[520px] rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 group">
              <img
                src={adminBannerImage}
                alt={heroTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as any).src =
                    "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <Badge className="bg-amber-500 text-slate-950 font-bold text-xs mb-1.5">
                  Ganeshotsav Special
                </Badge>
                <div className="text-lg font-bold truncate">{heroTitle}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FLOATING SEARCH & FILTER BAR ─────────────────────────────────── */}
      <div id="mandals-search-section" className="w-full max-w-[1700px] mx-auto px-4 md:px-8 lg:px-12 -mt-10 md:-mt-14 relative z-30">
        <div className="bg-white dark:bg-card rounded-3xl p-5 md:p-7 shadow-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          {/* Main Controls Grid matching design screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input (3 cols) */}
            <div className="lg:col-span-3 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by Mandal Name, Area or City..."
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

            {/* Dropdown 1: Locations (2 cols) */}
            <div className="lg:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-semibold px-3 rounded-xl"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {selectedLocation === "All" ? "All Locations" : selectedLocation}
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
                            {loc === "All" ? "All Locations" : loc}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Dropdown 2: Areas (2 cols) */}
            <div className="lg:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-semibold px-3 rounded-xl"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Filter className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {selectedArea === "All" ? "All Areas" : selectedArea}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 text-zinc-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 rounded-xl">
                  <Command>
                    <CommandInput placeholder="Search area..." className="h-9 text-xs" />
                    <CommandList>
                      <CommandEmpty className="py-2 text-xs text-center text-zinc-500">
                        No area found
                      </CommandEmpty>
                      <CommandGroup>
                        {areas.map((area) => (
                          <CommandItem
                            key={area}
                            value={area}
                            onSelect={() => setSelectedArea(area)}
                            className="py-2 text-xs cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5 text-primary",
                                selectedArea === area ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {area === "All" ? "All Areas" : area}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Dropdown 3: Mandal Type (2 cols) */}
            <div className="lg:col-span-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-between bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-semibold px-3 rounded-xl"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Star className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">
                        {selectedCategory === "All" ? "All Mandals" : selectedCategory}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 text-zinc-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 rounded-xl">
                  <Command>
                    <CommandInput placeholder="Search type..." className="h-9 text-xs" />
                    <CommandList>
                      <CommandEmpty className="py-2 text-xs text-center text-zinc-500">
                        No type found
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat}
                            value={cat}
                            onSelect={() => setSelectedCategory(cat)}
                            className="py-2 text-xs cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5 text-primary",
                                selectedCategory === cat ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {cat === "All" ? "All Mandals" : cat}
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
              <Button
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
                  {isLocating ? "Locating..." : userCoords ? "Near Me ✓" : "Near Me"}
                </span>
              </Button>

              <Button
                onClick={() => {
                  setSearchQuery(searchInput);
                }}
                className="h-12 flex-1 bg-[#6B0F1A] hover:bg-[#520B14] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Search</span>
              </Button>
            </div>
          </div>

          {/* Popular Searches Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-500 mr-1">Popular Searches :</span>
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
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── FEATURED MANDALS SECTION ───────────────────────────────────────── */}
      <section className="py-12 px-4 md:px-8 lg:px-12 w-full max-w-[1700px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 dark:text-zinc-100">
              Featured Mandals
            </h2>
          </div>
          <Link
            href="#mandals-search-section"
            className="text-xs md:text-sm font-bold text-[#6B0F1A] dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            View All Mandals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mandals Grid (Matching Screenshot Cards) */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-600 border-t-transparent" />
          </div>
        ) : mandals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {mandals.map((mandal) => {
              if (!mandal) return null;
              const localizedName = getLocalized(mandal, "name", language) || mandal.name || "Mandal";
              const isFav = favorites.some((f) => f && f.mandalId === mandal.id);
              const isVerifiedMandal = mandal.isActive === true && String(mandal.status || "").toUpperCase() === "APPROVED";

              return (
                <div
                  key={mandal.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-zinc-100">
                    <img
                      src={getFullImageUrl(mandal.image)}
                      alt={localizedName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as any).src =
                          "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&q=80&w=500";
                      }}
                    />

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
                      onClick={(e) => toggleFavorite(e, mandal.id)}
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
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#6B0F1A] transition-colors">
                          {localizedName}
                        </h3>
                        {isVerifiedMandal && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF4E6] dark:bg-[#2C1810] border border-[#DEB887]/30 shrink-0 mt-0.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-[#D97706] fill-white dark:fill-[#2C1810]" />
                            <span className="text-[10px] font-bold text-[#92400E] dark:text-[#FCD34D] uppercase tracking-wider">
                              Verified
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
                          {mandal.distanceKm} km away
                        </span>
                      )}
                      {mandal.establishedYear && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                          {mandal.establishedYear.includes('+') || mandal.establishedYear.toLowerCase().includes('years') ? mandal.establishedYear : `${mandal.establishedYear} Years`}
                        </span>
                      )}
                      {mandal.isLive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                          LIVE Darshan
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
                      <Link
                        href={`/mandals/${mandal.slug || mandal.id}`}
                        className="text-xs font-bold text-[#6B0F1A] dark:text-amber-400 hover:underline flex items-center gap-1 group/link"
                      >
                        Explore Mandal
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 p-8">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">
              No Mandals Found
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
              Try resetting your search query or selecting a different location.
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
              Reset Filters
            </Button>
          </div>
        )}
      </section>

      {/* ─── IS YOUR MANDAL LISTED? CTA BANNER SECTION ─────────────────────── */}
      <section className="py-8 px-4 md:px-8 lg:px-12 w-full max-w-[1700px] mx-auto">
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
                  Claim your Mandal and connect with millions of devotees.
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
