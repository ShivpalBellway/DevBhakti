"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Loader2,
    Sparkles,
    Check,
    ChevronsUpDown,
    X,
    Power,
    PowerOff,
    Eye,
    Download,
    Upload,
    FileText
} from "lucide-react";
import * as XLSX from 'xlsx';
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
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    fetchMyEvents,
    createMyEvent,
    createBulkMyEvents,
    updateMyEvent,
    deleteMyEvent,
    fetchMyPoojas,
    toggleEventStatus,
} from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { parseLocalizedValue, stripHtml } from '@/utils/textUtils';
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function TempleEventsPage() {
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

    const canCreate = hasPermission('events.create');
    const canEdit = hasPermission('events.edit');
    const canManage = hasPermission('events.manage');
    const canDelete = hasPermission('events.delete');

    // Pooja selection state
    const [templePoojas, setTemplePoojas] = useState<any[]>([]);
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [loadingPoojas, setLoadingPoojas] = useState(false);

    const [formData, setFormData] = useState({
        name_en: "",
        name_hi: "",
        name_mr: "",
        date: "",
        time: "",
        description_en: "",
        description_hi: "",
        description_mr: "",
        status: true,
    });

    const getL = (value: any, lang: 'en' | 'hi' | 'mr') => {
        const result = parseLocalizedValue(value, lang);
        return result === "N/A" ? "" : result;
    };

    const [timeData, setTimeData] = useState({
        hours: "10",
        minutes: "00",
        period: "AM"
    });

    // Helper to format time for storage
    const getFormattedTime = (h: string, m: string, p: string) => `${h}:${m} ${p}`;

    // Helper to parse stored time
    const parseStoredTime = (timeStr: string) => {
        if (!timeStr) return { hours: "10", minutes: "00", period: "AM" };
        const [time, period] = timeStr.split(" ");
        if (!time || !period) return { hours: "10", minutes: "00", period: "AM" };
        const [hours, minutes] = time.split(":");
        return { hours: hours || "10", minutes: minutes || "00", period: period || "AM" };
    };

    useEffect(() => {
        loadData();
        loadTemplePoojas();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyEvents();
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

    const loadTemplePoojas = async () => {
        setLoadingPoojas(true);
        try {
            const response = await fetchMyPoojas();
            setTemplePoojas(response.data || []);
        } catch (error) {
            console.error("Failed to load poojas:", error);
        } finally {
            setLoadingPoojas(false);
        }
    };

    const handleOpenDialog = (event: any = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name_en: getL(event.name, 'en'),
                name_hi: getL(event.name, 'hi'),
                name_mr: getL(event.name, 'mr'),
                date: event.date,
                time: event.time || "",
                description_en: getL(event.description, 'en'),
                description_hi: getL(event.description, 'hi'),
                description_mr: getL(event.description, 'mr'),
                status: event.status,
            });
            setTimeData(parseStoredTime(event.time));
            // Pre-populate selected poojas in edit mode
            if (event.Pooja && Array.isArray(event.Pooja)) {
                setSelectedPoojaIds(event.Pooja.map((p: any) => p.id));
            } else {
                setSelectedPoojaIds([]);
            }
        } else {
            setEditingEvent(null);
            setFormData({
                name_en: "",
                name_hi: "",
                name_mr: "",
                date: "",
                time: "",
                description_en: "",
                description_hi: "",
                description_mr: "",
                status: true,
            });
            setTimeData({ hours: "10", minutes: "00", period: "AM" });
            setSelectedPoojaIds([]);
        }
        setIsDialogOpen(true);
    };

    const handlePoojaToggle = (poojaId: string, checked: boolean | string) => {
        if (checked) {
            setSelectedPoojaIds(prev => [...prev, poojaId]);
        } else {
            setSelectedPoojaIds(prev => prev.filter(id => id !== poojaId));
        }
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
            const payload = {
                ...formData,
                // time: getFormattedTime(timeData.hours, timeData.minutes, timeData.period),
                recommendedPoojaIds: selectedPoojaIds,
            };

            if (editingEvent) {
                await updateMyEvent(editingEvent.id, payload);
                toast({ title: "Success", description: "Event updated successfully" });
            } else {
                await createMyEvent(payload);
                toast({ title: "Success", description: "Event created successfully" });
            }
            setIsDialogOpen(false);
            setSelectedPoojaIds([]);
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
                await deleteMyEvent(id);
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
            await toggleEventStatus(id);
            setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, status: !currentStatus } : ev));
            toast({
                title: "Status Updated",
                description: `Event ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update event status",
                variant: "destructive",
            });
        }
    };

    const uniqueDates = Array.from(new Set(events.map(e => e.date)))
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const filteredEvents = events.filter((event) => {
        const name = getL(event.name, 'en').toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase());
        const matchesDate = selectedDate === "ALL" || event.date === selectedDate;
        return matchesSearch && matchesDate;
    });

    // --- BULK MANAGEMENT ---
    const downloadTemplate = () => {
        const template = [
            {
                "Name_EN": "Hanuman Janmotsav",
                "Name_HI": "हनुमान जन्मोत्सव",
                "Name_MR": "हनुमान जन्मोत्सव",
                "Date": "May 15, 2026",
                "Time": "10:00 AM",
                "Status": "TRUE",
                "Description_EN": "Special celebration of Lord Hanuman's birth.",
                "Description_HI": "भगवान हनुमान के जन्म का विशेष उत्सव।",
                "Description_MR": "भगवान हनुमानाचा जन्मोत्सव सोहळा."
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Event Template");
        XLSX.writeFile(wb, "Temple_Event_Import_Template.xlsx");
    };

    const handleExportExcel = () => {
        const exportData = events.map(e => ({
            "ID": e.id,
            "Name_EN": getL(e.name, 'en'),
            "Name_HI": getL(e.name, 'hi'),
            "Name_MR": getL(e.name, 'mr'),
            "Date": e.date,
            "Time": e.time,
            "Status": e.status ? "TRUE" : "FALSE",
            "Description_EN": getL(e.description, 'en'),
            "Description_HI": getL(e.description, 'hi'),
            "Description_MR": getL(e.description, 'mr'),
            "Created_At": e.createdAt
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "My Events");
        XLSX.writeFile(wb, `My_Events_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                if (data.length === 0) {
                    toast({ title: "Error", description: "Excel file is empty", variant: "destructive" });
                    return;
                }

                toast({ title: "Import Started", description: `Importing ${data.length} events...`, variant: "success" });

                const mappedEvents = data.map((row: any) => ({
                    name_en: String(row.Name_EN || "").trim(),
                    name_hi: String(row.Name_HI || "").trim(),
                    name_mr: String(row.Name_MR || "").trim(),
                    date: String(row.Date || "").trim(),
                    description_en: String(row.Description_EN || "").trim(),
                    description_hi: String(row.Description_HI || "").trim(),
                    description_mr: String(row.Description_MR || "").trim(),
                    status: String(row.Status || "TRUE").toUpperCase() === "TRUE",
                    recommendedPoojaIds: []
                }));

                try {
                    const result = await createBulkMyEvents({ events: mappedEvents });
                    const { successCount, failCount, errors } = result.data;

                    if (failCount > 0) {
                        toast({
                            title: "Import Partially Failed",
                            description: `Success: ${successCount}, Failed: ${failCount}. Check console or fix these: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
                            variant: "destructive"
                        });
                        console.error('Bulk Import Errors:', errors);
                    } else {
                        toast({
                            title: "Import Successful",
                            description: `Successfully imported ${successCount} events.`,
                            variant: "success"
                        });
                    }
                    loadData();
                } catch (bulkErr: any) {
                    toast({ title: "Import Failed", description: bulkErr.response?.data?.message || "Failed to process bulk upload.", variant: "destructive" });
                }
            } catch (error) {
                toast({ title: "Import Failed", description: "Failed to process Excel file", variant: "destructive" });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">Temple Events</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage festivals and special celebrations at your temple.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                    <Button
                        onClick={downloadTemplate}
                        variant="outline"
                        className="flex-1 md:flex-initial border-[#7b4623]/20 hover:bg-[#7b4623]/5 text-xs h-9"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Template
                    </Button>
                    <div className="relative flex-1 md:flex-initial">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="import-excel"
                            onChange={handleImportExcel}
                        />
                        <Button
                            onClick={() => document.getElementById('import-excel')?.click()}
                            variant="outline"
                            className="w-full border-[#7b4623]/20 hover:bg-[#7b4623]/5 text-xs h-9"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import Excel
                        </Button>
                    </div>
                    <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        className="flex-1 md:flex-initial border-[#7b4623]/20 hover:bg-[#7b4623]/5 text-xs h-9"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export All
                    </Button>
                    {(!canCreate || !canEdit || !canManage || !canDelete) && (
                        <Badge className="bg-slate-100 text-slate-500 border-slate-200 uppercase font-black tracking-widest px-4 py-2 rounded-xl">View Only Mode</Badge>
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
                        placeholder="Search your events..."
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
                            <TableHead>Recommended Sevas</TableHead>
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
                                        <span className="text-sm text-muted-foreground">Loading your events...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredEvents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="text-muted-foreground">No upcoming events found. Create one now!</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEvents.map((event) => (
                                <TableRow key={event.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-[#7b4623]/10 flex items-center justify-center">
                                                <CalendarIcon className="w-5 h-5 text-[#7b4623]" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{getL(event.name, 'en')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit bg-indigo-50 text-indigo-700 border-indigo-100">
                                                {event.date}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[400px]">
                                            {stripHtml(getL(event.description, 'en')) || "No description"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {event.Pooja && event.Pooja.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {event.Pooja.slice(0, 2).map((pooja: any) => (
                                                    <Badge key={pooja.id} variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        {parseLocalizedValue(pooja.name)}
                                                    </Badge>
                                                ))}
                                                {event.Pooja.length > 2 && (
                                                    <Badge variant="outline" className="text-xs border-[#7b4623]/30 text-[#7b4623]">
                                                        +{event.Pooja.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={event.status}
                                                disabled={!canManage}
                                                onCheckedChange={() => handleToggleStatus(event.id, event.status)}
                                            />
                                            <Badge variant={event.status ? "default" : "secondary"} className={event.status ? "bg-emerald-100 text-emerald-800" : ""}>
                                                {event.status ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/temples/dashboard/events/${event.id}`)}
                                                className="hover:bg-blue-50 hover:text-blue-600"
                                                title="View Event"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.push(`/temples/dashboard/events/edit/${event.id}`)}
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
                            Fill in the details for your upcoming temple festival or event.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <Tabs defaultValue="en" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-100 p-1 rounded-xl">
                                <TabsTrigger value="en" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">English</TabsTrigger>
                                <TabsTrigger value="hi" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">हिन्दी</TabsTrigger>
                                <TabsTrigger value="mr" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">मराठी</TabsTrigger>
                            </TabsList>
                            
                            {['en', 'hi', 'mr'].map((lang) => (
                                <TabsContent key={lang} value={lang} className="space-y-4 outline-none">
                                    <div className="space-y-2">
                                        <Label htmlFor={`name_${lang}`} className="text-slate-700 font-medium">Event Name * ({lang.toUpperCase()})</Label>
                                        <Input
                                            id={`name_${lang}`}
                                            placeholder="e.g. Annual Mahaprasad"
                                            value={(formData as any)[`name_${lang}`]}
                                            onChange={(e) =>
                                                setFormData({ ...formData, [`name_${lang}`]: e.target.value })
                                            }
                                            className="h-11 rounded-xl border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                            required={lang === 'en'}
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Description ({lang.toUpperCase()})</Label>
                                        <RichTextEditor
                                            value={(formData as any)[`description_${lang}`]}
                                            onChange={(content) => setFormData({ ...formData, [`description_${lang}`]: content })}
                                            placeholder="Briefly describe what happens during this event..."
                                            minHeight="150px"
                                        />
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-slate-700 font-medium">Date *</Label>
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

                            {/* <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Time *</Label>
                                <div className="flex gap-1">
                                    <select
                                        className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/10"
                                        value={timeData.hours}
                                        onChange={(e) => setTimeData({ ...timeData, hours: e.target.value })}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b4623]/10"
                                        value={timeData.minutes}
                                        onChange={(e) => setTimeData({ ...timeData, minutes: e.target.value })}
                                    >
                                        {["00", "15", "30", "45"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="w-16 h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold text-[#7b4623] focus:outline-none focus:ring-2 focus:ring-[#7b4623]/10"
                                        value={timeData.period}
                                        onChange={(e) => setTimeData({ ...timeData, period: e.target.value })}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div> */}
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-slate-700">Event Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show or hide this event on the platform
                                </p>
                            </div>
                            <Switch
                                checked={formData.status}
                                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                            />
                        </div>

                        {/* Recommended Poojas Section */}
                        <div className="space-y-2">
                            <Label className="text-slate-700 font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                Recommended Sevas (Optional)
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between h-auto min-h-[2.5rem] py-2 border-slate-200"
                                        disabled={loadingPoojas || templePoojas.length === 0}
                                    >
                                        {loadingPoojas ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#7b4623]" />
                                                Loading sevas...
                                            </span>
                                        ) : templePoojas.length === 0 ? (
                                            <span className="text-muted-foreground">No sevas available</span>
                                        ) : selectedPoojaIds.length === 0 ? (
                                            <span className="text-muted-foreground">Select sevas...</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {templePoojas
                                                    .filter(p => selectedPoojaIds.includes(p.id))
                                                    .map(pooja => (
                                                        <Badge key={pooja.id} variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">
                                                            {parseLocalizedValue(pooja.name)}
                                                            <X
                                                                className="w-3 h-3 ml-1 cursor-pointer hover:text-amber-900"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePoojaToggle(pooja.id, false);
                                                                }}
                                                            />
                                                        </Badge>
                                                    ))
                                                }
                                            </div>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[450px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search sevas..." />
                                        <CommandEmpty>No seva found.</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-auto">
                                            {templePoojas.map((pooja) => (
                                                <CommandItem
                                                    key={pooja.id}
                                                    value={parseLocalizedValue(pooja.name)}
                                                    onSelect={() => {
                                                        handlePoojaToggle(pooja.id, !selectedPoojaIds.includes(pooja.id));
                                                    }}
                                                    className="flex items-start gap-2 py-2"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mt-1 h-4 w-4",
                                                            selectedPoojaIds.includes(pooja.id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">{parseLocalizedValue(pooja.name)}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ₹{pooja.price}
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedPoojaIds.length > 0 && (
                                <p className="text-xs text-emerald-700 font-medium">
                                    ✓ {selectedPoojaIds.length} seva{selectedPoojaIds.length > 1 ? 's' : ''} selected
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Select sevas to recommend to devotees for this event
                            </p>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-11 rounded-xl px-6 border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 rounded-xl px-8 bg-[#7b4623] hover:bg-[#5d351a] text-white"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingEvent ? "Update Event" : "Create Event"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
