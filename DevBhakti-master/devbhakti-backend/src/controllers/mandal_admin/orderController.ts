import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { syncOrderAndLedgerStatus } from "../../utils/orderStatusSync";
import { getLang, localize } from "../../utils/localization";

// Get orders specifically for a Mandal
export const getMandalOrders = async (req: Request, res: Response) => {
  try {
    const mandalId = req.params.mandalId as string;

    const subOrders = await prisma.subOrder.findMany({
      where: { mandalId },
      include: {
        order: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        items: {
          include: {
            product: { select: { name: true, image: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const lang = getLang(req);
    const localizedSubOrders = localize(subOrders, lang);

    const formattedSubOrders = localizedSubOrders.map((sub: any) => {
      return {
        ...sub,
        totalAmount: sub.totalAmount ? Number(sub.totalAmount) : 0,
        order: sub.order ? {
          ...sub.order,
          totalAmount: sub.order.totalAmount ? Number(sub.order.totalAmount) : 0
        } : sub.order
      };
    });

    return res.status(200).json({ success: true, data: formattedSubOrders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mandal updates their own sub-order status
export const updateMandalOrderStatus = async (req: Request, res: Response) => {
  try {
    const subOrderId = req.params.subOrderId as string;
    const { status, shippingLabel, mandalId } = req.body;

    // Verify this sub-order belongs to the mandal
    const existing = await prisma.subOrder.findUnique({
      where: { id: subOrderId }
    });

    if (!existing || existing.mandalId !== mandalId) {
      return res.status(403).json({ success: false, message: "Unauthorized or order not found" });
    }

    // Optional: Update shippingLabel if provided
    if (shippingLabel) {
      await prisma.subOrder.update({
        where: { id: subOrderId },
        data: { shippingLabel }
      });
    }

    // Use shared utility for status sync (Ledger, Parent Order, etc.)
    const updated = await syncOrderAndLedgerStatus(subOrderId, status);

    const lang = getLang(req);
    return res.status(200).json({ success: true, message: "Order status updated", data: localize(updated, lang) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mandal creates offline product order
export const createOfflineMandalOrder = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { items, customerName, customerPhone, customerEmail, customerAddress, paymentMethod, adminNotes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required" });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: "Customer name and phone are required" });
    }

    // Normalize phone to prevent duplicate users with same number in different formats
    // e.g. "+91 9977132450", "91 9977132450", "+919977132450" → "+919977132450"
    let cleanedPhone = String(customerPhone || '').replace(/\D/g, '');
    if (cleanedPhone.startsWith('00')) cleanedPhone = cleanedPhone.substring(2);
    if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.substring(1);
    if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;
    const normalizedPhone = '+' + cleanedPhone;

    // Find user by any known format of the same number
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: customerPhone },
          { phone: cleanedPhone },
        ],
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: customerName,
          email: customerEmail || undefined,
          role: "DEVOTEE"
        }
      });
    }

    let grandTotal = 0;
    const itemData: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true }
      });

      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      const price = item.price || (variant ? Number(variant.price) : 0);
      const qty = parseInt(item.quantity, 10) || 1;

      grandTotal += price * qty;

      const variantName = variant ? (typeof variant.name === 'string' ? variant.name : JSON.stringify(variant.name)) : "Default";

      itemData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        variantName: variantName,
        quantity: qty,
        price: price
      });

      // Update variant stock if variant exists
      if (variant) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: qty } }
        });
      }
    }

    // Create Order and SubOrder
    const displayId = `ORD-OFF-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        displayId,
        userId: user.id,
        totalAmount: grandTotal,
        status: "DELIVERED", // Offline orders are fulfilled immediately
        paymentStatus: "PAID",
        paymentMethod: paymentMethod || "CASH",
        shippingAddress: customerAddress ? { address: customerAddress, notes: adminNotes } : undefined,
        subOrders: {
          create: {
            mandalId,
            status: "DELIVERED",
            totalAmount: grandTotal,
            items: {
              create: itemData
            }
          }
        }
      },
      include: {
        subOrders: {
          include: {
            items: {
              include: { product: true }
            }
          }
        }
      }
    });

    return res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    console.error("Create Offline Mandal Order Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create offline order" });
  }
};

