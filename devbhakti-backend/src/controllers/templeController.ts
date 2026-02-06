import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

const getUserIdFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

export const getAllTemples = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);

    // Fetch only temples where user is verified AND temple is active
    const temples = await prisma.temple.findMany({
      where: {
        user: {
          isVerified: true,
          role: 'INSTITUTION'
        },
        isActive: true
      },
      include: {
        poojas: {
          where: { status: true }
        }
      }
    });

    let favoritedTempleIds = new Set<string>();

    // If user is logged in, fetch their favorites
    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
          templeId: { not: null }
        },
        select: { templeId: true }
      });
      favorites.forEach(fav => {
        if (fav.templeId) favoritedTempleIds.add(fav.templeId);
      });
    }

    // Map temples to include isFavorite AND expose Live URL
    const templesWithDetails = await Promise.all(temples.map(async (temple) => {
      // Direct URL mode:
      // - Temple/apne panel ya admin jo liveUrl / channelId de, wahi expose karenge
      // - YouTube API key ki zarurat nahi, koi external live check nahi
      const hasUserLiveFlag = temple.isLive;
      const hasLiveSource = !!(temple.liveUrl || temple.channelId);

      const isLiveNow = !!(hasUserLiveFlag && hasLiveSource);
      const resolvedLiveUrl: string | null = temple.liveUrl || null;

      return {
        ...temple,
        isLiveNow,          // UI ke liye convenience flag
        liveUrl: resolvedLiveUrl, // Hamesha kam se kam user-configured URL
        isFavorite: favoritedTempleIds.has(temple.id)
      };
    }));

    res.json({ success: true, data: templesWithDetails });
  } catch (error) {
    console.error('Fetch temples error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temples' });
  }
};

export const getTempleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromRequest(req);

    // First, find the temple to get its actual ID
    const temple = await prisma.temple.findFirst({
      where: {
        OR: [
          { id: id as string },
          { slug: id as string },
          { subdomain: id as string }
        ],
        user: {
          isVerified: true,
          role: 'INSTITUTION'
        },
        isActive: true
      },
      include: {
        user: {
          select: { isVerified: true }
        }
      }
    });

    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found or not verified' });
    }

    // Now fetch poojas and events using the actual temple.id
    const [poojas, events] = await Promise.all([
      prisma.pooja.findMany({
        where: {
          templeId: temple.id, // Use actual temple ID
          status: true
        }
      }),
      prisma.event.findMany({
        where: {
          templeId: temple.id,
          status: true
        }
      })
    ]);

    // Resolve live status for this temple using direct URL/flags (no YouTube API)
    const hasUserLiveFlag = temple.isLive;
    const hasLiveSource = !!((temple as any).liveUrl || (temple as any).channelId);
    const isLiveNow = !!(hasUserLiveFlag && hasLiveSource);
    const resolvedLiveUrl: string | null = (temple as any).liveUrl || null;

    let isFavorite = false;
    if (userId) {
      // Note: We must use the resolved temple.id here, not the slug/param
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_templeId: {
            userId: userId,
            templeId: temple.id
          }
        }
      });
      if (fav) isFavorite = true;
    }

    res.json({
      success: true,
      data: {
        ...temple,
        poojas,
        events,
        isLiveNow,
        liveUrl: resolvedLiveUrl,
        isFavorite
      }
    });

  } catch (error) {
    console.error('Fetch temple details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temple details' });
  }
};


export const registerTemple = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // This is a dummy endpoint. Real registration happens in temple_admin/templeController.ts
    res.status(201).json({ success: true, message: "Temple registered successfully", data: body });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid temple data' });
  }
};

export const getPoojaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromRequest(req);

    const pooja = await prisma.pooja.findFirst({
      where: {
        id: String(id),
        OR: [
          { isMaster: true },
          {
            temple: {
              user: {
                isVerified: true,
                role: 'INSTITUTION'
              }
            }
          }
        ]
      },
      include: {
        temple: true,
        templeCopies: {
          where: {
            status: true,
            temple: {
              user: { isVerified: true }
            }
          },
          include: {
            temple: {
              select: {
                id: true,
                name: true,
                location: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!pooja) {
      return res.status(404).json({ success: false, message: 'Pooja not found' });
    }

    let isFavorite = false;
    if (userId) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_poojaId: {
            userId: userId,
            poojaId: pooja.id
          }
        }
      });
      if (fav) isFavorite = true;
    }

    res.json({ success: true, data: { ...pooja, isFavorite } });

  } catch (error) {
    console.error('Get pooja error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pooja' });
  }
};

export const getAllPoojas = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const { templeId } = req.query;

    const where: any = {
      status: true
    };

    if (templeId) {
      where.templeId = String(templeId);
    } else {
      where.isMaster = true; // Global list only shows Master templates
    }

    const poojas = await prisma.pooja.findMany({
      where,
      include: {
        temple: {
          select: {
            name: true,
            location: true,
            image: true
          }
        },
        _count: {
          select: { templeCopies: true }
        }
      }
    });

    let favoritedPoojaIds = new Set<string>();

    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
          poojaId: { not: null }
        },
        select: { poojaId: true }
      });
      favorites.forEach(fav => {
        if (fav.poojaId) favoritedPoojaIds.add(fav.poojaId);
      });
    }

    const poojasWithFav = poojas.map(pooja => ({
      ...pooja,
      isFavorite: favoritedPoojaIds.has(pooja.id)
    }));

    res.json({ success: true, data: poojasWithFav });
  } catch (error) {
    console.error('Fetch poojas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch poojas' });
  }
};
