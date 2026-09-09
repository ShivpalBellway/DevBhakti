"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  Printer,
  Sparkles,
  Search,
  ChevronRight,
  RefreshCw,
  Heart,
  Flower2,
  Ticket,
  Package,
  Camera
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { parseLocalizedValue } from "@/utils/textUtils";
import { API_URL } from "@/config/apiConfig";

const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL.replace("/api", "")}${path}`;
};

export default function TempleUnifiedTellerCartPage() {
  const [activeTab, setActiveTab] = useState("pooja");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Catalog State
  const [catalog, setCatalog] = useState<{
    poojas: any[];
    products: any[];
    slots: any[];
    photoPackages: any[];
    photoSlots: any[];
    allowedPhotoAreas?: string[];
    darshanPrice?: number;
    prasadPrice?: number;
  }>({
    poojas: [],
    products: [],
    slots: [],
    photoPackages: [],
    photoSlots: [],
    allowedPhotoAreas: [],
    darshanPrice: 0,
    prasadPrice: 0
  });

  // Cart Items State
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Custom Donation Input State
  const [donationCategory, setDonationCategory] = useState("General");
  const [donationAmount, setDonationAmount] = useState<number | string>("");

  // Devotee Details State
  const [devotee, setDevotee] = useState({
    name: "",
    phone: "",
    email: "",
    gothra: "",
    address: ""
  });

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");

  // Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const handlePhoneLookup = async (phoneVal: string) => {
    const cleaned = phoneVal.replace(/\D/g, "");
    if (cleaned.length < 10) return;
    try {
      setIsLookupLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/temple-admin/devotees/lookup?phone=${encodeURIComponent(phoneVal)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDevotee(prev => ({
          ...prev,
          name: json.data.name || prev.name,
          email: json.data.email || prev.email,
          gothra: json.data.gothra || prev.gothra,
          address: json.data.address || prev.address,
        }));
        toast.success(`Existing record found for ${json.data.name || 'devotee'}. Details Auto-Filled.`);
      }
    } catch (err) {
      console.error("Phone lookup error", err);
    } finally {
      setIsLookupLoading(false);
    }
  };

  // Fetch Catalog
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/temple-admin/teller/catalog`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setCatalog(json.data);
      } else {
        toast.error(json.message || "Failed to load temple catalog");
      }
    } catch (err: any) {
      toast.error(err.message || "Catalog fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Cart Helper Operations
  const addToCart = (item: any) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id && i.itemType === item.itemType);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += (item.quantity || 1);
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    toast.success(`${item.itemName || item.name} added to cart`);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCartItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const [commissionData, setCommissionData] = useState<{ totalPlatformFee: number; itemsBreakdown: any[] }>({
    totalPlatformFee: 0,
    itemsBreakdown: []
  });

  const fetchCommissionBreakdown = async (items: any[]) => {
    if (!items || items.length === 0) {
      setCommissionData({ totalPlatformFee: 0, itemsBreakdown: [] });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/temple-admin/teller/calculate-commission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCommissionData(json.data);
      }
    } catch (err) {
      console.error("Error fetching temple commission breakdown:", err);
    }
  };

  useEffect(() => {
    fetchCommissionBreakdown(cartItems);
  }, [cartItems]);

  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  // Add Custom Donation
  const handleAddDonation = () => {
    const amountNum = Number(donationAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }

    addToCart({
      id: `don_${Date.now()}`,
      itemType: "DONATION",
      itemName: `Donation (${donationCategory})`,
      unitPrice: amountNum,
      quantity: 1,
      price: amountNum
    });

    setDonationAmount("");
  };

  // Process Checkout
  const handleCheckout = async () => {
    if (!devotee.name || !devotee.phone) {
      toast.error("Devotee Name and Phone number are required");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        devotee,
        payment: {
          method: paymentMethod,
          transactionRef
        },
        items: cartItems.map(item => ({
          itemType: item.itemType,
          itemId: item.itemId || item.id,
          itemName: item.itemName || item.name,
          unitPrice: item.unitPrice || item.price,
          quantity: item.quantity,
          price: item.unitPrice || item.price,
          totalPrice: (item.unitPrice || item.price) * item.quantity,
          metadata: item
        }))
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/temple-admin/teller/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Temple Checkout Successful!");
        setCompletedOrder(json.data);
        setShowReceipt(true);
        clearCart();
        setDevotee({ name: "", phone: "", email: "", gothra: "", address: "" });
      } else {
        toast.error(json.message || "Checkout failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error during checkout");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-amber-300" />
            Temple Counter Teller Module
          </h1>
          <p className="text-amber-100 text-sm mt-1">
            Book Poojas, Donations, Darshan Passes, Sacred Prasad, & Offline Photography sessions in a single unified checkout.
          </p>
        </div>

        <Button
          onClick={fetchCatalog}
          variant="outline"
          className="bg-white/10 border-amber-300/30 text-white hover:bg-white/20 shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Catalog
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Catalog Section (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-amber-200/60 shadow-sm">
            <CardHeader className="pb-3 border-b bg-amber-50/40">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-lg font-bold text-amber-900">Select Temple Counter Items</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search pooja, product..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 border-amber-200 text-xs"
                  />
                </div>
              </div>

              {/* Navigation Tabs (5 Categories: Pooja, Donation, Ticket, Prasad, Photography) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
                <TabsList className="grid grid-cols-5 bg-amber-100/60 p-1 rounded-xl">
                  <TabsTrigger value="pooja" className="text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:text-amber-900">
                    <Flower2 className="w-3.5 h-3.5" /> Pooja
                  </TabsTrigger>
                  <TabsTrigger value="donation" className="text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:text-amber-900">
                    <Heart className="w-3.5 h-3.5" /> Donation
                  </TabsTrigger>
                  <TabsTrigger value="ticket" className="text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:text-amber-900">
                    <Ticket className="w-3.5 h-3.5" /> Ticketing
                  </TabsTrigger>
                  <TabsTrigger value="product" className="text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:text-amber-900">
                    <Package className="w-3.5 h-3.5" /> Products / Prasad
                  </TabsTrigger>
                  <TabsTrigger value="photography" className="text-xs font-bold gap-1 data-[state=active]:bg-white data-[state=active]:text-amber-900">
                    <Camera className="w-3.5 h-3.5" /> Photo
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-4 min-h-[420px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-amber-700">
                  <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-700 rounded-full animate-spin mb-3" />
                  <p className="text-xs font-medium">Loading catalog items...</p>
                </div>
              ) : (
                <>
                  {/* POOJA TAB */}
                  {activeTab === "pooja" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalog.poojas.length === 0 ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">
                          <Flower2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No Active Poojas Found</p>
                          <p className="text-xs">Create poojas in Temple Admin to list here</p>
                        </div>
                      ) : (
                        catalog.poojas
                          .filter(p => !searchQuery || parseLocalizedValue(p.name).toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(pooja => (
                            <div key={pooja.id} className="p-3 border rounded-xl bg-white hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex gap-3 items-start">
                                  {pooja.image ? (
                                    <img src={getImageUrl(pooja.image)} alt={parseLocalizedValue(pooja.name)} className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0" />
                                  ) : (
                                    <div className="w-14 h-14 bg-amber-100/70 rounded-lg flex items-center justify-center text-amber-900 shrink-0 font-bold text-lg">
                                      🪔
                                    </div>
                                  )}
                                  <div className="space-y-1 flex-1 min-w-0">
                                    {pooja.category && (
                                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-900 border-amber-200 py-0">
                                        {parseLocalizedValue(pooja.category)}
                                      </Badge>
                                    )}
                                    <h4 className="font-bold text-sm text-foreground truncate">{parseLocalizedValue(pooja.name)}</h4>
                                    <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 font-bold">
                                      ₹{pooja.price}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => addToCart({
                                  id: pooja.id,
                                  itemType: "POOJA",
                                  itemName: parseLocalizedValue(pooja.name),
                                  unitPrice: pooja.price,
                                  price: pooja.price
                                })}
                                size="sm"
                                className="mt-3 w-full bg-amber-800 hover:bg-amber-900 text-xs h-8 text-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add to Cart
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {/* DONATION TAB */}
                  {activeTab === "donation" && (
                    <div className="space-y-4">
                      <div className="p-4 border border-amber-200 rounded-xl bg-amber-50/30 space-y-3">
                        <h4 className="font-bold text-sm text-amber-900">Add Counter Donation</h4>
                        <div className="grid grid-cols-4 gap-2">
                          {["General", "Annadan", "Renovation", "Festival"].map(cat => (
                            <Button
                              key={cat}
                              type="button"
                              variant={donationCategory === cat ? "default" : "outline"}
                              onClick={() => setDonationCategory(cat)}
                              className={`text-xs h-8 ${donationCategory === cat ? "bg-amber-800 hover:bg-amber-900 text-white" : ""}`}
                            >
                              {cat}
                            </Button>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Input
                            type="number"
                            placeholder="Enter amount (e.g. 501, 1001)"
                            value={donationAmount}
                            onChange={e => setDonationAmount(e.target.value)}
                            className="h-9 text-xs border-amber-300"
                          />
                          <Button onClick={handleAddDonation} className="bg-amber-800 hover:bg-amber-900 text-xs h-9 px-4 text-white">
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add
                          </Button>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {[101, 501, 1001, 2501, 5001].map(preset => (
                          <Button
                            key={preset}
                            variant="outline"
                            onClick={() => addToCart({
                              id: `don_preset_${preset}`,
                              itemType: "DONATION",
                              itemName: `Donation (₹${preset})`,
                              unitPrice: preset,
                              price: preset
                            })}
                            className="h-10 text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
                          >
                            + ₹{preset}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TICKET TAB */}
                  {activeTab === "ticket" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalog.slots.length === 0 ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">
                          <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No Darshan Slots Found</p>
                          <p className="text-xs">Create or open slots in Darshan Ticket Slots page</p>
                        </div>
                      ) : (
                        catalog.slots.map(slot => {
                          const remaining = (slot.maxCapacity || 0) - (slot.bookedCount || 0);
                          return (
                            <div key={slot.id} className="p-3 border rounded-xl bg-white hover:border-amber-400 shadow-xs transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-sm text-foreground">Darshan Pass ({slot.date || 'Today'})</h4>
                                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 font-bold shrink-0">
                                    ₹{catalog.darshanPrice || 0}
                                  </Badge>
                                </div>
                                <p className="text-xs font-mono text-slate-600 mt-1 flex items-center gap-1">
                                  <Ticket className="w-3.5 h-3.5 text-amber-700" />
                                  {slot.startTime || ''} - {slot.endTime || ''}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Available: {remaining > 0 ? `${remaining} Passes` : 'Full'}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                onClick={() => addToCart({
                                  id: slot.id,
                                  itemType: "TICKET",
                                  itemName: `Darshan Ticket Pass (${slot.startTime || 'Standard'})`,
                                  unitPrice: catalog.darshanPrice || 0,
                                  price: catalog.darshanPrice || 0,
                                  slotTime: `${slot.startTime} - ${slot.endTime}`
                                })}
                                size="sm"
                                className="mt-3 w-full bg-amber-800 hover:bg-amber-900 text-xs h-8 text-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Darshan Pass
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* PRODUCT / PRASAD TAB */}
                  {activeTab === "product" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalog.products.length === 0 ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">
                          <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No Approved Products / Prasad Found</p>
                          <p className="text-xs">Approved products added in Temple Admin will appear here</p>
                        </div>
                      ) : (
                        catalog.products
                          .filter(p => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            const pName = parseLocalizedValue(p.name).toLowerCase();
                            const pCat = parseLocalizedValue(p.category).toLowerCase();
                            return pName.includes(query) || pCat.includes(query);
                          })
                          .map(prod => {
                            const firstVariant = prod.variants?.[0];
                            const price = firstVariant ? firstVariant.price : (catalog.prasadPrice || 50);
                            const categoryName = parseLocalizedValue(prod.category) || "Products / Prasad";

                            return (
                              <div key={prod.id} className="p-3 border rounded-xl bg-white hover:border-amber-400 shadow-xs transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex gap-3 items-start">
                                    {prod.image ? (
                                      <img src={getImageUrl(prod.image)} alt={parseLocalizedValue(prod.name)} className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0" />
                                    ) : (
                                      <div className="w-14 h-14 bg-amber-100/70 rounded-lg flex items-center justify-center text-amber-900 shrink-0 font-bold text-lg">
                                        🎁
                                      </div>
                                    )}
                                    <div className="space-y-1 flex-1 min-w-0">
                                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-900 border-amber-200 py-0">
                                        {categoryName}
                                      </Badge>
                                      <h4 className="font-bold text-sm text-foreground truncate">{parseLocalizedValue(prod.name)}</h4>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-sm text-amber-900">₹{price}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => addToCart({
                                    id: prod.id,
                                    itemType: "PRODUCT",
                                    itemName: parseLocalizedValue(prod.name),
                                    unitPrice: price,
                                    price
                                  })}
                                  size="sm"
                                  className="mt-3 w-full bg-amber-800 hover:bg-amber-900 text-xs h-8 text-white"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Product / Item
                                </Button>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}

                  {/* PHOTOGRAPHY TAB (Offline Photographic Pass) */}
                  {activeTab === "photography" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalog.photoPackages.length === 0 ? (
                        <div className="col-span-2 text-center py-10 text-slate-500">
                          <Camera className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-sm">No Active Photography Packages Found</p>
                          <p className="text-xs">Create packages in Photography Settings page to list them here</p>
                        </div>
                      ) : (
                        catalog.photoPackages
                          .filter(pkg => !searchQuery || parseLocalizedValue(pkg.name).toLowerCase().includes(searchQuery.toLowerCase()))
                          .map(pkg => (
                            <div key={pkg.id} className="p-3 border rounded-xl bg-white hover:border-amber-400 shadow-xs transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex gap-3 items-start">
                                  <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center text-amber-900 shrink-0 font-bold text-lg">
                                    📷
                                  </div>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-900 border-amber-200 py-0">
                                      Offline Photo Pass
                                    </Badge>
                                    <h4 className="font-bold text-sm text-foreground truncate">{parseLocalizedValue(pkg.name)}</h4>
                                    <span className="font-bold text-sm text-amber-900">₹{pkg.price}</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-2">
                                  Duration: {pkg.duration} mins
                                </p>
                              </div>
                              <Button
                                onClick={() => addToCart({
                                  id: pkg.id,
                                  itemType: "PHOTOGRAPHY",
                                  itemName: parseLocalizedValue(pkg.name),
                                  unitPrice: pkg.price,
                                  price: pkg.price,
                                  selectedArea: "Main Courtyard"
                                })}
                                size="sm"
                                className="mt-3 w-full bg-amber-800 hover:bg-amber-900 text-xs h-8 text-white"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Photography Pass
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout Section (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-amber-300 shadow-md">
            <CardHeader className="pb-3 border-b bg-amber-50 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600" /> Current Cart ({cartItems.length})
              </CardTitle>
              {cartItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-xs text-red-600 hover:text-red-700 h-7 px-2">
                  Clear
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Item List */}
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto opacity-30 text-amber-700" />
                  <p>Your cart is empty.</p>
                  <p className="text-[11px] text-amber-700/60">Select items from the catalog on left.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((item, idx) => {
                    const itemBreakdown = commissionData.itemsBreakdown?.find(b => b.id === (item.id || item.itemId));
                    const fee = itemBreakdown ? itemBreakdown.platformFee : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold truncate text-foreground">{item.itemName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">₹{item.unitPrice} × {item.quantity}</span>
                            {fee > 0 && (
                              <Badge variant="outline" className="text-[9px] bg-amber-100/80 text-amber-900 border-amber-300 py-0 h-4">
                                Platform Fee: ₹{fee}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center border border-amber-300 rounded-lg bg-white">
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(idx, -1); }} className="p-1 hover:bg-amber-100 text-amber-900 rounded-l-lg">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-bold text-xs">{item.quantity}</span>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(idx, 1); }} className="p-1 hover:bg-amber-100 text-amber-900 rounded-r-lg">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Amount & Platform Fee Summary */}
              <div className="p-3 bg-gradient-to-r from-amber-100 to-amber-50 rounded-xl space-y-1.5 text-amber-900">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Amount:</span>
                  <span className="text-lg">₹{totalCartAmount}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-amber-200/60 pt-1.5 text-amber-900/80">
                  <span>Est. Platform Fee (Offline Slab):</span>
                  <span className="font-semibold text-amber-900">₹{commissionData.totalPlatformFee || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-800">
                  <span>Net Temple Earning:</span>
                  <span className="font-bold text-emerald-900">₹{Math.max(0, totalCartAmount - (commissionData.totalPlatformFee || 0))}</span>
                </div>
              </div>

              {/* Devotee Input Fields */}
              <div className="space-y-2.5 pt-2 border-t">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Devotee Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                  <Input
                    placeholder="Full Name *"
                    value={devotee.name}
                    onChange={e => setDevotee(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-xs border-amber-200"
                  />
                  <div className="relative">
                    <Input
                      placeholder="Phone Number *"
                      value={devotee.phone}
                      onChange={e => {
                        let val = e.target.value;
                        if (!val.startsWith("+91 ") && !val.startsWith("+91")) {
                          val = val.replace(/^\+?91\s*/, "");
                          val = val ? `+91 ${val.replace(/\D/g, "")}` : "";
                        } else {
                          val = `+91 ${val.replace(/^\+91\s*/, "").replace(/\D/g, "")}`;
                        }
                        const cleaned = val.replace(/\D/g, "").slice(2);
                        val = cleaned ? `+91 ${cleaned.slice(0, 10)}` : "";
                        
                        setDevotee(prev => ({ ...prev, phone: val }));
                        if (cleaned.length === 10) {
                           handlePhoneLookup(val);
                        }
                      }}
                      className="h-8 text-xs border-amber-200"
                      maxLength={14}
                    />
                    {isLookupLoading && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Gothra / Additional Notes (Optional)"
                  value={devotee.gothra}
                  onChange={e => setDevotee(prev => ({ ...prev, gothra: e.target.value }))}
                  className="h-8 text-xs border-amber-200"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2.5 pt-2 border-t">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">Payment Method</h4>
                <div className="grid grid-cols-3 gap-2">
                  {["CASH", "UPI", "CARD"].map(pm => (
                    <Button
                      key={pm}
                      type="button"
                      variant={paymentMethod === pm ? "default" : "outline"}
                      onClick={() => setPaymentMethod(pm)}
                      className={`text-xs h-8 font-bold ${paymentMethod === pm ? "bg-amber-800 hover:bg-amber-900 text-white" : "border-amber-200"}`}
                    >
                      {pm}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Submit Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={submitting || cartItems.length === 0}
                className="w-full bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white font-bold h-10 shadow-md"
              >
                {submitting ? "Processing..." : `Collect Payment & Print Receipt (₹${totalCartAmount})`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-lg text-amber-900 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" /> Temple Booking Successful
            </DialogTitle>
          </DialogHeader>

          {completedOrder && (
            <div className="p-4 border rounded-xl bg-amber-50/40 space-y-3 text-xs">
              <div className="text-center border-b pb-2">
                <h3 className="font-bold text-sm text-foreground">DevBhakti Temple Counter</h3>
                <p className="text-[10px] text-muted-foreground">Receipt No: {completedOrder.displayId}</p>
              </div>

              <div className="space-y-1">
                <p><strong>Devotee:</strong> {completedOrder.devoteeName} ({completedOrder.devoteePhone})</p>
                <p><strong>Payment Mode:</strong> {completedOrder.paymentMethod}</p>
                <p><strong>Date & Time:</strong> {new Date(completedOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-t pt-2 space-y-1.5">
                <p className="font-bold text-[11px]">Item Details:</p>
                {completedOrder.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{it.itemName} (x{it.quantity})</span>
                    <span className="font-semibold text-foreground">₹{it.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 flex justify-between font-bold text-sm text-amber-900">
                <span>Total Amount Paid:</span>
                <span>₹{completedOrder.totalAmount}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button onClick={() => window.print()} variant="outline" className="w-full text-xs">
              <Printer className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
            <Button onClick={() => setShowReceipt(false)} className="w-full bg-amber-800 text-xs text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
