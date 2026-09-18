import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/admin/campaigns — List all campaigns with stats
export const getAllCampaignsAdmin = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { entries: true },
        },
        winner: {
          include: {
            entry: true,
          },
        },
      },
    });

    return res.json({ success: true, data: campaigns });
  } catch (error: any) {
    console.error("Error fetching campaigns for admin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/campaigns — Create new campaign
export const createCampaignAdmin = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      bannerImage,
      startDate,
      endDate,
      playStoreLink,
      appStoreLink,
      maxImagesPerEntry = 3,
      maxLikesPerUserPerDay = 15,
      isActive = true,
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: "Campaign Name and Slug are required." });
    }

    const existing = await prisma.campaign.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Campaign with slug "${slug}" already exists.` });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        title: name,
        slug,
        description: description || "",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: Boolean(isActive),
        maxImagesPerEntry: Number(maxImagesPerEntry) || 3,
        maxLikesPerUserPerDay: Number(maxLikesPerUserPerDay) || 15,
      },
    });

    return res.status(201).json({ success: true, message: "Campaign created successfully!", data: campaign });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/campaigns/:id — Update existing campaign
export const updateCampaignAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      description,
      startDate,
      endDate,
      isActive,
      maxImagesPerEntry,
      maxLikesPerUserPerDay,
    } = req.body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name, title: name }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(maxImagesPerEntry !== undefined && { maxImagesPerEntry: Number(maxImagesPerEntry) }),
        ...(maxLikesPerUserPerDay !== undefined && { maxLikesPerUserPerDay: Number(maxLikesPerUserPerDay) }),
      },
    });

    return res.json({ success: true, message: "Campaign updated successfully!", data: campaign });
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/campaigns/:id — Delete campaign
export const deleteCampaignAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.campaign.delete({ where: { id } });
    return res.json({ success: true, message: "Campaign deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/:id/dashboard — Detailed Dashboard Analytics
export const getCampaignDashboardAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        winner: {
          include: {
            entry: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }

    const totalEntries = await prisma.campaignEntry.count({
      where: { campaignId: id },
    });

    const aggregateLikes = await prisma.campaignEntry.aggregate({
      where: { campaignId: id },
      _sum: { likesCount: true },
    });

    const totalVotesRecorded = await prisma.campaignVote.count({
      where: { entry: { campaignId: id } },
    });

    const topEntries = await prisma.campaignEntry.findMany({
      where: { campaignId: id },
      orderBy: { likesCount: "desc" },
      take: 5,
    });

    return res.json({
      success: true,
      data: {
        campaign,
        totalEntries,
        totalLikes: aggregateLikes._sum.likesCount || 0,
        totalShares: Math.floor((aggregateLikes._sum.likesCount || 0) * 0.35), // Estimated engagement metric
        totalVotesRecorded,
        topEntries,
      },
    });
  } catch (error: any) {
    console.error("Error fetching campaign dashboard:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/:id/submissions — List all submissions for campaign
export const getCampaignSubmissionsAdmin = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const status = req.query.status as string;

    const where: any = { campaignId };
    if (status) where.status = status;

    const submissions = await prisma.campaignEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error: any) {
    console.error("Error fetching submissions for admin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/campaigns/:id/winner — Select & Publish Campaign Winner
export const publishCampaignWinnerAdmin = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const { submissionId, prize, tagline, winnerImage } = req.body;

    if (!submissionId || !prize) {
      return res.status(400).json({ success: false, message: "Winning Submission and Prize details are required." });
    }

    const submission = await prisma.campaignEntry.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: "Selected submission not found." });
    }

    // Upsert winner record
    const winner = await prisma.campaignWinner.upsert({
      where: { campaignId },
      update: {
        entryId: submissionId,
        prize,
        tagline: tagline || "Congratulations to the winner!",
        winnerImage: winnerImage || (submission.images[0] || ""),
        publishedAt: new Date(),
      },
      create: {
        campaignId,
        entryId: submissionId,
        prize,
        tagline: tagline || "Congratulations to the winner!",
        winnerImage: winnerImage || (submission.images[0] || ""),
      },
    });

    return res.json({
      success: true,
      message: "Winner published successfully! It is now live on the campaign page.",
      data: winner,
    });
  } catch (error: any) {
    console.error("Error publishing winner:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/campaigns/submissions/:id — Update submission entry details
export const updateSubmissionAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, city, address, participantType, caption, likesCount, phone, images } = req.body;

    const existing = await prisma.campaignEntry.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }

    // Process images array: convert base64 data URLs to file paths on disk if present
    const fs = require("fs");
    const path = require("path");
    let processedImages: string[] | undefined = undefined;

    if (Array.isArray(images)) {
      processedImages = [];
      const uploadDir = path.join(process.cwd(), "uploads", "campaigns");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (typeof img === "string" && img.startsWith("data:image")) {
          // Extract extension & base64 string
          const matches = img.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
            const base64Data = matches[2];
            const fileName = `campaign-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
            processedImages.push(`/uploads/campaigns/${fileName}`);
          } else {
            processedImages.push(img);
          }
        } else {
          processedImages.push(img);
        }
      }
    }

    const updated = await prisma.campaignEntry.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(participantType !== undefined && { participantType }),
        ...(caption !== undefined && { caption }),
        ...(likesCount !== undefined && { likesCount: Number(likesCount) }),
        ...(processedImages !== undefined && { images: processedImages }),
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (phone && existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { phone },
      });
    }

    return res.json({
      success: true,
      message: "Submission updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating campaign submission:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/campaigns/submissions/:id — Delete a campaign submission entry
export const deleteSubmissionAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.campaignVote.deleteMany({ where: { entryId: id } });
    await prisma.campaignWinner.deleteMany({ where: { entryId: id } });
    await prisma.campaignEntry.delete({ where: { id } });

    return res.json({ success: true, message: "Submission entry deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting campaign submission:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/campaigns/:id/export — Export all campaign submissions as CSV
export const exportCampaignSubmissionsAdmin = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id as string;
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }

    const submissions = await prisma.campaignEntry.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
    });

    const csvHeaders = ["ID", "Name", "Phone", "Participant Type", "City", "Address", "Caption", "Likes", "Submitted Date", "Images"];
    const csvRows = submissions.map((sub) => {
      const escape = (text: string | null | undefined) => `"${(text || "").replace(/"/g, '""')}"`;
      return [
        escape(sub.id),
        escape(sub.name),
        escape(sub.user?.phone || ""),
        escape(sub.participantType),
        escape(sub.city),
        escape(sub.address),
        escape(sub.caption),
        sub.likesCount,
        new Date(sub.createdAt).toISOString(),
        escape(sub.images.join("; ")),
      ].join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${campaign.slug}-submissions.csv"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("Error exporting campaign submissions:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
