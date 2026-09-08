"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Edit3,
  Save,
  Loader2,
  Flame,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchMandalProfile, updateMandalProfile } from "@/api/mandalAdminController";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const PERIODS = ["PM", "AM"]; // PM first since most evening/dusk Aartis are common

export default function DedicatedMandalAartiPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aartiTimings, setAartiTimings] = useState<Array<{ id: string; name: string; time: string }>>([]);

  // Form states for Add
  const [aartiNameInput, setAartiNameInput] = useState("");
  const [selectedHour, setSelectedHour] = useState("7");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("PM");

  // Edit states
  const [editingAartiId, setEditingAartiId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState("");
  const [editHour, setEditHour] = useState("7");
  const [editMinute, setEditMinute] = useState("00");
  const [editPeriod, setEditPeriod] = useState("PM");

  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetchMandalProfile();
      if (res.success && res.data) {
        if (res.data.aartiTimings && Array.isArray(res.data.aartiTimings)) {
          setAartiTimings(res.data.aartiTimings);
        }
      }
    } catch (error) {
      console.error("Failed to load mandal profile for Aarti page", error);
      toast({ title: "Error", description: "Failed to load Aarti data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeString = (hour: string, minute: string, period: string) => {
    const formattedHour = hour.padStart(2, "0");
    if (minute === "00") {
      return `${formattedHour}:00 ${period}`;
    }
    return `${formattedHour}:${minute} ${period}`;
  };

  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return { hour: "7", minute: "00", period: "PM" };
    const match = timeStr.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
    if (match) {
      return {
        hour: String(parseInt(match[1], 10)),
        minute: match[2] || "00",
        period: match[3].toUpperCase()
      };
    }
    return { hour: "7", minute: "00", period: "PM" };
  };

  const handleAddAarti = () => {
    const trimmedName = aartiNameInput.trim();
    if (!trimmedName) {
      toast({
        title: "Validation Error",
        description: "Please enter the Aarti Name.",
        variant: "destructive",
      });
      return;
    }

    const formattedTime = formatTimeString(selectedHour, selectedMinute, selectedPeriod);

    const newEntry = {
      id: Date.now().toString(),
      name: trimmedName,
      time: formattedTime,
    };

    setAartiTimings((prev) => [...prev, newEntry]);
    setAartiNameInput("");
    toast({ title: "Added to Schedule", description: `${trimmedName} at ${formattedTime} added.` });
  };

  const handleStartEdit = (item: { id: string; name: string; time: string }) => {
    setEditingAartiId(item.id);
    setEditNameInput(item.name);
    const parsed = parseTimeString(item.time);
    setEditHour(parsed.hour);
    setEditMinute(parsed.minute);
    setEditPeriod(parsed.period);
  };

  const handleSaveEdit = () => {
    const trimmedName = editNameInput.trim();
    if (!trimmedName) {
      toast({
        title: "Validation Error",
        description: "Please enter the Aarti Name.",
        variant: "destructive",
      });
      return;
    }

    const formattedTime = formatTimeString(editHour, editMinute, editPeriod);

    setAartiTimings((prev) =>
      prev.map((item) =>
        item.id === editingAartiId ? { ...item, name: trimmedName, time: formattedTime } : item
      )
    );
    setEditingAartiId(null);
    toast({ title: "Updated", description: "Aarti timing updated." });
  };

  const handleDeleteAarti = (id: string) => {
    setAartiTimings((prev) => prev.filter((item) => item.id !== id));
    toast({ title: "Removed", description: "Aarti timing removed." });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("aartiTimings", JSON.stringify(aartiTimings));

      const res = await updateMandalProfile(fd);
      if (res.success) {
        toast({
          title: "Schedule Saved! 🙏",
          description: "Mandal Aarti timings have been saved and updated on your public page.",
        });
        loadProfile();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to save Aarti timings.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Something went wrong while saving.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const SelectClass =
    "w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623] transition-all font-semibold text-slate-800";
  const InputClass =
    "w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20 focus:border-[#7b4623] transition-all";
  const LabelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#7b4623]" />
          <p className="text-sm text-muted-foreground">Loading Aarti schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#7b4623] shrink-0">
            <Flame className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623] flex items-center gap-2">
              Aarti Timings (आरती का समय)
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Type Aarti name and select time from dropdowns to configure daily schedule.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-[#7b4623] hover:bg-[#5d351a] text-white font-bold shadow-md rounded-xl px-6 h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add New Aarti Card */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
          <Plus className="w-5 h-5 text-[#7b4623]" />
          <span>Add New Aarti Timing (नया आरती समय जोड़ें)</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/70 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* 1. Aarti Name Text Input */}
            <div className="md:col-span-6">
              <Label className={LabelClass}>Aarti Name (आरती का नाम) *</Label>
              <Input
                type="text"
                value={aartiNameInput}
                onChange={(e) => setAartiNameInput(e.target.value)}
                placeholder="e.g. Sandhya Aarti, Kakad Aarti, Maha Aarti"
                className={InputClass}
              />
            </div>

            {/* 2. Clean Time Dropdowns (Hours 1-12, Minutes :00-:55, AM/PM) */}
            <div className="md:col-span-6">
              <Label className={LabelClass}>Aarti Time (आरती का समय) *</Label>
              <div className="grid grid-cols-3 gap-2">
                {/* Hours */}
                <div>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className={SelectClass}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minutes */}
                <div>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className={SelectClass}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        :{m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM/PM */}
                <div>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className={`${SelectClass} font-bold text-amber-900 bg-amber-100/70 border-amber-300`}
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Time Preview Badge & Add Button */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
            <div className="text-xs text-amber-900 font-semibold flex items-center gap-2">
              <span>Selected Time Preview:</span>
              <Badge className="bg-amber-600 text-white font-bold text-xs px-3 py-1 rounded-lg">
                ⏰ {formatTimeString(selectedHour, selectedMinute, selectedPeriod)}
              </Badge>
            </div>

            <Button
              type="button"
              onClick={handleAddAarti}
              className="bg-[#7b4623] hover:bg-[#5d351a] text-white font-bold h-10 px-6 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add to Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduled Aartis List */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Configured Aarti Schedule ({aartiTimings.length})</span>
          </div>
          <Badge className="bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
            {aartiTimings.length} Active Timings
          </Badge>
        </div>

        {aartiTimings.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <Flame className="w-10 h-10 text-amber-500/50 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Aarti Timings Added</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Type Aarti name and select time from dropdowns above to display daily schedule to devotees.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {aartiTimings.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 bg-slate-50/70 hover:bg-amber-50/30 border border-slate-200 hover:border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                {editingAartiId === item.id ? (
                  <div className="flex-1 space-y-3 bg-white p-4 rounded-xl border border-amber-300">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <Label className={LabelClass}>Aarti Name</Label>
                        <Input
                          type="text"
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          placeholder="Aarti Name"
                          className={InputClass}
                        />
                      </div>

                      <div className="md:col-span-6">
                        <Label className={LabelClass}>Aarti Time</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={editHour}
                            onChange={(e) => setEditHour(e.target.value)}
                            className={SelectClass}
                          >
                            {HOURS.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editMinute}
                            onChange={(e) => setEditMinute(e.target.value)}
                            className={SelectClass}
                          >
                            {MINUTES.map((m) => (
                              <option key={m} value={m}>
                                :{m}
                              </option>
                            ))}
                          </select>

                          <select
                            value={editPeriod}
                            onChange={(e) => setEditPeriod(e.target.value)}
                            className={SelectClass}
                          >
                            {PERIODS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        type="button"
                        onClick={handleSaveEdit}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 text-xs rounded-xl"
                      >
                        Update
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setEditingAartiId(null)}
                        variant="outline"
                        className="h-9 px-4 text-xs rounded-xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#7b4623] flex items-center justify-center font-bold shrink-0">
                        <Flame className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs font-semibold text-amber-800 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        variant="outline"
                        className="h-9 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border-slate-200"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" /> Edit
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDeleteAarti(item.id)}
                        variant="outline"
                        className="h-9 px-3 text-xs font-bold text-red-600 hover:bg-red-50 border-red-200 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
