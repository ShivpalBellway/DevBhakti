"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Calendar,
    MapPin,
} from "lucide-react";
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
import {
    fetchAllEventsAdmin,
    fetchAllTemplesAdmin,
    createEventAdmin,
    updateEventAdmin,
    deleteEventAdmin,
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";

export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [temples, setTemples] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        date: "",
        description: "",
        templeId: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [eventsData, templesData] = await Promise.all([
                fetchAllEventsAdmin(),
                fetchAllTemplesAdmin(),
            ]);
            setEvents(eventsData);
            setTemples(templesData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load data",
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
                description: event.description || "",
                templeId: event.templeId,
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name: "",
                date: "",
                description: "",
                templeId: temples.length > 0 ? temples[0].id : "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingEvent) {
                await updateEventAdmin(editingEvent.id, formData);
                toast({ title: "Success", description: "Event updated successfully" });
            } else {
                await createEventAdmin(formData);
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
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await deleteEventAdmin(id);
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

    const filteredEvents = events.filter(
        (event) =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.temple?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-primary hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Event
                </Button>
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
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    Loading events...
                                </TableCell>
                            </TableRow>
                        ) : filteredEvents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No events found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{event.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="text-sm">{event.temple?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{event.date}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                                            {event.description || "No description"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(event)}
                                                title="Edit Event"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(event.id)}
                                                title="Delete Event"
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
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
                            <Label htmlFor="templeId">Temple *</Label>
                            <select
                                id="templeId"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={formData.templeId}
                                onChange={(e) =>
                                    setFormData({ ...formData, templeId: e.target.value })
                                }
                                required
                            >
                                <option value="">Select a Temple</option>
                                {temples.map((temple) => (
                                    <option key={temple.id} value={temple.id}>
                                        {temple.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                placeholder="e.g. March 8, 2025"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                required
                            />
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
