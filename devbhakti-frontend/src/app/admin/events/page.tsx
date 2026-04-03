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
    Sparkles,
    Check,
    ChevronsUpDown,
    X,
    Power,
    PowerOff
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { Switch } from "@/components/ui/switch";
import { fetchAllEventsAdmin, fetchAllTemplesAdmin, createEventAdmin, updateEventAdmin, deleteEventAdmin, fetchAllPoojasAdmin, toggleEventStatusAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminAuth } from "@/hooks/use-admin-auth";


export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [temples, setTemples] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();


    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(10);

    // Pooja selection state
    const [templePoojas, setTemplePoojas] = useState<any[]>([]);
    const [selectedPoojaIds, setSelectedPoojaIds] = useState<string[]>([]);
    const [loadingPoojas, setLoadingPoojas] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        date: "",
        time: "",
        description: "",
        templeId: "",
        status: true,
    });

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
        loadEvents(1);
    }, [debouncedSearch]);

    useEffect(() => {
        loadEvents(currentPage);
    }, [currentPage]);

    useEffect(() => {
        loadTemples();
    }, []);

    const loadTemples = async () => {
        try {
            const templesData = await fetchAllTemplesAdmin();
            const actualTemples = templesData
                .filter((user: any) => user.temple)
                .map((user: any) => user.temple);
            setTemples(actualTemples);
        } catch (error) {
            console.error("Failed to load temples", error);
        }
    };

    const loadTemplePoojas = async (templeId: string) => {
        if (!templeId) {
            setTemplePoojas([]);
            return;
        }

        setLoadingPoojas(true);
        try {
            const response = await fetchAllPoojasAdmin({ templeId });
            console.log('Temple poojas response:', response);
            // Backend returns array directly, not wrapped in { data: [...] }
            setTemplePoojas(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Failed to load temple poojas:", error);
            setTemplePoojas([]);
        } finally {
            setLoadingPoojas(false);
        }
    };

    // Watch for temple selection change
    useEffect(() => {
        if (formData.templeId) {
            loadTemplePoojas(formData.templeId);
            // Clear selected poojas when temple changes
            setSelectedPoojaIds([]);
        } else {
            setTemplePoojas([]);
            setSelectedPoojaIds([]);
        }
    }, [formData.templeId]);

    const loadEvents = async (page: number) => {
        setIsLoading(true);
        try {
            const res = await fetchAllEventsAdmin({
                page,
                limit: itemsPerPage,
                search: debouncedSearch,
            });

            if (res.success) {
                setEvents(res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages);
                    setTotalItems(res.pagination.total);
                    setCurrentPage(res.pagination.page);
                }
            }
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
                name: event.name,
                date: event.date,
                time: event.time || "",
                description: event.description || "",
                templeId: event.templeId,
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
                name: "",
                date: "",
                time: "",
                description: "",
                templeId: "",
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

        try {
            const payload = {
                ...formData,
                time: getFormattedTime(timeData.hours, timeData.minutes, timeData.period),
                recommendedPoojaIds: selectedPoojaIds,
            };

            if (editingEvent) {
                await updateEventAdmin(editingEvent.id, payload);
                toast({ title: "Success", description: "Event updated successfully" });
            } else {
                await createEventAdmin(payload);
                toast({ title: "Success", description: "Event created successfully" });
            }
            setIsDialogOpen(false);
            setSelectedPoojaIds([]);
            loadEvents(currentPage);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save event",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteEventAdmin(id);
                toast({ title: "Success", description: "Event deleted successfully", variant: "success" });
                loadEvents(currentPage);
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
            const nextStatus = !currentStatus;
            await toggleEventStatusAdmin(id, nextStatus);
            setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, status: nextStatus } : ev));
            toast({
                title: "Status Updated",
                description: `Event ${nextStatus ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update event status",
                variant: "destructive",
            });
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Events Management</h1>
                    <p className="text-muted-foreground">
                        Manage upcoming events and festivals for temples
                    </p>
                </div>
                {hasPermission("events.create") && (
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Event
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by event name or temple..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Events Table */}
            <div className="border rounded-lg bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Temple</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Recommended Poojas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    Loading events...
                                </TableCell>
                            </TableRow>
                        ) : events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    No events found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{event.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {event.temple ? (
                                                <>
                                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-sm">{event.temple.name}</span>
                                                </>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-200">
                                                    General Event
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit">{event.date}</Badge>
                                            {event.time && (
                                                <div className="flex items-center text-[10px] font-bold text-muted-foreground ml-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {event.time}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                                            {event.description || "No description"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {event.Pooja && event.Pooja.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {event.Pooja.slice(0, 2).map((pooja: any) => (
                                                    <Badge key={pooja.id} variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        {pooja.name}
                                                    </Badge>
                                                ))}
                                                {event.Pooja.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{event.Pooja.length - 2} more
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={event.status}
                                                onCheckedChange={() => handleToggleStatus(event.id, event.status)}
                                            />
                                            <Badge variant={event.status ? "default" : "secondary"}>
                                                {event.status ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {hasPermission("events.edit") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(event)}
                                                    title="Edit Event"
                                                >
                                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                                </Button>
                                            )}
                                            {hasPermission("events.delete") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(event.id)}
                                                    title="Delete Event"
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
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

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                        <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, totalItems)}
                        </span>{" "}
                        of <span className="font-medium">{totalItems}</span> results
                    </p>
                    <Pagination className="justify-end w-auto mx-0">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {/* Simple pagination logic */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                                .map((page, idx, array) => (
                                    <React.Fragment key={page}>
                                        {idx > 0 && array[idx - 1] !== page - 1 && (
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        )}
                                        <PaginationItem>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(page);
                                                }}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </React.Fragment>
                                ))}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePageChange(currentPage + 1);
                                    }}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEvent ? "Edit Event" : "Add New Event"}
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the details for the upcoming event or festival.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Maha Shivaratri"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="templeId">Temple (Optional)</Label>
                            <select
                                id="templeId"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.templeId}
                                onChange={(e) =>
                                    setFormData({ ...formData, templeId: e.target.value })
                                }
                            >
                                <option value="">Global / No Temple Select</option>
                                {temples.map((temple) => (
                                    <option key={temple.id} value={temple.id}>
                                        {temple.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-10 border-input rounded-xl",
                                                !formData.date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.date ? (
                                                formData.date
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
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
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-medium">Time *</Label>
                                <div className="flex gap-1">
                                    <select
                                        className="flex-1 h-10 rounded-xl border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={timeData.hours}
                                        onChange={(e) => setTimeData({ ...timeData, hours: e.target.value })}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="flex-1 h-10 rounded-xl border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={timeData.minutes}
                                        onChange={(e) => setTimeData({ ...timeData, minutes: e.target.value })}
                                    >
                                        {["00", "15", "30", "45"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="w-16 h-10 rounded-xl border border-input bg-background px-2 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={timeData.period}
                                        onChange={(e) => setTimeData({ ...timeData, period: e.target.value })}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of the event..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="h-24"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Event Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show or hide this event on the platform
                                </p>
                            </div>
                            <Switch
                                checked={formData.status}
                                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                            />
                        </div>

                        {/* Recommended Temple Poojas Section */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                Recommended Poojas for this Temple (Optional)
                            </Label>
                            {!formData.templeId ? (
                                <div className="border rounded-lg p-6 bg-amber-50/50 text-center">
                                    <p className="text-sm text-amber-800 font-medium">
                                        Please select a temple first to see available poojas
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between h-auto min-h-[2.5rem] py-2"
                                                disabled={loadingPoojas || templePoojas.length === 0}
                                            >
                                                {loadingPoojas ? (
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                        Loading poojas...
                                                    </span>
                                                ) : templePoojas.length === 0 ? (
                                                    <span className="text-muted-foreground">No poojas available</span>
                                                ) : selectedPoojaIds.length === 0 ? (
                                                    <span className="text-muted-foreground">Select poojas...</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {templePoojas
                                                            .filter(p => selectedPoojaIds.includes(p.id))
                                                            .map(pooja => (
                                                                <Badge key={pooja.id} variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200">
                                                                    {pooja.name}
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
                                        <PopoverContent className="w-[520px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search poojas..." />
                                                <CommandEmpty>No pooja found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {templePoojas.map((pooja) => (
                                                        <CommandItem
                                                            key={pooja.id}
                                                            value={pooja.name}
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
                                                                <div className="font-medium">{pooja.name}</div>
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
                                        <p className="text-xs text-amber-700 font-medium">
                                            ✓ {selectedPoojaIds.length} pooja{selectedPoojaIds.length > 1 ? 's' : ''} selected
                                        </p>
                                    )}
                                </>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Select poojas from the selected temple to recommend for this event
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingEvent ? "Update Event" : "Create Event"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
