"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Loader2, Plus, Calendar, Clock, Users, Trash2, ArrowLeft, Layers, Pencil } from "lucide-react";
import { formatSlotTime } from "@/utils/textUtils";
import { useRouter } from "next/navigation";

export default function MandalDarshanSlotsPage() {
  const { toast } = useToast();
  const router = useRouter();

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filter mode: "ALL" shows all created slots; "DATE" filters by selected date
  const [filterMode, setFilterMode] = useState<"ALL" | "DATE">("ALL");
  const [filterDate, setFilterDate] = useState("");

  // Create form state
  const [formData, setFormData] = useState({
    startDate: getTodayString(),
    endDate: getTodayString(),
    title: "General Darshan Ticket",
    price: "0",
    startTime: "08:00",
    endTime: "09:00",
    maxCapacity: "500",
  });

  // Edit form modal state
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    date: "",
    title: "",
    price: "0",
    maxCapacity: "500",
    startTime: "08:00",
    endTime: "09:00",
    isClosed: false,
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
      console.error("Failed to fetch slots", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch: Load all slots so the Mandal admin sees all created slots right away
    fetchSlots("");
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setFilterDate(dateVal);
    if (dateVal) {
      setFilterMode("DATE");
      fetchSlots(dateVal);
    } else {
      setFilterMode("ALL");
      fetchSlots("");
    }
  };

  const handleShowAllSlots = () => {
    setFilterDate("");
    setFilterMode("ALL");
    fetchSlots("");
  };

  const handleShowTodaySlots = () => {
    const today = getTodayString();
    setFilterDate(today);
    setFilterMode("DATE");
    fetchSlots(today);
  };

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault();

    const todayStr = getTodayString();

    // 1. Validation: Start Date
    if (!formData.startDate) {
      toast({ title: "Validation Error", description: "Start Date is required", variant: "destructive" });
      return;
    }
    if (formData.startDate < todayStr) {
      toast({ title: "Validation Error", description: "Start Date cannot be in the past.", variant: "destructive" });
      return;
    }

    // 2. Validation: End Date
    if (!formData.endDate) {
      toast({ title: "Validation Error", description: "End Date is required", variant: "destructive" });
      return;
    }
    if (formData.endDate < formData.startDate) {
      toast({ title: "Validation Error", description: "End Date cannot be before Start Date.", variant: "destructive" });
      return;
    }

    // 3. Validation: Time check for same day
    if (formData.startDate === formData.endDate && formData.endTime <= formData.startTime) {
      toast({ title: "Validation Error", description: "End Time must be after Start Time for same-day slots.", variant: "destructive" });
      return;
    }

    // 4. Validation: Price & Max Capacity
    const priceVal = parseFloat(formData.price || "0");
    if (isNaN(priceVal) || priceVal < 0) {
      toast({ title: "Validation Error", description: "Price cannot be negative", variant: "destructive" });
      return;
    }

    const capVal = parseInt(formData.maxCapacity || "0");
    if (isNaN(capVal) || capVal <= 0) {
      toast({ title: "Validation Error", description: "Max Capacity must be at least 1", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        title: formData.title,
        price: priceVal,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxCapacity: capVal
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
        // Automatically display all created slots after creation
        handleShowAllSlots();
      } else {
        toast({ title: "Error", description: json.error || "Failed to create slots", variant: "destructive" });
      }
    } catch (err) {
      console.error("Create slots error", err);
      toast({ title: "Error", description: "An error occurred while creating slots", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditModal = (slot: any) => {
    setEditingSlot(slot);
    setEditFormData({
      date: slot.date || getTodayString(),
      title: slot.title || "General Darshan Ticket",
      price: String(slot.price ?? 0),
      maxCapacity: String(slot.maxCapacity ?? 500),
      startTime: slot.startTime || "08:00",
      endTime: slot.endTime || "09:00",
      isClosed: Boolean(slot.isClosed),
    });
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const todayStr = getTodayString();

    if (!editFormData.date) {
      toast({ title: "Validation Error", description: "Date is required", variant: "destructive" });
      return;
    }

    if (editFormData.date < todayStr) {
      toast({ title: "Validation Error", description: "Date cannot be in the past.", variant: "destructive" });
      return;
    }

    if (editFormData.endTime <= editFormData.startTime) {
      toast({ title: "Validation Error", description: "End Time must be after Start Time.", variant: "destructive" });
      return;
    }

    const priceVal = parseFloat(editFormData.price || "0");
    if (isNaN(priceVal) || priceVal < 0) {
      toast({ title: "Validation Error", description: "Price cannot be negative", variant: "destructive" });
      return;
    }

    const capVal = parseInt(editFormData.maxCapacity || "0");
    if (isNaN(capVal) || capVal <= 0) {
      toast({ title: "Validation Error", description: "Max Capacity must be at least 1", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/mandal-admin/darshan-bookings/slots/${editingSlot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: editFormData.date,
          title: editFormData.title,
          price: priceVal,
          maxCapacity: capVal,
          startTime: editFormData.startTime,
          endTime: editFormData.endTime,
          isClosed: editFormData.isClosed,
        })
      });

      const json = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: json.message || "Slot updated successfully", variant: "success" });
        setEditingSlot(null);
        fetchSlots(filterMode === "DATE" ? filterDate : "");
      } else {
        toast({ title: "Error", description: json.error || "Failed to update slot", variant: "destructive" });
      }
    } catch (err) {
      console.error("Update slot error", err);
      toast({ title: "Error", description: "Failed to update slot", variant: "destructive" });
    } finally {
      setIsUpdating(false);
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
        fetchSlots(filterMode === "DATE" ? filterDate : "");
      } else {
        const json = await res.json();
        toast({ title: "Error", description: json.error || "Failed to delete slot", variant: "destructive" });
      }
    } catch (err) {
      console.error("Delete slot error", err);
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
            <CardDescription>Manually create specific time slot(s) for devotees.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSlots} className="space-y-4">
              <div className="space-y-1">
                <Label>Ticket Title / Type *</Label>
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
                  <Label>Ticket Price (₹) *</Label>
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
                  <Label>Max Capacity *</Label>
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
                  <Label>Start Date *</Label>
                  <Input 
                    type="date" 
                    min={getTodayString()}
                    value={formData.startDate} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        startDate: val,
                        endDate: !prev.endDate || prev.endDate < val ? val : prev.endDate
                      }));
                    }}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Date *</Label>
                  <Input 
                    type="date" 
                    min={formData.startDate || getTodayString()}
                    value={formData.endDate} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && formData.startDate && val < formData.startDate) {
                        toast({
                          title: "Invalid Date",
                          description: "End Date cannot be before Start Date.",
                          variant: "destructive"
                        });
                        return;
                      }
                      setFormData(prev => ({ ...prev, endDate: val }));
                    }}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Time *</Label>
                  <Input 
                    type="time" 
                    value={formData.startTime} 
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Time *</Label>
                  <Input 
                    type="time" 
                    value={formData.endTime} 
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl h-11 font-bold shadow-md" disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Slot
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Slots */}
        <Card className="md:col-span-2 shadow-sm border rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7b4623]" /> Existing Slots ({slots.length})
              </CardTitle>
              <CardDescription>View and manage generated slots for your Mandal.</CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={filterMode === "ALL" ? "default" : "outline"}
                onClick={handleShowAllSlots}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-colors ${
                  filterMode === "ALL" ? "bg-[#7b4623] text-white hover:bg-[#5d351a]" : "border-slate-300 text-slate-700"
                }`}
              >
                All Slots
              </Button>

              <Button
                type="button"
                size="sm"
                variant={filterMode === "DATE" && filterDate === getTodayString() ? "default" : "outline"}
                onClick={handleShowTodaySlots}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition-colors ${
                  filterMode === "DATE" && filterDate === getTodayString() ? "bg-[#7b4623] text-white hover:bg-[#5d351a]" : "border-slate-300 text-slate-700"
                }`}
              >
                Today
              </Button>

              <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2 py-1 bg-white text-xs shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <Input 
                  type="date" 
                  value={filterDate}
                  onChange={handleFilterChange}
                  className="w-32 h-6 border-0 p-0 text-xs shadow-none focus-visible:ring-0"
                  placeholder="Select Date"
                />
                {filterDate && (
                  <button
                    type="button"
                    onClick={handleShowAllSlots}
                    className="text-slate-400 hover:text-slate-700 font-extrabold text-sm ml-1 px-1"
                    title="Clear Date Filter"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#7b4623]" />
                <span className="text-xs font-medium">Loading slots...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center p-10 text-muted-foreground bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-700 text-sm">
                  {filterDate ? `No slots found for ${format(new Date(filterDate), "dd MMM yyyy")}.` : "No slots created yet."}
                </p>
                <p className="text-xs text-slate-400">
                  {filterDate ? "Click 'All Slots' above or create a new slot on the left." : "Use the form on the left to create slots."}
                </p>
                {filterDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShowAllSlots}
                    className="mt-2 text-xs border-[#7b4623]/30 text-[#7b4623] hover:bg-amber-50 rounded-xl font-bold"
                  >
                    View All Created Slots
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div key={slot.id} className={`border rounded-xl p-3.5 bg-white transition-all group relative shadow-sm flex flex-col justify-between ${
                    slot.isClosed ? "border-red-200 bg-red-50/20" : "hover:border-[#7b4623]/50"
                  }`}>
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#7b4623] block truncate">
                              {slot.title || "General Darshan Ticket"}
                            </span>
                            {slot.isClosed && (
                              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                                CLOSED
                              </span>
                            )}
                          </div>
                          <div className="font-semibold flex items-center gap-1.5 text-xs text-slate-900 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#7b4623]" />
                            {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenEditModal(slot)}
                              className="text-slate-500 hover:text-[#7b4623] transition-colors p-1 hover:bg-amber-50 rounded"
                              title="Edit Slot"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="bg-amber-100 text-[#7b4623] text-[11px] font-black px-2 py-0.5 rounded-full shrink-0">
                            ₹{slot.price ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {slot.date ? format(new Date(slot.date), "dd MMM yyyy") : ""}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Users className="w-3 h-3 text-slate-400" /> {slot.bookedCount}/{slot.maxCapacity} Booked
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            slot.maxCapacity - slot.bookedCount <= 0 
                              ? "bg-red-100 text-red-700" 
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {Math.max(0, slot.maxCapacity - slot.bookedCount)} Left
                          </span>
                        </div>
                      </div>

                      {/* Capacity progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${slot.bookedCount >= slot.maxCapacity ? 'bg-red-500' : 'bg-[#7b4623]'}`}
                          style={{ width: `${Math.min(100, (slot.bookedCount / slot.maxCapacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Slot Dialog Modal */}
      <Dialog open={Boolean(editingSlot)} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Darshan Slot</DialogTitle>
            <DialogDescription>
              Update ticket details, date, times, capacity, or toggle slot status.
            </DialogDescription>
          </DialogHeader>

          {editingSlot && (
            <form onSubmit={handleUpdateSlot} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Ticket Title / Type *</Label>
                <Input 
                  type="text" 
                  value={editFormData.title} 
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Ticket Price (₹) *</Label>
                  <Input 
                    type="number"
                    min="0" 
                    value={editFormData.price} 
                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="rounded-xl font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Max Capacity *</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={editFormData.maxCapacity} 
                    onChange={(e) => setEditFormData({ ...editFormData, maxCapacity: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  min={getTodayString()}
                  value={editFormData.date} 
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Time *</Label>
                  <Input 
                    type="time" 
                    value={editFormData.startTime} 
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Time *</Label>
                  <Input 
                    type="time" 
                    value={editFormData.endTime} 
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <Label className="font-bold text-slate-800 text-sm block">Slot Booking Status</Label>
                  <p className="text-xs text-slate-500">Temporarily close booking for this slot</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {editFormData.isClosed ? "Closed" : "Active"}
                  </span>
                  <Switch 
                    checked={editFormData.isClosed} 
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, isClosed: checked })} 
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSlot(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl font-bold"
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
