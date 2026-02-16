"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    Eye,
    ShoppingCart,
    Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMyTempleDevotees } from "@/api/templeAdminController";
import { useToast } from "@/hooks/use-toast";

interface Devotee {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    profileImage: string | null;
    lastInteraction: string;
    totalInteractions: number;
    totalSpent: number;
    type: 'POOJA' | 'PRODUCT';
}

interface Stats {
    totalDevotees: number;
    poojaBookersCount: number;
    productCustomersCount: number;
}

export default function TempleUsersPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [poojaBookers, setPoojaBookers] = useState<Devotee[]>([]);
    const [productCustomers, setProductCustomers] = useState<Devotee[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalDevotees: 0,
        poojaBookersCount: 0,
        productCustomersCount: 0,
    });

    useEffect(() => {
        loadDevotees();
    }, []);

    const loadDevotees = async () => {
        setIsLoading(true);
        try {
            const response = await fetchMyTempleDevotees();
            if (response.success) {
                setPoojaBookers(response.data.poojaBookers);
                setProductCustomers(response.data.productCustomers);
                setStats(response.data.stats);
            }
        } catch (error: any) {
            console.error("Load Devotees Error:", error);
            toast({
                title: "Error",
                description: "Failed to load devotees. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filterDevotees = (list: Devotee[]) => {
        return list.filter((user) =>
            (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.phone || "").includes(searchQuery)
        );
    };

    const DevoteeTable = ({ data, type }: { data: Devotee[], type: 'POOJA' | 'PRODUCT' }) => {
        const filtered = filterDevotees(data);

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-border bg-muted/30">
                        <tr>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Devotee</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                                {type === 'POOJA' ? 'Rituals' : 'Purchases'}
                            </th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Value</th>
                            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recent Activity</th>
                            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? (
                            filtered.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="border-b border-border hover:bg-muted/30 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm overflow-hidden">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (user.name || "U").substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{user.name || "Anonymous User"}</p>
                                                <p className="text-xs text-muted-foreground">UID: {user.id.substring(user.id.length - 6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1">
                                            {user.email && (
                                                <p className="text-sm text-foreground flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                                    {user.email}
                                                </p>
                                            )}
                                            {user.phone && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {user.phone}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-medium">{user.totalInteractions} {type === 'POOJA' ? 'Bookings' : 'Orders'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-semibold text-primary">₹{user.totalSpent.toLocaleString()}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(user.lastInteraction).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    No {type === 'POOJA' ? 'pooja bookers' : 'product customers'} found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading temple devotees...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Devotees /Users
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and connect with devotees who have interacted with your temple.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold">{stats.totalDevotees}</p>
                        <p className="text-sm text-muted-foreground">Total Unique Devotees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-primary">{stats.poojaBookersCount}</p>
                        <p className="text-sm text-muted-foreground">Pooja Bookers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-2xl font-bold text-orange-600">{stats.productCustomersCount}</p>
                        <p className="text-sm text-muted-foreground">Product Customers</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="pooja" className="w-full">
                        <div className="px-4 pt-4 border-b">
                            <TabsList className="bg-muted/50">
                                <TabsTrigger value="pooja" className="gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Pooja Bookers
                                </TabsTrigger>
                                <TabsTrigger value="product" className="gap-2">
                                    <ShoppingCart className="w-4 h-4" />
                                    Product Customers
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="pooja" className="mt-0">
                            <DevoteeTable data={poojaBookers} type="POOJA" />
                        </TabsContent>
                        <TabsContent value="product" className="mt-0">
                            <DevoteeTable data={productCustomers} type="PRODUCT" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
