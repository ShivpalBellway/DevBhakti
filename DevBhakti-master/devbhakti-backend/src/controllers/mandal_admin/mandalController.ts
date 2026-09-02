import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildLangJson, getLang, localize } from '../../utils/localization';

const getFilePath = (files: any, fieldName: string) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    return `/uploads/mandals/${files[fieldName][0].filename}`;
  }
  return null;
};

const getFilePaths = (files: any, fieldName: string) => {
  if (files && files[fieldName]) {
    return files[fieldName].map((f: any) => `/uploads/mandals/${f.filename}`);
  }
  return [];
};

export const getMyMandalProfile = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal record not found.' });
    }

    const lang = getLang(req);
    res.json({ success: true, data: localize(mandal, lang) });
  } catch (error: any) {
    console.error('Fetch Mandal Profile Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const updateMyMandalProfile = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const files = req.files as any;
    const data = req.body;

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    // Safely parse JSON or objects
    const parseJson = (val: any) => {
      if (!val) return undefined;
      if (typeof val !== 'string') return val;
      try { return JSON.parse(val); } catch (e) { return val; }
    };

    // Images update
    const mainImage = getFilePath(files, 'image') || data.image;
    const newHeroImages = getFilePaths(files, 'heroImages');
    let existingBannerImages = [];
    if (data.existingBannerImages) {
      try {
        existingBannerImages = typeof data.existingBannerImages === 'string' 
          ? JSON.parse(data.existingBannerImages) 
          : data.existingBannerImages;
      } catch (e) {
        existingBannerImages = mandal.bannerImages;
      }
    } else {
      existingBannerImages = mandal.bannerImages;
    }

    const updatedBannerImages = [...existingBannerImages, ...newHeroImages];

    const updatedMandal = await prisma.mandal.update({
      where: { id: mandalId },
      data: {
        name: buildLangJson(data.name || data.name_en, data.name_hi, data.name_mr),
        description: buildLangJson(data.description_en || data.description || '', data.description_hi, data.description_mr),
        about: data.about ? buildLangJson(data.about_en || data.about || '', data.about_hi, data.about_mr) : undefined,
        mandalType: data.mandalType || undefined,
        establishedYear: data.establishedYear || undefined,
        presiding_deity: data.presiding_deity || undefined,
        festivals: data.festivals || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        pinCode: data.pinCode || undefined,
        mapUrl: data.mapUrl || undefined,
        email: data.email || undefined,
        presidentName: data.presidentName || undefined,
        // Media
        image: mainImage || undefined,
        bannerImages: updatedBannerImages,
        // Live Darshan fields
        liveUrl: data.liveUrl || undefined,
        channelId: data.channelId || undefined,
        liveStatus: data.liveStatus !== undefined ? (data.liveStatus === 'true' || data.liveStatus === true) : undefined,
        isLive: data.isLive !== undefined ? (data.isLive === 'true' || data.isLive === true) : undefined,
        isPrimaryLive: data.isPrimaryLive !== undefined ? (data.isPrimaryLive === 'true' || data.isPrimaryLive === true) : undefined,
        // Social links
        instagramUrl: data.instagramUrl !== undefined ? data.instagramUrl : undefined,
        facebookUrl: data.facebookUrl !== undefined ? data.facebookUrl : undefined,
        youtubeUrl: data.youtubeUrl !== undefined ? data.youtubeUrl : undefined
      }
    });

    res.json({ success: true, message: 'Mandal profile updated successfully', data: updatedMandal });
  } catch (error: any) {
    console.error('Update Mandal Profile Error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};
