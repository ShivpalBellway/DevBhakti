"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Heart,
  Video,
  Calendar,
  Share2,
  ChevronLeft,
  Users,
  IndianRupee,
  Phone,
  Globe,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import { fetchPublicTemples, fetchPublicFilters, fetchRatingsSettings } from "@/api/publicController";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";
import { API_URL } from "@/config/apiConfig";
import { getTempleUrl } from "@/lib/utils/templeUtils";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalized } from "@/utils/localization";
import { stripHtml } from "@/utils/textUtils";



export function TemplesList() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedPooja, setSelectedPooja] = useState("All");
  const [temples, setTemples] = useState<any[]>([]);
  const [allTemples, setAllTemples] = useState<any[]>([]); // For suggestions source
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showRatings, setShowRatings] = useState(false);
  const { language, t } = useLanguage();

  // Suggestions state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  React.useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadFavorites();
    }
    fetchInitialOptions();
    loadRatingsSettings();
  }, [language]);

  const [allOptions, setAllOptions] = useState({ categories: ["All"], locations: ["All"], poojas: ["All"] });

  const fetchInitialOptions = async () => {
    try {
      const data = await fetchPublicFilters(language);
      if (data) {
        setAllOptions({
          categories: ["All", ...(data.categories || [])],
          locations: ["All", ...(data.locations || [])],
          poojas: ["All", ...(data.poojas || [])]
        });
      }

      // Also fetch all temples once for suggestions source
      const allTemps = await fetchPublicTemples({ lang: language });
      setAllTemples(allTemps || []);
    } catch (error) {
      console.error("Error fetching initial options:", error);
    }
  };

  const categories = allOptions.categories;
  const locations = allOptions.locations;
  const poojaOptions = allOptions.poojas;

  const loadRatingsSettings = async () => {
    try {
      const data = await fetchRatingsSettings();
      if (data && data.settings) {
        setShowRatings(data.settings.temple.home);
      }
    } catch (error) {
      console.error("Error loading ratings settings:", error);
    }
  };

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    loadTemples();
  }, [searchQuery, selectedCategory, selectedLocation, selectedPooja, language]);

  const loadFavorites = async () => {
    try {
      const res = await fetchUserFavorites();
      if (res.success) {
        setFavorites(res.data);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadTemples = async () => {
    setLoading(true);
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== "All") params.category = selectedCategory;
    if (selectedLocation !== "All") params.location = selectedLocation;
    if (selectedPooja !== "All") params.pooja = selectedPooja;
    params.lang = language;

    const data = await fetchPublicTemples(params);
    setTemples(data || []);
    setLoading(false);
  };

  const handleManualSearch = () => {
    setSearchQuery(searchInput);
  };

  const getFullImageUrl = (imagePath: string | null, type: string = "Temple") => {
    if (!imagePath) return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">${type}</text></svg>`;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
return `${API_URL.replace('/api', '')}${cleanPath}`;
  };

  const toggleFavorite = async (e: React.MouseEvent, templeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to login as a devotee to add favourites.",
        variant: "destructive",
      });
      return;
    }

    const isFav = favorites.some((f) => f.templeId === templeId);
    try {
      if (isFav) {
        await removeFavorite({ templeId });
        setFavorites(favorites.filter((f) => f.templeId !== templeId));
        toast({ title: "Removed from Favourites", description: "Temple removed from your favourites.", variant: "success" });
      } else {
        await addFavorite({ templeId });
        setFavorites([...favorites, { templeId }]);
        toast({ title: "❤️ Added to Favourites", description: "Temple added to your favourites!", variant: "success" });
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || error.message || t('marketplace.cart.failed'),
        variant: "destructive",
      });
    }
  };

  // Levenshtein Distance Helper for Fuzzy Search
  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Use the fetched temples directly as they are already filtered by the backend
  const filteredTemples = temples;

  // Suggestions helper for autocomplete dropdown
  const getFuzzySuggestions = (query: string) => {
    if (query.length < 2) return [];
    
    // Check against ALL temples list for close matches
    const matches: any[] = [];
    allTemples.forEach(temple => {
      const name = getLocalized(temple, 'name', language) || "";
      const queryLower = query.toLowerCase();
      const nameLower = name.toLowerCase();
      const distance = getLevenshteinDistance(queryLower, nameLower);
      
      // If it's an exact match, we don't need to suggest it
      if (nameLower === queryLower) return;

      if (distance < 3 || nameLower.includes(queryLower)) {
        matches.push({
          title: name,
          category: getLocalized(temple, 'category', language)
        });
      }
    });

    // Remove duplicates and limit
    return Array.from(new Set(matches.map(m => m.title)))
      .map(title => matches.find(m => m.title === title))
      .slice(0, 5);
  };

  React.useEffect(() => {
    if (searchInput.trim() && isSearchFocused) {
      setSuggestions(getFuzzySuggestions(searchInput));
    } else {
      setSuggestions([]);
    }
  }, [searchInput, isSearchFocused, allTemples]);

  // "Did you mean?" suggestion for empty results
  const resultSuggestion = React.useMemo(() => {
    if (searchQuery.length < 2 || filteredTemples.length > 0) return null;

    let minDistance = Infinity;
    let bestMatch = "";

    // We need a list of all possible temple names to suggest from
    // Since 'temples' is filtered, we might need a broader list or just use what we have
    // For now, let's assume we use the temples list which might be empty if search failed
    // If it's empty, we can't suggest from it. We'd need the full list.
    // In PoojaListClient, it uses the full poojas list.
    // Here, temples is already filtered by backend.
    
    return null; // For now, autocomplete is more important.
  }, [searchQuery, filteredTemples]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="/images/sacred_temples_list_hero_bg.png"
              alt="Sacred Temples"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
          </div>

          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute inset-0 bg-[url('/images/sacred_marketplace_hero_pattern.png')] opacity-10" />
          </div>

          <div className="container mx-auto px-4 pt-28 pb-12 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-foreground mb-6 leading-tight"
              >
                {t('temples.discover_title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-800 mb-10"
              >
                {t('temples.discover_subtitle')}
              </motion.p>

              {/* Premium Search Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative max-w-2xl mx-auto group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-primary/10">
                  <div className="relative flex items-center overflow-hidden">
                    <Search className="absolute left-5 h-5 w-5 text-primary/50" />
                    <input
                      type="text"
                      placeholder={t('temples.search_placeholder_long')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualSearch();
                          setIsSearchFocused(false);
                        }
                      }}
                      className="w-full pl-14 pr-32 py-5 text-lg outline-none bg-transparent text-zinc-800 placeholder:text-zinc-400"
                    />
                    <Button 
                      onClick={() => {
                        handleManualSearch();
                        setIsSearchFocused(false);
                      }}
                      className="absolute right-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white hidden sm:flex font-bold"
                    >
                      {t('marketplace.explore')}
                    </Button>
                  </div>

                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Streamlined Quick Filters Bar */}
        <section className="py-3 sticky top-0 md:top-[74px] z-40 bg-primary  shadow-lg border-b border-black/20 transition-all">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/10 rounded-md">
                    <Filter className="h-4 w-4 text-amber-200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.1em] font-medium text-amber-200/80 leading-snug">{t('temples.filter_experience')}</span>
                    <span className="text-lg font-serif font-bold text-white leading-none mt-2">{t('temples.refine_discovery')}</span>
                  </div>
                </div>
                {(selectedCategory !== "All" || selectedLocation !== "All" || selectedPooja !== "All" || searchQuery !== "") && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedLocation("All");
                      setSelectedPooja("All");
                      setSearchInput("");
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-amber-200 hover:text-white transition-all bg-black/20 px-3 py-1.5 rounded-full border border-amber-500/30"
                  >
                    {t('temples.reset_all')}
                  </motion.button>
                )}
              </div>

              {/* Enhanced Filter Bar with Searchable Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Category Dropdown */}
                <div className="relative group bg-black/20 border border-white/10 rounded-xl shadow-inner hover:bg-black/30 transition-all duration-300 p-0.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        className="w-full justify-start h-11 hover:bg-transparent rounded-lg border-none shadow-none text-left font-normal px-3"
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="text-amber-200/70 group-hover:text-amber-200 transition-colors shrink-0">
                            <Star className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start leading-tight min-w-0">
                            <span className="text-[9px] uppercase font-semibold text-white/50 tracking-wider">{t('temples.divine_category')}</span>
                            <span className="truncate text-white text-xs font-semibold mt-0.5">
                              {selectedCategory === "All" ? t('temples.all_categories') : selectedCategory}
                            </span>
                          </div>
                        </div>
                        <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-white/40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                      <Command>
                        <CommandInput placeholder={t('temples.search_category')} className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">{t('temples.no_category_found')}</CommandEmpty>
                          <CommandGroup>
                            {categories.map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => {
                                  setSelectedCategory(category);
                                }}
                                className="py-2 text-xs cursor-pointer data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5 text-primary",
                                    selectedCategory === category ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {category}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Location Dropdown */}
                <div className="relative group bg-black/20 border border-white/10 rounded-xl shadow-inner hover:bg-black/30 transition-all duration-300 p-0.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        className="w-full justify-start h-11 hover:bg-transparent rounded-lg border-none shadow-none text-left font-normal px-3"
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="text-amber-200/70 group-hover:text-amber-200 transition-colors shrink-0">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start leading-tight min-w-0">
                            <span className="text-[9px] uppercase font-semibold text-white/50 tracking-wider">{t('temples.sanctum_location')}</span>
                            <span className="truncate text-white text-xs font-semibold mt-0.5">
                              {selectedLocation === "All" ? t('temples.all_locations') : selectedLocation}
                            </span>
                          </div>
                        </div>
                        <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-white/40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                      <Command>
                        <CommandInput placeholder={t('temples.search_location')} className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">{t('temples.no_location_found')}</CommandEmpty>
                          <CommandGroup>
                            {locations.map((location) => (
                              <CommandItem
                                key={location}
                                value={location}
                                onSelect={() => {
                                  setSelectedLocation(location);
                                }}
                                className="py-2 text-xs cursor-pointer data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5 text-primary",
                                    selectedLocation === location ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {location}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Ritual Type Dropdown */}
                <div className="relative group bg-black/20 border border-white/10 rounded-xl shadow-inner hover:bg-black/30 transition-all duration-300 p-0.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        className="w-full justify-start h-11 hover:bg-transparent rounded-lg border-none shadow-none text-left font-normal px-3"
                      >
                        <div className="flex items-center gap-2.5 w-full">
                          <div className="text-amber-200/70 group-hover:text-amber-200 transition-colors shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start leading-tight min-w-0">
                            <span className="text-[9px] uppercase font-semibold text-white/50 tracking-wider">
                              {t('poojas.ritual_type')}
                            </span>
                            <span className="truncate text-white text-xs font-semibold mt-0.5">
                              {selectedPooja === "All" ? t('poojas.all_poojas') : selectedPooja}
                            </span>
                          </div>
                        </div>
                        <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-white/40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                      <Command>
                        <CommandInput placeholder={t('poojas.search_ritual')} className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">{t('poojas.no_ritual_found')}</CommandEmpty>
                          <CommandGroup>
                            {poojaOptions.map((pooja) => (
                              <CommandItem
                                key={pooja}
                                value={pooja}
                                onSelect={() => {
                                  setSelectedPooja(pooja);
                                }}
                                className="py-2 text-xs cursor-pointer data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-3.5 w-3.5 text-primary",
                                    selectedPooja === pooja ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {pooja}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Active Selection Feedback - Modernized Chips */}
              {(selectedCategory !== "All" || selectedLocation !== "All" || selectedPooja !== "All" || searchQuery !== "") && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 px-1">
                  <span className="text-xs font-medium text-muted-foreground mr-1">
                    {t('temples.active')}
                  </span>
                  {searchQuery !== "" && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-primary/20 transition-colors">
                      <Search className="w-3 h-3 text-primary/60" />
                      "{searchQuery}"
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => {
                        setSearchInput("");
                        setSearchQuery("");
                      }} />
                    </Badge>
                  )}
                  {selectedCategory !== "All" && (
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-primary/10 transition-colors">
                      <Star className="w-3 h-3 text-primary/60" />
                      {selectedCategory}
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedCategory("All")} />
                    </Badge>
                  )}
                  {selectedLocation !== "All" && (
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-primary/10 transition-colors">
                      <MapPin className="w-3 h-3 text-primary/60" />
                      {selectedLocation}
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedLocation("All")} />
                    </Badge>
                  )}
                  {selectedPooja !== "All" && (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground border-secondary/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-secondary/20 transition-colors">
                      <Calendar className="w-3 h-3 text-secondary/60" />
                      {selectedPooja}
                      <X className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedPooja("All")} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Temple Grid */}
        <section className="py-6 min-h-[400px]">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-foreground">
                {t('temples.showing')} <span className="font-semibold text-foreground">{filteredTemples.length}</span> {t('temples.temples_count_label')}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredTemples.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemples.map((temple) => (
                  <div key={temple.id} className="relative group/card h-full">
                    <Link href={getTempleUrl(temple)}>
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 h-full">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={getFullImageUrl(temple.image)}
                            alt={getLocalized(temple, 'name', language)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as any).src = "https://via.placeholder.com/400x300?text=Temple"
                            }}
                          />
                          {temple.liveStatus && (
                            <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-pulse">
                              <span className="w-2 h-2 bg-white rounded-full mr-2" />
                              {t('temples.live_now')}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm"
                          >
                            {getLocalized(temple, 'category', language)}
                          </Badge>

                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {getLocalized(temple, 'name', language)}
                          </h3>
                          <p className="text-sm text-foreground mb-3 line-clamp-2">
                            {stripHtml(getLocalized(temple, 'description', language))}
                          </p>

                          <div className="flex items-center gap-2 text-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{getLocalized(temple, 'location', language)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            {showRatings && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="font-medium text-foreground">{temple.rating}</span>
                                <span className="text-muted-foreground text-sm">
                                  ({(temple.reviewsCount || 0).toLocaleString()})
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>

                    {/* Favorite Button - Outside Link */}
                    <button
                      onClick={(e) => toggleFavorite(e, temple.id)}
                      className="absolute top-3 right-1 z-30 p-2 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-background/80 transition-all group/fav"
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${favorites.some((f) => f.templeId === temple.id)
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground group-hover/fav:text-red-500"
                          }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-2">
                    {t('temples.no_temple_found')}
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    {t('landing.landing_search.no_results_for')} "{searchQuery}". {t('landing.landing_search.try_another')}
                  </p>
                  
                  {/* Local Fuzzy Suggestion for results area */}
                  {searchInput.length >= 2 && getFuzzySuggestions(searchInput).length > 0 && (
                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 animate-in fade-in slide-in-from-bottom-4">
                      <p className="text-foreground font-bold mb-4">{t('landing.landing_search.did_you_mean')}?</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {getFuzzySuggestions(searchInput).map((s: any, idx: number) => (
                          <Button
                            key={idx}
                            variant="outline"
                            onClick={() => {
                              setSearchInput(s.title);
                              setSearchQuery(s.title);
                            }}
                            className="rounded-full bg-white border-primary/20 hover:bg-primary hover:text-white transition-all font-serif italic"
                          >
                            {s.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}