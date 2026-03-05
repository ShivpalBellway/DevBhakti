"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    Heart,
    Send,
    Filter,
    CheckCircle,
    AlertCircle,
    Loader2,
    Trash2,
    User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import axios from 'axios';

interface Devotee {
    id: string;
    name: string;
    phone: string;
    dob?: string;
    anniversary?: string;
}

const AISENSY_TEMPLATES = [
    { id: 'birthday_wish', name: 'Birthday Wish', description: 'Template: Namaste {{1}}, Happy Birthday from DevBhakti!', params: ['{{name}}'] },
    { id: 'anniversary_wish', name: 'Anniversary Wish', description: 'Template: Wishing you a very Happy Anniversary {{1}}! - DevBhakti', params: ['{{name}}'] },
    { id: 'pooja_reminder', name: 'Pooja Reminder', description: 'Template: Namaste {{1}}, don\'t forget your upcoming Pooja.', params: ['{{name}}'] },
];

export default function MarketingDashboard() {
    const [targetType, setTargetType] = useState<string>('birthday');
    const [poojas, setPoojas] = useState<any[]>([]);
    const [selectedPoojaId, setSelectedPoojaId] = useState<string>('');
    const [devotees, setDevotees] = useState<Devotee[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(AISENSY_TEMPLATES[0]);

    useEffect(() => {
        fetchPoojas();
        fetchDevotees();
    }, [targetType, selectedPoojaId]);

    const fetchPoojas = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/poojas`);
            if (response.data.success) {
                setPoojas(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching poojas:', error);
        }
    };

    const fetchDevotees = async () => {
        setLoading(true);
        try {
            const params: any = { type: targetType };
            if (targetType === 'pooja_history' && selectedPoojaId) {
                params.poojaId = selectedPoojaId;
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/marketing/target-devotees`, { params });
            if (response.data.success) {
                setDevotees(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching devotees:', error);
            toast.error('Failed to load devotee list');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessages = async () => {
        if (devotees.length === 0) {
            toast.error('No devotees selected');
            return;
        }

        if (!confirm(`Are you sure you want to send WhatsApp messages to ${devotees.length} devotees?`)) {
            return;
        }

        setSending(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/marketing/send-bulk-whatsapp`, {
                userIds: devotees.map(d => d.id),
                campaignName: selectedTemplate.id,
                templateParams: selectedTemplate.params
            });

            if (response.data.success) {
                toast.success(`Successfully sent ${response.data.results.length} messages!`);
            }
        } catch (error) {
            console.error('Error sending messages:', error);
            toast.error('Failed to send messages');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h1>
                    <p className="text-muted-foreground">Manage your WhatsApp promotional campaigns.</p>
                </div>
                <Button
                    onClick={handleSendMessages}
                    disabled={devotees.length === 0 || sending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-md"
                >
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Bulk WhatsApp ({devotees.length})
                </Button>
            </div>

            {/* Top Filter Card */}
            <Card className="shadow-sm border-muted">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">Campaign Filters & Template</CardTitle>
                        </div>
                        <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {devotees.length} Bhakts found
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                Target Audience
                            </label>
                            <Select value={targetType} onValueChange={setTargetType}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="birthday">Today's Birthdays</SelectItem>
                                    <SelectItem value="anniversary">Today's Anniversaries</SelectItem>
                                    <SelectItem value="pooja_history">Pooja History</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {targetType === 'pooja_history' && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-muted-foreground" />
                                    Select Pooja
                                </label>
                                <Select value={selectedPoojaId} onValueChange={setSelectedPoojaId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select a pooja" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {poojas.map(pooja => (
                                            <SelectItem key={pooja.id} value={pooja.id}>{pooja.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Send className="w-4 h-4 text-muted-foreground" />
                                WhatsApp Template
                            </label>
                            <Select
                                value={selectedTemplate.id}
                                onValueChange={(val) => setSelectedTemplate(AISENSY_TEMPLATES.find(t => t.id === val) || AISENSY_TEMPLATES[0])}
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AISENSY_TEMPLATES.map(template => (
                                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-1 border-l pl-6 bg-primary/5 rounded-r-lg p-4">
                            <label className="text-[10px] uppercase font-bold text-primary tracking-wider mb-2 block">
                                Proposed Message Content
                            </label>
                            <div className="text-sm italic text-muted-foreground bg-white/50 p-2 rounded border border-primary/10 leading-relaxed">
                                {targetType === 'birthday' ? (
                                    <>Namaste <span className="text-primary font-bold">{"{name}"}</span>, Happy Birthday from DevBhakti! 🎊 Celebrate your special day with divine blessings.</>
                                ) : targetType === 'anniversary' ? (
                                    <>Wishing you a very Happy Anniversary <span className="text-primary font-bold">{"{name}"}</span>! ❤️ May your bond be blessed - DevBhakti</>
                                ) : (
                                    <>Namaste <span className="text-primary font-bold">{"{name}"}</span>, don&apos;t forget to book your favorite Pooja again on DevBhakti! 🙏</>
                                )}
                            </div>
                            <p className="mt-2 text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Variable {"{name}"} will be replaced automatically.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recipient Preview List */}
            <Card className="shadow-sm border-muted">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="w-5 h-5 text-primary" />
                        Bhakts Recipient List
                    </CardTitle>
                    <CardDescription>Review the list of devotees who will receive the message.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse text-sm">Finding matching bhakts for your campaign...</p>
                        </div>
                    ) : devotees.length > 0 ? (
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-muted-foreground border-r last:border-r-0 uppercase tracking-tight">Bhakt Name</th>
                                        <th className="px-6 py-4 text-left font-semibold text-muted-foreground border-r last:border-r-0 uppercase tracking-tight">WhatsApp Number</th>
                                        <th className="px-6 py-4 text-left font-semibold text-muted-foreground border-r last:border-r-0 uppercase tracking-tight">Event Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {devotees.map((devotee) => (
                                        <tr key={devotee.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4 border-r last:border-r-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors border border-primary/20">
                                                        {devotee.name?.[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{devotee.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 border-r last:border-r-0 font-mono text-muted-foreground">
                                                {devotee.phone}
                                            </td>
                                            <td className="px-6 py-4 border-r last:border-r-0">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
                                                    {targetType === 'birthday' ? devotee.dob : targetType === 'anniversary' ? devotee.anniversary : 'Pooja History'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-2xl bg-muted/10">
                            <div className="p-5 rounded-full bg-muted/50 mb-4 border shadow-inner">
                                <User className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <p className="text-xl font-semibold text-muted-foreground">No Bhakts Detected</p>
                            <p className="text-sm text-muted-foreground/60 mt-1 max-w-[280px] text-center">
                                Please adjust your filters above to find matching devotees for this campaign.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
