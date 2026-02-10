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
              select: { id: true, name: true, category: true, price: true }
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
      const cleaned = data.phone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
      }
      data.phone = normalizePhone(data.phone);
    }

    // Image validations (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (files) {
      if (files.heroImages && files.heroImages.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 banner images allowed' });
      }

      const allFiles = [...(files.image || []), ...(files.heroImages || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ error: `Image ${file.originalname} is too large. Max size allowed is 2MB.` });
        }
      }
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

      // 4. Create Commission Slabs
      const commissionSlabs = data.commissionSlabs ? JSON.parse(data.commissionSlabs) : [];
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
      const cleaned = data.phone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
      }
      data.phone = normalizePhone(data.phone);
    }

    // Image validations (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (files) {
      const newHeroImagesCount = files.heroImages ? files.heroImages.length : 0;
      const totalHeroImages = existingHeroImages.length + newHeroImagesCount;

      if (totalHeroImages > 5) {
        return res.status(400).json({ error: `Maximum 5 banner images allowed. You already have ${existingHeroImages.length} and tried to add ${newHeroImagesCount}.` });
      }

      const allFiles = [...(files.image || []), ...(files.heroImages || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ error: `Image ${file.originalname} is too large. Max size allowed is 2MB.` });
        }
      }
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

// Toggle Temple Status (including Live Status)
export const toggleTempleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      isVerified,
      isActive,
      slug,
      subdomain,
      urlType,
      productCommissionRate,
      poojaCommissionRate,
      commissionSlabs,
      liveStatus,
    } = req.body;

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
              liveStatus: liveStatus !== undefined ? liveStatus : undefined,
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

        // Create new ones with EXPLICIT category field
        if (commissionSlabs.length > 0) {
          await (tx as any).commissionSlab.createMany({
            data: commissionSlabs.map((s: any) => ({
              minAmount: parseFloat(s.minAmount),
              maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
              platformFee: parseFloat(s.platformFee),
              percentage: parseFloat(s.percentage),
              slabType: 'TEMPLE',
              targetId: user.temple!.id,
              category: s.category || 'MARKETPLACE', // CRITICAL: Explicitly set category from frontend
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

// Update only Live configuration (channelId, liveUrl, isLive flag) for a specific temple (Admin-only)
export const updateTempleLiveConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { channelId, liveUrl, isLive } = req.body;

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        temple: {
          update: {
            channelId: channelId !== undefined ? channelId : undefined,
            liveUrl: liveUrl !== undefined ? liveUrl : undefined,
            isLive: isLive !== undefined ? Boolean(isLive) : undefined,
          }
        }
      },
      include: { temple: true }
    });

    if (!user.temple) {
      return res.status(404).json({ success: false, message: "Temple profile not found for this user" });
    }

    res.json({ success: true, data: user.temple });
  } catch (error: any) {
    console.error('Update temple live config error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update live config' });
  }
};

// Delete Temple account
export const deleteTemple = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First find the user to get the temple ID
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      include: { temple: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Temple account not found' });
    }

    if (!user.temple) {
      return res.status(404).json({ error: 'Temple profile not found for this user' });
    }

    const templeId = user.temple.id;

    // Check for related data before deletion
    const [productsCount, bookingsCount, poojasCount, eventsCount] = await Promise.all([
      // Count products owned by this temple
      prisma.product.count({
        where: {
          OR: [
            { templeId: templeId },
            { sellerId: user.id }
          ]
        }
      }),
      // Count bookings for this temple
      prisma.poojaBooking.count({
        where: { templeId: templeId }
      }),
      // Count temple-specific poojas (not master poojas)
      prisma.pooja.count({
        where: {
          templeId: templeId,
          isMaster: false
        }
      }),
      // Count events for this temple
      prisma.event.count({
        where: { templeId: templeId }
      })
    ]);

    // Calculate total related data
    const totalRelatedData = productsCount + bookingsCount + poojasCount + eventsCount;

    // If there's any related data, prevent deletion
    if (totalRelatedData > 0) {
      const relatedData: any = {};
      if (productsCount > 0) relatedData.products = productsCount;
      if (bookingsCount > 0) relatedData.bookings = bookingsCount;
      if (poojasCount > 0) relatedData.poojas = poojasCount;
      if (eventsCount > 0) relatedData.events = eventsCount;

      return res.status(400).json({
        error: 'Cannot delete this temple. It has existing data that must be removed first.',
        message: 'This temple cannot be deleted because it has associated data.',
        relatedData: relatedData
      });
    }

    // If no related data, proceed with deletion
    await prisma.$transaction(async (tx) => {
      // Delete commission slabs for this temple
      await tx.commissionSlab.deleteMany({
        where: {
          targetId: templeId,
          slabType: SlabType.TEMPLE
        }
      });

      // Delete the temple record
      await tx.temple.delete({
        where: { id: templeId }
      });

      // Delete the user record
      await tx.user.delete({
        where: { id: String(id) }
      });
    });

    res.json({
      success: true,
      message: 'Temple account deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete error:', error);

    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Cannot delete temple. Please remove all associated data first.',
        message: 'This temple has related data that prevents deletion.'
      });
    }

    res.status(500).json({
      error: 'Failed to delete temple account',
      message: error.message
    });
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



