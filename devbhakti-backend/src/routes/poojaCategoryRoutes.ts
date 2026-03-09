import { Router } from "express";
import { getApprovedPoojaCategories, createPoojaCategory } from "../controllers/admin/poojaCategoryController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Public: Get all approved categories
router.get("/", getApprovedPoojaCategories);

// Temple Admin (or anyone authorized): Suggest a category
router.post("/suggest", authenticate, (req, res) => {
    req.body.status = "PENDING";
    return createPoojaCategory(req, res);
});

export default router;
