"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Clock, ShieldAlert, Package, Calendar, Heart, Search } from "lucide-react";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/notificationController";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    body: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [adminUser, setAdminUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("admin_user");
        if (userStr) {
            setAdminUser(JSON.parse(userStr));
        }
    }, []);

    const userId = adminUser?.id;
    const userType = 'admin';

    const loadNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetchNotifications(userId, userType);
            if (res.success) {
                setNotifications(res.data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            loadNotifications();
        }
    }, [userId, loadNotifications]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await markNotificationRead(id);
        if (res.success) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        }
    };

    const handleMarkAllRead = async () => {
        if (!userId) return;
        const res = await markAllNotificationsRead(userId, userType);
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

    const getIcon = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("order")) return <Package className="w-5 h-5 text-primary" />;
        if (t.includes("booking")) return <Calendar className="w-5 h-5 text-secondary" />;
        if (t.includes("donation")) return <Heart className="w-5 h-5 text-red-600" />;
        if (t.includes("alert") || t.includes("warning")) return <ShieldAlert className="w-5 h-5 text-amber-600" />;
        return <Bell className="w-5 h-5 text-primary" />;
    };

    const filteredNotifications = notifications.filter(n =>
        (n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (n.body?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated on platform activity, orders, and system alerts.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllRead} className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md border-b-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notifications..."
                        className="pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-12 pl-12 text-center space-y-4 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-muted-foreground">Loading your notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                            <Bell className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">You're all caught up!</h3>
                            <p className="text-muted-foreground mt-1">There are no notifications to show right now.</p>
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground">No notifications match your search.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "flex flex-col sm:flex-row sm:items-start gap-4 p-5 transition-all hover:bg-primary/5 group relative",
                                    !n.isRead && "bg-secondary/10 border-l-4 border-secondary pl-4"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                                    !n.isRead ? "bg-secondary/20 shadow-sm" : "bg-primary/5"
                                )}>
                                    {getIcon(n.title)}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5 pt-1">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                        <h4 className={cn(
                                            "text-base leading-none pr-8 sm:pr-0",
                                            !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"
                                        )}>
                                            {n.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap hidden sm:flex">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed pr-8 sm:pr-0">
                                        {n.body}
                                    </p>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 sm:hidden">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </div>

                                    {n.data?.link && (
                                        <div className="pt-2">
                                            <Link href={n.data.link}>
                                                <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold">
                                                    View Details →
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                {!n.isRead && (
                                    <button
                                        onClick={(e) => handleMarkAsRead(n.id, e)}
                                        className="absolute right-4 top-5 p-2 bg-background/50 hover:bg-white rounded-full text-primary shadow-sm ring-1 ring-black/5 transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                        title="Mark as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
