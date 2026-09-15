import { Router } from "express";
import {
  getCampaignInfo,
  getActiveCampaigns,
  submitCampaignEntry,
  getGalleryEntries,
  getUserEntry,
  likeCampaignEntry,
} from "../controllers/campaignController";

const router = Router();

// Campaign Info
router.get("/list-active", getActiveCampaigns);
router.get("/info", getCampaignInfo);
router.get("/info/:slug", getCampaignInfo);

// Contest Submissions & User Entry
router.post("/entries", submitCampaignEntry);
router.get("/my-entry", getUserEntry);

// Public Gallery
router.get("/gallery", getGalleryEntries);

// Voting / Likes
router.post("/entries/:id/like", likeCampaignEntry);

export default router;
