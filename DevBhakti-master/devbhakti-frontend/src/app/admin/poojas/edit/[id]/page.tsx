"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePoojaAdmin, fetchAllTemplesAdmin, fetchPoojaCategoriesAdmin, fetchPoojaByIdAdmin, fetchAllPoojasAdmin, fetchAllMandalsAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { PoojaForm } from "@/components/admin/poojas/PoojaForm";

export default function EditPoojaPage() {
    const router = useRouter();
    const params = useParams();
    const poojaId = params.id as string;
    const { toast } = useToast();
    
    const [temples, setTemples] = useState<any[]>([]);
    const [mandals, setMandals] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const [masterTemplates, setMasterTemplates] = useState<any[]>([]);
    const [poojaData, setPoojaData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, [poojaId]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch core pooja data first as it is required
            let poojaRes: any;
            try {
                poojaRes = await fetchPoojaByIdAdmin(poojaId);
            } catch (err) {
                console.error('Failed to fetch pooja:', err);
                toast({ title: "Error", description: "Pooja not found or access denied", variant: "destructive" });
                router.push('/admin/poojas');
                return;
            }

            if (!poojaRes || !poojaRes.success || !poojaRes.data) {
                toast({ title: "Error", description: "Pooja not found", variant: "destructive" });
                router.push('/admin/poojas');
                return;
            }

            setPoojaData(poojaRes.data);
            // Update breadcrumb with pooja name
            const poojaName = poojaRes.data.name?.en || poojaRes.data.name_en || "Edit Pooja";
            window.dispatchEvent(new CustomEvent('updateBreadcrumb', { detail: `Edit: ${poojaName}` }));

            // Fetch auxiliary data (temples, mandals, categories, master templates)
            try {
                const [templesRes, categoriesRes, masterRes, mandalsRes] = await Promise.all([
                    fetchAllTemplesAdmin({ isVerified: true, isActive: true }).catch(e => { console.warn('Could not load temples:', e); return []; }),
                    fetchPoojaCategoriesAdmin({ status: "APPROVED" }).catch(e => { console.warn('Could not load categories:', e); return { success: false, data: [] }; }),
                    fetchAllPoojasAdmin({ isMaster: true, lang: 'raw' }).catch(e => { console.warn('Could not load master templates:', e); return []; }),
                    fetchAllMandalsAdmin({ status: "APPROVED", isActive: true, limit: 100 }).catch(e => { console.warn('Could not load mandals:', e); return []; })
                ]);

                if (Array.isArray(templesRes)) {
                    const actualTemples = templesRes
                        .filter((user: any) => user.temple)
                        .map((user: any) => user.temple);
                    setTemples(actualTemples);
                }

                const mandalsList = mandalsRes?.data?.mandals || mandalsRes?.data || (Array.isArray(mandalsRes) ? mandalsRes : []);
                if (Array.isArray(mandalsList)) {
                    setMandals(mandalsList);
                }

                if (categoriesRes && categoriesRes.success) {
                    setAvailableCategories(categoriesRes.data);
                }

                if (Array.isArray(masterRes)) {
                    setMasterTemplates(masterRes);
                }
            } catch (auxError) {
                console.warn('Error loading auxiliary data:', auxError);
            }

        } catch (error) {
            console.error('Load initial data error:', error);
            toast({ title: "Error", description: "Failed to load pooja data", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await updatePoojaAdmin(poojaId, formData);
            toast({ title: "Success", description: "Pooja updated successfully", variant: "success" });
            router.push('/admin/poojas');
        } catch (error) {
            toast({ title: "Error", description: "Failed to update pooja", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Pooja</h1>
                    <p className="text-slate-500 font-medium">Modify existing spiritual service details and localization.</p>
                </div>
            </div>

            <PoojaForm 
                mode="edit"
                initialData={poojaData}
                temples={temples}
                mandals={mandals}
                availableCategories={availableCategories}
                masterTemplates={masterTemplates}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
            />
        </div>
    );
}
