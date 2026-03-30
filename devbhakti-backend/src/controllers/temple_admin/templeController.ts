import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createShiprocketPickupLocation } from '../../services/shiprocketService';
import { parseLocation, extractPincode } from '../../lib/shiprocketUtils';
import bcrypt from 'bcrypt';
import { notifyAdmins } from '../../services/firebaseService';

const getFilePath = (files: any, fieldName: string) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    return `/uploads/temples/${files[fieldName][0].filename}`;
  }
  return null;
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

const getFilePaths = (files: any, fieldName: string) => {
  if (files && files[fieldName]) {
    return files[fieldName].map((f: any) => `/uploads/temples/${f.filename}`);
  }
  return [];
};

export const registerTemple = async (req: Request, res: Response) => {
  try {
    const files = req.files as any;
    const data = req.body;

    // Parse JSON fields safely
    const parseJson = (val: any) => {
      if (!val) return null;
      if (typeof val !== 'string') return val;
      try { return JSON.parse(val); } catch (e) { return null; }
    };

    const poojaIds = parseJson(data.poojaIds) || [];
    const inlineEvents = parseJson(data.inlineEvents) || [];
    const operatingHours = parseJson(data.operatingHours);

    // Normalize Phone
    if (data.phone) {
      const cleaned = data.phone.replace(/\D/g, '');
      // Allow 10 digits OR 12 digits if starting with 91
      if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
      }
      data.phone = normalizePhone(data.phone);
    }

    // Image validations (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (files) {
      if (files.heroImages && files.heroImages.length > 5) {
        return res.status(400).json({ success: false, message: 'Maximum 5 banner images allowed' });
      }
      const allFiles = [...(files.image || []), ...(files.heroImages || []), ...(files.gallery || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ success: false, message: `Image ${file.originalname} is too large. Max 2MB allowed.` });
        }
      }
    }

    // Check if phone number is already registered with ANY role
    const existingUser = await prisma.user.findFirst({
        where: { phone: data.phone }
    });




    if (existingUser) {
        return res.status(400).json({ 
            success: false, 
            message: `This mobile number is already registered as a ${existingUser.role}. Please use a different number or login with your existing account.` 
        });
    }

    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User (Institution)
      const user = await tx.user.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: hashedPassword,
          role: 'INSTITUTION',
          isVerified: false, // Pending admin approval
        }
      });

      // 2. Create the Temple linked to the User
      const templeId = `TMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const temple = await tx.temple.create({
        data: {
          templeId: templeId,
          name: data.templeName || 'New Temple',
          category: data.category || 'Sacred',
          openTime: data.openTime || '',
          operatingHours: operatingHours,
          description: data.description || '',
          history: data.history || '',
          location: data.location || '',
          fullAddress: data.fullAddress || '',
          phone: data.phone || '',
          website: data.website,
          mapUrl: data.mapUrl,
          viewers: data.viewers,
          rating: parseFloat(data.rating || '0'),
          reviewsCount: parseInt(data.reviewsCount || '0'),
          userId: user.id,
          liveStatus: false, // Pending admin approval
          image: getFilePath(files, 'image'),
          heroImages: getFilePaths(files, 'heroImages'),
          // Link Poojas
          poojas: {
            connect: poojaIds.map((id: string) => ({ id }))
          },
          // Create Inline Events
          events: {
            create: inlineEvents.map((ev: any) => ({
              name: ev.name,
              date: ev.date,
              description: ev.description
            }))
          },
          pickupLocation: `TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        }
      });

      return { user, temple };
    });

    // 3. Register Pickup Location with Shiprocket
    try {
      const { city, state } = parseLocation(data.location || "");
      const pincode = extractPincode(data.fullAddress || "");

      const pickupData = {
        pickup_location: (result.temple as any).pickupLocation,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.fullAddress || '',
        city: city || "Delhi",
        state: state || "Delhi",
        country: "India",
        pin_code: pincode || "110001"
      };
      await createShiprocketPickupLocation(pickupData);
    } catch (srError) {
      console.error("Shiprocket Pickup sync error:", srError);
    }

    res.status(201).json({
      success: true,
      message: 'Temple registration submitted successfully. Please wait for admin approval.',
      data: result
    });

    // Notify all admins about the new temple registration (non-blocking)
    notifyAdmins({
      title: '🛕 New Temple Registered!',
      body: `${data.templeName || 'A new temple'} has submitted a registration request and is awaiting your approval.`,
      data: {
        link: '/admin/temples',
        templeId: (result.temple as any).id
      }
    }).catch((err: any) => console.error('Admin notification error:', err));

  } catch (error: any) {
    console.error('Temple registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit registration'
    });
  }
};

