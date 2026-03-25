import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { syncOrderAndLedgerStatus } from "../../utils/orderStatusSync";

const prisma = new PrismaClient();

// Get all orders for Admin
export const getAllOrdersAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;
    const date = req.query.date as string;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const [orders, totalRecords] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          subOrders: {
            include: {
              temple: { select: { name: true } },
              items: { include: { product: { select: { name: true, image: true } } } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import ExcelJS from 'exceljs';

export const downloadOrdersExcelAdmin = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, phone: true, email: true } },
        subOrders: {
          include: {
            temple: { select: { name: true } },
            items: { include: { product: { select: { name: true } } } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Admin Orders Report');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 30 },
      { header: 'Devotee Name', key: 'devoteeName', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Order Date', key: 'orderDate', width: 20 },
      { header: 'SubOrders JSON', key: 'subOrdersPreview', width: 40 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF794A05' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    orders.forEach((o: any) => {
      // Create a quick summary of suborders
      const subOrdersSummary = o.subOrders.map((sub: any) =>
        `[${sub.status}] ${sub.temple?.name || 'Official'} - ₹${sub.totalAmount}`
      ).join(' | ');

      worksheet.addRow({
        id: o.id,
        devoteeName: o.user?.name || "N/A",
        phone: o.user?.phone || "N/A",
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod || "N/A",
        orderDate: o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
        subOrdersPreview: subOrdersSummary,
      });
    });

    worksheet.columns?.forEach((column) => {
      let maxLength = 0;
      column?.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) maxLength = cellLength;
      });
      if (column) column.width = maxLength < 10 ? 12 : maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=admin_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);

    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error("Orders Export Error:", error);
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
