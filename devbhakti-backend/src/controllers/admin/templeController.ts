import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const getAllTemples = async (req: Request, res: Response) => {
  try {
    const temples = await prisma.temple.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });
    res.json(temples);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch temples' });
  }
};

export const approveTemple = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const temple = await prisma.temple.update({
      where: { id },
      data: { liveStatus: true } // Assuming liveStatus means approved/active
    });
    res.json({ message: 'Temple approved successfully', temple });
  } catch (error) {
    res.status(400).json({ error: 'Failed to approve temple' });
  }
};
