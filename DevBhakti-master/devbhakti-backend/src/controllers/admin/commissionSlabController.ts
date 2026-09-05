import { Request, Response } from 'express';
import { PrismaClient, SlabType, CommissionCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all commission slabs (Global, Temple-specific, Seller-specific)
 */
export const getAllSlabs = async (req: Request, res: Response) => {
  try {
    const { type, targetId, category, isOffline } = req.query;

    const where: any = { isActive: true };

    if (type) {
      where.slabType = type as SlabType;
    }

    if (targetId) {
      where.targetId = targetId as string;
    }

    if (category) {
      where.category = category as CommissionCategory;
    }

    if (isOffline !== undefined) {
      where.isOffline = isOffline === 'true';
    }

    const slabs = await prisma.commissionSlab.findMany({
      where,
      orderBy: { minAmount: 'asc' }
    });

    res.json({
      success: true,
      message: 'Commission slabs fetched successfully',
      data: slabs
    });
  } catch (error: any) {
    console.error('Error fetching slabs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission slabs',
      error: error.message
    });
  }
};

/**
 * Create a new commission slab
 */
export const createSlab = async (req: Request, res: Response) => {
  try {
    const { minAmount, maxAmount, platformFee, percentage, slabType, targetId, category, isOffline } = req.body;

    // Validation
    if (minAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'minAmount is required'
      });
    }

    const slab = await prisma.commissionSlab.create({
      data: {
        minAmount: parseFloat(minAmount) || 0,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        platformFee: platformFee ? parseFloat(platformFee) : 0,
        percentage: percentage ? parseFloat(percentage) : 0,
        slabType: slabType || SlabType.GLOBAL,
        isOffline: isOffline === true || isOffline === 'true',
        targetId: targetId || null,
        category: category || CommissionCategory.MARKETPLACE
      }
    });

    res.status(201).json({
      success: true,
      message: 'Commission slab created successfully',
      data: slab
    });
  } catch (error: any) {
    console.error('Error creating slab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create commission slab',
      error: error.message
    });
  }
};

/**
 * Update an existing commission slab
 */
export const updateSlab = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { minAmount, maxAmount, platformFee, percentage, isActive, isOffline } = req.body;

    const updateData: any = {};

    if (minAmount !== undefined) updateData.minAmount = parseFloat(minAmount);
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount ? parseFloat(maxAmount) : null;
    if (platformFee !== undefined) updateData.platformFee = parseFloat(platformFee);
    if (percentage !== undefined) updateData.percentage = parseFloat(percentage);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isOffline !== undefined) updateData.isOffline = isOffline === true || isOffline === 'true';

    const slab = await prisma.commissionSlab.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Commission slab updated successfully',
      data: slab
    });
  } catch (error: any) {
    console.error('Error updating slab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission slab',
      error: error.message
    });
  }
};

/**
 * Delete a commission slab (soft delete by setting isActive to false)
 */
export const deleteSlab = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const slab = await prisma.commissionSlab.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Commission slab deleted successfully',
      data: slab
    });
  } catch (error: any) {
    console.error('Error deleting slab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete commission slab',
      error: error.message
    });
  }
};

/**
 * Calculate commission for a given amount and vendor
 * This is a utility function that will be used during checkout
 */
export const calculateCommission = async (req: Request, res: Response) => {
  try {
    const { amount, vendorType, vendorId, category, isOffline } = req.body;

    if (!amount || !vendorType) {
      return res.status(400).json({
        success: false,
        message: 'amount and vendorType are required'
      });
    }

    const commission = await getCommissionForAmount(
      parseFloat(amount),
      vendorType as SlabType,
      vendorId,
      category as CommissionCategory,
      isOffline === true || isOffline === 'true'
    );

    res.json({
      success: true,
      message: 'Commission calculated successfully',
      data: commission
    });
  } catch (error: any) {
    console.error('Error calculating commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commission',
      error: error.message
    });
  }
};

/**
 * Helper function to get commission for a specific amount
 * First checks for vendor-specific slabs (matching mode: online vs offline), then falls back to global slabs
 */
export const getCommissionForAmount = async (
  amount: number,
  vendorType: SlabType,
  vendorId?: string,
  category: CommissionCategory = CommissionCategory.MARKETPLACE,
  isOffline: boolean = false
): Promise<{
  platformFee: number;
  percentage: number;
  totalCommission: number;
  slab: any;
}> => {
  let slab = null;

  // First try to find vendor-specific slab with matching isOffline flag
  if (vendorId) {
    slab = await prisma.commissionSlab.findFirst({
      where: {
        slabType: vendorType,
        targetId: vendorId,
        category: category,
        isOffline: isOffline,
        isActive: true,
        minAmount: { lte: amount },
        OR: [
          { maxAmount: { gte: amount } },
          { maxAmount: null }
        ]
      },
      orderBy: { minAmount: 'desc' }
    });
  }

  // If no vendor-specific slab found, fallback to global slab with matching isOffline flag
  if (!slab) {
    slab = await prisma.commissionSlab.findFirst({
      where: {
        slabType: SlabType.GLOBAL,
        category: category,
        isOffline: isOffline,
        isActive: true,
        minAmount: { lte: amount },
        OR: [
          { maxAmount: { gte: amount } },
          { maxAmount: null }
        ]
      },
      orderBy: { minAmount: 'desc' }
    });
  }

  // If still no slab found, return zero commission
  if (!slab) {
    return {
      platformFee: 0,
      percentage: 0,
      totalCommission: 0,
      slab: null
    };
  }

  const percentageAmount = (amount * slab.percentage) / 100;
  const totalCommission = slab.platformFee + percentageAmount;

  return {
    platformFee: slab.platformFee,
    percentage: slab.percentage,
    totalCommission,
    slab
  };
};
