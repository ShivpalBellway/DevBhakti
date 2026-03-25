import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const searchGlobal = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const searchQuery = typeof query === "string" ? query.trim() : "";

        // If no query, prioritize showing Temples by default
        const [temples, poojas, products] = await Promise.all([
            // Search Temples
            prisma.temple.findMany({
                where: searchQuery ? {
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { location: { contains: searchQuery, mode: "insensitive" } },
                        { category: { contains: searchQuery, mode: "insensitive" } },
                        { description: { contains: searchQuery, mode: "insensitive" } }
                    ],
                    isActive: true,
                    user: { isVerified: true }
                } : {
                    isActive: true,
                    user: { isVerified: true }
                },
                select: {
                    id: true,
                    name: true,
                    location: true,
                    image: true,
                    category: true
                },
                take: searchQuery ? 20 : 6, // Fetch more for ranking
                orderBy: { createdAt: "desc" }
            }),

            // Search Poojas (only if searching)
            searchQuery ? prisma.pooja.findMany({
                where: {
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { category: { contains: searchQuery, mode: "insensitive" } },
                        { about: { contains: searchQuery, mode: "insensitive" } }
                    ],
                    status: true
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    category: true,
                    temple: {
                        select: {
                            name: true
                        }
                    }
                },
                take: 20
            }) : Promise.resolve([]),

            // Search Products (only if searching)
            searchQuery ? prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { category: { contains: searchQuery, mode: "insensitive" } },
                        { description: { contains: searchQuery, mode: "insensitive" } }
                    ],
                    status: "approved"
                },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    category: true
                },
                take: 20
            }) : Promise.resolve([])
        ]);

        // Unify results
        let unifiedResults = [
            ...temples.map(t => ({
                id: t.id,
                title: t.name,
                category: "Temple" as const,
                location: t.location,
                image: t.image,
                type: t.category
            })),
            ...(poojas as any[]).map(p => ({
                id: p.id,
                title: p.name,
                category: "Pooja" as const,
                location: p.temple?.name,
                image: p.image,
                type: p.category
            })),
            ...(products as any[]).map(p => ({
                id: p.id,
                title: p.name,
                category: "Product" as const,
                image: p.image,
                type: p.category
            }))
        ];

        // Rank results if searching
        if (searchQuery) {
            const lowQuery = searchQuery.toLowerCase();
            unifiedResults.sort((a, b) => {
                const titleA = a.title.toLowerCase();
                const titleB = b.title.toLowerCase();

                // Exact match priority (case-insensitive)
                if (titleA === lowQuery && titleB !== lowQuery) return -1;
                if (titleB === lowQuery && titleA !== lowQuery) return 1;

                // Starts with match priority
                if (titleA.startsWith(lowQuery) && !titleB.startsWith(lowQuery)) return -1;
                if (titleB.startsWith(lowQuery) && !titleA.startsWith(lowQuery)) return 1;

                // Title containment priority
                const aInTitle = titleA.includes(lowQuery);
                const bInTitle = titleB.includes(lowQuery);
                if (aInTitle && !bInTitle) return -1;
                if (bInTitle && !aInTitle) return 1;

                return 0; // Keep original order (usually createdAt) for other matches
            });

            // After ranking, take the top 12 or 15
            unifiedResults = unifiedResults.slice(0, 15);
        }

        res.status(200).json({
            success: true,
            data: unifiedResults,
            isDefault: !searchQuery
        });

    } catch (error) {
        console.error("Global Search Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
