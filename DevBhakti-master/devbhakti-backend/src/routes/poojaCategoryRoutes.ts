import { Router, Request, Response } from "express";
import { getApprovedPoojaCategories, createPoojaCategory } from "../controllers/admin/poojaCategoryController";
import { authenticate } from "../middleware/authMiddleware";
import { prisma } from "../lib/prisma";

const router = Router();

// Public: Get all approved categories
router.get("/", getApprovedPoojaCategories);

// Temple Admin / Mandal Admin / Authenticated User: Suggest a category
router.post("/suggest", authenticate, async (req: any, res: any) => {
    try {
        req.body.status = "PENDING";
        
        if (req.user?.role === 'INSTITUTION') {
            const temple = await prisma.temple.findUnique({ 
                where: { userId: req.user.userId },
                select: { id: true }
            });
            if (temple) req.body.templeId = temple.id;
        }

        return createPoojaCategory(req, res);
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
