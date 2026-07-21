"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Calendar as CalendarIcon,
    Loader2,
    Sparkles,
    Eye,
    Power,
    PowerOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    fetchMandalEvents,
    createMandalEvent,
    updateMandalEvent,
    deleteMandalEvent,
    toggleMandalEventStatus,
} from "@/api/mandalAdminController";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { parseLocalizedValue, stripHtml } from "@/utils/textUtils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function MandalEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState("ALL");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();

    const canCreate = hasPermission("events.create");
    const canEdit = hasPermission("events.edit");
    const canManage = hasPermission("events.manage");
    const canDelete = hasPermission("events.delete");

    const [formData, setFormData] = useState({
        name_en: "",
        name_hi: "",
        name_mr: "",
        date: "",
        description_en: "",
        description_hi: "",
        description_mr: "",
        status: true,
    });

    const getL = (value: any, lang: "en" | "hi" | "mr") => {
        const result = parseLocalizedValue(value, lang);
        return result === "N/A" ? "" : result;
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMandalEvents();
            setEvents(response.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load events",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (event: any = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name_en: getL(event.name, "en"),
                name_hi: getL(event.name, "hi"),
                name_mr: getL(event.name, "mr"),
                date: event.date,
                description_en: getL(event.description, "en"),
                description_hi: getL(event.description, "hi"),
                description_mr: getL(event.description, "mr"),
                status: event.status,
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name_en: "",
                name_hi: "",
                name_mr: "",
                date: "",
                description_en: "",
                description_hi: "",
                description_mr: "",
                status: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.date) {
            toast({
                title: "Select Date",
                description: "Please select a date for the event",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingEvent) {
                await updateMandalEvent(editingEvent.id, formData);
                toast({ title: "Success", description: "Event updated successfully" });
            } else {
                await createMandalEvent(formData);
                toast({ title: "Success", description: "Event created successfully" });
            }
            setIsDialogOpen(false);
            loadData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save event",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteMandalEvent(id);
                toast({ title: "Success", description: "Event deleted successfully" });
                loadData();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete event",
                    variant: "destructive",
                });
            }
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await toggleMandalEventStatus(id);
            setEvents((prev) =>
                prev.map((ev) => (ev.id === id ? { ...ev, status: !currentStatus } : ev))
            );
            toast({
                title: "Status Updated",
                description: `Event ${!currentStatus ? "activated" : "deactivated"} successfully`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update event status",
                variant: "destructive",
            });
        }
    };

    const uniqueDates = Array.from(new Set(events.map((e) => e.date)))
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const filteredEvents = events.filter((event) => {
        const name = getL(event.name, "en").toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase());
        const matchesDate = selectedDate === "ALL" || event.date === selectedDate;
        return matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Mandal Events
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage festivals and special celebrations for your mandal.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                    {(!canCreate || !canEdit || !canManage || !canDelete) && (
                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 uppercase font-black tracking-widest px-4 py-2 rounded-xl">
                            View Only Mode
                        </Badge>
                    )}
                    {canCreate && (
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="bg-[#7b4623] hover:bg-[#5d351a] text-white flex-1 md:flex-initial"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Event
                        </Button>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        className="pl-10 border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="flex h-10 w-full md:w-[250px] items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7b4623]/20">
                        <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL" className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]">
                            All Dates
                        </SelectItem>
                        {uniqueDates.map((date) => (
                            <SelectItem
                                key={date}
                                value={date}
                                className="focus:bg-[#7b4623]/10 focus:text-[#7b4623]"
                            >
                                {date}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Events Table */}
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm text-muted-foreground">
                                            Loading events...
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredEvents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <CalendarIcon className="w-10 h-10 opacity-30" />
                                        <p>No upcoming events found. Create one now!</p>
                                        {canCreate && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleOpenDialog()}
                                                className="bg-[#7b4623] hover:bg-[#5d351a] text-white mt-1"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Add First Event
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEvents.map((event) => (
                                <TableRow
                                    key={event.id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-[#7b4623]/10 flex items-center justify-center">
                                                <CalendarIcon className="w-5 h-5 text-[#7b4623]" />
                                            </div>
                                            <span className="font-semibold text-slate-900">
                                                {getL(event.name, "en")}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="w-fit bg-indigo-50 text-indigo-700 border-indigo-100"
                                        >
                                            {event.date}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[400px]">
                                            {stripHtml(getL(event.description, "en")) || "No description"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={event.status}
                                                disabled={!canManage}
                                                onCheckedChange={() =>
                                                    handleToggleStatus(event.id, event.status)
                                                }
                                            />
                                            <Badge
                                                variant={event.status ? "default" : "secondary"}
                                                className={
                                                    event.status ? "bg-emerald-100 text-emerald-800" : ""
                                                }
                                            >
                                                {event.status ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(event)}
                                                    className="hover:bg-blue-50 hover:text-blue-600"
                                                    title="Edit Event"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(event.id)}
                                                    className="hover:bg-red-50 hover:text-red-600"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-[#7b4623]">
                            {editingEvent ? "Edit Event" : "Add New Event"}
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the details for your upcoming mandal festival or event.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <Tabs defaultValue="en" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger
                                    value="en"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    English
                                </TabsTrigger>
                                <TabsTrigger
                                    value="hi"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    हिन्दी
                                </TabsTrigger>
                                <TabsTrigger
                                    value="mr"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    मराठी
                                </TabsTrigger>
                            </TabsList>

                            {(["en", "hi", "mr"] as const).map((lang) => (
                                <TabsContent key={lang} value={lang} className="space-y-4 outline-none">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor={`name_${lang}`}
                                            className="text-slate-700 font-medium"
                                        >
                                            Event Name * ({lang.toUpperCase()})
                                        </Label>
                                        <Input
                                            id={`name_${lang}`}
                                            placeholder="e.g. Annual Ganesh Utsav"
                                            value={(formData as any)[`name_${lang}`]}
                                            onChange={(e) =>
                                                setFormData({ ...formData, [`name_${lang}`]: e.target.value })
                                            }
                                            className="h-11 rounded-xl border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                            required={lang === "en"}
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">
                                            Description ({lang.toUpperCase()})
                                        </Label>
                                        <RichTextEditor
                                            value={(formData as any)[`description_${lang}`]}
                                            onChange={(content) =>
                                                setFormData({ ...formData, [`description_${lang}`]: content })
                                            }
                                            placeholder="Briefly describe what happens during this event..."
                                            minHeight="150px"
                                        />
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>

                        {/* Date Picker */}
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-slate-700 font-medium">
                                Date *
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-11 rounded-xl border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10",
                                            !formData.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date ? formData.date : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date ? new Date(formData.date) : undefined}
                                        onSelect={(date) =>
                                            setFormData({
                                                ...formData,
                                                date: date ? format(date, "PPP") : "",
                                            })
                                        }
                                        disabled={(date) =>
                                            date < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-slate-700">
                                    Event Status
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show or hide this event on the platform
                                </p>
                            </div>
                            <Switch
                                checked={formData.status}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, status: checked })
                                }
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : editingEvent ? (
                                    "Update Event"
                                ) : (
                                    "Create Event"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
