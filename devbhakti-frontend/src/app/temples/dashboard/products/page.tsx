"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Package,
    Search,
    Filter,
    MoreVertical,
    Plus,
    Eye,
    Edit,
    Trash2,
    IndianRupee
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const products = [
    {
        id: 1,
        name: "Panchamrit Set",
        category: "Pooja Items",
        price: "₹550",
        stock: 45,
        status: "In Stock",
        image: "https://images.unsplash.com/photo-1609130718589-61942360f7be?q=80&w=2070&auto=format&fit=crop",
    },
    {
        id: 2,
        name: "Brass Diya",
        category: "Home Decor",
        price: "₹1,200",
        stock: 12,
        status: "Low Stock",
        image: "https://images.unsplash.com/photo-1602633159171-46342c035654?q=80&w=2070&auto=format&fit=crop",
    },
    {
        id: 3,
        name: "Incense Sticks",
        category: "Fragrance",
        price: "₹250",
        stock: 150,
        status: "In Stock",
        image: "https://images.unsplash.com/photo-1602633159171-46342c035654?q=80&w=2070&auto=format&fit=crop",
    },
];

export default function TempleProductsPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                        Product Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your temple's marketplace inventory.
                    </p>
                </div>
                <Button variant="sacred">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Product
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Products", value: "84", color: "text-foreground" },
                    { label: "Active Listings", value: "72", color: "text-primary" },
                    { label: "Out of Stock", value: "5", color: "text-red-600" },
                    { label: "Total Sales", value: "₹45,200", color: "text-green-600" },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Category
                </Button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card className="overflow-hidden group hover:shadow-warm transition-all duration-300">
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2">
                                    <Badge className={product.status === "In Stock" ? "bg-green-500" : "bg-orange-500"}>
                                        {product.status}
                                    </Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">{product.category}</p>
                                    </div>
                                    <p className="text-lg font-bold text-primary">{product.price}</p>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground">Stock: <span className="font-medium text-foreground">{product.stock}</span></p>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
