"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle,
    XCircle,
    Building2,
    Calendar,
    ArrowRight,
    Loader2,
    Clock,
    FileText,
    Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    fetchTempleUpdateRequests,
    approveTempleUpdate,
    rejectTempleUpdate
} from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/apiConfig";

export default function TempleUpdateRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await fetchTempleUpdateRequests();
            setRequests(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load update requests",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await approveTempleUpdate(id);
            toast({ title: "Success", description: "Request approved and profile updated" });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to approve request",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id);
        try {
            await rejectTempleUpdate(id);
            toast({ title: "Success", description: "Request rejected" });
            loadRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to reject request",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const renderValue = (key: string, value: any) => {
        if (!value) return <span className="text-slate-400 italic text-xs">Empty</span>;

        if (key === 'image' || key === 'profileImage') {
            return (
                <div className="relative w-20 h-20 rounded-lg border-2 border-slate-200 overflow-hidden shadow-sm">
                    <img src={`${API_URL.replace('/api', '')}${value}`} alt="Requested" className="w-full h-full object-cover" />
                </div>
            );
        }

        if ((key === 'heroImages' || key === 'gallery') && Array.isArray(value)) {
            return (
                <div className="flex gap-2 flex-wrap">
                    {value.map((img: string, i: number) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg border-2 border-slate-200 overflow-hidden shadow-sm">
                            <img src={`${API_URL.replace('/api', '')}${img}`} alt={`${key}-${i}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            );
        }

        return <span className="text-sm font-medium text-slate-700">{String(value)}</span>;
    };

    return (
        <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Temple Update Requests
                    </h1>
                    <p className="text-slate-500 mt-2">Review and approve sensitive profile updates from institutes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-slate-200 text-slate-600 px-3 py-1.5">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending: {requests.length}
                    </Badge>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <div className="absolute inset-0 w-12 h-12 animate-ping rounded-full bg-blue-200 opacity-30"></div>
                    </div>
                    <p className="mt-4 text-slate-500">Loading update requests...</p>
                </div>
            ) : requests.length === 0 ? (
                <Card className="border-0 shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">✓</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">All caught up!</h3>
                        <p>No pending update requests found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {requests.map((request, index) => (
                        <Card key={request.id} className="overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-slate-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl text-white shadow-lg">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900">{request.temple.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                                                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    {Object.keys(request.requestedData).length} fields
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 bg-white hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm"
                                            onClick={() => handleReject(request.id)}
                                            disabled={actionLoading === request.id}
                                        >
                                            {actionLoading === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                                            onClick={() => handleApprove(request.id)}
                                            disabled={actionLoading === request.id}
                                        >
                                            {actionLoading === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                            Approve Updates
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-1/4 font-semibold text-slate-700">Field</TableHead>
                                            <TableHead className="w-3/8 font-semibold text-amber-600">Current Value</TableHead>
                                            <TableHead className="w-3/8 font-semibold text-emerald-600">New Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.keys(request.requestedData).map((key, idx) => (
                                            <TableRow key={key} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                                                <TableCell className="font-semibold capitalize text-slate-700 border-r border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        {key.includes('image') ? <Image className="w-4 h-4 text-slate-400" /> : <FileText className="w-4 h-4 text-slate-400" />}
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="border-r border-slate-100">
                                                    {renderValue(key, request.oldData[key])}
                                                </TableCell>
                                                <TableCell className="bg-gradient-to-r from-emerald-50/50 to-green-50/50">
                                                    <div className="flex items-start gap-2">
                                                        <div className="bg-emerald-100 rounded-full p-1 mt-0.5">
                                                            <ArrowRight className="w-3 h-3 text-emerald-600" />
                                                        </div>
                                                        {renderValue(key, request.requestedData[key])}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}