export const getMyTempleProfile = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner.ownerId;

    const temple = await prisma.temple.findUnique({
      where: { id: templeId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!temple) {
      console.log(`No temple found for templeId: ${templeId}`);
      return res.status(200).json({ success: false, message: 'Temple record not found for this account. Please register your temple.' });
    }

    console.log("Temple profile fetched successfully");
    res.json({ success: true, data: temple });
  } catch (error: any) {
    console.error('Fetch Temple Profile Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const updateMyTempleProfile = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner.ownerId;
    const files = req.files as any;
    const data = req.body;

    const temple = await prisma.temple.findUnique({
      where: { id: templeId },
      include: { user: true }
    });

    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    // Validate Phone if provided
    if (data.phone) {
      const cleaned = data.phone.replace(/\D/g, '');
      // Allow 10 digits OR 12 digits if starting with 91
      if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
      }
      data.phone = normalizePhone(data.phone);

      // Check if phone number is already taken by another user
      const conflictingUser = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          id: { not: temple.userId }
        }
      });

      if (conflictingUser) {
        return res.status(400).json({ 
          success: false, 
          message: `The user with number ${data.phone} is already with us (Registered as ${conflictingUser.role}). Please use a different number.` 
        });
      }

      // If phone is different from current, we'll need to update the User record as well
      if (data.phone !== temple.user?.phone && data.phone !== temple.phone) {
        await prisma.user.update({
          where: { id: temple.userId },
          data: { phone: data.phone }
        });
      }
    }
    
    // Note: temple.user might not be included in the initial fetch, let's check.
    // Line 225: const temple = await prisma.temple.findUnique({ where: { id: templeId } }); -> No include.
    // I should probably fetch with user include to be safe, or just use temple.userId.

    // Image size validations (2MB for NEW files)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (files) {
      const newHeroImagesCount = files.heroImages ? files.heroImages.length : 0;
      const currentHeroImagesCount = temple.heroImages ? (temple.heroImages as string[]).length : 0;
      const totalHeroImages = currentHeroImagesCount + newHeroImagesCount;

      if (totalHeroImages > 5) {
        return res.status(400).json({ success: false, message: `Maximum 5 banners allowed. You already have ${currentHeroImagesCount} and tried to add ${newHeroImagesCount}.` });
      }

      const allFiles = [...(files.image || []), ...(files.heroImages || []), ...(files.gallery || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ success: false, message: `Image ${file.originalname} is too large. Max 2MB allowed.` });
        }
      }
    }

    // Define sensitive fields
    const sensitiveFields = [
      'name', 'location', 'category', 'fullAddress', 'image', 'heroImages', 'gallery',
      'accountHolderName', 'accountNumber', 'bankName', 'ifscCode', 'upiId'
    ];

    // Check if any sensitive field is being updated
    const updateData: any = {};
    const sensitiveChanges: any = {};
    const oldSensitiveData: any = {};
    let hasSensitiveChanges = false;

    // Map of fields to their values in req.body
    const fieldMapping: any = {
      name: data.name,
      category: data.category,
      location: data.location,
      fullAddress: data.fullAddress,
      openTime: data.openTime,
      operatingHours: data.operatingHours ? (typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours) : undefined,
      description: data.description,
      history: data.history,
      phone: data.phone,
      website: data.website,
      mapUrl: data.mapUrl,
      viewers: data.viewers,
      isLive: data.isLive !== undefined ? (String(data.isLive) === 'true') : undefined,
      liveUrl: data.liveUrl,
      // Technical Identity
      slug: data.slug,
      subdomain: data.subdomain,
      urlType: data.urlType,
      // If user pastes a raw YouTube Channel ID in liveUrl, persist it into channelId as well
      channelId: data.channelId || (typeof data.liveUrl === 'string' && data.liveUrl.trim().startsWith('UC') ? data.liveUrl.trim() : undefined),
    };

    // Handle files
    const newImage = getFilePath(files, 'image');
    if (newImage) {
      sensitiveChanges['image'] = newImage;
      oldSensitiveData['image'] = temple.image;
      hasSensitiveChanges = true;
    }

    const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : null;
    if (newHeroImages && newHeroImages.length > 0) {
      sensitiveChanges['heroImages'] = newHeroImages;
      oldSensitiveData['heroImages'] = temple.heroImages;
      hasSensitiveChanges = true;
    }

    const newGallery = files && files['gallery'] ? getFilePaths(files, 'gallery') : null;
    if (newGallery && newGallery.length > 0) {
      sensitiveChanges['gallery'] = newGallery;
      oldSensitiveData['gallery'] = temple.gallery;
      hasSensitiveChanges = true;
    }

    // Check textual fields
    for (const key in fieldMapping) {
      const newValue = fieldMapping[key];
      const oldValue = (temple as any)[key];

      if (newValue !== undefined && newValue !== oldValue) {
        if (sensitiveFields.includes(key)) {
          sensitiveChanges[key] = newValue;
          oldSensitiveData[key] = oldValue;
          hasSensitiveChanges = true;
        } else {
          updateData[key] = newValue;
        }
      }
    }

    if (hasSensitiveChanges) {
      // Create a pending update request
      await prisma.templeUpdateRequest.create({
        data: {
          templeId: temple.id,
          requestedData: sensitiveChanges,
          oldData: oldSensitiveData,
          status: 'PENDING'
        }
      });

      // Notify Admins
      await notifyAdmins({
        title: "Temple Profile Update",
        body: `${temple.name || 'A Temple'} has updated sensitive profile details requiring verification.`,
        data: {
          link: '/admin/temples/update-requests',
          type: 'TEMPLE_UPDATE'
        }
      });

      // Update non-sensitive fields immediately if any
      if (Object.keys(updateData).length > 0) {
        await prisma.temple.update({
          where: { id: temple.id },
          data: updateData
        });
      }

      return res.json({
        success: true,
        message: 'Sensitive fields update request submitted for admin approval. Non-sensitive fields (if any) updated.',
        pendingApproval: true
      });
    }

    // If no sensitive changes, update everything directly
    if (Object.keys(updateData).length > 0) {
      const updatedTemple = await prisma.temple.update({
        where: { id: temple.id },
        data: updateData
      });

      // Sync with Shiprocket if address or location changed
      if (updateData.fullAddress || updateData.location || updateData.phone) {
        try {
          const { city, state } = parseLocation(updateData.location || temple.location || "");
          const pincode = extractPincode(updateData.fullAddress || temple.fullAddress || "");

          const pickupData = {
            pickup_location: temple.pickupLocation,
            name: temple.name,
            email: (temple as any).user?.email || "",
            phone: updateData.phone || temple.phone,
            address: updateData.fullAddress || temple.fullAddress || '',
            city: city || "Delhi",
            state: state || "Delhi",
            country: "India",
            pin_code: pincode || "110001"
          };
          await createShiprocketPickupLocation(pickupData);
        } catch (srError) {
          console.error("Shiprocket update sync error:", srError);
        }
      }

      return res.json({ success: true, data: updatedTemple, message: 'Profile updated successfully' });
    }

    res.json({ success: true, message: 'No changes detected' });
  } catch (error: any) {
    console.error('Update Temple Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTempleDevotees = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner.ownerId;

    const temple = await prisma.temple.findUnique({
      where: { id: templeId }
    });

    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    // 1. Fetch users who have booked poojas
    const poojaBookings = await prisma.poojaBooking.findMany({
      where: {
        templeId: temple.id,
        status: { not: 'PENDING' }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            dob: true,
            anniversary: true,
            address: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch users who have ordered products (via SubOrders)
    const productSubOrders = await prisma.subOrder.findMany({
      where: { templeId: temple.id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileImage: true,
                dob: true,
                anniversary: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Process Pooja Bookers
    const poojaDevoteesMap = new Map();
    poojaBookings.forEach(booking => {
      if (!booking.user) return;
      if (!poojaDevoteesMap.has(booking.userId)) {
        poojaDevoteesMap.set(booking.userId, {
          ...booking.user,
          lastInteraction: booking.createdAt,
          totalInteractions: 0,
          totalSpent: 0,
          type: 'POOJA'
        });
      }
      const devotee = poojaDevoteesMap.get(booking.userId);
      devotee.totalInteractions += 1;
      devotee.totalSpent += booking.packagePrice;
      if (new Date(booking.createdAt) > new Date(devotee.lastInteraction)) {
        devotee.lastInteraction = booking.createdAt;
      }
    });

    // Process Product Customers
    const productDevoteesMap = new Map();
    productSubOrders.forEach(subOrder => {
      if (!subOrder.order.user) return;
      if (!productDevoteesMap.has(subOrder.order.userId)) {
        productDevoteesMap.set(subOrder.order.userId, {
          ...subOrder.order.user,
          lastInteraction: subOrder.createdAt,
          totalInteractions: 0,
          totalSpent: 0,
          type: 'PRODUCT'
        });
      }
      const devotee = productDevoteesMap.get(subOrder.order.userId);
      devotee.totalInteractions += 1;
      devotee.totalSpent += subOrder.totalAmount;
      if (new Date(subOrder.createdAt) > new Date(devotee.lastInteraction)) {
        devotee.lastInteraction = subOrder.createdAt;
      }
    });

    const querySearch = (req.query.search as string || "").toLowerCase();
    const dob = req.query.dob as string;
    const anniversary = req.query.anniversary as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    let poojaBookers = Array.from(poojaDevoteesMap.values());
    let productCustomers = Array.from(productDevoteesMap.values());

    if (querySearch) {
      poojaBookers = poojaBookers.filter(user =>
        (user.name?.toLowerCase() || "").includes(querySearch) ||
        (user.email?.toLowerCase() || "").includes(querySearch) ||
        (user.phone || "").includes(querySearch)
      );
      productCustomers = productCustomers.filter(user =>
        (user.name?.toLowerCase() || "").includes(querySearch) ||
        (user.email?.toLowerCase() || "").includes(querySearch) ||
        (user.phone || "").includes(querySearch)
      );
    }

    if (dob) {
      poojaBookers = poojaBookers.filter(u => u.dob === dob);
      productCustomers = productCustomers.filter(u => u.dob === dob);
    }
    if (anniversary) {
      poojaBookers = poojaBookers.filter(u => u.anniversary === anniversary);
      productCustomers = productCustomers.filter(u => u.anniversary === anniversary);
    }

    const totalDevoteesCount = new Set([...poojaDevoteesMap.keys(), ...productDevoteesMap.keys()]).size;

    // Total lengths after search
    const poojaTotal = poojaBookers.length;
    const productTotal = productCustomers.length;

    // Apply Pagination
    poojaBookers = poojaBookers.slice((page - 1) * limit, page * limit);
    productCustomers = productCustomers.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        poojaBookers,
        productCustomers,
        stats: {
          totalDevotees: totalDevoteesCount,
          poojaBookersCount: poojaTotal,
          productCustomersCount: productTotal,
        },
        pagination: {
          page,
          limit,
          poojaTotalPages: Math.ceil(poojaTotal / limit),
          productTotalPages: Math.ceil(productTotal / limit),
        }
      }
    });
  } catch (error: any) {
    console.error('Get Temple Devotees Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

import ExcelJS from 'exceljs';

export const downloadDevoteesExcel = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner.ownerId;
    const type = req.query.type as string; // 'pooja', 'product', or 'all'
    const dob = req.query.dob as string;
    const anniversary = req.query.anniversary as string;
    const search = (req.query.search as string || "").toLowerCase();

    const temple = await prisma.temple.findUnique({
      where: { id: templeId }
    });

    if (!temple) return res.status(404).json({ success: false, message: 'Temple not found' });

    let poojaDevoteesMap = new Map();
    let productDevoteesMap = new Map();

    if (type !== 'product') {
      const poojaBookings = await prisma.poojaBooking.findMany({
        where: { templeId: temple.id, status: { not: 'PENDING' } },
        include: { user: { select: { id: true, name: true, email: true, phone: true, dob: true, anniversary: true, address: true } } }
      });
      poojaBookings.forEach(booking => {
        if (!booking.user) return;
        if (!poojaDevoteesMap.has(booking.userId)) {
          poojaDevoteesMap.set(booking.userId, { ...booking.user, totalInteractions: 0, totalSpent: 0, type: 'POOJA', lastInteraction: booking.createdAt });
        }
        const devotee = poojaDevoteesMap.get(booking.userId);
        devotee.totalInteractions += 1;
        devotee.totalSpent += booking.packagePrice;
        if (new Date(booking.createdAt) > new Date(devotee.lastInteraction)) devotee.lastInteraction = booking.createdAt;
      });
    }

    if (type !== 'pooja') {
      const productSubOrders = await prisma.subOrder.findMany({
        where: { templeId: temple.id },
        include: { order: { include: { user: { select: { id: true, name: true, email: true, phone: true, dob: true, anniversary: true, address: true } } } } }
      });
      productSubOrders.forEach(subOrder => {
        if (!subOrder.order.user) return;
        if (!productDevoteesMap.has(subOrder.order.userId)) {
          productDevoteesMap.set(subOrder.order.userId, { ...subOrder.order.user, totalInteractions: 0, totalSpent: 0, type: 'PRODUCT', lastInteraction: subOrder.createdAt });
        }
        const devotee = productDevoteesMap.get(subOrder.order.userId);
        devotee.totalInteractions += 1;
        devotee.totalSpent += subOrder.totalAmount;
        if (new Date(subOrder.createdAt) > new Date(devotee.lastInteraction)) devotee.lastInteraction = subOrder.createdAt;
      });
    }

    let poojaList = Array.from(poojaDevoteesMap.values());
    let productList = Array.from(productDevoteesMap.values());

    if (search) {
      poojaList = poojaList.filter(u => (u.name?.toLowerCase() || "").includes(search) || (u.email?.toLowerCase() || "").includes(search) || (u.phone || "").includes(search));
      productList = productList.filter(u => (u.name?.toLowerCase() || "").includes(search) || (u.email?.toLowerCase() || "").includes(search) || (u.phone || "").includes(search));
    }
    if (dob) {
      poojaList = poojaList.filter(u => u.dob === dob);
      productList = productList.filter(u => u.dob === dob);
    }
    if (anniversary) {
      poojaList = poojaList.filter(u => u.anniversary === anniversary);
      productList = productList.filter(u => u.anniversary === anniversary);
    }

    const devoteesList = type === 'pooja' ? poojaList :
      type === 'product' ? productList :
        [...poojaList, ...productList];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Devotees Report');

    worksheet.columns = [
      { header: 'Devotee ID', key: 'id', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Anniversary', key: 'anniversary', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Interactions', key: 'interactions', width: 15 },
      { header: 'Total Spent (₹)', key: 'totalSpent', width: 15 },
      { header: 'Last Activity', key: 'lastActivity', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF794A05' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    devoteesList.forEach((d: any) => {
      worksheet.addRow({
        id: d.id,
        name: d.name || "Anonymous",
        email: d.email || "N/A",
        phone: d.phone || "N/A",
        type: d.type,
        dob: d.dob || "N/A",
        anniversary: d.anniversary || "N/A",
        address: d.address || "N/A",
        interactions: d.totalInteractions,
        totalSpent: d.totalSpent,
        lastActivity: d.lastInteraction ? new Date(d.lastInteraction).toLocaleString() : "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=temple_devotees_${new Date().toISOString().slice(0, 10)}.xlsx`);

    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error("Devotees Export Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDevoteeDetail = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner.ownerId;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: id as string },
      include: {
        bookings: {
          where: {
            templeId,
            status: { not: 'PENDING' }
          },
          include: {
            pooja: { select: { name: true } },
            temple: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          where: {
            subOrders: {
              some: { templeId }
            },
            OR: [
              { paymentMethod: 'COD' },
              { paymentStatus: 'PAID' }
            ]
          },
          include: {
            subOrders: {
              where: { templeId },
              include: {
                items: {
                  include: {
                    product: { select: { name: true } }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        donations: {
          where: {
            templeId,
            status: 'SUCCESS'
          },
          include: {
            temple: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Devotee not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching devotee detail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
