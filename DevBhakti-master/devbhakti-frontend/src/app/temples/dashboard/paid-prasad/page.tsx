"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Save,
  Loader2,
  CheckCircle2,
  Package,
  IndianRupee,
  ShoppingBag,
  Sparkles,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchMyTempleProfile, updateMyTempleProfile } from "@/api/templeAdminController";

export default function PaidPrasadPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPaidPrasad, setHasPaidPrasad] = useState(false);
  const [prasadPrice, setPrasadPrice] = useState<string>("51");
  const [templeData, setTempleData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTempleProfile();
  }, []);

  const loadTempleProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetchMyTempleProfile();
      if (response.success && response.data) {
        const data = response.data;
        setTempleData(data);
        const currentPrice = data.prasadPrice || 0;
        if (currentPrice > 0) {
          setHasPaidPrasad(true);
          setPrasadPrice(String(currentPrice));
        } else {
          setHasPaidPrasad(false);
          setPrasadPrice("51");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load temple prasad settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const numericPrice = hasPaidPrasad ? parseFloat(prasadPrice) || 0 : 0;

      const fd = new FormData();
      fd.append("prasadPrice", String(numericPrice));

      const response = await updateMyTempleProfile(fd);

      if (response.success) {
        toast({
          title: "Prasad Settings Saved!",
          description: hasPaidPrasad
            ? `Paid Prasad enabled at ₹${numericPrice} per packet.`
            : "Paid Prasad service has been disabled.",
          variant: "success",
        });
        loadTempleProfile();
      } else {
        toast({
          title: "Save Failed",
          description: response.message || "Failed to update prasad price",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong while saving.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#7b4623]" />
        <p className="text-slate-600 font-medium">Loading Prasad configuration...</p>
      </div>
    );
  }

  const numericPrice = hasPaidPrasad ? parseFloat(prasadPrice) || 0 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen bg-slate-50/50"
    >
      {/* Header Banner - #7b4623 Temple Dashboard Theme */}
      <div className="bg-gradient-to-r from-[#7b4623] via-[#8c5029] to-[#5d351a] text-white rounded-[2rem] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Gift className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 flex-col space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-100 border border-white/20 shadow-sm">
            <Sparkles className="w-4 h-4" /> Devotee Prasad Delivery Config
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-serif tracking-tight">
            Paid Prasad Management
          </h1>
          <p className="text-amber-100/90 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
            Configure Paid Prasad pricing for your temple. When enabled, devotees booking any Pooja of this temple can request home-delivered Prasad packets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start relative z-10">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <Card className="border border-slate-100/60 shadow-sm rounded-[2rem] overflow-hidden bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#7b4623]/10 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-[#7b4623]" />
                  </span>
                  Prasad Service Status
                </CardTitle>
                <Badge
                  variant={hasPaidPrasad ? "default" : "secondary"}
                  className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest ${hasPaidPrasad ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}
                >
                  {hasPaidPrasad ? "ACTIVE" : "DISABLED"}
                </Badge>
              </div>
              <CardDescription className="text-sm text-slate-500 mt-2 font-medium">
                Toggle Paid Prasad for all Poojas offered by <span className="font-bold text-slate-700">{templeData?.name?.en || templeData?.name || "your temple"}</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-8">
              {/* Service Toggle */}
              <div className="flex items-center justify-between p-5 md:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-white transition-all shadow-sm">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="paid-prasad-toggle" className="text-lg font-black text-slate-800 cursor-pointer block">
                    Enable Paid Prasad Delivery
                  </Label>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Allow devotees to add paid prasad packets during pooja booking checkout.
                  </p>
                </div>
                <Switch
                  id="paid-prasad-toggle"
                  checked={hasPaidPrasad}
                  onCheckedChange={(checked) => setHasPaidPrasad(checked)}
                  className="data-[state=checked]:bg-[#7b4623] scale-125 mr-2"
                />
              </div>

              {/* Price Input */}
              {hasPaidPrasad && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <Label htmlFor="prasad-price" className="text-sm font-black text-slate-700 flex items-center gap-2 uppercase tracking-widest">
                      <IndianRupee className="w-4 h-4 text-[#7b4623]" />
                      Prasad Packet Price (₹) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative max-w-sm">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-xl">₹</span>
                      <Input
                        id="prasad-price"
                        type="number"
                        min="1"
                        step="1"
                        value={prasadPrice}
                        onChange={(e) => setPrasadPrice(e.target.value)}
                        placeholder="e.g. 51"
                        className="pl-10 h-14 text-xl font-black rounded-xl border-slate-200 focus:bg-white focus:ring-[#7b4623] bg-slate-50 hover:bg-white transition-colors"
                      />
                    </div>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
                      <Info className="w-4 h-4 text-[#7b4623] shrink-0" />
                      This price per packet will be multiplied by the quantity chosen by the devotee.
                    </p>
                  </div>

                  {/* Preset Price Quick Chips */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Select Price:</span>
                    <div className="flex flex-wrap gap-3">
                      {["21", "51", "101", "151", "251", "501"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPrasadPrice(val)}
                          className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all border shadow-sm ${
                            prasadPrice === val
                              ? "bg-[#7b4623] text-white border-[#7b4623] scale-105"
                              : "bg-white text-slate-600 border-slate-200 hover:border-[#7b4623]/40 hover:bg-[#7b4623]/5 hover:text-[#7b4623]"
                          }`}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <div className="pt-8 border-t border-slate-100 flex items-center justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (hasPaidPrasad && (!prasadPrice || parseFloat(prasadPrice) <= 0))}
                  className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-10 h-14 rounded-xl shadow-xl shadow-[#7b4623]/20 font-black text-base transition-all hover:scale-105 w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Saving Configuration...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" /> Save Prasad Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info & Summary Cards */}
        <div className="space-y-6 md:space-y-8">
            {/* Info Card */}
            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="bg-[#7b4623]/5 p-6 border-b border-[#7b4623]/10">
                    <div className="flex items-center gap-3 font-black text-[#7b4623] text-base">
                        <div className="w-10 h-10 rounded-full bg-[#7b4623]/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-[#7b4623]" />
                        </div>
                        How Paid Prasad Booking Works
                    </div>
                </div>
                <CardContent className="p-6">
                    <ul className="text-sm font-medium space-y-4 text-slate-600 list-none">
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-[#7b4623] flex items-center justify-center text-xs font-black shrink-0">1</span>
                        <span>When enabled, step 3 of the booking flow prominently displays the <b>"Would you like Prasad delivered to your home?"</b> option.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-[#7b4623] flex items-center justify-center text-xs font-black shrink-0">2</span>
                        <span>Devotees can explicitly choose <b>Yes (₹{numericPrice > 0 ? numericPrice : 51} per box)</b> or opt-out by selecting <b>No</b>.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-[#7b4623] flex items-center justify-center text-xs font-black shrink-0">3</span>
                        <span>Choosing <b>Yes</b> opens a clean quantity counter (enabling devotees to select 1 to 10 packets).</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">4</span>
                        <span>The total Prasad amount is instantly calculated in real-time and securely added to the final payment summary before checkout!</span>
                    </li>
                    </ul>
                </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50 rounded-[2rem] p-6 text-center group">
                <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-sm border border-slate-100 mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Need Help?</h3>
                <p className="text-sm font-medium text-slate-500 mb-4">
                    For questions about dispatching prasad or configuring courier charges, contact dev support.
                </p>
            </Card>
        </div>
      </div>
    </motion.div>
  );
}
