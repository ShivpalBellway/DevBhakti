import { Request, Response } from 'express';
import { PrismaClient, UserRole, BookingStatus, SlabType, CommissionCategory, LedgerStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createShiprocketPickupLocation } from '../../services/shiprocketService';
import { parseLocation, extractPincode } from '../../lib/shiprocketUtils';

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
    const { page, limit, search, isVerified, templeId, date, deity, state, district, transactionRange } = req.query;

    const where: any = {
      role: 'INSTITUTION'
    };

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (templeId && templeId !== 'all') {
      where.temple = { ...where.temple, id: String(templeId) };
    }

    if (deity && deity !== 'all') {
      where.temple = { ...where.temple, category: { contains: String(deity), mode: 'insensitive' } };
    }

    if (state) {
      where.temple = { ...where.temple, location: { contains: String(state), mode: 'insensitive' } };
    }

    if (district) {
      where.temple = { ...where.temple, location: { contains: String(district), mode: 'insensitive' } };
    }

    if (transactionRange && transactionRange !== 'all') {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Get count of earnings for the current month
      const ledgerGroups = await prisma.templeLedger.groupBy({
        by: ['templeId'],
        where: {
          createdAt: { gte: monthStart },
          type: { in: ['MARKETPLACE_EARNING', 'POOJA_EARNING', 'DONATION_EARNING'] },
          templeId: { not: null }
        },
        _count: { id: true }
      });

      const filteredTempleIds = ledgerGroups
        .filter(group => {
          const count = group._count.id;
          if (transactionRange === 'less_100') return count < 100;
          if (transactionRange === '101_250') return count >= 101 && count <= 250;
          if (transactionRange === '251_500') return count >= 251 && count <= 500;
          if (transactionRange === '501_1000') return count >= 501 && count <= 1000;
          if (transactionRange === 'more_1000') return count > 1000;
          return true;
        })
        .map(group => group.templeId) as string[];

      // Special case: If "less_100" is selected, temples with 0 transactions should also be included
      if (transactionRange === 'less_100') {
        // Temples with NO ledger entries this month also count as less than 100
        const allTempleIdsWithLedger = ledgerGroups.map(g => g.templeId);
        const templesWithNoLedger = await prisma.temple.findMany({
          where: { id: { notIn: allTempleIdsWithLedger.filter(Boolean) as string[] } },
          select: { id: true }
        });
        filteredTempleIds.push(...templesWithNoLedger.map(t => t.id));
      }

      if (filteredTempleIds.length > 0) {
        where.temple = { ...where.temple, id: { in: filteredTempleIds } };
      } else {
        where.temple = { ...where.temple, id: 'NONE_MATCH' };
      }
    }

    if (date) {
      const startOfDay = new Date(String(date));
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(String(date));
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
        {
          temple: {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { location: { contains: String(search), mode: 'insensitive' } },
              { templeId: { contains: String(search), mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Backward compatibility: If no page/limit provided, return all as array
    if (!page && !limit) {
      const temples = await prisma.user.findMany({
        where,
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
      return res.json(temples);
    }

    // Paginated response
    const p = parseInt(String(page)) || 1;
    const l = parseInt(String(limit)) || 10;
    const skip = (p - 1) * l;

    const [temples, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: l
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: temples,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
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
      if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
        return res.status(400).json({ error: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
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
              operatingHours: data.operatingHours ? (typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours) : undefined,
              phone: data.templePhone,
              website: data.website,
              mapUrl: data.mapUrl,
              viewers: data.viewers,
              rating: (data.rating && data.rating !== '0' && !isNaN(parseFloat(data.rating))) ? parseFloat(data.rating) : 4.5,
              reviewsCount: data.reviewsCount && !isNaN(parseInt(data.reviewsCount)) ? parseInt(data.reviewsCount) : 0,
              slug: data.slug || undefined,
              subdomain: data.subdomain || undefined, // Added
              urlType: data.urlType || 'slug', // Added
              pickupLocation: `TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
              isActive: data.isActive === 'true',
              liveStatus: data.liveStatus === 'true',
              productCommissionRate: data.productCommissionRate && !isNaN(parseFloat(data.productCommissionRate)) ? parseFloat(data.productCommissionRate) : 10.0,
              poojaCommissionRate: data.poojaCommissionRate && !isNaN(parseFloat(data.poojaCommissionRate)) ? parseFloat(data.poojaCommissionRate) : 5.0,
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

    // Register Pickup Location with Shiprocket
    try {
      if (result.temple) {
        const { city, state } = parseLocation(data.location || "");
        const pincode = extractPincode(data.fullAddress || "");

        const pickupData = {
          pickup_location: result.temple.pickupLocation,
          name: data.name,
          email: data.email,
          phone: result.phone,
          address: data.fullAddress || '',
          city: city || "Delhi",
          state: state || "Delhi",
          country: "India",
          pin_code: pincode || "110001"
        };
        await createShiprocketPickupLocation(pickupData);
        console.log("Shiprocket Pickup Location Created Successfully for Temple from Admin");
      }
    } catch (srError) {
      console.error("Failed to create Shiprocket Pickup Location for Temple from Admin:", srError);
    }

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

    console.log('Update Temple Called for ID:', id);
    console.log('Body Keys:', Object.keys(data));

    // Robust JSON parsing
    const safeParse = (str: string, fallback: any) => {
      if (!str) return fallback;
      try {
        // If it's already an object (sometimes happens with some middlewares), return it
        if (typeof str === 'object') return str;
        return JSON.parse(str);
      } catch (e) {
        console.error('JSON Parse Error for string:', str);
        return fallback;
      }
    };

    const poojaIds = safeParse(data.poojaIds, []);
    const inlineEvents = safeParse(data.inlineEvents, []);
    const existingHeroImages = safeParse(data.existingHeroImages, []);
    const commissionSlabs = safeParse(data.commissionSlabs, null);

    if (data.phone) {
      const cleaned = data.phone.replace(/\D/g, '');
      if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
        return res.status(400).json({ error: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
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

    console.log('Validations passed, starting transaction...');

    const result = await prisma.$transaction(async (tx) => {
      // Find the user first to ensure they exist and have a temple
      const existingUser = await tx.user.findUnique({
        where: { id: String(id) },
        include: { temple: true }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (!existingUser.temple) {
        // Option A: Throw error. Option B: Create it if it should exist. 
        // For update, let's throw error as it's an 'update' of an existing temple.
        throw new Error('This user account does not have an associated temple profile');
      }

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
              operatingHours: data.operatingHours ? (typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours) : undefined,
              phone: data.templePhone,
              website: data.website,
              mapUrl: data.mapUrl,
              viewers: data.viewers,
              rating: isNaN(parseFloat(data.rating)) ? 0 : parseFloat(data.rating),
              reviewsCount: isNaN(parseInt(data.reviewsCount)) ? 0 : parseInt(data.reviewsCount),
              slug: data.slug || undefined,
              subdomain: data.subdomain || undefined,
              urlType: data.urlType || 'slug',
              liveStatus: data.liveStatus === 'true',
              productCommissionRate: (data.productCommissionRate && !isNaN(parseFloat(data.productCommissionRate))) ? parseFloat(data.productCommissionRate) : undefined,
              poojaCommissionRate: (data.poojaCommissionRate && !isNaN(parseFloat(data.poojaCommissionRate))) ? parseFloat(data.poojaCommissionRate) : undefined,
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
      console.log('Syncing Poojas for Temple:', templeId);
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
        // Fetch all selected poojas in one query
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
        console.log('Syncing Events...');
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
        console.log('Updating Commission Slabs...');
        await tx.commissionSlab.deleteMany({
          where: { targetId: templeId, slabType: SlabType.TEMPLE }
        });

        if (commissionSlabs.length > 0) {
          await tx.commissionSlab.createMany({
            data: commissionSlabs.map((s: any) => ({
              minAmount: parseFloat(s.minAmount) || 0,
              maxAmount: s.maxAmount ? parseFloat(s.maxAmount) : null,
              platformFee: parseFloat(s.platformFee) || 0,
              percentage: parseFloat(s.percentage) || 0,
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
      maxWait: 15000,
      timeout: 30000
    });

    console.log('Transaction completed successfully');

    // Sync with Shiprocket if address or location changed
    if (data.fullAddress || data.location || data.phone || data.templePhone) {
      try {
        if (result.temple) {
          const { city, state } = parseLocation(data.location || result.temple.location || "");
          const pincode = extractPincode(data.fullAddress || result.temple.fullAddress || "");

          let pickupLoc = result.temple.pickupLocation;
          if (!pickupLoc) {
            pickupLoc = `TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            await prisma.temple.update({ where: { id: result.temple.id }, data: { pickupLocation: pickupLoc } });
          }

          const pickupData = {
            pickup_location: pickupLoc,
            name: result.temple.name,
            email: result.email || "",
            phone: data.phone || result.phone,
            address: data.fullAddress || result.temple.fullAddress || '',
            city: city || "Delhi",
            state: state || "Delhi",
            country: "India",
            pin_code: pincode || "110001"
          };
          await createShiprocketPickupLocation(pickupData);
        }
      } catch (srError) {
        console.error("Shiprocket update sync error:", srError);
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Update Temple Controller Error:', error);
    // Explicit 400 for structural errors vs 500 for generic ones
    const statusCode = error.message?.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update temple',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Set a temple as the primary live darshan temple (Admin-only)
export const setPrimaryLive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Reset all temples' primary status
      await tx.temple.updateMany({
        data: { isPrimaryLive: false }
      });

      // 2. Set the chosen temple as primary
      const temple = await tx.temple.update({
        where: { userId: String(id) }, // Note: Most admin temple actions use User ID
        data: { isPrimaryLive: true }
      });

      return temple;
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Set primary live error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to set primary live temple' });
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
export const getTempleCategories = async (req: Request, res: Response) => {
  try {
    const temples = await prisma.temple.findMany({
      where: {
        category: { not: "" }
      },
      select: { category: true },
      distinct: ['category']
    });

    const categories = temples
      .map(t => t.category)
      .filter((c): c is string => !!c && c.trim() !== "");

    res.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to fetch temple categories' });
  }
};

