"use client";

import React, { useState, useEffect } from "react";
import { fetchMyTempleProfile } from "@/api/templeAdminController";
import { API_URL } from "@/config/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Ticket, IndianRupee, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useRouter } from "next/navigation";

export default function DarshanOverviewClient() {
  const { hasPermission } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDarshanActive, setIsDarshanActive] = useState(false);
  const [darshanPrice, setDarshanPrice] = useState("0");

  useEffect(() => {
    // Basic permission check
    // If we had a specific permission for darshan, we'd check it here. 
    // Assuming standard access for now, as it's part of temple config.
    
    const loadProfile = async () => {
      try {
        const res = await fetchMyTempleProfile();
        if (res && res.success && res.data) {
          setIsDarshanActive(res.data.isDarshanActive || false);
          setDarshanPrice(res.data.darshanPrice ? res.data.darshanPrice.toString() : "0");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/temple-admin/darshan/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isDarshanActive,
          darshanPrice: parseFloat(darshanPrice) || 0
        })
      });

      const json = await res.json();
      if (res.ok) {
        toast({ title: "Settings Updated", description: "Darshan settings saved successfully.", variant: "success" });
      } else {
        toast({ title: "Error", description: json.error || "Failed to update settings.", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Darshan Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your temple's Darshan passes availability and pricing.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" /> Availability
            </CardTitle>
            <CardDescription>Enable or disable Darshan pass bookings for devotees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border p-4 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Enable Darshan</Label>
                <p className="text-sm text-muted-foreground">Devotees can book time slots.</p>
              </div>
              <Switch
                checked={isDarshanActive}
                onCheckedChange={setIsDarshanActive}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Base Price per Pass (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  value={darshanPrice}
                  onChange={(e) => setDarshanPrice(e.target.value)}
                  className="pl-9 h-12 rounded-xl"
                  placeholder="e.g. 100"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Set to 0 for free darshan passes (Not recommended as per rules, all darshan should be paid).</p>
            </div>

            <Button 
              className="w-full h-12 rounded-xl font-bold" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
