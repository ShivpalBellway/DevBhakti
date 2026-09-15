import { Router } from "express";
import {
  getCampaignInfo,
  getActiveCampaigns,
  submitCampaignEntry,
  getGalleryEntries,
  getUserEntry,
  getSingleEntry,
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
router.get("/entries/single/:id", getSingleEntry);

// Public Gallery
router.get("/gallery", getGalleryEntries);

// Voting / Likes
router.post("/entries/:id/like", likeCampaignEntry);

export default router;
