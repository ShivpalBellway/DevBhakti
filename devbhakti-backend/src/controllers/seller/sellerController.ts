import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSellerProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const store = await prisma.temple.findUnique({
            where: { userId },
            include: { user: { select: { name: true, phone: true } } }
        });

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        return res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        console.error("Seller Profile Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
