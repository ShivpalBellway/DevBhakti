import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all orders for Admin
export const getAllOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, phone: true } },
        subOrders: {
          include: {
            temple: { select: { name: true } },
            items: { include: { product: { select: { name: true, image: true } } } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update SubOrder status (Admin can update any, but mainly for null templeId)
export const updateSubOrderStatusAdmin = async (req: Request, res: Response) => {
  try {
    const subOrderId = req.params.subOrderId as string;
    const { status, shippingLabel } = req.body;

    const subOrder = await prisma.subOrder.update({
      where: { id: subOrderId },
      data: { 
        status, 
        shippingLabel,
        updatedAt: new Date()
      }
    });

    // Sync Ledger Status
    if (status === "DELIVERED") {
      await prisma.templeLedger.updateMany({
        where: { sourceId: subOrderId, type: "MARKETPLACE_EARNING" },
        data: { status: "COMPLETED" }
      });
    } else if (status === "CANCELLED") {
      await prisma.templeLedger.updateMany({
        where: { sourceId: subOrderId, type: "MARKETPLACE_EARNING" },
        data: { status: "CANCELLED" }
      });
    }

    // Check if all sub-orders of the parent order are delivered/completed
    const parentOrder = await prisma.order.findUnique({
      where: { id: subOrder.orderId },
      include: { subOrders: true }
    });

    if (parentOrder) {
      const allDone = parentOrder.subOrders.every(so => so.status === "DELIVERED");
      if (allDone) {
        await prisma.order.update({
          where: { id: parentOrder.id },
          data: { status: "COMPLETED" }
        });
      } else {
        // If at least one is shipped, parent could be SHIPPED
        const anyShipped = parentOrder.subOrders.some(so => so.status === "SHIPPED");
        if (anyShipped) {
          await prisma.order.update({
            where: { id: parentOrder.id },
            data: { status: "PARTIALLY_SHIPPED" }
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: "Status updated", data: subOrder });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
