import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, shippingAddress, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

<<<<<<< HEAD
    // 1. Fetch all products to group by templeId or sellerId
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, templeId: true, sellerId: true },
    });

    const productMap = new Map();
    products.forEach((p) => {
      productMap.set(p.id, { templeId: p.templeId, sellerId: p.sellerId });
    });
=======
    // 1. Fetch all products to group by templeId
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, templeId: true },
    });

    const productMap = new Map();
    products.forEach((p) => productMap.set(p.id, p.templeId));
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3

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

<<<<<<< HEAD
    // 3. Group items by templeId or sellerId
    const groups: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const info = productMap.get(item.productId);
      const key = info?.templeId ? `temple_${info.templeId}` : (info?.sellerId ? `seller_${info.sellerId}` : "admin");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // 4. Create SubOrders and OrderItems
    for (const [key, groupItems] of Object.entries(groups)) {
      const subOrderTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      let commissionRate = 10; // Default to 10
      let templeId = null;
      let sellerId = null;

      if (key.startsWith("temple_")) {
        templeId = key.replace("temple_", "");
=======
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
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
        const temple = await prisma.temple.findUnique({
          where: { id: templeId },
          select: { productCommissionRate: true }
        });
<<<<<<< HEAD
        commissionRate = temple?.productCommissionRate ?? 10;
      } else if (key.startsWith("seller_")) {
        sellerId = key.replace("seller_", "");
        const seller = await prisma.sellerProfile.findUnique({
          where: { id: sellerId },
          select: { productCommissionRate: true }
        });
        commissionRate = seller?.productCommissionRate ?? 10;
=======
        commissionRate = temple?.productCommissionRate || 10; // Default to 10 if not found
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
      }

      const commissionAmount = (subOrderTotal * commissionRate) / 100;
      const netEarning = subOrderTotal - commissionAmount;

      const subOrder = await prisma.subOrder.create({
        data: {
          orderId: order.id,
<<<<<<< HEAD
          templeId,
          sellerId,
=======
          templeId: templeId === "admin" ? null : templeId,
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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

<<<<<<< HEAD
      // Create a pending ledger entry (if not admin)
      if (templeId || sellerId) {
        await prisma.templeLedger.create({
          data: {
            templeId,
            sellerId,
=======
      // Create a pending ledger entry for the temple (if not admin)
      if (templeId !== "admin") {
        await prisma.templeLedger.create({
          data: {
            templeId,
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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
<<<<<<< HEAD

=======
    
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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
<<<<<<< HEAD
            },
            seller: {
              select: { name: true }
=======
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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
<<<<<<< HEAD
            temple: true,
            seller: true
=======
            temple: true
>>>>>>> a039abdbf46f6d92de19b9fd663d531b9bf8c5e3
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
