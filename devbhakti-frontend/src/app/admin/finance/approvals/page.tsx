"use client";

import Link from "next/link";

import React, { useEffect, useState } from "react";
import {
    fetchPendingApprovals,
    approveRequestAdmin,
    rejectRequestAdmin
} from "@/api/adminController";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ApprovalRequest {
    id: string;
    type: "TEMPLE" | "SELLER";
    entityName: string;
    entityId: string;
    requestedData: Record<string, any>;
    oldData: Record<string, any>;
    createdAt: string;
    status: string;
}

export default function ApprovalsPage() {
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetchPendingApprovals();
            if (res.success) {
                setRequests(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch approvals:", error);
            toast.error("Failed to load pending approvals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, type: "TEMPLE" | "SELLER", action: "approve" | "reject") => {
        try {
            setProcessingId(id);

            let res;
            if (action === "approve") {
                res = await approveRequestAdmin(id, type);
            } else {
                res = await rejectRequestAdmin(id, type);
            }

            if (res.success) {
                toast.success(`Request ${action}d successfully`);
                // Remove from list
                setRequests((prev) => prev.filter((req) => req.id !== id));
            }
        } catch (error: any) {
            console.error(`Failed to ${action} request:`, error);
            // Handle error message gracefully
            const msg = error.response?.data?.message || error.message || `Failed to ${action} request`;
            toast.error(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const renderDiff = (key: string, oldVal: any, newVal: any) => {
        // Handle complex objects like images array if necessary, otherwise stringify
        const formatVal = (val: any) => {
            if (val === undefined || val === null) return <span className="text-muted-foreground italic">None</span>;
            if (typeof val === 'object') return <pre className="text-xs max-w-[200px] overflow-auto whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
            return String(val);
        };

        return (
            <TableRow key={key}>
                <TableCell className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                <TableCell className="text-muted-foreground">{formatVal(oldVal)}</TableCell>
                <TableCell className="font-semibold text-primary">{formatVal(newVal)}</TableCell>
            </TableRow>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
                <p className="text-muted-foreground">
                    Review and approve sensitive profile updates from Temples and Sellers.
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Check className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">No Pending Requests</h3>
                    <p className="text-muted-foreground text-center max-w-sm mt-2">
                        All profile update requests have been processed. Good job!
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {requests.map((request) => (
                        <Card key={request.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <div className="space-y-1">

                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Link
                                            href={request.type === "TEMPLE" ? `/admin/temples/${request.entityId}` : `/admin/sellers/view/${request.entityId}`}
                                            className="hover:underline hover:text-primary transition-colors"
                                        >
                                            {request.entityName}
                                        </Link>
                                        <Badge variant={request.type === "TEMPLE" ? "default" : "secondary"}>
                                            {request.type}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Requested on {format(new Date(request.createdAt), "PPP p")}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 mt-4">
                                <div className="bg-muted/30 rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[120px]">Field</TableHead>
                                                <TableHead>Old Value</TableHead>
                                                <TableHead>New Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.keys(request.requestedData).map((key) =>
                                                renderDiff(key, request.oldData[key], request.requestedData[key])
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-3 pt-6 border-t">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleAction(request.id, request.type, "reject")}
                                    disabled={!!processingId}
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <X className="w-4 h-4 mr-2" />
                                    )}
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => handleAction(request.id, request.type, "approve")}
                                    disabled={!!processingId}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processingId === request.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Approve
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
