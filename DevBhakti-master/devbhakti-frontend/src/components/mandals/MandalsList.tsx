"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Heart,
  Video,
  Calendar,
  Filter,
  X,
  ChevronsUpDown,
  Check,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { stripHtml } from "@/utils/textUtils";
import { fetchUserFavorites, addFavorite, removeFavorite } from "@/api/userController";

export function MandalsList() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [mandals, setMandals] = useState<any[]>([]);
  const [allMandals, setAllMandals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { language, t } = useLanguage();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user and favorites
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      loadFavorites();
    }
    fetchInitialOptions();
  }, [language]);

  const fetchInitialOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/mandals`);
      const data = await response.json();
      if (data.success) {
        setAllMandals(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching mandals:", error);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await fetchUserFavorites();
      if (res.success) {
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
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load mandals with filters
  useEffect(() => {
    loadMandals();
  }, [searchQuery, selectedCategory, selectedLocation, language]);

  const loadMandals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedLocation !== "All") params.append("location", selectedLocation);
      params.append("lang", language);

      const response = await fetch(`${API_URL}/mandals?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
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
    if (!path) return "/placeholder.jpg";
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

    const isFav = favorites.some((f) => f.mandalId === mandalId);
    try {
      if (isFav) {
        await removeFavorite({ mandalId });
        setFavorites(favorites.filter((f) => f.mandalId !== mandalId));
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
        description: error.response?.data?.message || error.message || "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  // Get unique categories and locations from mandals
  const categories = ["All", ...new Set(mandals.map((m) => m.mandalType).filter(Boolean))];
  const locations = ["All", ...new Set(mandals.map((m) => m.city).filter(Boolean))];

  // Fuzzy search suggestions
  const getFuzzySuggestions = (query: string) => {
    if (query.length < 2) return [];
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

  const filteredMandals = mandals;

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section - Like Temple List */}
        <section className="relative min-h-[480px] flex items-center justify-center overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="/images/sacred_temples_list_hero_bg.png"
              alt="Sacred Mandals"
              fill
              priority
              className="object-cover"
              onError={(e) => {
                (e.target as any).style.display = "none";
              }}
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
                {mounted ? t('mandal_list.title') : "Browse Sacred Mandals"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-800 mb-10"
              >
                {mounted ? t('mandal_list.subtitle') : "Explore and support devotional mandals across India"}
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
                      placeholder={mounted ? t('mandal_list.search_placeholder') : "Search mandals by name, city, or type..."}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSearchQuery(searchInput);
                          setIsSearchFocused(false);
                        }
                      }}
                      className="w-full pl-14 pr-32 py-5 text-lg outline-none bg-transparent text-zinc-800 placeholder:text-zinc-400"
                    />
                    <Button
                      onClick={() => {
                        setSearchQuery(searchInput);
                        setIsSearchFocused(false);
                      }}
                      className="absolute right-2 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white hidden sm:flex font-bold"
                    >
                      {mounted ? t('mandal_list.explore') : "Explore"}
                    </Button>
                  </div>

                  {/* Suggestions Dropdown */}
                  {isSearchFocused && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-border max-h-60 overflow-y-auto z-50">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="w-full px-4 py-3 text-left hover:bg-primary/5 flex items-center gap-3 transition-colors"
                          onClick={() => {
                            setSearchInput(suggestion.title);
                            setSearchQuery(suggestion.title);
                            setIsSearchFocused(false);
                          }}
                        >
                          <Search className="w-4 h-4 text-primary/50" />
                          <div>
                            <div className="font-medium">{suggestion.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.type && `${suggestion.type} • `}
                              {suggestion.city && suggestion.city}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Filter Bar - Like Temple List */}
        <section className="py-3 sticky top-0 md:top-[74px] z-40 bg-primary shadow-lg border-b border-black/20 transition-all">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/10 rounded-md">
                    <Filter className="h-4 w-4 text-amber-200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.1em] font-medium text-amber-200/80 leading-snug">
                      {mounted ? t('mandal_list.filter_experience') : "Filter Experience"}
                    </span>
                    <span className="text-lg font-serif font-bold text-white leading-none mt-2">
                      {mounted ? t('mandal_list.refine_discovery') : "Refine Discovery"}
                    </span>
                  </div>
                </div>
                {(selectedCategory !== "All" || selectedLocation !== "All" || searchQuery !== "") && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory("All");
                      setSelectedLocation("All");
                      setSearchInput("");
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-amber-200 hover:text-white transition-all bg-black/20 px-3 py-1.5 rounded-full border border-amber-500/30"
                  >
                    {mounted ? t('mandal_list.reset_all') : "Reset All"}
                  </motion.button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Category Filter */}
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
                            <span className="text-[9px] uppercase font-semibold text-white/50 tracking-wider">
                              {mounted ? t('mandal_list.mandal_type') : "Mandal Type"}
                            </span>
                            <span className="truncate text-white text-xs font-semibold mt-0.5">
                              {selectedCategory === "All" ? (mounted ? t('mandal_list.all_types') : "All Types") : selectedCategory}
                            </span>
                          </div>
                        </div>
                        <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-white/40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                      <Command>
                        <CommandInput placeholder="Search type..." className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">
                            No type found
                          </CommandEmpty>
                          <CommandGroup>
                            {categories.map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={() => setSelectedCategory(category)}
                                className="py-2 text-xs cursor-pointer"
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

                {/* Location Filter */}
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
                            <span className="text-[9px] uppercase font-semibold text-white/50 tracking-wider">
                              {mounted ? t('mandal_list.location') : "Location"}
                            </span>
                            <span className="truncate text-white text-xs font-semibold mt-0.5">
                              {selectedLocation === "All" ? (mounted ? t('mandal_list.all_locations') : "All Locations") : selectedLocation}
                            </span>
                          </div>
                        </div>
                        <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 text-white/40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
                      <Command>
                        <CommandInput placeholder="Search location..." className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">
                            No location found
                          </CommandEmpty>
                          <CommandGroup>
                            {locations.map((location) => (
                              <CommandItem
                                key={location}
                                value={location}
                                onSelect={() => setSelectedLocation(location)}
                                className="py-2 text-xs cursor-pointer"
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
              </div>

              {/* Active Filters */}
              {(selectedCategory !== "All" || selectedLocation !== "All" || searchQuery !== "") && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 px-1">
                  <span className="text-xs font-medium text-white/70 mr-1">Active:</span>
                  {searchQuery !== "" && (
                    <Badge className="bg-white/20 text-white border-white/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-white/30 transition-colors">
                      <Search className="w-3 h-3 text-white/60" />
                      "{searchQuery}"
                      <X
                        className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSearchInput("");
                          setSearchQuery("");
                        }}
                      />
                    </Badge>
                  )}
                  {selectedCategory !== "All" && (
                    <Badge className="bg-white/20 text-white border-white/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-white/30 transition-colors">
                      <Star className="w-3 h-3 text-white/60" />
                      {selectedCategory}
                      <X
                        className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedCategory("All")}
                      />
                    </Badge>
                  )}
                  {selectedLocation !== "All" && (
                    <Badge className="bg-white/20 text-white border-white/20 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 group cursor-pointer hover:bg-white/30 transition-colors">
                      <MapPin className="w-3 h-3 text-white/60" />
                      {selectedLocation}
                      <X
                        className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedLocation("All")}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mandal Grid */}
        <section className="py-6 min-h-[400px]">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-foreground">
                {mounted ? t('mandal_list.showing') : "Showing"} <span className="font-semibold">{filteredMandals.length}</span> {mounted ? t('mandal_list.mandals') : "mandals"}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredMandals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMandals.map((mandal) => (
                  <div key={mandal.id} className="relative group/card h-full">
                    <Link href={`/mandals/${mandal.slug || mandal.id}`}>
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 h-full">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={getFullImageUrl(mandal.image)}
                            alt={getLocalized(mandal, "name", language)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as any).src = "https://via.placeholder.com/400x300?text=Mandal";
                            }}
                          />
                          {mandal.isLive && (
                            <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-pulse">
                              <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block" />
                              Live Now
                            </Badge>
                          )}
                          {mandal.mandalType && (
                            <Badge
                              variant="secondary"
                              className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm"
                            >
                              {mandal.mandalType}
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {getLocalized(mandal, "name", language)}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {stripHtml(getLocalized(mandal, "description", language))}
                          </p>

                          <div className="flex items-center gap-2 text-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">
                              {[mandal.city, mandal.state].filter(Boolean).join(", ")}
                            </span>
                          </div>

                          {mandal.presiding_deity && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Deity:</span> {mandal.presiding_deity}
                            </div>
                          )}

                          {mandal.isLive && (
                            <Badge variant="outline" className="mt-2 text-primary border-primary">
                              <Video className="h-3 w-3 mr-1" />
                              Live Darshan Available
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(e, mandal.id)}
                      className="absolute top-3 right-3 z-30 p-2 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-background/80 transition-all group/fav"
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${
                          favorites.some((f) => f.mandalId === mandal.id)
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
                  <h3 className="text-xl font-serif text-foreground mb-2">{mounted ? t('mandal_list.no_mandals') : "No mandals found"}</h3>
                  <p className="text-muted-foreground mb-8">
                    {mounted ? t('mandal_list.try_adjusting') : "Try adjusting your search criteria"}
                  </p>

                  {/* Suggestions */}
                  {searchInput.length >= 2 && getFuzzySuggestions(searchInput).length > 0 && (
                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 animate-in fade-in slide-in-from-bottom-4">
                      <p className="text-foreground font-bold mb-4">Did you mean?</p>
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