import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/campaigns/list-active
export const getActiveCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        name: true,
        bannerImage: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: campaigns });
  } catch (error: any) {
    console.error("Error fetching active campaigns:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/campaigns/info/:slug
export const getCampaignInfo = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    if (!slug) {
      return res.status(400).json({ success: false, message: "Campaign slug required." });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { slug },
      include: {
        winner: {
          include: {
            entry: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    return res.json({ success: true, data: campaign });
  } catch (error: any) {
    console.error("Error fetching campaign info:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/campaigns/entries — Submit Family / Mandal Entry
export const submitCampaignEntry = async (req: Request, res: Response) => {
  try {
    const {
      campaignSlug,
      participantType = "home",
      name,
      city,
      address,
      images = [],
      caption,
      userPhone,
      userId,
    } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "Family/Mandal Name, City, and Full Address are required.",
      });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least 1 Ganesha photo is required.",
      });
    }

    if (!campaignSlug) {
      return res.status(400).json({
        success: false,
        message: "Campaign reference missing.",
      });
    }

    const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // 1 Person = 1 Entry Check
    let existingEntry = null;
    if (userId) {
      existingEntry = await prisma.campaignEntry.findFirst({
        where: { campaignId: campaign.id, userId },
      });
    } else if (userPhone) {
      existingEntry = await prisma.campaignEntry.findFirst({
        where: {
          campaignId: campaign.id,
          user: { phone: userPhone },
        },
      });
    }

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an entry for this contest. 1 entry allowed per person.",
        existingEntry,
      });
    }

    // Try finding user by phone/id if provided
    let dbUserId = userId || null;
    if (dbUserId) {
      const dbUser = await prisma.user.findUnique({ where: { id: dbUserId } });
      if (!dbUser) dbUserId = null;
    }
    if (!dbUserId && userPhone) {
      const dbUser = await prisma.user.findFirst({ where: { phone: userPhone } });
      if (dbUser) dbUserId = dbUser.id;
    }

    // Process images array: convert base64 data URLs to file paths on disk if present
    const fs = require("fs");
    const path = require("path");
    const processedImages: string[] = [];

    if (Array.isArray(images)) {
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

    // Create entry in database
    const newEntry = await prisma.campaignEntry.create({
      data: {
        campaignId: campaign.id,
        userId: dbUserId,
        participantType: participantType === "mandal" ? "mandal" : "home",
        name,
        city,
        address,
        images: processedImages,
        caption: caption || "",
        status: "APPROVED", // Auto-approved for immediate public gallery display
      },
    });

    return res.status(201).json({
      success: true,
      message: "Ganesha entry submitted successfully! Ganpati Bappa Morya! 🙏",
      data: newEntry,
    });
  } catch (error: any) {
    console.error("Error submitting campaign entry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/campaigns/entries — Fetch Public Gallery Entries (Paginated & Sorted)
export const getGalleryEntries = async (req: Request, res: Response) => {
  try {
    const slug = req.query.slug as string;
    if (!slug) {
      return res.status(400).json({ success: false, message: "Campaign slug required." });
    }
    const sortBy = (req.query.sortBy as string) || "popular"; // "popular" | "latest" | "alphabetical"
    const type = req.query.type as string; // "home" | "mandal"

    const campaign = await prisma.campaign.findUnique({ where: { slug } });
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const where: any = {
      campaignId: campaign.id,
      status: "APPROVED",
    };

    if (type === "home" || type === "mandal") {
      where.participantType = type;
    }

    let orderBy: any = { likesCount: "desc" };
    if (sortBy === "latest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "alphabetical" || sortBy === "name" || sortBy === "az") {
      orderBy = { name: "asc" };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const [entries, totalCount] = await Promise.all([
      prisma.campaignEntry.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.campaignEntry.count({ where }),
    ]);

    const hasMore = skip + entries.length < totalCount;

    return res.json({
      success: true,
      page,
      limit,
      totalCount,
      hasMore,
      count: entries.length,
      data: entries,
    });
  } catch (error: any) {
    console.error("Error fetching gallery entries:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/campaigns/entries/single/:id — Fetch Single Entry for Deep Linking & App API
export const getSingleEntry = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ success: false, message: "Entry ID required." });
    }

    const entry = await prisma.campaignEntry.findUnique({
      where: { id },
      include: {
        campaign: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }

    return res.json({ success: true, data: entry });
  } catch (error: any) {
    console.error("Error fetching single entry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/campaigns/my-entry — Fetch User's Submitted Entry (Supports Bearer Token or Query Params)
export const getUserEntry = async (req: Request, res: Response) => {
  try {
    let userPhone = req.query.phone as string;
    let userId = req.query.userId as string;
    let slug = req.query.slug as string;

    // Check Bearer Token header if passed
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "devbhakti_secret_key_2026"
        ) as any;
        if (decoded) {
          if (decoded.userId) userId = decoded.userId;
          if (decoded.id && !userId) userId = decoded.id;
          if (decoded.phone) userPhone = decoded.phone;
        }
      } catch (err) {
        console.warn("Invalid JWT token provided in /my-entry header:", err);
      }
    }

    // Also check if (req as any).user exists from express auth middleware
    if ((req as any).user) {
      const u = (req as any).user;
      if (u.userId || u.id) userId = u.userId || u.id;
      if (u.phone) userPhone = u.phone;
    }

    if (!userPhone && !userId) {
      return res.status(400).json({
        success: false,
        message: "Authentication token (Authorization: Bearer <token>) or query parameters (userId / phone) required.",
      });
    }

    let campaign = null;
    if (slug) {
      campaign = await prisma.campaign.findUnique({ where: { slug } });
    } else {
      campaign = await prisma.campaign.findFirst({
        where: { OR: [{ slug: "maza-ganesha" }, { isActive: true }] },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const whereConditions: any[] = [];
    if (userId) whereConditions.push({ userId });
    if (userPhone) whereConditions.push({ user: { phone: userPhone } });

    const entry = await prisma.campaignEntry.findFirst({
      where: {
        campaignId: campaign.id,
        OR: whereConditions,
      },
    });

    return res.json({ success: true, data: entry || null });
  } catch (error: any) {
    console.error("Error fetching user entry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/campaigns/entries/:id/like — Like / Vote Entry with 24h Quota
export const likeCampaignEntry = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.id as string;
    const { userId, userPhone } = req.body;

    const entry = await prisma.campaignEntry.findUnique({
      where: { id: entryId },
      include: { campaign: true },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found." });
    }

    const maxLikes = entry.campaign.maxLikesPerUserPerDay || 15;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check user 24h vote count
    if (userId || userPhone) {
      const userVotesCount = await prisma.campaignVote.count({
        where: {
          votedAt: { gte: twentyFourHoursAgo },
          OR: [
            userId ? { userId } : {},
            userPhone ? { userPhone } : {},
          ],
        },
      });

      if (userVotesCount >= maxLikes) {
        return res.status(429).json({
          success: false,
          message: `Daily voting limit reached (${maxLikes} votes per 24 hours). Try again tomorrow!`,
        });
      }
    }

    // Atomic transaction: Increment like count & record vote log
    const [updatedEntry] = await prisma.$transaction([
      prisma.campaignEntry.update({
        where: { id: entryId },
        data: { likesCount: { increment: 1 } },
      }),
      prisma.campaignVote.create({
        data: {
          entryId,
          userId: userId || null,
          userPhone: userPhone || null,
        },
      }),
    ]);

    return res.json({
      success: true,
      message: "Liked Ganesha entry! 🙏",
      likesCount: updatedEntry.likesCount,
    });
  } catch (error: any) {
    console.error("Error liking entry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
