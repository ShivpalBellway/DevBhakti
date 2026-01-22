"use client";

import React, { useState, useEffect } from "react";
import {
    Edit2,
    Upload,
    X,
    LayoutGrid,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchAllCTACardsAdmin, createCTACardAdmin, updateCTACardAdmin } from "@/api/adminController";
import { BASE_URL } from "@/config/apiConfig";

// Default seed data to ensure cards exist
const DEFAULT_CARDS = [
    {
        title: "For Devotees",
        points: [
            "Book poojas and sevas online",
            "Watch live darshan 24/7",
            "Shop authentic spiritual products",
            "Receive festival notifications",
            "Make secure donations"
        ],
        buttonText: "Sign Up as Devotee",
        buttonLink: "/auth?mode=register",
        cardType: "primary",
        active: true,
        order: 1
    },
    {
        title: "Temples, Devotional Shops & Pandits",
        points: [
            "Manage bookings and services",
            "Stream live darshan",
            "Sell products on marketplace",
            "Track donations and reports",
            "Automated logistics integration"
        ],
        buttonText: "Register Your Temple",
        buttonLink: "/temples/register",
        cardType: "secondary",
        active: true,
        order: 2
    }
];

export default function CTACardsPage() {
    const [ctaCards, setCTACards] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form state structure for fixed 5 points
    const [formData, setFormData] = useState({
        title: "",
        points: ["", "", "", "", ""],
    });

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string>("");

    useEffect(() => {
        loadCTACards();
    }, []);

    const loadCTACards = async () => {
        try {
            setLoading(true);
            let data = await fetchAllCTACardsAdmin();

            // Auto-seed if empty
            if (!data || data.length === 0) {
                console.log("Seeding default cards...");
                for (const card of DEFAULT_CARDS) {
                    const formData = new FormData();
                    formData.append('title', card.title);
                    formData.append('points', JSON.stringify(card.points));
                    formData.append('buttonText', card.buttonText);
                    formData.append('buttonLink', card.buttonLink);
                    formData.append('cardType', card.cardType);
                    formData.append('active', 'true');
                    formData.append('order', card.order.toString());
                    // Note: Creating without icon initially if seeding, will need manual icon upload later mostly
                    // Or we handle icon validation differently
                    // For now, let's assume admin will upload icon. 
                    // To bypass required icon in backend, we might need to adjust backend or upload dummy.
                    // But for now, let's just show empty state or handle differently.
                    // Actually, let's just let the user see empty and let them create via UI if needed?
                    // No, requirements say fixed 2 cards.
                    // We will just seed them on frontend state if backend is empty to allow creation?
                    // Better: UI shows 2 cards placeholder if empty, and "Initialize" or just "Edit" to create.
                }
                // Reload after seed? Or just use what we have?
                // For simplicity, if empty, we will guide user to "Setup" them or we just show placeholders.
            }

            // Sort by order
            data = data.sort((a: any, b: any) => a.order - b.order);
            setCTACards(data);
        } catch (error) {
            console.error("Error loading CTA cards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (card: any, index: number) => {
        // If card exists in Backend
        if (card.id) {
            setEditingCard(card);
            setFormData({
                title: card.title,
                points: Array.isArray(card.points) && card.points.length === 5
                    ? card.points
                    : [
                        card.points?.[0] || "",
                        card.points?.[1] || "",
                        card.points?.[2] || "",
                        card.points?.[3] || "",
                        card.points?.[4] || ""
                    ],
            });
            setIconPreview(card.icon ? (card.icon.startsWith('http') ? card.icon : `${BASE_URL}${card.icon}`) : "");
            setIconFile(null);
            setIsDialogOpen(true);
        } else {
            // "Ghost" card (placeholder) - Prepare for creation
            setEditingCard({ ...card, isNew: true }); // Mark as new for logic
            setFormData({
                title: card.title,
                points: card.points,
            });
            setIconPreview("");
            setIconFile(null);
            setIsDialogOpen(true);
        }
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setIconFile(file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handlePointChange = (index: number, value: string) => {
        const newPoints = [...formData.points];
        newPoints[index] = value;
        setFormData({ ...formData, points: newPoints });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();

            // Editable fields
            data.append('title', formData.title);
            data.append('points', JSON.stringify(formData.points));
            if (iconFile) data.append('icon', iconFile);

            // Fixed fields preservation
            // If editing existing, use its fixed values. If creating from ghost, use ghost values.
            const fixedData = editingCard.isNew ? editingCard : editingCard;

            data.append('buttonText', fixedData.buttonText);
            data.append('buttonLink', fixedData.buttonLink);
            data.append('cardType', fixedData.cardType);
            data.append('active', 'true');
            data.append('order', fixedData.order.toString());

            if (editingCard.id) {
                await updateCTACardAdmin(editingCard.id, data);
            } else {
                if (!iconFile) {
                    alert("Please upload an icon for the card.");
                    return;
                }
                await createCTACardAdmin(data);
            }

            setIsDialogOpen(false);
            loadCTACards();
        } catch (error) {
            console.error("Error saving CTA card:", error);
            alert("Error saving CTA card");
        }
    };

    // Merge backend data with default fixed structure to ensure 2 cards always show
    // AND enforce fixed fields (Buttons, Links) from code, ignoring DB for those specific fields
    const displayCards = [0, 1].map(index => {
        const backendCard = ctaCards.find(c => c.order === (index + 1));
        const defaultCard = DEFAULT_CARDS[index];

        if (backendCard) {
            return {
                ...backendCard,
                buttonText: defaultCard.buttonText,
                buttonLink: defaultCard.buttonLink,
                cardType: defaultCard.cardType
            };
        }
        return defaultCard;
    });

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">CTA Cards Management</h1>
                <p className="text-muted-foreground">
                    Manage the two main Call-to-Action cards on the homepage. <br />
                    Structure (Buttons & Links) is fixed. You can update the Title, content points, and icon.
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-2 text-center py-12">Loading...</div>
                ) : (
                    displayCards.map((card: any, index) => (
                        <div
                            key={index}
                            className={`relative rounded-2xl overflow-hidden border-2 shadow-sm transition-all
                                ${card.cardType === 'primary' ? 'border-primary/20 bg-orange-50/50' : 'border-gray-200 bg-white'}
                            `}
                        >
                            {/* Card Header Label */}
                            <div className="absolute top-4 right-4">
                                <Badge variant={card.cardType === 'primary' ? 'default' : 'secondary'}>
                                    {card.cardType === 'primary' ? 'Devotee Card' : 'Temple Card'}
                                </Badge>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Icon Preview */}
                                <div className="w-16 h-16 rounded-xl bg-white shadow-sm border flex items-center justify-center p-2">
                                    {card.icon ? (
                                        <img
                                            src={card.icon.startsWith('http') ? card.icon : `${BASE_URL}${card.icon}`}
                                            alt="Icon"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-xs text-muted-foreground text-center">No Icon</div>
                                    )}
                                </div>

                                {/* Content Preview */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{card.title}</h3>
                                    <ul className="space-y-3">
                                        {card.points?.map((point: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${card.cardType === 'primary' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                                <span>{point || "Empty point..."}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Fixed Button Preview */}
                                <div className="pt-4 border-t">
                                    <Button variant="outline" className="w-full cursor-not-allowed opacity-80" disabled>
                                        {card.buttonText}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Links to: <code className="bg-gray-100 px-1 py-0.5 rounded">{card.buttonLink}</code>
                                    </p>
                                </div>

                                {/* Edit Action */}
                                <Button
                                    onClick={() => handleEdit(card, index)}
                                    className="w-full gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Content
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Update {editingCard?.cardType === 'primary' ? 'Devotee' : 'Temple'} Card</DialogTitle>
                        <DialogDescription>
                            Update the title, icon, and 5 key points. Buttons and links are fixed.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        {/* Title Section */}
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-base font-semibold">Card Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter card title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Icon Section */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Card Icon</Label>
                            <div className="flex items-center gap-4">
                                <div className="border-2 border-dashed rounded-lg px-6 py-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer relative bg-slate-50 w-full">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                    <div className="text-sm font-medium text-center text-muted-foreground">
                                        Click to upload new icon
                                    </div>
                                    <Input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleIconChange}
                                        accept="image/*"
                                    />
                                </div>
                                {iconPreview && (
                                    <div className="w-20 h-20 shrink-0 border rounded-lg p-2 bg-white shadow-sm relative">
                                        <img src={iconPreview} className="w-full h-full object-contain" alt="Preview" />
                                        <button
                                            type="button"
                                            onClick={() => { setIconPreview(""); setIconFile(null); }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Points Section */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Bullet Points (Fixed 5)</Label>
                            <div className="space-y-3">
                                {formData.points.map((point, index) => (
                                    <div key={index} className="flex gap-3 items-center">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                                            {index + 1}
                                        </div>
                                        <Input
                                            placeholder={`Point ${index + 1} text...`}
                                            value={point}
                                            onChange={(e) => handlePointChange(index, e.target.value)}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
