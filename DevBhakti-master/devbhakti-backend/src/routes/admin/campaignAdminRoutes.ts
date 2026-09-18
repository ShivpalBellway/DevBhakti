import { Router } from "express";
import {
  getAllCampaignsAdmin,
  createCampaignAdmin,
  updateCampaignAdmin,
  deleteCampaignAdmin,
  getCampaignDashboardAdmin,
  getCampaignSubmissionsAdmin,
  publishCampaignWinnerAdmin,
  updateSubmissionAdmin,
  deleteSubmissionAdmin,
  exportCampaignSubmissionsAdmin,
} from "../../controllers/admin/campaignAdminController";

const router = Router();

// Campaign CRUD
router.get("/", getAllCampaignsAdmin);
router.post("/", createCampaignAdmin);
router.put("/:id", updateCampaignAdmin);
router.delete("/:id", deleteCampaignAdmin);

// Campaign Dashboard & Analytics
router.get("/:id/dashboard", getCampaignDashboardAdmin);

// Campaign Submissions List, Delete & Export
router.get("/:id/submissions", getCampaignSubmissionsAdmin);
router.get("/:id/export", exportCampaignSubmissionsAdmin);
router.put("/submissions/:id", updateSubmissionAdmin);
router.delete("/submissions/:id", deleteSubmissionAdmin);

// Publish Winner
router.post("/:id/winner", publishCampaignWinnerAdmin);

export default router;
