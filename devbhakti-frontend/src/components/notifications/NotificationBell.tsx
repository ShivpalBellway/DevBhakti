"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Clock, ShieldAlert, Package, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "@/api/notificationController";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";

interface Notification {
    id: string;
    title: string;
    body: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

interface NotificationBellProps {
    userId: string;
    userType: 'admin' | 'temple_admin' | 'seller' | 'devotee';
}

export function NotificationBell({ userId, userType }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const res = await fetchNotifications(userId, userType);
        if (res.success) {
            console.log(`✅ [Bell Component] Fetched ${res.data.length} notifications, unread: ${res.unreadCount}`);
            setNotifications(res.data);
            setUnreadCount(res.unreadCount);
        } else {
            console.error("❌ [Bell Component] Failed to fetch notifications:", res.message);
        }
        setLoading(false);
    }, [userId, userType]);

    useEffect(() => {
        loadNotifications();

        // 💡 Periodically refresh every 30 seconds
        const interval = setInterval(() => {
            loadNotifications();
        }, 30000);

        // 💡 Signal sunne wala function
        const handleNewNotification = (event: any) => {
            console.log("⚡ [Bell Component] Signal RECEIVED! Refreshing fast...");
            // Sirf 1 second ka delay
            setTimeout(() => {
                loadNotifications();
            }, 1000);
        };

        window.addEventListener('notification-received', handleNewNotification);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notification-received', handleNewNotification);
        };
    }, [userId, userType, loadNotifications]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await markNotificationRead(id);
        if (res.success) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllRead = async () => {
        const res = await markAllNotificationsRead(userId, userType);
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        }
    };

    const getIcon = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("order")) return <Package className="w-4 h-4 text-primary" />;
        if (t.includes("booking")) return <Calendar className="w-4 h-4 text-secondary" />;
        if (t.includes("donation")) return <Heart className="w-4 h-4 text-red-600" />;
        return <Bell className="w-4 h-4 text-primary" />;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-sidebar-accent/50 transition-colors rounded-full w-10 h-10">
                    <Bell className="w-5 h-5 text-foreground/70" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-[10px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-background shadow-lg z-10 transition-transform scale-100 hover:scale-110">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-primary/10 animate-in fade-in zoom-in duration-200 bg-white">
                <div className="flex items-center justify-between p-4 border-b border-primary/5 bg-primary/5">
                    <h3 className="font-bold text-sm tracking-tight text-primary">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="text-[11px] h-7 px-2 hover:bg-primary/10 hover:text-primary transition-colors gap-1 text-primary/60"
                        >
                            <CheckCheck className="w-3 h-3" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[350px]">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-muted-foreground animate-pulse">Fetching blessings...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-sidebar-accent/30 rounded-full flex items-center justify-center">
                                <Bell className="w-6 h-6 text-sidebar-foreground/20" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Peaceful here.</p>
                                <p className="text-xs text-muted-foreground">No new notifications at the moment.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-1">
                            {notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={n.data?.link || "#"}
                                    className={cn(
                                        "flex gap-3 p-3 rounded-lg transition-all hover:bg-primary/5 group relative mb-1 mx-1",
                                        !n.isRead && "bg-secondary/10 border-l-2 border-secondary rounded-l-none"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                                        !n.isRead ? "bg-secondary/20" : "bg-primary/5"
                                    )}>
                                        {getIcon(n.title)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className={cn(
                                            "text-xs leading-none",
                                            !n.isRead ? "font-bold text-foreground" : "font-medium text-foreground/70"
                                        )}>{n.title}</p>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                            {n.body}
                                        </p>
                                        <div className="flex items-center gap-2 pt-0.5">
                                            <Clock className="w-3 h-3 text-muted-foreground/50" />
                                            <span className="text-[10px] text-muted-foreground/70 font-medium">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    {!n.isRead && (
                                        <button
                                            onClick={(e) => handleMarkAsRead(n.id, e)}
                                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-full text-primary"
                                            title="Mark as read"
                                        >
                                            <CheckCheck className="w-3 h-3" />
                                        </button>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-primary/5 bg-primary/5">
                        <Link href={userType === 'admin' ? '/admin/notifications' : userType === 'temple_admin' ? '/temples/dashboard/notifications' : '/seller/dashboard/notifications'}>
                            <Button className="w-full text-xs h-10 font-bold bg-white hover:bg-primary/5 text-primary border border-primary/10 rounded-xl shadow-sm hover:shadow transition-all">
                                View All Notifications
                            </Button>
                        </Link>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
