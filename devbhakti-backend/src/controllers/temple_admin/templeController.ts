import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

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
    const poojaIds = data.poojaIds ? JSON.parse(data.poojaIds) : [];
    const inlineEvents = data.inlineEvents ? JSON.parse(data.inlineEvents) : [];

    // Normalize Phone
    if (data.phone) {
      data.phone = normalizePhone(data.phone);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: data.phone,
        role: 'INSTITUTION'
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this phone number already exists' });
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
          }
        }
      });

      return { user, temple };
    });

    res.status(201).json({
      success: true,
      message: 'Temple registration submitted successfully. Please wait for admin approval.',
      data: result
    });
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
    const userId = (req as any).user.userId;

    const temple = await prisma.temple.findUnique({
      where: { userId },
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
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    res.json({ success: true, data: temple });
  } catch (error: any) {
    console.error('Fetch Temple Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMyTempleProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const files = req.files as any;
    const data = req.body;

    const temple = await prisma.temple.findUnique({
      where: { userId }
    });

    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    // Define sensitive fields
    const sensitiveFields = ['name', 'location', 'category', 'fullAddress', 'image', 'heroImages', 'gallery'];
    
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
      description: data.description,
      history: data.history,
      phone: data.phone,
      website: data.website,
      mapUrl: data.mapUrl,
      viewers: data.viewers,
      isLive: data.isLive !== undefined ? (String(data.isLive) === 'true') : undefined,
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
      return res.json({ success: true, data: updatedTemple, message: 'Profile updated successfully' });
    }

    res.json({ success: true, message: 'No changes detected' });
  } catch (error: any) {
    console.error('Update Temple Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
