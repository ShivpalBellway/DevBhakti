import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createShiprocketPickupLocation } from '../../services/shiprocketService';
import { parseLocation, extractPincode } from '../../lib/shiprocketUtils';
import bcrypt from 'bcrypt';
import { notifyAdmins } from '../../services/firebaseService';
import { buildLangJson, getEnglish, localize, getLang } from '../../utils/localization';

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
        where: { phone: data.phone, role: 'INSTITUTION' }
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
          name: buildLangJson(data.name_en || data.templeName || 'New Temple', data.name_hi, data.name_mr),
          category: buildLangJson(data.category_en || data.category || 'Sacred', data.category_hi, data.category_mr),
          openTime: data.openTime || '',
          operatingHours: operatingHours,
          description: buildLangJson(data.description_en || data.description || '', data.description_hi, data.description_mr),
          history: buildLangJson(data.history_en || data.history || '', data.history_hi, data.history_mr),
          location: buildLangJson(data.location_en || data.location || '', data.location_hi, data.location_mr),
          fullAddress: buildLangJson(data.fullAddress_en || data.fullAddress || '', data.fullAddress_hi, data.fullAddress_mr),
          phone: data.phone || '',
          website: data.website,
          mapUrl: data.mapUrl,
          viewers: data.viewers,
          rating: parseFloat(data.rating || '0'),
          reviewsCount: parseInt(data.reviewsCount || '0'),
          userId: user.id,
          liveStatus: false,
          image: getFilePath(files, 'image'),
          heroImages: getFilePaths(files, 'heroImages'),
          poojas: {
            connect: poojaIds.map((id: string) => ({ id }))
          },
          events: {
            create: inlineEvents.map((ev: any) => ({
              name: buildLangJson(ev.name_en || ev.name, ev.name_hi, ev.name_mr),
              description: buildLangJson(ev.description_en || ev.description || '', ev.description_hi, ev.description_mr),
              date: ev.date,
            }))
          },
          pickupLocation: buildLangJson(`TEMPLE_${Math.random().toString(36).substring(2, 7).toUpperCase()}`, null, null)
        }
      });

      return { user, temple };
    });

    // Delete the Lead if it exists, since they have successfully registered
    if (data.phone) {
      try {
        await prisma.lead.delete({
          where: { phone: data.phone }
        });
        console.log(`Deleted lead for phone ${data.phone} after successful temple registration.`);
      } catch (leadDeleteErr) {
        // Ignore error if lead doesn't exist
      }
    }

    // 3. Register Pickup Location with Shiprocket
    try {
      const locEn = getEnglish((result.temple as any).location) || data.location || '';
      const addrEn = getEnglish((result.temple as any).fullAddress) || data.fullAddress || '';
      const { city, state } = parseLocation(locEn);
      const pincode = extractPincode(addrEn);

      const pickupData = {
        pickup_location: getEnglish((result.temple as any).pickupLocation),
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: addrEn,
        city: city || 'Delhi',
        state: state || 'Delhi',
        country: 'India',
        pin_code: pincode || '110001'
      };
      await createShiprocketPickupLocation(pickupData);
    } catch (srError) {
      console.error('Shiprocket Pickup sync error:', srError);
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

    // Fetch commission slabs (Custom > Entity Default > Global)
    let commissionSlabs = await prisma.commissionSlab.findMany({
      where: { targetId: temple.id, slabType: 'TEMPLE', isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    if (commissionSlabs.length === 0) {
      commissionSlabs = await prisma.commissionSlab.findMany({
        where: { targetId: null, slabType: 'TEMPLE', isActive: true },
        orderBy: { minAmount: 'asc' }
      });
    }

    if (commissionSlabs.length === 0) {
      commissionSlabs = await prisma.commissionSlab.findMany({
        where: { slabType: 'GLOBAL', isActive: true },
        orderBy: { minAmount: 'asc' }
      });
    }

    console.log("Temple profile fetched successfully");
    const lang = getLang(req);
    res.json({
      success: true,
      data: {
        ...localize(temple, lang),
        commissionSlabs
      }
    });
  } catch (error: any) {
    console.error('Fetch Temple Profile Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

// export const updateMyTempleProfile = async (req: Request, res: Response) => {
//   try {
//     const templeId = (req as any).owner.ownerId;
//     const files = req.files as any;
//     const data = req.body;

//     const temple = await prisma.temple.findUnique({
//       where: { id: templeId },
//       include: { user: true }
//     });

//     if (!temple) {
//       return res.status(404).json({ success: false, message: 'Temple not found' });
//     }

//     // ─── Trustee (Admin User) Info Update ───────────────────────────────────
//     const adminName  = data.adminName  ? String(data.adminName).trim()  : null;
//     const adminEmail = data.adminEmail ? String(data.adminEmail).trim() : null;
//     const adminPhone = data.adminPhone ? String(data.adminPhone).trim() : null;

//     const userUpdatePayload: any = {};
//     let trusteeInfoChanged = false;

//     if (adminName  && adminName  !== temple.user?.name)  { userUpdatePayload.name  = adminName;  trusteeInfoChanged = true; }
//     if (adminEmail && adminEmail !== temple.user?.email) { userUpdatePayload.email = adminEmail; trusteeInfoChanged = true; }
//     if (adminPhone) {
//       const normalizedAdminPhone = normalizePhone(adminPhone);
//       if (normalizedAdminPhone !== temple.user?.phone) {
//         const conflict = await prisma.user.findFirst({
//           where: { phone: normalizedAdminPhone, role: 'INSTITUTION', id: { not: temple.userId } }
//         });
//         if (conflict) {
//           return res.status(400).json({ success: false, message: `Phone ${normalizedAdminPhone} is already registered. Use a different number.` });
//         }
//         userUpdatePayload.phone = normalizedAdminPhone;
//         trusteeInfoChanged = true;
//       }
//     }

//     // Validate Phone if provided
//     if (data.phone) {
//       const cleaned = data.phone.replace(/\D/g, '');
//       // Allow 10 digits OR 12 digits if starting with 91
//       if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
//         return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
//       }
//       data.phone = normalizePhone(data.phone);

//       // Check if phone number is already taken by another user
//       const conflictingUser = await prisma.user.findFirst({
//         where: {
//           phone: data.phone,
//           role: 'INSTITUTION',
//           id: { not: temple.userId }
//         }
//       });

//       if (conflictingUser) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `The user with number ${data.phone} is already with us (Registered as ${conflictingUser.role}). Please use a different number.` 
//         });
//       }

//       // If phone is different from current, it will be added to sensitive changes below
//     }
    
//     // Note: temple.user might not be included in the initial fetch, let's check.
//     // Line 225: const temple = await prisma.temple.findUnique({ where: { id: templeId } }); -> No include.
//     // I should probably fetch with user include to be safe, or just use temple.userId.

//     // Image size validations (2MB for NEW files)
//     const MAX_SIZE = 2 * 1024 * 1024;
//     if (files) {
//       const newHeroImagesCount = files.heroImages ? files.heroImages.length : 0;
//       const currentHeroImagesCount = temple.heroImages ? (temple.heroImages as string[]).length : 0;
//       const totalHeroImages = currentHeroImagesCount + newHeroImagesCount;

//       if (totalHeroImages > 10) {
//         return res.status(400).json({ success: false, message: `Maximum 10 gallery images allowed. You already have ${currentHeroImagesCount} and tried to add ${newHeroImagesCount}.` });
//       }

//       const allFiles = [...(files.image || []), ...(files.heroImages || [])];
//       for (const file of allFiles) {
//         if (file.size > MAX_SIZE) {
//           return res.status(400).json({ success: false, message: `Image ${file.originalname} is too large. Max 2MB allowed.` });
//         }
//       }
//     }

//     // Define sensitive fields
//     const sensitiveFields = [
//       'name_en', 'name_hi', 'name_mr',
//       'location_en', 'location_hi', 'location_mr',
//       'category_en', 'category_hi', 'category_mr',
//       'fullAddress_en', 'fullAddress_hi', 'fullAddress_mr',
//       'phone', 'slug', 'subdomain', 'urlType',
//       'pickupLocation_en', 'pickupLocation_hi', 'pickupLocation_mr',
//       'accountHolderName', 'accountNumber', 'bankName', 'ifscCode', 'upiId'
//     ];

//     // Check if any sensitive field is being updated
//     const updateData: any = {};
//     const sensitiveChanges: any = {};
//     const oldSensitiveData: any = {};
//     let hasSensitiveChanges = false;

//     // Map of fields to their values in req.body
//     const fieldMapping: any = {
//       name_en: data.name_en || data.name,
//       name_hi: data.name_hi,
//       name_mr: data.name_mr,
//       category_en: data.category_en || data.category,
//       category_hi: data.category_hi,
//       category_mr: data.category_mr,
//       location_en: data.location_en || data.location,
//       location_hi: data.location_hi,
//       location_mr: data.location_mr,
//       fullAddress_en: data.fullAddress_en || data.fullAddress,
//       fullAddress_hi: data.fullAddress_hi,
//       fullAddress_mr: data.fullAddress_mr,
//       openTime: data.openTime,
//       operatingHours: data.operatingHours ? (typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours) : undefined,
//       description_en: data.description_en || data.description,
//       description_hi: data.description_hi,
//       description_mr: data.description_mr,
//       history_en: data.history_en || data.history,
//       history_hi: data.history_hi,
//       history_mr: data.history_mr,
//       phone: data.phone,
//       website: data.website,
//       mapUrl: data.mapUrl,
//       viewers: data.viewers,
//       isLive: data.isLive !== undefined ? (String(data.isLive) === 'true') : undefined,
//       liveUrl: data.liveUrl,
//       youtubeLinks: data.youtubeLinks ? JSON.parse(data.youtubeLinks) : undefined,
//       // Technical Identity
//       slug: data.slug,
//       subdomain: data.subdomain,
//       urlType: data.urlType,
//       pickupLocation_en: data.pickupLocation_en || data.pickupLocation,
//       pickupLocation_hi: data.pickupLocation_hi,
//       pickupLocation_mr: data.pickupLocation_mr,
//       // Social Media
//       instagramUrl: data.instagramUrl,
//       facebookUrl: data.facebookUrl,
//       youtubeUrl: data.youtubeUrl,
//       // If user pastes a raw YouTube Channel ID in liveUrl, persist it into channelId as well
//       channelId: data.channelId || (typeof data.liveUrl === 'string' && data.liveUrl.trim().startsWith('UC') ? data.liveUrl.trim() : undefined),
//     };

//     // Handle files (Now Non-Sensitive)
//     const newImage = getFilePath(files, 'image');
//     if (newImage) {
//       updateData['image'] = newImage;
//     }

//     const existingHeroImages = data.existingHeroImages ? JSON.parse(data.existingHeroImages) : (temple.heroImages as string[] || []);
//     const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : [];
//     const currentHeroImages = temple.heroImages as string[] || [];

//     if (newHeroImages.length > 0 || (data.existingHeroImages && existingHeroImages.length !== currentHeroImages.length)) {
//       updateData['heroImages'] = [
//         ...existingHeroImages,
//         ...newHeroImages
//       ];
//     }

//     // News Cuttings Logic
//     const existingNewsCuttings = data.existingNewsCuttings ? JSON.parse(data.existingNewsCuttings) : (temple.newsCuttings as any[] || []);
//     const newNewsCuttingImages = files && files['newsCuttingImages'] ? getFilePaths(files, 'newsCuttingImages') : [];
//     let newNewsCuttingLinks = [];
//     try {
//       newNewsCuttingLinks = data.newsCuttingLinks ? JSON.parse(data.newsCuttingLinks) : [];
//     } catch (e) {
//       newNewsCuttingLinks = [];
//     }

//     const newNewsCuttings = newNewsCuttingImages.map((imgPath: string, index: number) => ({
//       image: imgPath,
//       link: newNewsCuttingLinks[index] || ""
//     }));

//     if (newNewsCuttings.length > 0 || (data.existingNewsCuttings && existingNewsCuttings.length !== (temple.newsCuttings as any[] || []).length)) {
//       updateData['newsCuttings'] = [
//         ...existingNewsCuttings,
//         ...newNewsCuttings
//       ];
//     }

//     // Add trustee changes to sensitiveChanges if any
//     if (trusteeInfoChanged && Object.keys(userUpdatePayload).length > 0) {
//       if (userUpdatePayload.name) {
//         sensitiveChanges.adminName = userUpdatePayload.name;
//         oldSensitiveData.adminName = temple.user?.name;
//       }
//       if (userUpdatePayload.email) {
//         sensitiveChanges.adminEmail = userUpdatePayload.email;
//         oldSensitiveData.adminEmail = temple.user?.email;
//       }
//       if (userUpdatePayload.phone) {
//         sensitiveChanges.adminPhone = userUpdatePayload.phone;
//         oldSensitiveData.adminPhone = temple.user?.phone;
//       }
//       hasSensitiveChanges = true;
//     }

//     // Note: gallery field removed — heroImages now serves as the gallery

//     // Check textual fields
//     for (const key in fieldMapping) {
//       const newValue = fieldMapping[key];
//       if (newValue === undefined) continue;

//       let oldValue: any;
      
//       // Handle localized fields comparison
//       if (key.endsWith('_en') || key.endsWith('_hi') || key.endsWith('_mr')) {
//         const baseKey = key.slice(0, -3); // e.g., 'name'
//         const langCode = key.slice(-2);   // e.g., 'en'
//         oldValue = (temple as any)[baseKey]?.[langCode];
//       } else {
//         oldValue = (temple as any)[key];
//       }

//       if (newValue !== oldValue) {
//         if (sensitiveFields.includes(key)) {
//           sensitiveChanges[key] = newValue;
//           oldSensitiveData[key] = oldValue;
//           hasSensitiveChanges = true;
//         } else {
//           // If it's a localized field not in sensitive list (unlikely based on the list above)
//           if (key.endsWith('_en') || key.endsWith('_hi') || key.endsWith('_mr')) {
//              const baseKey = key.slice(0, -3);
//              const langCode = key.slice(-2);
//              if (!updateData[baseKey]) updateData[baseKey] = { ...(temple as any)[baseKey] };
//              updateData[baseKey][langCode] = newValue;
//           } else {
//             updateData[key] = newValue;
//           }
//         }
//       }
//     }

//     if (hasSensitiveChanges) {
//       // Create a pending update request
//       await prisma.templeUpdateRequest.create({
//         data: {
//           templeId: temple.id,
//           requestedData: sensitiveChanges,
//           oldData: oldSensitiveData,
//           status: 'PENDING'
//         }
//       });

//       // Notify Admins
//       await notifyAdmins({
//         title: "Temple Profile Update",
//         body: `${getEnglish(temple.name) || 'A Temple'} has updated sensitive profile details requiring verification.`,
//         data: {
//           link: '/admin/temples/update-requests',
//           type: 'TEMPLE_UPDATE'
//         }
//       });

//       // Update non-sensitive fields immediately if any
//       if (Object.keys(updateData).length > 0) {
//         await prisma.temple.update({
//           where: { id: temple.id },
//           data: updateData
//         });
//       }

//       return res.json({
//         success: true,
//         message: 'Sensitive fields update request submitted for admin approval. Non-sensitive fields (if any) updated.',
//         pendingApproval: true
//       });
//     }

//     // If no sensitive changes, update everything directly
//     if (Object.keys(updateData).length > 0) {
//       const updatedTemple = await prisma.temple.update({
//         where: { id: temple.id },
//         data: updateData
//       });

//       // Sync with Shiprocket if address or location changed
//       if (updateData.fullAddress || updateData.location || updateData.phone) {
//         try {
//           const locEn = getEnglish(updateData.location) || getEnglish(temple.location) || '';
//           const addrEn = getEnglish(updateData.fullAddress) || getEnglish(temple.fullAddress) || '';
//           const { city, state } = parseLocation(locEn);
//           const pincode = extractPincode(addrEn);

//           const pickupData = {
//             pickup_location: getEnglish(temple.pickupLocation),
//             name: getEnglish(temple.name),
//             email: (temple as any).user?.email || '',
//             phone: updateData.phone || temple.phone,
//             address: addrEn,
//             city: city || 'Delhi',
//             state: state || 'Delhi',
//             country: 'India',
//             pin_code: pincode || '110001'
//           };
//           await createShiprocketPickupLocation(pickupData);
//         } catch (srError) {
//           console.error('Shiprocket update sync error:', srError);
//         }
//       }

//       return res.json({ success: true, data: updatedTemple, message: 'Profile updated successfully' });
//     }

//     // If only trustee info was changed (now pending), handled above
//     res.json({ success: true, message: 'No changes detected' });
//   } catch (error: any) {
//     console.error('Update Temple Profile Error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
export const updateMyTempleProfile = async (req: Request, res: Response) => {
  try {
    const templeId = (req as any).owner.ownerId;
    const files = req.files as any;
    const data = req.body;

    console.log('📝 Update request received for temple:', templeId);

    const temple = await prisma.temple.findUnique({
      where: { id: templeId },
      include: { user: true }
    });

    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    // ─── Trustee (Admin User) Info Update ───────────────────────────────────
    const adminName = data.adminName ? String(data.adminName).trim() : null;
    const adminEmail = data.adminEmail ? String(data.adminEmail).trim() : null;
    const adminPhone = data.adminPhone ? String(data.adminPhone).trim() : null;

    const userUpdatePayload: any = {};
    let trusteeInfoChanged = false;

    if (adminName && adminName !== temple.user?.name) {
      userUpdatePayload.name = adminName;
      trusteeInfoChanged = true;
    }
    if (adminEmail && adminEmail !== temple.user?.email) {
      userUpdatePayload.email = adminEmail;
      trusteeInfoChanged = true;
    }
    if (adminPhone) {
      const normalizedAdminPhone = normalizePhone(adminPhone);
      if (normalizedAdminPhone !== temple.user?.phone) {
        const conflict = await prisma.user.findFirst({
          where: { phone: normalizedAdminPhone, role: 'INSTITUTION', id: { not: temple.userId } }
        });
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Phone ${normalizedAdminPhone} is already registered. Use a different number.`
          });
        }
        userUpdatePayload.phone = normalizedAdminPhone;
        trusteeInfoChanged = true;
      }
    }

    // Validate Phone if provided
    if (data.phone) {
      const cleaned = data.phone.replace(/\D/g, '');
      if (!(cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91')))) {
        return res.status(400).json({ success: false, message: 'Invalid phone number. Use 10 digits or include 91 prefix.' });
      }
      data.phone = normalizePhone(data.phone);
    }

    // ─── Image validations ──────────────────────────────────────────────────
    const MAX_SIZE = 2 * 1024 * 1024;
    if (files) {
      const newHeroImagesCount = files.heroImages ? files.heroImages.length : 0;
      const currentHeroImagesCount = temple.heroImages ? (temple.heroImages as string[]).length : 0;
      const totalHeroImages = currentHeroImagesCount + newHeroImagesCount;

      if (totalHeroImages > 10) {
        return res.status(400).json({
          success: false,
          message: `Maximum 10 gallery images allowed. You already have ${currentHeroImagesCount} and tried to add ${newHeroImagesCount}.`
        });
      }

      const allFiles = [...(files.image || []), ...(files.heroImages || [])];
      for (const file of allFiles) {
        if (file.size > MAX_SIZE) {
          return res.status(400).json({
            success: false,
            message: `Image ${file.originalname} is too large. Max 2MB allowed.`
          });
        }
      }
    }

    // ─── Define sensitive fields ────────────────────────────────────────────
    // Only truly critical fields (bank details, official contact phone, domain routing) require admin approval.
    // Routine profile info (name, location, category, address, description, gallery, news cuttings) updates directly.
    const sensitiveFields = [
      'phone', 'slug', 'subdomain', 'urlType',
      'accountHolderName', 'accountNumber', 'bankName', 'ifscCode', 'upiId'
    ];

    const updateData: any = {};
    const sensitiveChanges: any = {};
    const oldSensitiveData: any = {};
    let hasSensitiveChanges = false;

    // ─── Field mapping ──────────────────────────────────────────────────────
    const fieldMapping: any = {
      name_en: data.name_en || data.name,
      name_hi: data.name_hi,
      name_mr: data.name_mr,
      category_en: data.category_en || data.category,
      category_hi: data.category_hi,
      category_mr: data.category_mr,
      location_en: data.location_en || data.location,
      location_hi: data.location_hi,
      location_mr: data.location_mr,
      fullAddress_en: data.fullAddress_en || data.fullAddress,
      fullAddress_hi: data.fullAddress_hi,
      fullAddress_mr: data.fullAddress_mr,
      openTime: data.openTime,
      operatingHours: data.operatingHours ? (typeof data.operatingHours === 'string' ? JSON.parse(data.operatingHours) : data.operatingHours) : undefined,
      description_en: data.description_en || data.description,
      description_hi: data.description_hi,
      description_mr: data.description_mr,
      history_en: data.history_en || data.history,
      history_hi: data.history_hi,
      history_mr: data.history_mr,
      phone: data.phone,
      website: data.website,
      mapUrl: data.mapUrl,
      viewers: data.viewers,
      isLive: data.isLive !== undefined ? (String(data.isLive) === 'true') : undefined,
      liveUrl: data.liveUrl,
      youtubeLinks: data.youtubeLinks ? (typeof data.youtubeLinks === 'string' ? JSON.parse(data.youtubeLinks) : data.youtubeLinks) : undefined,
      slug: data.slug,
      subdomain: data.subdomain,
      urlType: data.urlType,
      pickupLocation_en: data.pickupLocation_en || data.pickupLocation,
      pickupLocation_hi: data.pickupLocation_hi,
      pickupLocation_mr: data.pickupLocation_mr,
      channelId: data.channelId || (typeof data.liveUrl === 'string' && data.liveUrl.trim().startsWith('UC') ? data.liveUrl.trim() : undefined),
      prasadPrice: data.prasadPrice !== undefined ? (parseFloat(data.prasadPrice) || 0) : undefined,
    };

    // ─── Social Media URLs ──────────────────────────────────────────────────
    updateData['instagramUrl'] = getSingleString(data.instagramUrl);
    updateData['facebookUrl'] = getSingleString(data.facebookUrl);
    updateData['youtubeUrl'] = getSingleString(data.youtubeUrl);

    // ─── NEWS CUTTINGS - FIXED ─────────────────────────────────────────────
    try {
      // Get existing news cuttings
      let existingNewsCuttings: any[] = [];
      
      if (data.existingNewsCuttings) {
        try {
          const parsed = typeof data.existingNewsCuttings === 'string' 
            ? JSON.parse(data.existingNewsCuttings) 
            : data.existingNewsCuttings;
          existingNewsCuttings = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          existingNewsCuttings = [];
        }
      }

      // Get new news cutting images
      const newNewsCuttingImages = files && files['newsCuttingImages'] 
        ? files['newsCuttingImages'].map((f: any) => `/uploads/temples/${f.filename}`)
        : [];

      // Get links for new news cuttings
      let newNewsCuttingLinks: string[] = [];
      if (data.newsCuttingLinks) {
        try {
          const parsed = typeof data.newsCuttingLinks === 'string' 
            ? JSON.parse(data.newsCuttingLinks) 
            : data.newsCuttingLinks;
          newNewsCuttingLinks = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          newNewsCuttingLinks = [];
        }
      }

      // Create new news cuttings
      const newNewsCuttings = newNewsCuttingImages.map((imgPath: string, index: number) => ({
        image: imgPath,
        link: newNewsCuttingLinks[index] || ""
      }));

      // Combine existing and new
      let allNewsCuttings = [...existingNewsCuttings, ...newNewsCuttings];

      // Clean up - ensure proper format
      allNewsCuttings = allNewsCuttings
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          image: item.image || "",
          link: item.link || ""
        }));

      // ONLY add to updateData if there are news cuttings
      if (allNewsCuttings.length > 0) {
        updateData['newsCuttings'] = allNewsCuttings;
      } else {
        // If no news cuttings, set to empty array
        updateData['newsCuttings'] = [];
      }

      console.log('✅ News Cuttings processed:', {
        existingCount: existingNewsCuttings.length,
        newImages: newNewsCuttingImages.length,
        newLinks: newNewsCuttingLinks.length,
        total: allNewsCuttings.length
      });

    } catch (newsError) {
      console.error('❌ Error processing news cuttings:', newsError);
      // Set empty array as fallback
      updateData['newsCuttings'] = [];
    }

    // ─── Handle Files ──────────────────────────────────────────────────────
    const newImage = getFilePath(files, 'image');
    if (newImage) {
      updateData['image'] = newImage;
    }

    const existingHeroImages = data.existingHeroImages ? JSON.parse(data.existingHeroImages) : (temple.heroImages as string[] || []);
    const newHeroImages = files && files['heroImages'] ? getFilePaths(files, 'heroImages') : [];
    const currentHeroImages = temple.heroImages as string[] || [];

    if (newHeroImages.length > 0 || (data.existingHeroImages && existingHeroImages.length !== currentHeroImages.length)) {
      updateData['heroImages'] = [
        ...existingHeroImages,
        ...newHeroImages
      ];
    }

    // ─── Check for changes ──────────────────────────────────────────────────
    // Normalize: treat null, undefined, and "" as the same (no value)
    const norm = (v: any): string => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'boolean') return String(v);
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    };

    for (const key in fieldMapping) {
      const newValue = fieldMapping[key];
      if (newValue === undefined) continue;

      let oldValue: any;

      if (key.endsWith('_en') || key.endsWith('_hi') || key.endsWith('_mr')) {
        const baseKey = key.slice(0, -3);
        const langCode = key.slice(-2);
        const langObj = getLangObject((temple as any)[baseKey]);
        oldValue = langObj[langCode];
      } else {
        oldValue = (temple as any)[key];
      }

      // Only proceed if there is a real change (normalized comparison)
      if (norm(newValue) !== norm(oldValue)) {
        if (sensitiveFields.includes(key)) {
          sensitiveChanges[key] = newValue;
          oldSensitiveData[key] = oldValue;
          hasSensitiveChanges = true;
        } else {
          if (key.endsWith('_en') || key.endsWith('_hi') || key.endsWith('_mr')) {
            const baseKey = key.slice(0, -3);
            const langCode = key.slice(-2);
            if (!updateData[baseKey]) {
              updateData[baseKey] = getLangObject((temple as any)[baseKey]);
            }
            updateData[baseKey][langCode] = newValue || null;
          } else {
            updateData[key] = newValue;
          }
        }
      }
    }

    // Add trustee changes
    if (trusteeInfoChanged && Object.keys(userUpdatePayload).length > 0) {
      if (userUpdatePayload.name) {
        sensitiveChanges.adminName = userUpdatePayload.name;
        oldSensitiveData.adminName = temple.user?.name;
      }
      if (userUpdatePayload.email) {
        sensitiveChanges.adminEmail = userUpdatePayload.email;
        oldSensitiveData.adminEmail = temple.user?.email;
      }
      if (userUpdatePayload.phone) {
        sensitiveChanges.adminPhone = userUpdatePayload.phone;
        oldSensitiveData.adminPhone = temple.user?.phone;
      }
      hasSensitiveChanges = true;
    }

    console.log('📝 Final updateData keys:', Object.keys(updateData));

    // ─── Apply Updates ──────────────────────────────────────────────────────
    if (hasSensitiveChanges) {
      await prisma.templeUpdateRequest.create({
        data: {
          templeId: temple.id,
          requestedData: sensitiveChanges,
          oldData: oldSensitiveData,
          status: 'PENDING'
        }
      });

      await notifyAdmins({
        title: "Temple Profile Update",
        body: `${getEnglish(temple.name) || 'A Temple'} has updated sensitive profile details requiring verification.`,
        data: {
          link: '/admin/temples/update-requests',
          type: 'TEMPLE_UPDATE'
        }
      });

      if (Object.keys(updateData).length > 0) {
        await prisma.temple.update({
          where: { id: temple.id },
          data: updateData
        });
      }

      return res.json({
        success: true,
        message: 'Sensitive fields update request submitted for admin approval.',
        pendingApproval: true
      });
    }

    if (Object.keys(updateData).length > 0) {
      console.log('🔄 Updating temple with data keys:', Object.keys(updateData));
      
      const updatedTemple = await prisma.temple.update({
        where: { id: temple.id },
        data: updateData
      });

      // Sync with Shiprocket
      if (updateData.fullAddress || updateData.location || updateData.phone) {
        try {
          const locEn = getEnglish(updateData.location) || getEnglish(temple.location) || '';
          const addrEn = getEnglish(updateData.fullAddress) || getEnglish(temple.fullAddress) || '';
          const { city, state } = parseLocation(locEn);
          const pincode = extractPincode(addrEn);

          const pickupData = {
            pickup_location: getEnglish(temple.pickupLocation),
            name: getEnglish(temple.name),
            email: (temple as any).user?.email || '',
            phone: updateData.phone || temple.phone,
            address: addrEn,
            city: city || 'Delhi',
            state: state || 'Delhi',
            country: 'India',
            pin_code: pincode || '110001'
          };
          await createShiprocketPickupLocation(pickupData);
        } catch (srError) {
          console.error('Shiprocket update sync error:', srError);
        }
      }

      return res.json({ success: true, data: updatedTemple, message: 'Profile updated successfully' });
    }

    res.json({ success: true, message: 'No changes detected' });
  } catch (error: any) {
    console.error('❌ Update Temple Profile Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    
    
    // Check if it's a Prisma validation error
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Data validation error. Please check the data format.',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
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

    // Process Lists
    const poojaDevoteesMap = new Map();
    const productDevoteesMap = new Map();
    const allDevoteesMap = new Map();
    
    // Process Pooja Bookers
    poojaBookings.forEach(booking => {
        if (!booking.user) return;
        const userId = booking.userId;
        
        // Individual list
        if (!poojaDevoteesMap.has(userId)) {
            poojaDevoteesMap.set(userId, {
                ...booking.user,
                lastInteraction: booking.createdAt,
                totalInteractions: 0,
                totalSpent: 0,
                type: 'POOJA'
            });
        }
        const pDevotee = poojaDevoteesMap.get(userId);
        pDevotee.totalInteractions += 1;
        pDevotee.totalSpent += booking.packagePrice;
        if (new Date(booking.createdAt) > new Date(pDevotee.lastInteraction)) {
            pDevotee.lastInteraction = booking.createdAt;
        }

        // All list
        if (!allDevoteesMap.has(userId)) {
            allDevoteesMap.set(userId, {
                ...booking.user,
                lastInteraction: booking.createdAt,
                totalInteractions: 0,
                totalSpent: 0,
                type: 'POOJA'
            });
        }
        const aDevotee = allDevoteesMap.get(userId);
        aDevotee.totalInteractions += 1;
        aDevotee.totalSpent += booking.packagePrice;
        if (new Date(booking.createdAt) > new Date(aDevotee.lastInteraction)) {
            aDevotee.lastInteraction = booking.createdAt;
        }
    });

    // Process Product Customers
    productSubOrders.forEach(subOrder => {
        if (!subOrder.order.user) return;
        const userId = subOrder.order.userId;

        // Individual list
        if (!productDevoteesMap.has(userId)) {
            productDevoteesMap.set(userId, {
                ...subOrder.order.user,
                lastInteraction: subOrder.createdAt,
                totalInteractions: 0,
                totalSpent: 0,
                type: 'PRODUCT'
            });
        }
        const prDevotee = productDevoteesMap.get(userId);
        prDevotee.totalInteractions += 1;
        prDevotee.totalSpent += subOrder.totalAmount;
        if (new Date(subOrder.createdAt) > new Date(prDevotee.lastInteraction)) {
            prDevotee.lastInteraction = subOrder.createdAt;
        }

        // All list
        if (!allDevoteesMap.has(userId)) {
            allDevoteesMap.set(userId, {
                ...subOrder.order.user,
                lastInteraction: subOrder.createdAt,
                totalInteractions: 0,
                totalSpent: 0,
                type: 'PRODUCT'
            });
        } else {
            const aDevotee = allDevoteesMap.get(userId);
            aDevotee.type = 'BOTH';
        }
        const aDevotee = allDevoteesMap.get(userId);
        aDevotee.totalInteractions += 1;
        aDevotee.totalSpent += subOrder.totalAmount;
        if (new Date(subOrder.createdAt) > new Date(aDevotee.lastInteraction)) {
            aDevotee.lastInteraction = subOrder.createdAt;
        }
    });

    const querySearch = (req.query.search as string || "").toLowerCase();
    const dobStart = req.query.dobStart as string;
    const dobEnd = req.query.dobEnd as string;
    const anniversaryStart = req.query.anniversaryStart as string;
    const anniversaryEnd = req.query.anniversaryEnd as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    let poojaBookers = Array.from(poojaDevoteesMap.values());
    let productCustomers = Array.from(productDevoteesMap.values());
    let allDevotees = Array.from(allDevoteesMap.values());

    // Date Range Helper (handles YYYY-MM-DD or MM-DD for recurring dates)
    const isDateInRange = (dateStr: string | null, start: string, end: string) => {
        if (!dateStr || !start || !end) return true;
        // If it's a birthday/anniversary, we often care about MM-DD
        // But if a range is provided like 2024-01-01 to 2024-01-31, we can match exactly
        const date = new Date(dateStr);
        const s = new Date(start);
        const e = new Date(end);
        return date >= s && date <= e;
    };

    // Search and Filter helper
    const filterList = (list: any[]) => {
        let filtered = list;
        if (querySearch) {
            filtered = filtered.filter(user =>
                (user.name?.toLowerCase() || "").includes(querySearch) ||
                (user.email?.toLowerCase() || "").includes(querySearch) ||
                (user.phone || "").includes(querySearch)
            );
        }
        
        if (dobStart && dobEnd) {
            filtered = filtered.filter(u => isDateInRange(u.dob, dobStart, dobEnd));
        }
        if (anniversaryStart && anniversaryEnd) {
            filtered = filtered.filter(u => isDateInRange(u.anniversary, anniversaryStart, anniversaryEnd));
        }
        
        return filtered;
    };

    poojaBookers = filterList(poojaBookers);
    productCustomers = filterList(productCustomers);
    allDevotees = filterList(allDevotees);

    // Sort by recent activity helper
    const sortByRecent = (a: any, b: any) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime();
    poojaBookers.sort(sortByRecent);
    productCustomers.sort(sortByRecent);
    allDevotees.sort(sortByRecent);

    // Total counts after filtering
    const poojaTotal = poojaBookers.length;
    const productTotal = productCustomers.length;
    const allTotal = allDevotees.length;

    // Apply Pagination
    poojaBookers = poojaBookers.slice((page - 1) * limit, page * limit);
    productCustomers = productCustomers.slice((page - 1) * limit, page * limit);
    allDevotees = allDevotees.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        poojaBookers,
        productCustomers,
        allDevotees,
        stats: {
          totalDevotees: allDevoteesMap.size,
          poojaBookersCount: poojaTotal,
          productCustomersCount: productTotal,
          allDevoteesCount: allTotal
        },
        pagination: {
          page,
          limit,
          poojaTotalPages: Math.ceil(poojaTotal / limit),
          productTotalPages: Math.ceil(productTotal / limit),
          allTotalPages: Math.ceil(allTotal / limit)
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
    const dobStart = req.query.dobStart as string;
    const dobEnd = req.query.dobEnd as string;
    const anniversaryStart = req.query.anniversaryStart as string;
    const anniversaryEnd = req.query.anniversaryEnd as string;
    const search = (req.query.search as string || "").toLowerCase();

    // Date Range Helper
    const isDateInRange = (dateStr: string | null, start: string, end: string) => {
        if (!dateStr || !start || !end) return true;
        const date = new Date(dateStr);
        const s = new Date(start);
        const e = new Date(end);
        return date >= s && date <= e;
    };

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
    
    if (dobStart && dobEnd) {
      poojaList = poojaList.filter(u => isDateInRange(u.dob, dobStart, dobEnd));
      productList = productList.filter(u => isDateInRange(u.dob, dobStart, dobEnd));
    }
    if (anniversaryStart && anniversaryEnd) {
      poojaList = poojaList.filter(u => isDateInRange(u.anniversary, anniversaryStart, anniversaryEnd));
      productList = productList.filter(u => isDateInRange(u.anniversary, anniversaryStart, anniversaryEnd));
    }

    let devoteesList: any[] = [];
    if (type === 'pooja') {
        devoteesList = poojaList;
    } else if (type === 'product') {
        devoteesList = productList;
    } else {
        // Merge both lists for 'all'
        const mergedMap = new Map();
        poojaList.forEach(u => mergedMap.set(u.id, { ...u }));
        productList.forEach(u => {
            if (mergedMap.has(u.id)) {
                const existing = mergedMap.get(u.id);
                existing.totalInteractions += u.totalInteractions;
                existing.totalSpent += u.totalSpent;
                existing.type = 'BOTH';
                if (new Date(u.lastInteraction) > new Date(existing.lastInteraction)) {
                    existing.lastInteraction = u.lastInteraction;
                }
            } else {
                mergedMap.set(u.id, { ...u });
            }
        });
        devoteesList = Array.from(mergedMap.values());
    }
    
    // Sort merged list
    devoteesList.sort((a: any, b: any) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime());

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

    const lang = getLang(req);
    res.json({
      success: true,
      data: localize(user, lang)
    });
  } catch (error: any) {
    console.error('Error fetching devotee detail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
