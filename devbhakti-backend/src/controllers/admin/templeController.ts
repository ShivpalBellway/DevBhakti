import { Request, Response } from 'express';
import { PrismaClient, UserRole, BookingStatus, SlabType, CommissionCategory, LedgerStatus } from '@prisma/client';
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
        role: 'INSTITUTION'
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
          isVerified: false,
          temple: {
            create: {
              templeId: `TMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
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
              slug: data.slug || undefined,
              subdomain: data.subdomain || undefined, // Added
              urlType: data.urlType || 'slug', // Added
              isActive: data.isActive === 'true',
              liveStatus: data.liveStatus === 'true',
              productCommissionRate: data.productCommissionRate ? parseFloat(data.productCommissionRate) : 10.0,
              poojaCommissionRate: data.poojaCommissionRate ? parseFloat(data.poojaCommissionRate) : 5.0,
              image: getFilePath(files, 'image'),
              heroImages: getFilePath(files, 'heroImages') || [],
            }
          }
        },
        include: { temple: true }
      });

      const templeId = (user as any).temple!.id;

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
    const commissionSlabs = data.commissionSlabs ? JSON.parse(data.commissionSlabs) : null;

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
              slug: data.slug || undefined, 
              subdomain: data.subdomain || undefined, 
              urlType: data.urlType || 'slug',
              liveStatus: data.liveStatus === 'true',
              productCommissionRate: data.productCommissionRate ? parseFloat(data.productCommissionRate) : undefined,
              poojaCommissionRate: data.poojaCommissionRate ? parseFloat(data.poojaCommissionRate) : undefined,
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

      // 2. Sync Poojas (Master-Template Logic)
      const currentPoojas = await tx.pooja.findMany({
        where: { templeId: templeId },
        select: { id: true, masterPoojaId: true }
      });

      // Clear existing links
      await tx.pooja.updateMany({
        where: { templeId: templeId },
        data: { templeId: null }
      });

      if (poojaIds.length > 0) {
        // Fetch all selected poojas in one query to avoid N+1 inside transaction
        const selectedPoojasData = await tx.pooja.findMany({
          where: { id: { in: poojaIds } }
        });

        for (const poojaRecord of selectedPoojasData) {
          if (poojaRecord.isMaster) {
            const existingCopy = currentPoojas.find(cp => cp.masterPoojaId === poojaRecord.id);
            if (existingCopy) {
              await tx.pooja.update({
                where: { id: existingCopy.id },
                data: { templeId: templeId }
              });
            } else {
              await tx.pooja.create({
                data: {
                  name: poojaRecord.name,
                  category: poojaRecord.category,
                  price: poojaRecord.price,
                  duration: poojaRecord.duration,
                  description: poojaRecord.description as string[],
                  time: poojaRecord.time,
                  image: poojaRecord.image,
                  about: poojaRecord.about,
                  benefits: poojaRecord.benefits as string[],
                  bullets: poojaRecord.bullets as string[],
                  process: poojaRecord.process,
                  processSteps: poojaRecord.processSteps || undefined,
                  templeId: templeId,
                  isMaster: false,
                  masterPoojaId: poojaRecord.id,
                  packages: poojaRecord.packages || undefined,
                  faqs: poojaRecord.faqs || undefined
                }
              });
            }
          } else {
            await tx.pooja.update({
              where: { id: poojaRecord.id },
              data: { templeId: templeId }
            });
          }
        }
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

      // 4. Update Commission Slabs
      if (commissionSlabs) {
        await tx.commissionSlab.deleteMany({
          where: { targetId: templeId, slabType: SlabType.TEMPLE }
        });

        if (commissionSlabs.length > 0) {
          await tx.commissionSlab.createMany({
            data: commissionSlabs.map((s: any) => ({
              minAmount: parseFloat(s.minAmount),
              maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
              platformFee: parseFloat(s.platformFee),
              percentage: parseFloat(s.percentage),
              slabType: SlabType.TEMPLE,
              targetId: templeId,
              category: s.category || CommissionCategory.MARKETPLACE,
              isActive: true
            }))
          });
        }
      }

      return user;
    }, {
      maxWait: 10000,
      timeout: 20000 
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
    const { isVerified, isActive, slug, subdomain, urlType, productCommissionRate, poojaCommissionRate, commissionSlabs } = req.body;

    console.log('toggleTempleStatus called:', {
      id,
      isVerified,
      isActive,
      slug,
      commissionSlabsCount: commissionSlabs?.length
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update User & Temple status
      const user = await tx.user.update({
        where: { id: String(id) },
        data: {
          isVerified: isVerified !== undefined ? isVerified : undefined,
          temple: {
            update: {
              isActive: isActive !== undefined ? isActive : undefined,
              slug: slug || undefined,
              subdomain: subdomain || undefined,
              urlType: urlType || undefined,
              productCommissionRate: productCommissionRate ? parseFloat(productCommissionRate) : undefined,
              poojaCommissionRate: poojaCommissionRate ? parseFloat(poojaCommissionRate) : undefined,
            }
          }
        },
        include: { temple: true }
      });

      if (!user.temple) throw new Error("Temple profile not found for this user");

      // 2. Handle Commission Slabs
      if (commissionSlabs && Array.isArray(commissionSlabs)) {
        // Delete existing TEMPLE slabs for this temple
        await (tx as any).commissionSlab.deleteMany({
          where: {
            slabType: 'TEMPLE',
            targetId: user.temple.id
          }
        });

        // Create new ones
        if (commissionSlabs.length > 0) {
          await (tx as any).commissionSlab.createMany({
            data: commissionSlabs.map((s: any) => ({
              minAmount: parseFloat(s.minAmount),
              maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
              platformFee: parseFloat(s.platformFee),
              percentage: parseFloat(s.percentage),
              slabType: 'TEMPLE',
              targetId: user.temple!.id,
              isActive: true
            }))
          });
        }
      }

      return user;
    });

    console.log('Temple status and slabs updated');
    res.json({ success: true, message: 'Status and commission slabs updated successfully', data: result });
  } catch (error: any) {
    console.error('Toggle status error:', error);
    if (error.code === 'P2002' && error.meta?.target.includes('slug')) {
      return res.status(400).json({ error: 'Slug is already taken. Please choose another one.' });
    }
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
    }
  }
};

// Get Pending Update Requests
export const getPendingUpdateRequests = async (req: Request, res: Response) => {
  try {
    console.log("Admin: Fetching pending temple update requests...");
    const requests = await prisma.templeUpdateRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        temple: {
          select: {
            name: true,
            location: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${requests.length} pending requests.`);
    res.json(requests);
  } catch (error: any) {
    console.error('Fetch update requests CRITICAL ERROR:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ error: 'Failed to fetch update requests', details: error.message });
  }
};

// Approve Update Request
export const approveUpdateRequest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const request = await prisma.templeUpdateRequest.findUnique({
      where: { id },
      include: { temple: true }
    });

    if (!request || request.status !== 'PENDING') {
      return res.status(404).json({ error: 'Pending update request not found' });
    }

    const requestedData = request.requestedData as any;

    await prisma.$transaction(async (tx) => {
      // 1. Update Temple with requested data
      await tx.temple.update({
        where: { id: request.templeId },
        data: requestedData
      });

      // 2. Mark request as APPROVED
      await tx.templeUpdateRequest.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
    });

    res.json({ success: true, message: 'Update request approved and applied' });
  } catch (error: any) {
    console.error('Approve update request error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve update request' });
  }
};

// Reject Update Request
export const rejectUpdateRequest = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.templeUpdateRequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    res.json({ success: true, message: 'Update request rejected' });
  } catch (error: any) {
    console.error('Reject update request error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject update request' });
  }
};



