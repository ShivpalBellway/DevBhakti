import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { syncOrderAndLedgerStatus } from "../../utils/orderStatusSync";

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

    // Optional: Update shippingLabel if provided
    if (shippingLabel) {
      await prisma.subOrder.update({
        where: { id: subOrderId },
        data: { shippingLabel }
      });
    }

    // Use shared utility for status sync (Ledger, Parent Order, etc.)
    const subOrder = await syncOrderAndLedgerStatus(subOrderId, status);

    return res.status(200).json({ success: true, message: "Status updated", data: subOrder });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
