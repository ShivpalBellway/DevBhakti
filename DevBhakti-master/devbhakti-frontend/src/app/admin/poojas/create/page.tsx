"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPoojaAdmin, fetchAllTemplesAdmin, fetchPoojaCategoriesAdmin, fetchAllPoojasAdmin, fetchAllMandalsAdmin } from "@/api/adminController";
import { useToast } from "@/hooks/use-toast";
import { PoojaForm } from "@/components/admin/poojas/PoojaForm";

export default function CreatePoojaPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [temples, setTemples] = useState<any[]>([]);
    const [mandals, setMandals] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const [masterTemplates, setMasterTemplates] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadTemples();
        loadMandals();
        loadCategories();
        loadMasterTemplates();
    }, []);

    const loadMandals = async () => {
        try {
            const res = await fetchAllMandalsAdmin({ status: "APPROVED", isActive: true, limit: 100 });
            if (res.success && res.data?.mandals) {
                setMandals(res.data.mandals);
            }
        } catch (error) {
            console.error("Failed to load mandals", error);
        }
    };

    const loadMasterTemplates = async () => {
        try {
            const data = await fetchAllPoojasAdmin({ isMaster: true, lang: 'raw' });
            setMasterTemplates(data || []);
        } catch (error) {
            console.error("Failed to load master templates", error);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetchPoojaCategoriesAdmin({ status: "APPROVED" });
            if (res.success) {
                setAvailableCategories(res.data);
            }
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const loadTemples = async () => {
        try {
            // Request only verified and active temples from the API
            const data = await fetchAllTemplesAdmin({ isVerified: true, isActive: true });
            const actualTemples = (data || [])
                .filter((user: any) => user.temple)
                .map((user: any) => user.temple);

            setTemples(actualTemples);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load temples", variant: "destructive" });
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await createPoojaAdmin(formData);
            toast({ title: "Success", description: "Pooja created successfully", variant: "success" });
            router.push('/admin/poojas');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create pooja",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Pooja</h1>
                    <p className="text-slate-500 font-medium">Create a new pooja or ritual template for the platform.</p>
                </div>
            </div>

            <PoojaForm 
                mode="create"
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
