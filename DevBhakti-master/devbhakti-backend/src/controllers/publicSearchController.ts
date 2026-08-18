import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { localize, getLang } from "../utils/localization";

export const searchGlobal = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const lang = getLang(req);
        const searchQuery = typeof query === "string" ? query.trim() : "";
        const ilikeQuery = `%${searchQuery}%`;

        // Search Temples - active temples are visible publicly; transactions require verification.
        const showTemples = searchQuery ? prisma.$queryRaw`
            SELECT t.id, t.name, t.location, t.image, t.category, t.slug,
                   t."isActive" AS "isActive", u."isVerified" AS "isVerified"
            FROM "Temple" t
            INNER JOIN "User" u ON t."userId" = u.id
            WHERE (
                t.name::text ILIKE ${ilikeQuery}
                OR t.location::text ILIKE ${ilikeQuery}
                OR t.category::text ILIKE ${ilikeQuery}
            )
            AND t."isActive" = true
            LIMIT 20
        ` : prisma.temple.findMany({
            where: {
                isActive: true
            },
            select: {
                id: true,
                name: true,
                location: true,
                image: true,
                category: true,
                slug: true,
                isActive: true,
                user: {
                    select: {
                        isVerified: true
                    }
                }
            },
            take: 6,
            orderBy: {
                createdAt: "desc"
            }
        });

        // We use raw queries for case-insensitive JSON search in PostgreSQL.
        const [temples, poojas, products] = await Promise.all([
            showTemples,

            searchQuery
                ? prisma.$queryRaw`
                    SELECT p.id, p.name, p.image, p.category,
                           p."isMaster", p."masterPoojaId", p.slug,
                           jsonb_build_object('name', t.name) AS temple
                    FROM "Pooja" p
                    LEFT JOIN "Temple" t ON p."templeId" = t.id
                    LEFT JOIN "User" u ON t."userId" = u.id
                    WHERE (
                        p.name::text ILIKE ${ilikeQuery}
                        OR p.category::text ILIKE ${ilikeQuery}
                        OR p.about::text ILIKE ${ilikeQuery}
                    )
                    AND p.status = true
                    AND (
                        p."isMaster" = true
                        OR (
                            t."isActive" = true
                            AND u."isVerified" = true
                        )
                    )
                    LIMIT 20
                `
                : Promise.resolve([]),

            searchQuery
                ? prisma.$queryRaw`
                    SELECT p.id, p.name, p.image, p.category
                    FROM "Product" p
                    LEFT JOIN "Temple" t ON p."templeId" = t.id
                    LEFT JOIN "SellerProfile" s ON p."sellerId" = s.id
                    LEFT JOIN "User" ut ON t."userId" = ut.id
                    LEFT JOIN "User" us ON s."userId" = us.id
                    WHERE (
                        p.name::text ILIKE ${ilikeQuery}
                        OR p.category::text ILIKE ${ilikeQuery}
                        OR p.description::text ILIKE ${ilikeQuery}
                    )
                    AND p.status = 'approved'
                    AND (
                        (
                            p."templeId" IS NOT NULL
                            AND t."isActive" = true
                            AND ut."isVerified" = true
                        )
                        OR (
                            p."sellerId" IS NOT NULL
                            AND s."isActive" = true
                            AND us."isVerified" = true
                        )
                        OR (
                            p."templeId" IS NULL
                            AND p."sellerId" IS NULL
                        )
                    )
                    LIMIT 20
                `
                : Promise.resolve([])
        ]);

        // Localize results
        const locTemples = localize(temples as any[], lang);
        const locPoojas = localize(poojas as any[], lang);
        const locProducts = localize(products as any[], lang);

        // Deduplicate Poojas by name
        const uniquePoojasMap = new Map();
        (locPoojas as any[]).forEach((p: any) => {
            const key = (p.name || "").toLowerCase().trim();
            if (!key) return;

            const existing = uniquePoojasMap.get(key);
            const isBetter = !existing ||
                (p.isMaster && !existing.isMaster) ||
                (!p.masterPoojaId && existing.masterPoojaId && !p.isMaster);

            if (isBetter) uniquePoojasMap.set(key, p);
        });
        const deduplicatedPoojas = Array.from(uniquePoojasMap.values());

        let unifiedResults = [
            ...(locTemples as any[]).map((t: any) => ({
                id: t.id,
                title: t.name,
                category: "Temple" as const,
                location: t.location,
                image: t.image,
                type: t.category,
                slug: t.slug,
                showOnWebsite: t.isActive === true,
                canBookPooja: t.isActive === true && ((t.user?.isVerified ?? t.isVerified) === true),
                canDonate: t.isActive === true && ((t.user?.isVerified ?? t.isVerified) === true)
            })),
            ...(deduplicatedPoojas as any[]).map((p: any) => ({
                id: p.id,
                title: p.name,
                category: "Pooja" as const,
                location: p.temple?.name || undefined,
                image: p.image,
                type: p.category,
                slug: p.slug
            })),
            ...(locProducts as any[]).map((p: any) => ({
                id: p.id,
                title: p.name,
                category: "Product" as const,
                image: p.image,
                type: p.category
            }))
        ];

        // Rank results
        if (searchQuery) {
            const lowQuery = searchQuery.toLowerCase();
            unifiedResults.sort((a, b) => {
                const titleA = (a.title || "").toLowerCase();
                const titleB = (b.title || "").toLowerCase();

                if (titleA === lowQuery && titleB !== lowQuery) return -1;
                if (titleB === lowQuery && titleA !== lowQuery) return 1;
                if (titleA.startsWith(lowQuery) && !titleB.startsWith(lowQuery)) return -1;
                if (titleB.startsWith(lowQuery) && !titleA.startsWith(lowQuery)) return 1;
                if (titleA.includes(lowQuery) && !titleB.includes(lowQuery)) return -1;
                if (titleB.includes(lowQuery) && !titleA.includes(lowQuery)) return 1;
                return 0;
            });
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
