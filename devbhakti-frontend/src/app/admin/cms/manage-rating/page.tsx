"use client";

import React, { useState, useEffect } from "react";
import {
    Save,
    Star,
    Layout,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRatingsSettingsAdmin, updateRatingsSettingsAdmin } from "@/api/adminController";
import { toast } from "sonner";

interface RatingSettings {
    temple: { home: boolean; details: boolean };
    product: { home: boolean; details: boolean };
    pooja: { home: boolean; details: boolean };
}

export default function ManageRatingPage() {
    const [settings, setSettings] = useState<RatingSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await fetchRatingsSettingsAdmin();
            setSettings(data.settings);
        } catch (error) {
            console.error("Error loading ratings settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (category: keyof RatingSettings, field: 'home' | 'details') => {
        if (!settings) return;
        setSettings({
            ...settings,
            [category]: {
                ...settings[category],
                [field]: !settings[category][field]
            }
        });
    };

    const handleGlobalToggle = (checked: boolean) => {
        if (!settings) return;
        setSettings({
            temple: { home: checked, details: checked },
            product: { home: checked, details: checked },
            pooja: { home: checked, details: checked }
        });
    };

    const handleSave = async () => {
        if (!settings) return;
        try {
            setSaving(true);
            await updateRatingsSettingsAdmin(settings);
            toast.success("Ratings settings updated successfully");
        } catch (error) {
            console.error("Error saving ratings settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="space-y-8 p-6 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                        Manage Ratings
                    </h1>
                    <h6 className="text-muted-foreground text-base">
                        Centrally control the visibility of ratings and reviews across the platform.
                    </h6>
                </div>
                <Button
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 h-11 px-6 shadow-md"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Configuration
                        </>
                    )}
                </Button>
            </div>

            {/* Global Toggle Card */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <Star className="w-5 h-5 fill-primary" />
                                Global Rating Control
                            </h3>
                            <p className="text-sm text-muted-foreground italic">
                                Enable or disable all ratings across the entire platform with one click.
                            </p>
                        </div>
                        <Switch
                            checked={settings.temple.home && settings.temple.details && settings.product.home && settings.product.details && settings.pooja.home && settings.pooja.details}
                            onCheckedChange={handleGlobalToggle}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temple Ratings */}
                <Card className="shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Layout className="w-5 h-5 text-primary" />
                            Temple Ratings
                        </CardTitle>
                        <CardDescription>Control ratings visibility for temple listings and detail pages.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Home / Listings Page</Label>
                                <p className="text-sm text-muted-foreground italic">Show ratings on temple cards in lists</p>
                            </div>
                            <Switch
                                checked={settings.temple.home}
                                onCheckedChange={() => handleToggle('temple', 'home')}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Temple Details Page</Label>
                                <p className="text-sm text-muted-foreground italic">Show ratings and reviews on detail page</p>
                            </div>
                            <Switch
                                checked={settings.temple.details}
                                onCheckedChange={() => handleToggle('temple', 'details')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Product Ratings */}
                <Card className="shadow-sm border-border overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Product Ratings
                        </CardTitle>
                        <CardDescription>Control ratings visibility for marketplace product cards and detail pages.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Home / Marketplace Page</Label>
                                <p className="text-sm text-muted-foreground italic">Show ratings on product cards in marketplace</p>
                            </div>
                            <Switch
                                checked={settings.product.home}
                                onCheckedChange={() => handleToggle('product', 'home')}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Product Details Page</Label>
                                <p className="text-sm text-muted-foreground italic">Show ratings and reviews on product page</p>
                            </div>
                            <Switch
                                checked={settings.product.details}
                                onCheckedChange={() => handleToggle('product', 'details')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pooja Ratings */}
                <Card className="shadow-sm border-border overflow-hidden col-md-span-2">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-primary" />
                            Pooja Ratings
                        </CardTitle>
                        <CardDescription>Control ratings visibility for pooja listings and detail pages.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Home / Listings Page</Label>
                                <p className="text-sm text-muted-foreground italic">Show ratings on pooja cards in lists</p>
                            </div>
                            <Switch
                                checked={settings.pooja.home}
                                onCheckedChange={() => handleToggle('pooja', 'home')}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Pooja Details Page</Label>
                                <p className="text-sm text-muted-foreground italic">Show ratings and reviews on pooja page</p>
                            </div>
                            <Switch
                                checked={settings.pooja.details}
                                onCheckedChange={() => handleToggle('pooja', 'details')}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className={`flex items-center gap-2 p-4 rounded-lg border ${settings.temple.home || settings.temple.details || settings.product.home || settings.product.details || settings.pooja.home || settings.pooja.details ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-muted border-border text-muted-foreground"}`}>
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                    {settings.temple.home || settings.temple.details || settings.product.home || settings.product.details || settings.pooja.home || settings.pooja.details
                        ? "Individual sections are enabled. Ratings will be visible where toggled ON."
                        : "All ratings are currently HIDDEN across the entire platform."}
                </p>
            </div>
        </div>
    );
}
