import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export const registerTemple = async (req: Request, res: Response) => {
  try {
    const {
      templeName,
      category,
      openTime,
      description,
      city,
      state,
      address,
      contactName,
      contactPhone,
      contactEmail,
      selectedPoojaIds
    } = req.body;

    // 1. Create or find the User (Institution)
    let user = await prisma.user.findUnique({
      where: { phone: contactPhone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          role: 'INSTITUTION',
          isVerified: false,
        }
      });
    }

    // 2. Create the Temple linked to the User
    const temple = await prisma.temple.create({
      data: {
        name: templeName,
        category,
        openTime,
        description,
        location: `${city}, ${state}`,
        fullAddress: address,
        phone: contactPhone,
        userId: user.id,
      }
    });

    res.status(201).json({
      message: 'Temple registration submitted successfully',
      templeId: temple.id
    });
  } catch (error) {
    console.error('Temple registration error:', error);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
};
