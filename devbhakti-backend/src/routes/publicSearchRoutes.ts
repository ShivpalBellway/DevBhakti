import { Router } from "express";
import { searchGlobal } from "../controllers/publicSearchController";

const router = Router();

router.get("/", searchGlobal);

export default router;
