import { Router } from "express";
import { getMandalDevotees } from "../../controllers/mandal_admin/devoteeController";
import { authenticate, injectMandalContext } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate, injectMandalContext);
router.get("/", getMandalDevotees);

export default router;
