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
      className="max-w-4xl mx-auto space-y-8 pb-16 px-4"
    >
      {/* Header Banner - #7b4623 Temple Dashboard Theme */}
      <div className="bg-gradient-to-r from-[#7b4623] via-[#8c5029] to-[#5d351a] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-8 -translate-y-8">
          <Gift className="w-72 h-72 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-amber-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" /> Devotee Prasad Delivery Config
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif">
            Paid Prasad Management
          </h1>
          <p className="text-amber-100/90 text-sm max-w-xl leading-relaxed">
            Configure Paid Prasad pricing for your temple. When enabled, devotees booking any Pooja of this temple can request home-delivered Prasad packets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Main Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-[#7b4623]/20 shadow-md rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[#7b4623]/5 border-b border-[#7b4623]/15 p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#7b4623]" />
                  Prasad Service Status
                </CardTitle>
                <Badge
                  variant={hasPaidPrasad ? "default" : "secondary"}
                  className={hasPaidPrasad ? "bg-[#7b4623] text-white" : "bg-slate-200 text-slate-600"}
                >
                  {hasPaidPrasad ? "ACTIVE" : "DISABLED"}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Toggle Paid Prasad for all Poojas offered by {templeData?.name?.en || templeData?.name || "your temple"}.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Service Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="space-y-0.5">
                  <Label htmlFor="paid-prasad-toggle" className="text-base font-semibold text-slate-800 cursor-pointer">
                    Enable Paid Prasad Delivery
                  </Label>
                  <p className="text-xs text-slate-500">
                    Allow devotees to add paid prasad packets during pooja booking
                  </p>
                </div>
                <Switch
                  id="paid-prasad-toggle"
                  checked={hasPaidPrasad}
                  onCheckedChange={(checked) => setHasPaidPrasad(checked)}
                  className="data-[state=checked]:bg-[#7b4623]"
                />
              </div>

              {/* Price Input */}
              {hasPaidPrasad && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="prasad-price" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-[#7b4623]" />
                      Prasad Packet Price (₹) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
                      <Input
                        id="prasad-price"
                        type="number"
                        min="1"
                        step="1"
                        value={prasadPrice}
                        onChange={(e) => setPrasadPrice(e.target.value)}
                        placeholder="e.g. 51"
                        className="pl-8 h-12 text-lg font-bold font-mono rounded-xl border-slate-300 focus-visible:ring-[#7b4623]"
                      />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Info className="w-3.5 h-3.5 text-[#7b4623] shrink-0" />
                      This price per packet will be multiplied by the quantity chosen by the devotee.
                    </p>
                  </div>

                  {/* Preset Price Quick Chips */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-500">Quick Select Price:</span>
                    <div className="flex flex-wrap gap-2">
                      {["21", "51", "101", "151", "201", "501"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPrasadPrice(val)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            prasadPrice === val
                              ? "bg-[#7b4623] text-white border-[#7b4623] shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-[#7b4623]/40 hover:bg-[#7b4623]/5"
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
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || (hasPaidPrasad && (!prasadPrice || parseFloat(prasadPrice) <= 0))}
                  className="bg-[#7b4623] hover:bg-[#5d351a] text-white px-8 h-12 rounded-xl shadow-lg shadow-[#7b4623]/20 font-bold text-sm transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Prasad Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-[#7b4623]/20 bg-[#7b4623]/5 rounded-2xl p-4 md:p-6 text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#7b4623] text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#7b4623]" />
              How Paid Prasad Booking Works for Devotees
            </div>
            <ul className="text-xs space-y-1.5 text-slate-600 pl-6 list-disc">
              <li>When enabled, step 3 of booking shows <b>"Would you like Prasad delivered to your home?"</b> option.</li>
              <li>Devotees can choose <b>Yes (₹{numericPrice > 0 ? numericPrice : 51} per box)</b> or <b>No</b>.</li>
              <li>Choosing <b>Yes</b> displays a quantity counter (1 to 10 packets).</li>
              <li>Prasad total amount is automatically calculated and added to the booking payment summary.</li>
            </ul>
          </Card>
        </div>

        {/* Live Preview Sidebar Card */}
     
      </div>
    </motion.div>
  );
}
