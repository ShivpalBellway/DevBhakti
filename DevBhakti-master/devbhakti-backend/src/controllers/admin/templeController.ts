import { Request, Response } from 'express';
import { UserRole, BookingStatus, SlabType, CommissionCategory, LedgerStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';
import { createShiprocketPickupLocation } from '../../services/shiprocketService';
import { parseLocation, extractPincode } from '../../lib/shiprocketUtils';
import { buildLangJson, getEnglish, getLang, localize } from '../../utils/localization';
import { generateCustomId } from "../../utils/idGenerator";


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

const getSingleString = (val: any): string | null => {
  if (!val) return null;
  if (Array.isArray(val)) {
    const nonVal = val.find(v => typeof v === 'string' && v.trim() !== '');
    return nonVal !== undefined ? nonVal.trim() : (val[0] ? String(val[0]).trim() : null);
  }
  if (typeof val === 'string') return val.trim();
  return String(val).trim();
};

const getLangObject = (val: any): any => {
  if (!val) return { en: null, hi: null, mr: null };
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch (e) {
      return { en: val, hi: null, mr: null };
    }
  }
  return { en: String(val), hi: null, mr: null };
};


// Get Temple by User ID (Raw data for admin)
export const getTempleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templeAccount = await prisma.user.findUnique({
      where: { id: String(id) },
      include: {
        temple: {
          include: {
            poojas: {
              select: { id: true, name: true, category: true, price: true, masterPoojaId: true, isMaster: true }
            },
            events: true,
          }
        }
      }
    });

    if (!templeAccount) {
      return res.status(404).json({ error: 'Temple account not found' });
    }

    // Since commissionSlabs don't have a formal relation in Prisma but use targetId
    let commissionSlabs: any[] = [];
    if (templeAccount.temple) {
        commissionSlabs = await prisma.commissionSlab.findMany({
            where: {
                targetId: templeAccount.temple.id,
                slabType: 'TEMPLE'
            }
        });
    }

    const lang = getLang(req);
    res.json({
      success: true,
      data: localize({
          ...templeAccount,
          temple: templeAccount.temple ? {
              ...templeAccount.temple,
              commissionSlabs
          } : null
      }, lang)
    });
  } catch (error) {
    console.error('Fetch temple error:', error);
    res.status(500).json({ error: 'Failed to fetch temple' });
  }
};

