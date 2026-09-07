"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Plus, Calendar, Clock, Users, Trash2, ArrowLeft } from "lucide-react";
import { formatSlotTime } from "@/utils/textUtils";
import { useRouter } from "next/navigation";

export default function MandalDarshanSlotsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [filterDate, setFilterDate] = useState("");

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    title: "General Darshan Ticket",
    price: "0",
    startTime: "08:00",
    endTime: "09:00",
    maxCapacity: "500",
  });

  const fetchSlots = async (dateFilter: string = "") => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/mandal-admin/darshan-bookings/slots${dateFilter ? `?date=${dateFilter}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSlots(Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFilterDate(today);
    setFormData(prev => ({ ...prev, startDate: today, endDate: today }));
    fetchSlots(today);
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDate(e.target.value);
    fetchSlots(e.target.value);
  };

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        title: formData.title,
        price: parseFloat(formData.price || "0"),
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxCapacity: parseInt(formData.maxCapacity)
      };

      const res = await fetch(`${API_URL}/mandal-admin/darshan-bookings/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: json.message || "Slots created successfully", variant: "success" });
        fetchSlots(filterDate);
      } else {
        toast({ title: "Error", description: json.error || "Failed to create slots", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/mandal-admin/darshan-bookings/slots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast({ title: "Deleted", description: "Slot deleted successfully.", variant: "success" });
        fetchSlots(filterDate);
      } else {
        const json = await res.json();
        toast({ title: "Error", description: json.error || "Failed to delete slot", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Manage Darshan Slots</h1>
          <p className="text-muted-foreground mt-1">Create and manage Darshan time slots with Ticket Types & Pricing for your Mandal.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Slots Form */}
        <Card className="md:col-span-1 shadow-sm border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Create Slot</CardTitle>
            <CardDescription>Manually create a specific time slot for devotees.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSlots} className="space-y-4">
              <div className="space-y-1">
                <Label>Ticket Title / Type</Label>
                <Input 
                  type="text" 
                  placeholder="e.g. General Darshan, Special VIP Pass, Maha Aarti"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Ticket Price (₹)</Label>
                  <Input 
                    type="number"
                    min="0" 
                    placeholder="0"
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="rounded-xl font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max Capacity</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={formData.maxCapacity} 
                    onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Time</Label>
                  <Input 
                    type="time" 
                    value={formData.startTime} 
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Time</Label>
                  <Input 
                    type="time" 
                    value={formData.endTime} 
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl h-11" disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Slot
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Slots */}
        <Card className="md:col-span-2 shadow-sm border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Existing Slots</CardTitle>
              <CardDescription>View and manage generated slots.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-xs uppercase font-bold text-muted-foreground">Filter Date:</Label>
              <Input 
                type="date" 
                value={filterDate}
                onChange={handleFilterChange}
                className="w-auto h-9 rounded-xl text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#7b4623]" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No slots found for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="border rounded-xl p-3.5 bg-white hover:border-[#7b4623]/50 transition-colors group relative shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#7b4623] block truncate">
                            {slot.title || "General Darshan Ticket"}
                          </span>
                          <div className="font-semibold flex items-center gap-1.5 text-xs text-slate-900 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#7b4623]" />
                            {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button 
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <span className="bg-amber-100 text-[#7b4623] text-[11px] font-black px-2 py-0.5 rounded-full shrink-0">
                            ₹{slot.price ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {slot.date ? format(new Date(slot.date), "dd MMM yyyy") : ""}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3 h-3 text-slate-400" /> {slot.bookedCount}/{slot.maxCapacity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
