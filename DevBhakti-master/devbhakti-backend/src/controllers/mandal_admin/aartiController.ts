import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export interface AartiTimingItem {
  id: string;
  name: string;
  time: string;
  isActive?: boolean;
}

/**
 * Helper to parse aartiTimings JSON from DB
 */
const parseAartiTimings = (val: any): AartiTimingItem[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * GET /api/mandal-admin/aarti
 * Get all Aarti Timings for the logged-in Mandal
 */
export const getMyAartiTimings = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId },
      select: { id: true, name: true, aartiTimings: true }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    const timings = parseAartiTimings(mandal.aartiTimings);

    return res.json({
      success: true,
      data: timings
    });
  } catch (error: any) {
    console.error('Error fetching Aarti timings:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * POST /api/mandal-admin/aarti
 * Add a new Aarti Timing
 * Body: { name: string, time: string, isActive?: boolean }
 */
export const createAartiTiming = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { name, time, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Aarti name is required' });
    }

    if (!time || !time.trim()) {
      return res.status(400).json({ success: false, message: 'Aarti time is required' });
    }

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId },
      select: { id: true, aartiTimings: true }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    const existingTimings = parseAartiTimings(mandal.aartiTimings);

    const newAarti: AartiTimingItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      time: time.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };

    const updatedTimings = [...existingTimings, newAarti];

    const updatedMandal = await prisma.mandal.update({
      where: { id: mandalId },
      data: { aartiTimings: updatedTimings as any }
    });

    return res.status(201).json({
      success: true,
      message: 'Aarti timing added successfully',
      data: updatedTimings,
      created: newAarti
    });
  } catch (error: any) {
    console.error('Error adding Aarti timing:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * PUT /api/mandal-admin/aarti/:id
 * Edit an existing Aarti Timing
 * Body: { name?: string, time?: string, isActive?: boolean }
 */
export const updateAartiTiming = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;
    const { name, time, isActive } = req.body;

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId },
      select: { id: true, aartiTimings: true }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    const existingTimings = parseAartiTimings(mandal.aartiTimings);
    const index = existingTimings.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Aarti timing entry not found' });
    }

    if (name !== undefined) existingTimings[index].name = name.trim();
    if (time !== undefined) existingTimings[index].time = time.trim();
    if (isActive !== undefined) existingTimings[index].isActive = Boolean(isActive);

    await prisma.mandal.update({
      where: { id: mandalId },
      data: { aartiTimings: existingTimings as any }
    });

    return res.json({
      success: true,
      message: 'Aarti timing updated successfully',
      data: existingTimings,
      updated: existingTimings[index]
    });
  } catch (error: any) {
    console.error('Error updating Aarti timing:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * PATCH /api/mandal-admin/aarti/:id/toggle
 * Toggle active/inactive status of an Aarti timing
 */
export const toggleAartiStatus = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId },
      select: { id: true, aartiTimings: true }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    const existingTimings = parseAartiTimings(mandal.aartiTimings);
    const index = existingTimings.findIndex(item => item.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Aarti timing entry not found' });
    }

    existingTimings[index].isActive = existingTimings[index].isActive === false ? true : false;

    await prisma.mandal.update({
      where: { id: mandalId },
      data: { aartiTimings: existingTimings as any }
    });

    return res.json({
      success: true,
      message: `Aarti status updated to ${existingTimings[index].isActive ? 'Active' : 'Inactive'}`,
      data: existingTimings
    });
  } catch (error: any) {
    console.error('Error toggling Aarti status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * DELETE /api/mandal-admin/aarti/:id
 * Delete an Aarti Timing
 */
export const deleteAartiTiming = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;

    const mandal = await prisma.mandal.findUnique({
      where: { id: mandalId },
      select: { id: true, aartiTimings: true }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    const existingTimings = parseAartiTimings(mandal.aartiTimings);
    const filteredTimings = existingTimings.filter(item => item.id !== id);

    if (filteredTimings.length === existingTimings.length) {
      return res.status(404).json({ success: false, message: 'Aarti timing entry not found' });
    }

    await prisma.mandal.update({
      where: { id: mandalId },
      data: { aartiTimings: filteredTimings as any }
    });

    return res.json({
      success: true,
      message: 'Aarti timing deleted successfully',
      data: filteredTimings
    });
  } catch (error: any) {
    console.error('Error deleting Aarti timing:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * PUT /api/mandal-admin/aarti
 * Bulk Replace/Save Full Aarti Schedule List
 * Body: { aartiTimings: Array<{ id?: string, name: string, time: string, isActive?: boolean }> }
 */
export const saveBulkAartiSchedule = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { aartiTimings } = req.body;

    if (!Array.isArray(aartiTimings)) {
      return res.status(400).json({ success: false, message: 'aartiTimings must be an array' });
    }

    const formattedList: AartiTimingItem[] = aartiTimings.map((item: any, idx: number) => ({
      id: item.id || (Date.now() + idx).toString(),
      name: String(item.name || '').trim(),
      time: String(item.time || '').trim(),
      isActive: item.isActive !== false
    }));

    await prisma.mandal.update({
      where: { id: mandalId },
      data: { aartiTimings: formattedList as any }
    });

    return res.json({
      success: true,
      message: 'Full Aarti schedule saved successfully',
      data: formattedList
    });
  } catch (error: any) {
    console.error('Error saving bulk Aarti schedule:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * PUBLIC GET /api/mandals/:idOrSlug/aarti-timings
 * Fetch active Aarti timings for a Mandal (for public mobile/web apps)
 */
export const getPublicMandalAartiTimings = async (req: Request, res: Response) => {
  try {
    const idOrSlug = String(req.params.idOrSlug);

    const mandal = await prisma.mandal.findFirst({
      where: {
        id: idOrSlug,
        isActive: true
      },
      select: { id: true, name: true, aartiTimings: true }
    });

    if (!mandal) {
      return res.status(404).json({ success: false, message: 'Mandal not found' });
    }

    const allTimings = parseAartiTimings(mandal.aartiTimings);
    const activeTimings = allTimings.filter(item => item.isActive !== false);

    return res.json({
      success: true,
      data: activeTimings
    });
  } catch (error: any) {
    console.error('Error fetching public Aarti timings:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
