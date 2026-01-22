import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to get file paths
const getFilePath = (files: any, fieldName: string): any => {
  if (!files || !files[fieldName]) return null;
  if (fieldName === 'image') return `/uploads/temples/${files[fieldName][0].filename}`;
  return files[fieldName].map((f: any) => `/uploads/temples/${f.filename}`);
};

const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return '+' + cleaned;
};

// Get all Temples (via User accounts)
export const getAllTemples = async (req: Request, res: Response) => {
  try {
    const temples = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'INSTITUTION' },
          { temple: { isNot: null } }
        ]
      },
      include: {
        temple: {
          include: {
            _count: {
              select: { poojas: true, events: true },
            },
            poojas: {
              select: { id: true, name: true, category: true, price: true, duration: true }
            },
            events: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(temples);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch temples' });
  }
};

// Create Temple Admin & Profile
export const createTemple = async (req: Request, res: Response) => {
  try {
    const files = req.files as any;
    const data = req.body;

    // Parse JSON fields safely
    const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
    const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];

    if (data.phone) {
      data.phone = normalizePhone(data.phone);
    }

    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User & Temple
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          role: 'INSTITUTION',
          isVerified: true,
          temple: {
            create: {
              name: data.templeName,
              location: data.location,
              fullAddress: data.fullAddress,
              description: data.description,
              history: data.history,
              category: data.category,
              openTime: data.openTime,
              phone: data.templePhone,
              website: data.website,
              mapUrl: data.mapUrl,
              viewers: data.viewers,
              rating: parseFloat(data.rating || '0'),
              reviewsCount: parseInt(data.reviewsCount || '0'),
              liveStatus: data.liveStatus === 'true',
              image: getFilePath(files, 'image'),
              heroImages: getFilePath(files, 'heroImages') || [],
            }
          }
        },
        include: { temple: true }
      });

      const templeId = user.temple!.id;

      // 2. Connect Poojas
      if (poojaIds.length > 0) {
        await tx.pooja.updateMany({
          where: { id: { in: poojaIds } },
          data: { templeId: templeId }
        });
      }

      // 3. Create Inline Events
      if (inlineEvents.length > 0) {
        await tx.event.createMany({
          data: inlineEvents.map((ev: any) => ({
            name: ev.name,
            date: ev.date,
            description: ev.description || '',
            templeId: templeId
          }))
        });
      }

      return user;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Create error:', error);
    res.status(500).json({ error: error.message || 'Failed to create temple' });
  }
};

// Update Temple Admin & Profile
export const updateTemple = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as any;
    const data = req.body;

    const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
    const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];
    const existingHeroImages = data.existingHeroImages ? JSON.parse(data.existingHeroImages) : [];

    if (data.phone) {
      data.phone = normalizePhone(data.phone);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User & Temple
      const user = await tx.user.update({
        where: { id: String(id) },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          temple: {
            update: {
              name: data.templeName,
              location: data.location,
              fullAddress: data.fullAddress,
              description: data.description,
              history: data.history,
              category: data.category,
              openTime: data.openTime,
              phone: data.templePhone,
              website: data.website,
              mapUrl: data.mapUrl,
              viewers: data.viewers,
              rating: parseFloat(data.rating || '0'),
              reviewsCount: parseInt(data.reviewsCount || '0'),
              liveStatus: data.liveStatus === 'true',
              // Merge image updates
              ...(files?.image && { image: getFilePath(files, 'image') }),
              heroImages: [
                ...existingHeroImages,
                ...(getFilePath(files, 'heroImages') || [])
              ]
            }
          }
        },
        include: { temple: true }
      });

      const templeId = user.temple!.id;

      // 2. Sync Poojas
      if (poojaIds.length > 0) {
        await tx.pooja.updateMany({
          where: { id: { in: poojaIds } },
          data: { templeId: templeId }
        });
      }

      // 3. Sync Events
      if (data.inlineEvents) {
        await tx.event.deleteMany({ where: { templeId: templeId } });
        if (inlineEvents.length > 0) {
          await tx.event.createMany({
            data: inlineEvents.map((ev: any) => ({
              name: ev.name,
              date: ev.date,
              description: ev.description || '',
              templeId: templeId
            }))
          });
        }
      }

      return user;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update temple' });
  }
};

// Toggle Temple Status
export const toggleTempleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified, liveStatus } = req.body;

    const result = await prisma.user.update({
      where: { id: String(id) },
      data: {
        isVerified: isVerified,
        temple: {
          update: {
            liveStatus: liveStatus
          }
        }
      },
      include: { temple: true }
    });

    res.json({ success: true, message: 'Status updated successfully', data: result });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update status' });
  }
};

// Delete Temple account
export const deleteTemple = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Use a transaction to delete both records safely
    await prisma.$transaction(async (tx) => {
      // First find the user to get the temple ID
      const user = await tx.user.findUnique({
        where: { id: String(id) },
        include: { temple: true }
      });
      
      if (!user) {
        throw new Error('Temple account not found');
      }
      
      // Delete the temple record first (if it exists)
      if (user.temple) {
        await tx.temple.delete({
          where: { id: user.temple.id }
        });
      }
      
      // Then delete the user record
      await tx.user.delete({ where: { id: String(id) } });
    });
    
    res.json({ message: 'Temple account deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    
    // If it's a foreign key constraint error, provide more specific message
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Cannot delete temple account. Please delete all associated poojas and events first.' 
      });
    } else if (error.message === 'Temple account not found') {
      res.status(404).json({ error: 'Temple account not found' });
    } else {
      res.status(500).json({ error: error.message || 'Failed to delete temple' });
    }
  }
};



