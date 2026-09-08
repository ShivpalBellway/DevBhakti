"use client";

import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Ban,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { getMandalAvailability, setMandalAvailability } from "@/api/mandalAdminController";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function MandalAvailabilityManager() {
    const { toast } = useToast();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [month, setMonth] = useState<Date>(new Date());

    // Monthly rules cache
    const [availabilityRules, setAvailabilityRules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDateRule, setSelectedDateRule] = useState<any>(null);

    // Form State
    const [isClosed, setIsClosed] = useState(false);
    const [maxBookings, setMaxBookings] = useState("500");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAvailability(month);
    }, [month]);

    const fetchAvailability = async (currentMonth: Date) => {
        setIsLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const monthNum = currentMonth.getMonth() + 1;

            const res = await getMandalAvailability({
                year: year.toString(),
                month: monthNum.toString()
            });

            if (res.success && res.data) {
                // Filter for global mandal rules (poojaId: null)
                setAvailabilityRules(res.data.filter((r: any) => r.poojaId === null));
            }
        } catch (error) {
            console.error("Failed to fetch mandal availability", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setDate(selectedDate);

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const rule = availabilityRules.find(r => r.date === dateStr);

        setSelectedDateRule(rule);
        setIsClosed(rule?.isClosed || false);
        setMaxBookings(rule?.maxBookings?.toString() || "500");
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!date) return;
        setIsSaving(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await setMandalAvailability({
                date: dateStr,
                isClosed,
                maxBookings: parseInt(maxBookings),
                poojaId: undefined // Global rule
            });

            if (res.success) {
                toast({ 
                    title: "Availability Updated", 
                    description: "Mandal availability rules updated successfully.",
                    variant: "success"
                });
                setIsDialogOpen(false);
                fetchAvailability(month); // Refresh
            } else {
                toast({ title: "Update Failed", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update availability", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    // Custom modifier to styling dates in calendar
    const modifiers = {
        closed: (date: Date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const rule = availabilityRules.find(r => r.date === dateStr);
            return rule?.isClosed === true;
        },
        limited: (date: Date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const rule = availabilityRules.find(r => r.date === dateStr);
            return rule && !rule.isClosed;
        }
    };

    const modifiersStyles = {
        closed: { color: 'var(--destructive)', fontWeight: 'bold', textDecoration: 'line-through' },
        limited: { fontWeight: 'bold', color: 'var(--primary)' }
    };

    const CustomDayContent = (props: any) => {
        const { date } = props;
        const dateStr = format(date, 'yyyy-MM-dd');
        const rule = availabilityRules.find(r => r.date === dateStr);

        return (
            <div className="relative w-full h-full flex flex-col items-center justify-center pt-1 pb-4">
                <span>{date.getDate()}</span>
                {rule && (
                    <span className={cn(
                        "absolute bottom-1 text-[10px] leading-tight font-bold",
                        rule.isClosed ? "text-red-500" : "text-amber-700"
                    )}>
                        {rule.isClosed ? "OFF" : rule.maxBookings}
                    </span>
                )}
            </div>
        );
    };

    return (
        <Card className="border border-amber-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-serif text-amber-950">Mandal Availability Calendar</CardTitle>
                    <CardDescription>
                        Click a date to change limit or close bookings for your mandal.
                        <span className="block mt-1 text-amber-800 font-medium">Default limit: 500 bookings/day</span>
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">
                        <Ban className="w-3 h-3 mr-1" /> Closed
                    </Badge>
                    <Badge variant="outline" className="text-amber-800 bg-amber-50 border-amber-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Limit Set
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center p-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        month={month}
                        onMonthChange={setMonth}
                        className="rounded-md border p-4 w-full max-w-sm mx-auto shadow-sm"
                        modifiers={modifiers}
                        modifiersStyles={modifiersStyles}
                        components={{
                            DayContent: CustomDayContent
                        }}
                    />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-amber-950">
                               {date ? format(date, "PPP") : ""}
                            </DialogTitle>
                            <DialogDescription>
                                Set global booking limits or close bookings for this date in your mandal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-amber-50/50 border-amber-200">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Booking Status</Label>
                                    <p className="text-xs text-slate-500">
                                        Toggle to open or close all bookings for this date.
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={!isClosed}
                                        onCheckedChange={(c) => setIsClosed(!c)}
                                        className="data-[state=unchecked]:bg-destructive"
                                    />
                                    <span className={cn("text-xs font-bold w-12", isClosed ? "text-destructive" : "text-green-600")}>
                                        {isClosed ? "CLOSED" : "OPEN"}
                                    </span>
                                </div>
                            </div>

                            <div className={cn("space-y-2", isClosed && "opacity-50 pointer-events-none")}>
                                <Label>Maximum Bookings Limit (Global)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={maxBookings}
                                        onChange={(e) => setMaxBookings(e.target.value)}
                                        className="font-mono text-lg"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Default limit is set to 500 per day. Change this to override for this specific date.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-amber-800 hover:bg-amber-900 text-white">
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
