"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/apiConfig";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Plus, Calendar, Clock, Users, Trash2 } from "lucide-react";

export default function DarshanSlotsClient() {
  const { toast } = useToast();

  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [filterDate, setFilterDate] = useState("");

  const [formData, setFormData] = useState({
    date: "",
    startTime: "08:00",
    endTime: "09:00",
    maxCapacity: "500",
  });

  const fetchSlots = async (dateFilter: string = "") => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/temple-admin/darshan/slots${dateFilter ? `?date=${dateFilter}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSlots(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set initial filter to today
    const today = new Date().toISOString().split('T')[0];
    setFilterDate(today);
    setFormData(prev => ({ ...prev, date: today }));
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
        startDate: formData.date,
        endDate: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxCapacity: parseInt(formData.maxCapacity)
      };

      const res = await fetch(`${API_URL}/temple-admin/darshan/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: json.message, variant: "success" });
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
      const res = await fetch(`${API_URL}/temple-admin/darshan/slots/${id}`, {
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Slots</h1>
          <p className="text-muted-foreground mt-1">Create and manage Darshan time slots.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Slots Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Create Slot</CardTitle>
            <CardDescription>Manually create a specific time slot.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSlots} className="space-y-4">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Time</Label>
                  <Input 
                    type="time" 
                    value={formData.startTime} 
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>End Time</Label>
                  <Input 
                    type="time" 
                    value={formData.endTime} 
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Max Capacity</Label>
                <Input 
                  type="number" 
                  min="1"
                  value={formData.maxCapacity} 
                  onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Slot
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Slots */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Existing Slots</CardTitle>
              <CardDescription>View and manage generated slots.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm text-muted-foreground">Filter Date:</Label>
              <Input 
                type="date" 
                value={filterDate}
                onChange={handleFilterChange}
                className="w-auto h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No slots found for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="border rounded-xl p-3 bg-white hover:border-primary/50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold flex items-center gap-1.5 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <button 
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(slot.date), "dd MMM yyyy")}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {slot.bookedCount}/{slot.maxCapacity}</span>
                    </div>
                    
                    {/* Progress bar for capacity */}
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                       <div 
                         className={`h-full rounded-full ${slot.bookedCount >= slot.maxCapacity ? 'bg-red-500' : 'bg-primary'}`}
                         style={{ width: `${Math.min(100, (slot.bookedCount / slot.maxCapacity) * 100)}%` }}
                       />
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
