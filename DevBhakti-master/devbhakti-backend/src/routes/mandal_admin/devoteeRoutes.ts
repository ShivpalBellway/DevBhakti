import { Router } from "express";
import { getMandalDevotees } from "../../controllers/mandal_admin/devoteeController";
import { authenticate, checkPermission } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, getMandalDevotees);

export default router;