// Get all Temples (via User accounts)
export const getAllTemples = async (req: Request, res: Response) => {
  try {
    const { 
      page, limit, search, isVerified, isActive, templeId, date, 
      startDate, endDate,
      deity, category, 
      state, district, location, 
      transactionRange, 
      ritual 
    } = req.query;
    const lang = (req.query.lang as string) || getLang(req);

    const where: any = {
      role: 'INSTITUTION'
    };

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (isActive !== undefined) {
      where.temple = { ...where.temple, isActive: isActive === 'true' };
    }

    if (templeId && templeId !== 'all') {
      where.temple = { ...where.temple, id: String(templeId) };
    }

    // Category Filter (supported via category or legacy deity param)
    const categoryToFilter = category || deity;
    if (categoryToFilter && categoryToFilter !== 'all') {
      where.temple = { ...where.temple, category: { path: ['en'], string_contains: String(categoryToFilter) } };
    }

    // Location Filter (supported via location or legacy state/district params)
    const locToFilter = location || state || district;
    if (locToFilter) {
      where.temple = { ...where.temple, location: { path: ['en'], string_contains: String(locToFilter) } };
    }

    // Ritual (Pooja) Filter
    if (ritual && ritual !== 'all') {
      where.temple = { 
        ...where.temple, 
        poojas: { 
          some: { 
            OR: [
              { name: { path: ['en'], string_contains: String(ritual) } },
              { name: { path: ['hi'], string_contains: String(ritual) } },
              { name: { path: ['mr'], string_contains: String(ritual) } },
              { id: String(ritual) },
              { masterPoojaId: String(ritual) }
            ]
          } 
        } 
      };
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

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    } else if (date) {
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
              { name: { path: ['en'], string_contains: String(search) } },
              { location: { path: ['en'], string_contains: String(search) } },
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
                select: { id: true, name: true, category: true, price: true, masterPoojaId: true, isMaster: true }
              },
              events: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      if (lang === 'raw') return res.json(temples);
      return res.json(localize(temples, lang));
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
                select: { id: true, name: true, category: true, price: true, masterPoojaId: true, isMaster: true }
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
      data: lang === 'raw' ? temples : localize(temples, lang),
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
      if (files.heroImages && files.heroImages.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 banner images allowed' });
      }

      const allFiles = [...(files.image || []), ...(files.heroImages || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ error: `Image ${file.originalname} is too large. Max size allowed is 2MB.` });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    // Check if an INSTITUTION user already exists with this phone or email
    if (data.email) {
      const existingUserByEmail = await prisma.user.findFirst({
        where: { 
          email: data.email as string,
          role: 'INSTITUTION'
        }
      });
      if (existingUserByEmail) {
        return res.status(400).json({ 
          error: `A Temple account already exists with this email address. Please use a different email.` 
        });
      }
    }

    if (data.phone) {
      const existingUserByPhone = await prisma.user.findFirst({
        where: { 
          phone: data.phone,
          role: 'INSTITUTION'
        }
      });
      if (existingUserByPhone) {
        return res.status(400).json({ 
          error: `A Temple account already exists with this phone number. Please use a different number.` 
        });
      }
    }

    // News Cuttings
    const newNewsCuttingImages = files && files['newsCuttingImages'] ? (getFilePath(files, 'newsCuttingImages') || []) : [];
    let newNewsCuttingLinks: string[] = [];
    if (data.newsCuttingLinks) {
      try {
        const parsed = typeof data.newsCuttingLinks === 'string' 
          ? JSON.parse(data.newsCuttingLinks) 
          : data.newsCuttingLinks;
        newNewsCuttingLinks = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        if (typeof data.newsCuttingLinks === 'string') {
          newNewsCuttingLinks = [data.newsCuttingLinks];
        } else if (Array.isArray(data.newsCuttingLinks)) {
          newNewsCuttingLinks = data.newsCuttingLinks;
        } else {
          newNewsCuttingLinks = [];
        }
      }
    }

    const newsCuttings = newNewsCuttingImages.map((imgPath: string, index: number) => ({
      image: imgPath,
      link: newNewsCuttingLinks[index] || ""
    }));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User & Temple
      const userDisplayId = await generateCustomId('TAID');
      const templeDisplayId = await generateCustomId('TID');

      const user = await tx.user.create({
        data: {
          displayId: userDisplayId,
          name: JSON.stringify(buildLangJson(data.adminName_en || data.name, data.adminName_hi, data.adminName_mr)),
          email: data.email,
          phone: data.phone,
          password: hashedPassword,
          role: 'INSTITUTION',
          isVerified: false,
          temple: {
            create: {
              displayId: templeDisplayId,
              templeId: templeDisplayId, // Use the same for backward compatibility or keep original logic? User said TID04A1286
              name: JSON.stringify(buildLangJson(data.name_en || data.templeName || data.name, data.name_hi, data.name_mr)),
              location: JSON.stringify(buildLangJson(data.location_en || data.location, data.location_hi, data.location_mr)),
              fullAddress: JSON.stringify(buildLangJson(data.fullAddress_en || data.fullAddress, data.fullAddress_hi, data.fullAddress_mr)),
              description: JSON.stringify(buildLangJson(data.description_en || data.description, data.description_hi, data.description_mr)),
              history: JSON.stringify(buildLangJson(data.history_en || data.history, data.history_hi, data.history_mr)),
              category: JSON.stringify(buildLangJson(data.category_en || data.category, data.category_hi, data.category_mr)),
              pickupLocation: JSON.stringify(buildLangJson(data.pickupLocation_en || data.pickupLocation, data.pickupLocation_hi, data.pickupLocation_mr)),
              openTime: data.openTime,
              operatingHours: data.operatingHours ? (typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours) : undefined,
              phone: data.templePhone,
              website: data.website,
              mapUrl: data.mapUrl,
              viewers: data.viewers,
              rating: (data.rating && data.rating !== '0' && !isNaN(parseFloat(data.rating))) ? parseFloat(data.rating) : 4.5,
              reviewsCount: data.reviewsCount && !isNaN(parseInt(data.reviewsCount)) ? parseInt(data.reviewsCount) : 0,
              slug: data.slug || undefined,
              subdomain: data.subdomain || undefined, 
              urlType: data.urlType || 'slug',
              isActive: data.isActive === 'true',
              liveStatus: data.liveStatus === 'true',
              productCommissionRate: data.productCommissionRate && !isNaN(parseFloat(data.productCommissionRate)) ? parseFloat(data.productCommissionRate) : 10.0,
              poojaCommissionRate: data.poojaCommissionRate && !isNaN(parseFloat(data.poojaCommissionRate)) ? parseFloat(data.poojaCommissionRate) : 5.0,
              prasadPrice: data.prasadPrice && !isNaN(parseFloat(data.prasadPrice)) ? parseFloat(data.prasadPrice) : 0,
              image: getFilePath(files, 'image'),
              heroImages: getFilePath(files, 'heroImages') || [],
              ...(data.youtubeLinks && { youtubeLinks: JSON.parse(data.youtubeLinks) } as any),
              instagramUrl: getSingleString(data.instagramUrl),
              facebookUrl: getSingleString(data.facebookUrl),
              youtubeUrl: getSingleString(data.youtubeUrl),
              newsCuttings: newsCuttings,
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
            isOffline: s.isOffline === true || s.isOffline === 'true',
            isActive: true
          }))
        });
      }

      return user;
    });

    // Register Pickup Location with Shiprocket
    try {
      if ((result as any).temple) {
        const locEn = getEnglish((result as any).temple?.location) || data.location || '';
        const addrEn = getEnglish((result as any).temple?.fullAddress) || data.fullAddress || '';
        const { city, state } = parseLocation(locEn);
        const pincode = extractPincode(addrEn);

        const pickupData = {
          pickup_location: getEnglish((result as any).temple.pickupLocation) || `TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          name: data.name_en || data.name,
          email: data.email,
          phone: (result as any).phone,
          address: data.fullAddress || '',
          city: city || 'Delhi',
          state: state || 'Delhi',
          country: 'India',
          pin_code: pincode || '110001'
        };
        await createShiprocketPickupLocation(pickupData);
        console.log('Shiprocket Pickup Location Created Successfully for Temple from Admin');
      }
    } catch (srError) {
      console.error('Failed to create Shiprocket Pickup Location for Temple from Admin:', srError);
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
    console.log('Hindi/Marathi data:', {
      location_hi: data.location_hi, description_hi: data.description_hi,
      name_hi: data.name_hi, category_hi: data.category_hi,
    });

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

      // Check for phone uniqueness specifically for INSTITUTION role
      const conflictingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          role: 'INSTITUTION',
          id: { not: String(id) }
        }
      });

      if (conflictingPhone) {
        return res.status(400).json({
          success: false,
          error: `Access Denied: The phone number ${data.phone} is already linked to another temple account.`
        });
      }
    }

    if (data.email) {
      const conflictingEmail = await prisma.user.findFirst({
        where: {
          email: data.email,
          role: 'INSTITUTION',
          id: { not: String(id) }
        }
      });

      if (conflictingEmail) {
        return res.status(400).json({
          success: false,
          error: `Access Denied: The email ${data.email} is already linked to another temple account.`
        });
      }
    }

    // Image validations (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (files) {
      const newHeroImagesCount = files.heroImages ? files.heroImages.length : 0;
      const totalHeroImages = existingHeroImages.length + newHeroImagesCount;

      if (totalHeroImages > 10) {
        return res.status(400).json({ error: `Maximum 10 banner images allowed. You already have ${existingHeroImages.length} and tried to add ${newHeroImagesCount}.` });
      }

      const allFiles = [...(files.image || []), ...(files.heroImages || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ error: `Image ${file.originalname} is too large. Max size allowed is 2MB.` });
        }
      }
    }

    console.log('Validations passed, starting transaction...');

    // News Cuttings Logic
    const existingNewsCuttings = safeParse(data.existingNewsCuttings, []);
    const newNewsCuttingImages = files && files['newsCuttingImages'] ? (getFilePath(files, 'newsCuttingImages') || []) : [];
    
    let newNewsCuttingLinks: string[] = [];
    if (data.newsCuttingLinks) {
      try {
        const parsed = typeof data.newsCuttingLinks === 'string' 
          ? JSON.parse(data.newsCuttingLinks) 
          : data.newsCuttingLinks;
        newNewsCuttingLinks = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        if (typeof data.newsCuttingLinks === 'string') {
          newNewsCuttingLinks = [data.newsCuttingLinks];
        } else if (Array.isArray(data.newsCuttingLinks)) {
          newNewsCuttingLinks = data.newsCuttingLinks;
        } else {
          newNewsCuttingLinks = [];
        }
      }
    }

    const newNewsCuttings = newNewsCuttingImages.map((imgPath: string, index: number) => ({
      image: imgPath,
      link: newNewsCuttingLinks[index] || ""
    }));

    const newsCuttings = [
        ...existingNewsCuttings,
        ...newNewsCuttings
    ];

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
          name: JSON.stringify(buildLangJson(data.adminName_en || data.name, data.adminName_hi, data.adminName_mr)),
          email: data.email,
          phone: data.phone,
          temple: {
            update: {
              name: JSON.stringify(buildLangJson(data.name_en || data.templeName || data.name, data.name_hi, data.name_mr)),
              location: JSON.stringify(buildLangJson(data.location_en || data.location, data.location_hi, data.location_mr)),
              fullAddress: JSON.stringify(buildLangJson(data.fullAddress_en || data.fullAddress, data.fullAddress_hi, data.fullAddress_mr)),
              description: JSON.stringify(buildLangJson(data.description_en || data.description, data.description_hi, data.description_mr)),
              history: JSON.stringify(buildLangJson(data.history_en || data.history, data.history_hi, data.history_mr)),
              category: JSON.stringify(buildLangJson(data.category_en || data.category, data.category_hi, data.category_mr)),
              pickupLocation: JSON.stringify(buildLangJson(data.pickupLocation_en || data.pickupLocation, data.pickupLocation_hi, data.pickupLocation_mr)),
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
              instagramUrl: data.instagramUrl !== undefined ? getSingleString(data.instagramUrl) : undefined,
              facebookUrl: data.facebookUrl !== undefined ? getSingleString(data.facebookUrl) : undefined,
              youtubeUrl: data.youtubeUrl !== undefined ? getSingleString(data.youtubeUrl) : undefined,
              newsCuttings: newsCuttings,
              productCommissionRate: (data.productCommissionRate && !isNaN(parseFloat(data.productCommissionRate))) ? parseFloat(data.productCommissionRate) : undefined,
              poojaCommissionRate: (data.poojaCommissionRate && !isNaN(parseFloat(data.poojaCommissionRate))) ? parseFloat(data.poojaCommissionRate) : undefined,
              prasadPrice: (data.prasadPrice !== undefined && !isNaN(parseFloat(data.prasadPrice))) ? parseFloat(data.prasadPrice) : undefined,
              ...(files?.image && { image: getFilePath(files, 'image') }),
              heroImages: [
                ...existingHeroImages,
                ...(getFilePath(files, 'heroImages') || [])
              ],
              ...(data.youtubeLinks !== undefined && { youtubeLinks: JSON.parse(data.youtubeLinks) } as any),
            }
          }
        },
        include: { temple: true }
      });

      const templeId = (user as any).temple!.id;

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
                  name: (poojaRecord as any).name,
                  category: (poojaRecord as any).category,
                  categoryId: poojaRecord.categoryId,
                  categoryIds: poojaRecord.categoryIds,
                  price: poojaRecord.price,
                  duration: (poojaRecord as any).duration,
                  description: (poojaRecord as any).description,
                  time: poojaRecord.time,
                  image: poojaRecord.image,
                  about: (poojaRecord as any).about,
                  benefits: (poojaRecord as any).benefits,
                  bullets: (poojaRecord as any).bullets,
                  process: (poojaRecord as any).process,
                  processSteps: poojaRecord.processSteps || undefined,
                  templeDetails: (poojaRecord as any).templeDetails,
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
              isOffline: s.isOffline === true || s.isOffline === 'true',
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
        if ((result as any).temple) {
          const locEn = getEnglish((result as any).temple.location) || data.location || '';
          const addrEn = getEnglish((result as any).temple.fullAddress) || data.fullAddress || '';
          const { city, state } = parseLocation(locEn);
          const pincode = extractPincode(addrEn);

          let pickupLoc = getEnglish((result as any).temple.pickupLocation);
          if (!pickupLoc) {
            pickupLoc = `TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            await prisma.temple.update({ where: { id: (result as any).temple.id }, data: { pickupLocation: { en: pickupLoc, hi: null, mr: null } } });
          }

          const pickupData = {
            pickup_location: pickupLoc,
            name: getEnglish((result as any).temple.name),
            email: (result as any).email || '',
            phone: data.phone || (result as any).phone,
            address: data.fullAddress_en || data.fullAddress || addrEn,
            city: city || 'Delhi',
            state: state || 'Delhi',
            country: 'India',
            pin_code: pincode || '110001'
          };
          await createShiprocketPickupLocation(pickupData);
        }
      } catch (srError) {
        console.error('Shiprocket update sync error:', srError);
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
              isOffline: s.isOffline === true || s.isOffline === 'true',
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

    // Check for related financial data before deletion
    const [bookingsCount, ledgersCount, donationsCount, subordersCount] = await Promise.all([
      // Count bookings for this temple
      prisma.poojaBooking.count({
        where: { templeId: templeId }
      }),
      prisma.templeLedger.count({
        where: { templeId: templeId }
      }),
      prisma.donation.count({
        where: { templeId: templeId }
      }),
      prisma.subOrder.count({
        where: { templeId: templeId }
      })
    ]);

    // Calculate total related financial data
    const totalRelatedData = bookingsCount + ledgersCount + donationsCount + subordersCount;

    // If there's any financial data, prevent deletion
    if (totalRelatedData > 0) {
      const relatedData: any = {};
      if (bookingsCount > 0) relatedData.bookings = bookingsCount;
      if (ledgersCount > 0) relatedData.ledgers = ledgersCount;
      if (donationsCount > 0) relatedData.donations = donationsCount;
      if (subordersCount > 0) relatedData.subOrders = subordersCount;

      return res.status(400).json({
        error: 'Cannot delete this temple. It has existing financial data (bookings, donations, ledgers) that must be handled.',
        message: 'This temple cannot be deleted because it has associated financial data.',
        relatedData: relatedData
      });
    }

    // If no financial data, proceed with deletion
    await prisma.$transaction(async (tx) => {
      // Delete commission slabs for this temple
      await tx.commissionSlab.deleteMany({
        where: {
          targetId: templeId,
          slabType: 'TEMPLE'
        }
      });

      // Delete temple-specific poojas
      await tx.pooja.deleteMany({
        where: { templeId: templeId }
      });

      // Delete events
      await tx.event.deleteMany({
        where: { templeId: templeId }
      });

      // Delete products
      await tx.product.deleteMany({
        where: {
          OR: [
            { templeId: templeId },
            { sellerId: user.id }
          ]
        }
      });

      // Delete update requests
      await tx.templeUpdateRequest.deleteMany({
        where: { templeId: templeId }
      });

      // Delete staff members associated with the temple
      await tx.staffMember.deleteMany({
        where: {
          ownerId: templeId,
          ownerType: 'TEMPLE'
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

    res.json({ success: true, message: 'Temple account and profile deleted successfully' });
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
          } as any
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const lang = getLang(req);
    if (lang === 'raw') return res.json(requests);
    res.json(localize(requests, lang));
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

    const dataToUpdate: any = { ...requestedData };
    const langFields = ['name', 'location', 'fullAddress', 'description', 'history', 'category', 'pickupLocation'];

    for (const field of langFields) {
      if (requestedData[`${field}_en`] !== undefined || requestedData[`${field}_hi`] !== undefined || requestedData[`${field}_mr`] !== undefined || requestedData[field] !== undefined) {
        dataToUpdate[field] = JSON.stringify(buildLangJson(
          requestedData[`${field}_en`] || requestedData[field] || '',
          requestedData[`${field}_hi`],
          requestedData[`${field}_mr`]
        ));
        delete dataToUpdate[`${field}_en`];
        delete dataToUpdate[`${field}_hi`];
        delete dataToUpdate[`${field}_mr`];
      }
    }

    const userUpdatePayload: any = {};
    if (dataToUpdate.adminName) {
      userUpdatePayload.name = dataToUpdate.adminName;
      delete dataToUpdate.adminName;
    }
    if (dataToUpdate.adminEmail) {
      userUpdatePayload.email = dataToUpdate.adminEmail;
      delete dataToUpdate.adminEmail;
    }
    if (dataToUpdate.adminPhone) {
      userUpdatePayload.phone = dataToUpdate.adminPhone;
      delete dataToUpdate.adminPhone;
    }

    // Clean up other potential non-schema fields
    delete dataToUpdate.poojaIds;
    delete dataToUpdate.inlineEvents;
    delete dataToUpdate.existingHeroImages;
    delete dataToUpdate.commissionSlabs;

    await prisma.$transaction(async (tx) => {
      // 1. Update Temple with requested data
      if (Object.keys(dataToUpdate).length > 0) {
        await tx.temple.update({
          where: { id: request.templeId },
          data: dataToUpdate
        });
      }

      // 2. Update User (Trustee) with requested data
      if (Object.keys(userUpdatePayload).length > 0) {
        await tx.user.update({
          where: { id: request.temple.userId },
          data: userUpdatePayload
        });
      }

      // 3. Mark request as APPROVED
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
    const categories = await prisma.temple.findMany({
      select: {
        category: true
      } as any
    });

    const lang = getLang(req);
    const locCategories = localize(categories, lang);
    const activeCategories = locCategories
      .map((t: any) => t.category)
      .filter((c: any): c is string => !!c && typeof c === 'string' && c.trim() !== "");

    res.json({ success: true, data: Array.from(new Set(activeCategories)).sort() });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to fetch temple categories' });
  }
};

export const getTempleLocations = async (req: Request, res: Response) => {
    try {
      const locations = await prisma.temple.findMany({
        select: {
          location: true
        } as any
      });
  
      const lang = getLang(req);
      const locData = localize(locations, lang);
      const activeLocations = locData
        .map((t: any) => t.location)
        .filter((c: any): c is string => !!c && typeof c === 'string' && c.trim() !== "");
  
      res.json({ success: true, data: Array.from(new Set(activeLocations)).sort() });
    } catch (error: any) {
      console.error('Fetch locations error:', error);
      res.status(500).json({ error: 'Failed to fetch temple locations' });
    }
  };

export const toggleShowPhone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { showPhone } = req.body;

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        temple: {
          update: {
            showPhone: Boolean(showPhone)
          }
        }
      },
      include: { temple: true }
    });

    if (!user.temple) {
      return res.status(404).json({ success: false, message: "Temple profile not found for this user" });
    }

    res.json({ success: true, message: "Phone visibility updated successfully", data: user.temple });
  } catch (error: any) {
    console.error('Toggle showPhone error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update phone visibility' });
  }
};

export const toggleShowWebsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { showWebsite } = req.body;

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        temple: {
          update: {
            showWebsite: Boolean(showWebsite)
          }
        }
      },
      include: { temple: true }
    });

    if (!user.temple) {
      return res.status(404).json({ success: false, message: "Temple profile not found for this user" });
    }

    res.json({ success: true, message: "Website visibility updated successfully", data: user.temple });
  } catch (error: any) {
    console.error('Toggle showWebsite error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update website visibility' });
  }
};
