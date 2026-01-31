import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, shippingAddress, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 1. Fetch all products to group by templeId
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, templeId: true },
    });

    const productMap = new Map();
    products.forEach((p) => productMap.set(p.id, p.templeId));

    // 2. Create Master Order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod,
        shippingAddress,
        status: "PENDING",
        paymentStatus: "PENDING", // Since we are using static success for now
      },
    });

    // 3. Group items by templeId
    const groups: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const templeId = productMap.get(item.productId) || "admin"; // Use "admin" as key for null
      if (!groups[templeId]) groups[templeId] = [];
      groups[templeId].push(item);
    });

    // 4. Create SubOrders and OrderItems
    for (const [templeId, groupItems] of Object.entries(groups)) {
      const subOrderTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      let commissionRate = 0;
      if (templeId !== "admin") {
        const temple = await prisma.temple.findUnique({
          where: { id: templeId },
          select: { productCommissionRate: true }
        });
        commissionRate = temple?.productCommissionRate || 10; // Default to 10 if not found
      }

      const commissionAmount = (subOrderTotal * commissionRate) / 100;
      const netEarning = subOrderTotal - commissionAmount;

      const subOrder = await prisma.subOrder.create({
        data: {
          orderId: order.id,
          templeId: templeId === "admin" ? null : templeId,
          totalAmount: subOrderTotal,
          commissionAmount,
          netEarning,
          status: "PENDING",
          items: {
            create: groupItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              variantName: item.variantName,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
      });

      // Create a pending ledger entry for the temple (if not admin)
      if (templeId !== "admin") {
        await prisma.templeLedger.create({
          data: {
            templeId,
            amount: netEarning,
            grossAmount: subOrderTotal,
            commission: commissionAmount,
            type: "MARKETPLACE_EARNING",
            sourceId: subOrder.id,
            description: `Earning from Order #${order.id.slice(-6).toUpperCase()}`,
            status: "PENDING"
          }
        });
      }

      // 5. Update Stock (Optional but recommended)
      for (const item of groupItems) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      details: error.message,
    });
  }
};

export const getMyOrders = async (req: any, res: Response) => {
  try {
    const userId = (req.user?.userId || req.params.userId) as string;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        subOrders: {
          include: {
            items: {
              include: {
                product: {
                  select: { name: true, image: true }
                }
              }
            },
            temple: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        subOrders: {
          include: {
            items: {
              include: {
                product: true
              }
            },
            temple: true
          }
        },
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
