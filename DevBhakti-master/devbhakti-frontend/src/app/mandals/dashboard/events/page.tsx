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
    Upload,
    Download,
    FileText,
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
    createBulkMandalEvents,
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
    const [viewingEvent, setViewingEvent] = useState<any>(null);
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

    // --- BULK MANAGEMENT ---
    const downloadTemplate = () => {
        const template = [
            {
                "Name_EN": "Ganesh Chaturthi Utsav",
                "Name_HI": "गणेश चतुर्थी उत्सव",
                "Name_MR": "गणेश चतुर्थी उत्सव",
                "Date": "Sep 15, 2026",
                "Status": "TRUE",
                "Description_EN": "Grand celebration of Ganesh Chaturthi.",
                "Description_HI": "गणेश चतुर्थी का भव्य उत्सव।",
                "Description_MR": "गणेश चतुर्थीचा भव्य सोहळा."
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Event Template");
        XLSX.writeFile(wb, "Mandal_Event_Import_Template.xlsx");
    };

    const handleExportExcel = () => {
        const exportData = events.map(e => ({
            "ID": e.id,
            "Name_EN": getL(e.name, 'en'),
            "Name_HI": getL(e.name, 'hi'),
            "Name_MR": getL(e.name, 'mr'),
            "Date": e.date,
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
                    const result = await createBulkMandalEvents({ events: mappedEvents });
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
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#7b4623]">
                        Mandal Events
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage festivals and special celebrations for your mandal.
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setViewingEvent(event)}
                                                className="hover:bg-amber-50 hover:text-[#7b4623]"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4 text-[#7b4623]" />
                                            </Button>
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

            {/* View Event Details Modal */}
            <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
                <DialogContent className="sm:max-w-[550px] rounded-2xl p-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#7b4623] text-white flex items-center justify-center shadow-md">
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <Badge variant="outline" className="bg-amber-100/70 text-[#7b4623] border-amber-200 text-xs font-semibold mb-1">
                                        Mandal Event
                                    </Badge>
                                    <h3 className="text-xl font-serif font-bold text-slate-900">
                                        {getL(viewingEvent?.name, "en")}
                                    </h3>
                                </div>
                            </div>
                            <Badge
                                variant={viewingEvent?.status ? "default" : "secondary"}
                                className={viewingEvent?.status ? "bg-emerald-100 text-emerald-800 border-0" : ""}
                            >
                                {viewingEvent?.status ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </div>

                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        {/* Event Date */}
                        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <CalendarIcon className="w-5 h-5 text-[#7b4623] shrink-0" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Scheduled Date</p>
                                <p className="text-sm font-semibold text-slate-800">{viewingEvent?.date || "N/A"}</p>
                            </div>
                        </div>

                        {/* Localized Names (Hindi & Marathi if available) */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            {getL(viewingEvent?.name, "hi") && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">नाम (हिन्दी)</p>
                                    <p className="font-medium text-slate-800 mt-0.5">{getL(viewingEvent?.name, "hi")}</p>
                                </div>
                            )}
                            {getL(viewingEvent?.name, "mr") && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">नाव (मराठी)</p>
                                    <p className="font-medium text-slate-800 mt-0.5">{getL(viewingEvent?.name, "mr")}</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Event Description
                            </h4>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed max-w-none">
                                {getL(viewingEvent?.description, "en") ? (
                                    <div dangerouslySetInnerHTML={{ __html: getL(viewingEvent?.description, "en") }} />
                                ) : (
                                    <p className="text-slate-400 italic">No description provided for this event.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 border-t flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => setViewingEvent(null)}
                            className="rounded-xl border-slate-200"
                        >
                            Close
                        </Button>
                        {canEdit && (
                            <Button
                                onClick={() => {
                                    const evt = viewingEvent;
                                    setViewingEvent(null);
                                    handleOpenDialog(evt);
                                }}
                                className="bg-[#7b4623] hover:bg-[#5d351a] text-white rounded-xl"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Event
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

