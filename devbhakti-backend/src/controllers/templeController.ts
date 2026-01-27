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
    
    // Fetch only temples where user is verified
    const temples = await prisma.temple.findMany({
      where: {
        user: {
          isVerified: true
        }
      },
      include: {
        poojas: true
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

    // Map temples to include isFavorite
    const templesWithFav = temples.map(temple => ({
      ...temple,
      isFavorite: favoritedTempleIds.has(temple.id)
    }));

    res.json({ success: true, data: templesWithFav });
  } catch (error) {
    console.error('Fetch temples error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temples' });
  }
};

export const getTempleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromRequest(req);

    const temple = await prisma.temple.findFirst({
      where: { 
        id: id as string,
        user: {
            isVerified: true
        }
      },
      include: {
        poojas: true,
        events: true,
        user: {
            select: { isVerified: true }
        }
      }
    });
    
    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found or not verified' });
    }

    let isFavorite = false;
    if (userId) {
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
    
    res.json({ success: true, data: { ...temple, isFavorite } });

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
        temple: {
            user: {
                isVerified: true
            }
        }
      },
      include: {
        temple: true
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

    const poojas = await prisma.pooja.findMany({
      where: {
        temple: {
            user: {
                isVerified: true
            }
        }
      },
      include: {
        temple: {
          select: {
            name: true,
            location: true,
            image: true
          }
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
