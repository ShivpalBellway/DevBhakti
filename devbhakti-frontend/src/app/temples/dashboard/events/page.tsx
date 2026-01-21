"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Calendar,
    MapPin,
    Clock,
    Loader2
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
    fetchMyEvents,
    createMyEvent,
    updateMyEvent,
    deleteMyEvent,
} from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";

export default function TempleEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        date: "",
        description: "",
    });

    useEffect(() => {
        loadData();
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

    const handleOpenDialog = (event: any = null) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name: event.name,
                date: event.date,
                description: event.description || "",
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name: "",
                date: "",
                description: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingEvent) {
                await updateMyEvent(editingEvent.id, formData);
                toast({ title: "Success", description: "Event updated successfully" });
            } else {
                await createMyEvent(formData);
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

    const filteredEvents = events.filter((event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-[#7b4623] hover:bg-[#5d351a] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Event
                </Button>
            </div>

            {/* Search */}
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
            </div>

            {/* Events Table */}
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-[#7b4623] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm text-muted-foreground">Loading your events...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredEvents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <div className="text-muted-foreground">No upcoming events found. Create one now!</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEvents.map((event) => (
                                <TableRow key={event.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-[#7b4623]/10 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-[#7b4623]" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{event.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm font-medium text-slate-700">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                                                {event.date}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[400px]">
                                            {event.description || "No description"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(event)}
                                                className="hover:bg-blue-50 hover:text-blue-600"
                                                title="Edit Event"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(event.id)}
                                                className="hover:bg-red-50 hover:text-red-600"
                                                title="Delete Event"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif font-bold text-[#7b4623]">
                            {editingEvent ? "Edit Event" : "Add New Event"}
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the details for your upcoming temple festival or event.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-medium">Event Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Annual Mahaprasad"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="h-11 rounded-xl border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-slate-700 font-medium">Date & Time *</Label>
                            <Input
                                id="date"
                                placeholder="e.g. October 25, 2024 at 6:00 PM"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                className="h-11 rounded-xl border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Briefly describe what happens during this event..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="h-32 rounded-xl resize-none border-slate-200 focus:border-[#7b4623] focus:ring-[#7b4623]/10"
                            />
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
