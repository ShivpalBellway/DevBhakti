"use client";

import React, { useEffect, useState } from "react";
import { Camera, Plus, Trash2, Edit, Check, X, Clock, MapPin, Tag, ShieldAlert, Sparkles, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_URL } from "@/config/apiConfig";
import { parseLocalizedValue } from "@/utils/textUtils";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    fetchPhotoSettings,
    updatePhotoSettings,
    createPhotoPackage,
    updatePhotoPackage,
    deletePhotoPackage,
    createPhotoSlot,
    updatePhotoSlot,
    deletePhotoSlot,
    fetchPhotoBookings
} from "@/api/photoAdminController";

export default function PhotographySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(false);
    const [allowedAreas, setAllowedAreas] = useState<string[]>([]);
    const [newAreaInput, setNewAreaInput] = useState("");
    const [rules, setRules] = useState<string[]>([]);
    const [newRuleInput, setNewRuleInput] = useState("");

    const [packages, setPackages] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);

    // Package modal / inline form state
    const [pkgModalOpen, setPkgModalOpen] = useState(false);
    const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
    const [pkgName, setPkgName] = useState("");
    const [pkgCategory, setPkgCategory] = useState("PERSONAL");
    const [pkgPrice, setPkgPrice] = useState("500");
    const [pkgDuration, setPkgDuration] = useState("60 mins");
    const [pkgDesc, setPkgDesc] = useState("");

    // Slot modal / inline form state
    const [slotModalOpen, setSlotModalOpen] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [slotStartTime, setSlotStartTime] = useState("09:00 AM");
    const [slotEndTime, setSlotEndTime] = useState("10:00 AM");
    const [slotCapacity, setSlotCapacity] = useState("5");

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchPhotoSettings();
            if (res.success && res.data) {
                const d = res.data;
                setIsEnabled(d.photographyEnabled ?? d.isEnabled ?? false);
                setAllowedAreas(d.allowedPhotoAreas || d.allowedAreas || []);
                setRules(d.photographyRules || d.rules || []);
            }
            const token = localStorage.getItem("token") || localStorage.getItem("admin_token");
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch packages, slots and bookings independently
            const pkgRes = await axios.get(`${API_URL}/temple-admin/photography/packages`, { headers });
            if (pkgRes.data?.success) setPackages(pkgRes.data.data || []);

            const slotRes = await axios.get(`${API_URL}/temple-admin/photography/slots`, { headers });
            if (slotRes.data?.success) setSlots(slotRes.data.data || []);

            const bkRes = await fetchPhotoBookings();
            if (bkRes.success) setBookings(bkRes.data || []);
        } catch (error: any) {
            toast.error("Failed to load photography settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSaveGeneralSettings = async (enabledState = isEnabled, areas = allowedAreas, rulesList = rules) => {
        try {
            const res = await updatePhotoSettings({
                isEnabled: enabledState,
                allowedAreas: areas,
                rules: rulesList
            });
            if (res.success) {
                toast.success("Settings updated successfully");
            }
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    const handleAddArea = () => {
        if (!newAreaInput.trim()) return;
        const updated = [...allowedAreas, newAreaInput.trim()];
        setAllowedAreas(updated);
        setNewAreaInput("");
        handleSaveGeneralSettings(isEnabled, updated, rules);
    };

    const handleRemoveArea = (index: number) => {
        const updated = allowedAreas.filter((_, i) => i !== index);
        setAllowedAreas(updated);
        handleSaveGeneralSettings(isEnabled, updated, rules);
    };

    const handleAddRule = () => {
        if (!newRuleInput.trim()) return;
        const updated = [...rules, newRuleInput.trim()];
        setRules(updated);
        setNewRuleInput("");
        handleSaveGeneralSettings(isEnabled, allowedAreas, updated);
    };

    const handleRemoveRule = (index: number) => {
        const updated = rules.filter((_, i) => i !== index);
        setRules(updated);
        handleSaveGeneralSettings(isEnabled, allowedAreas, updated);
    };

    const handleSavePackage = async () => {
        if (!pkgName.trim()) {
            toast.error("Package name is required");
            return;
        }
        try {
            const payload = {
                name: pkgName,
                category: pkgCategory,
                price: parseFloat(pkgPrice),
                duration: pkgDuration,
                description: pkgDesc
            };

            if (editingPkgId) {
                await updatePhotoPackage(editingPkgId, payload);
                toast.success("Package updated");
            } else {
                await createPhotoPackage(payload);
                toast.success("Package created");
            }
            setPkgModalOpen(false);
            resetPkgForm();
            loadData();
        } catch (error) {
            toast.error("Failed to save package");
        }
    };

    const handleDeletePackage = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;
        try {
            await deletePhotoPackage(id);
            toast.success("Package deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete package");
        }
    };

    const resetPkgForm = () => {
        setEditingPkgId(null);
        setPkgName("");
        setPkgCategory("PERSONAL");
        setPkgPrice("500");
        setPkgDuration("60 mins");
        setPkgDesc("");
    };

    const openEditPkg = (pkg: any) => {
        setEditingPkgId(pkg.id);
        setPkgName(typeof pkg.name === 'object' ? parseLocalizedValue(pkg.name) : pkg.name);
        setPkgCategory(pkg.category || "PERSONAL");
        setPkgPrice(pkg.price.toString());
        setPkgDuration(pkg.duration.toString());
        setPkgDesc(typeof pkg.description === 'object' ? parseLocalizedValue(pkg.description) : (pkg.description || ""));
        setPkgModalOpen(true);
    };

    const handleSaveSlot = async () => {
        try {
            const payload = {
                startTime: slotStartTime,
                endTime: slotEndTime,
                maxCapacity: parseInt(slotCapacity) || 5
            };
            if (editingSlotId) {
                await updatePhotoSlot(editingSlotId, payload);
                toast.success("Slot updated");
            } else {
                await createPhotoSlot(payload);
                toast.success("Slot created");
            }
            setSlotModalOpen(false);
            resetSlotForm();
            loadData();
        } catch (error) {
            toast.error("Failed to save time slot");
        }
    };

    const handleDeleteSlot = async (id: string) => {
        if (!confirm("Delete this time slot?")) return;
        try {
            await deletePhotoSlot(id);
            toast.success("Slot deleted");
            loadData();
        } catch (error) {
            toast.error("Failed to delete time slot");
        }
    };

    const resetSlotForm = () => {
        setEditingSlotId(null);
        setSlotStartTime("09:00 AM");
        setSlotEndTime("10:00 AM");
        setSlotCapacity("5");
    };

    const openEditSlot = (slot: any) => {
        setEditingSlotId(slot.id);
        const nameParts = (slot.slotName || "").split("-").map((p: string) => p.trim());
        setSlotStartTime(nameParts[0] || "09:00 AM");
        setSlotEndTime(nameParts[1] || "10:00 AM");
        setSlotCapacity((slot.maxBookingsPerDay ?? slot.maxCapacity ?? 5).toString());
        setSlotModalOpen(true);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Loading photography management...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Camera className="w-7 h-7 text-amber-600" />
                        Photography Service Settings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure allowed areas, rules, dynamic packages, time slots and view devotee bookings.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 rounded-xl">
                    <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                        {isEnabled ? "Photography Active" : "Photography Disabled"}
                    </span>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={(val) => {
                            setIsEnabled(val);
                            handleSaveGeneralSettings(val, allowedAreas, rules);
                        }}
                    />
                </div>
            </div>

            {/* Allowed Areas & Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allowed Areas */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-amber-600" />
                        Allowed Photography Areas
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newAreaInput}
                            onChange={(e) => setNewAreaInput(e.target.value)}
                            placeholder="e.g. Outer Garden, Courtyard"
                            className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <Button onClick={handleAddArea} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                            <Plus className="w-4 h-4 mr-1" /> Add Area
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {allowedAreas.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">No areas configured yet.</span>
                        )}
                        {allowedAreas.map((area, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                            >
                                {area}
                                <button onClick={() => handleRemoveArea(idx)} className="hover:text-red-500">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Rules & Guidelines */}
                <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                        Rules & Restrictions
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newRuleInput}
                            onChange={(e) => setNewRuleInput(e.target.value)}
                            placeholder="e.g. Flash photography strictly prohibited inside Sanctorum"
                            className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <Button onClick={handleAddRule} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                            <Plus className="w-4 h-4 mr-1" /> Add Rule
                        </Button>
                    </div>
                    <ul className="space-y-2 text-xs pt-1">
                        {rules.length === 0 && (
                            <li className="text-muted-foreground italic">No rules defined yet.</li>
                        )}
                        {rules.map((rule, idx) => (
                            <li key={idx} className="flex items-start justify-between bg-muted/40 p-2 rounded-lg">
                                <span className="text-muted-foreground">{idx + 1}. {rule}</span>
                                <button onClick={() => handleRemoveRule(idx)} className="text-red-500 hover:text-red-700 ml-2">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Packages Management */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Tag className="w-5 h-5 text-amber-600" />
                            Photography Packages
                        </h3>
                        <p className="text-xs text-muted-foreground">Devotees select from these packages. Platform fee (₹25) will be added automatically at checkout.</p>
                    </div>
                    <Button
                        onClick={() => {
                            resetPkgForm();
                            setPkgModalOpen(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Create Package
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="border rounded-xl p-4 bg-background flex flex-col justify-between space-y-3 relative hover:border-amber-400 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                                        {pkg.category}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEditPkg(pkg)} className="p-1 hover:text-amber-600 text-muted-foreground">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeletePackage(pkg.id)} className="p-1 hover:text-red-600 text-muted-foreground">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-base text-foreground mt-2">
                                    {typeof pkg.name === 'object' ? parseLocalizedValue(pkg.name) : pkg.name}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {pkg.description ? (typeof pkg.description === 'object' ? parseLocalizedValue(pkg.description) : pkg.description) : "No description provided."}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t text-sm">
                                <span className="font-semibold text-muted-foreground text-xs">Duration: {pkg.duration}</span>
                                <span className="font-bold text-amber-600 text-base">₹{pkg.price}</span>
                            </div>
                        </div>
                    ))}
                    {packages.length === 0 && (
                        <div className="col-span-full py-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                            No packages created yet. Click "Create Package" above to add one.
                        </div>
                    )}
                </div>
            </div>

            {/* Time Slots Management */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-600" />
                            Configurable Time Slots
                        </h3>
                        <p className="text-xs text-muted-foreground">Control max daily capacity & time slots available for booking.</p>
                    </div>
                    <Button
                        onClick={() => {
                            resetSlotForm();
                            setSlotModalOpen(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Time Slot
                    </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {slots.map((s) => (
                        <div key={s.id} className="border rounded-xl p-3 bg-background flex flex-col justify-between hover:border-amber-400">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-primary">
                                    {s.slotName || `${s.startTime || '09:00 AM'} - ${s.endTime || '10:00 AM'}`}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEditSlot(s)} className="p-1 text-muted-foreground hover:text-amber-600">
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteSlot(s.id)} className="p-1 text-muted-foreground hover:text-red-600">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground mt-2">Max Capacity: <b className="text-foreground">{s.maxBookingsPerDay ?? s.maxCapacity ?? 10}</b></span>
                        </div>
                    ))}
                    {slots.length === 0 && (
                        <div className="col-span-full py-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                            No time slots added. Devotees will not be able to book without active time slots.
                        </div>
                    )}
                </div>
            </div>

            {/* Bookings Overview */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-600" />
                    Recent Photography Bookings
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b bg-muted/30 text-muted-foreground">
                                <th className="p-3 font-semibold">Booking Code</th>
                                <th className="p-3 font-semibold">Devotee</th>
                                <th className="p-3 font-semibold">Package</th>
                                <th className="p-3 font-semibold">Area</th>
                                <th className="p-3 font-semibold">Date & Slot</th>
                                <th className="p-3 font-semibold">Amount Paid</th>
                                <th className="p-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bookings.map((b) => (
                                <tr key={b.id} className="hover:bg-muted/20">
                                    <td className="p-3 font-mono font-bold text-amber-600">{b.displayId}</td>
                                    <td className="p-3">
                                        <div className="font-semibold">{b.userName}</div>
                                        <div className="text-[10px] text-muted-foreground">{b.userPhone}</div>
                                    </td>
                                    <td className="p-3 font-medium">{b.package?.name}</td>
                                    <td className="p-3 text-muted-foreground">{b.area}</td>
                                    <td className="p-3">
                                        <div>{new Date(b.bookingDate).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-muted-foreground">{b.slotTime}</div>
                                    </td>
                                    <td className="p-3 font-bold text-foreground">
                                        ₹{b.totalAmount}
                                        <span className="text-[10px] block text-muted-foreground font-normal">
                                            (T: ₹{b.templeAmount} + P: ₹{b.platformFee})
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            b.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                            b.status === "CONFIRMED" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                        }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                        No photography bookings recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Creating / Editing Packages */}
            {pkgModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-background border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h3 className="text-lg font-bold text-foreground">
                            {editingPkgId ? "Edit Package" : "Create Photography Package"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Package Name</label>
                                <input
                                    type="text"
                                    value={pkgName}
                                    onChange={(e) => setPkgName(e.target.value)}
                                    placeholder="e.g. Pre-Wedding Shoot Pass"
                                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Category</label>
                                    <select
                                        value={pkgCategory}
                                        onChange={(e) => setPkgCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                                    >
                                        <option value="PERSONAL font-medium">PERSONAL</option>
                                        <option value="PROFESSIONAL">PROFESSIONAL</option>
                                        <option value="PRE_WEDDING">PRE_WEDDING</option>
                                        <option value="COMMERCIAL">COMMERCIAL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Temple Price (₹)</label>
                                    <input
                                        type="number"
                                        value={pkgPrice}
                                        onChange={(e) => setPkgPrice(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                                <input
                                    type="text"
                                    value={pkgDuration}
                                    onChange={(e) => setPkgDuration(e.target.value)}
                                    placeholder="e.g. 2 Hours"
                                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Description / Notes</label>
                                <textarea
                                    value={pkgDesc}
                                    onChange={(e) => setPkgDesc(e.target.value)}
                                    placeholder="Add any specific inclusions or notes..."
                                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 h-20"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setPkgModalOpen(false)} className="rounded-xl">
                                Cancel
                            </Button>
                            <Button onClick={handleSavePackage} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                                Save Package
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Creating / Editing Time Slots */}
            {slotModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-background border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
                        <h3 className="text-lg font-bold text-foreground">
                            {editingSlotId ? "Edit Slot" : "Add Time Slot"}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Start Time</label>
                                    <input
                                        type="time"
                                        value={slotStartTime.includes(":") && !slotStartTime.includes("M") ? slotStartTime : "09:00"}
                                        onChange={(e) => setSlotStartTime(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">End Time</label>
                                    <input
                                        type="time"
                                        value={slotEndTime.includes(":") && !slotEndTime.includes("M") ? slotEndTime : "10:00"}
                                        onChange={(e) => setSlotEndTime(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Max Capacity / Day</label>
                                <input
                                    type="number"
                                    value={slotCapacity}
                                    onChange={(e) => setSlotCapacity(e.target.value)}
                                    placeholder="5"
                                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setSlotModalOpen(false)} className="rounded-xl">
                                Cancel
                            </Button>
                            <Button onClick={handleSaveSlot} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                                Save Slot
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
