import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { createShiprocketOrder, checkShiprocketServiceability } from "../../services/shiprocketService";
import { extractPincode } from "../../lib/shiprocketUtils";
import razorpay from "../../lib/razorpay";
import { SlabType, CommissionCategory } from "@prisma/client";
import { getCommissionForAmount } from "../admin/commissionSlabController";
import { notifyUser, notifyAdmins } from "../../services/firebaseService";
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { sendOrderInvoiceEmail } from "../../services/orderMailService";

export const calculateFees = async (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { productId, price, quantity, templeId, sellerId }

    if (!items || items.length === 0) {
      return res.json({ success: true, platformFee: 0, vendorBreakdown: [] });
    }

    // Group items by vendor
    const groups: Record<string, { amount: number, type: SlabType, id: string | null }> = {};

    for (const item of items) {
      let vendorId = item.templeId || item.sellerId || "admin";
      let vendorType = item.templeId ? SlabType.TEMPLE : (item.sellerId ? SlabType.SELLER : SlabType.GLOBAL);

      const key = `${vendorType}_${vendorId}`;
      if (!groups[key]) {
        groups[key] = { amount: 0, type: vendorType, id: vendorId === "admin" ? null : vendorId };
      }
      groups[key].amount += item.price * item.quantity;
    }

    let totalPlatformFee = 0;
    const vendorBreakdown = [];

    for (const key in groups) {
      const group = groups[key];
      // Skip commission for admin products
      if (group.id === null) {
        vendorBreakdown.push({
          vendorId: "admin",
          amount: group.amount,
          fee: 0
        });
        continue;
      }

      const commission = await getCommissionForAmount(
        group.amount,
        group.type,
        group.id,
        CommissionCategory.MARKETPLACE
      );
      totalPlatformFee += commission.totalCommission;

      vendorBreakdown.push({
        vendorId: group.id,
        vendorType: group.type,
        amount: group.amount,
        fee: commission.totalCommission,
        percentage: commission.percentage,
        fixedFee: commission.platformFee
      });
    }

    return res.json({
      success: true,
      totalPlatformFee,
      vendorBreakdown
    });
  } catch (error: any) {
    console.error("Calculate Fees Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, shippingAddress, userId } = req.body;

    const authUser = (req as any).user;
    if (!authUser || authUser.role !== 'DEVOTEE') {
      return res.status(403).json({ success: false, message: 'Only devotee accounts can place marketplace orders.' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Only Razorpay is supported for this clean flow
    if (paymentMethod !== "RAZORPAY") {
      return res.status(400).json({ success: false, message: "Only Online Payment is supported currently." });
    }

    // 1. Just create a Razorpay Order
    // Note: We don't save anything in our DB yet.
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      message: "Order initiated.",
      razorpayOrder
    });
  } catch (error: any) {
    console.error("Initiate Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate order",
      details: error.message,
    });
  }
};

/**
 * Centrally create the order in DB after payment success
 * This is called from the payment controller
 */
export const createVerifiedOrder = async (orderData: any, userId: string) => {
  const { items, totalAmount, shippingAddress, paymentMethod } = orderData;

  const { order, groups, productMap } = await prisma.$transaction(async (tx) => {
    const productIds = items.map((item: any) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        templeId: true,
        sellerId: true,
        name: true,
        weight: true,
        length: true,
        width: true,
        height: true,
        temple: { select: { name: true, pickupLocation: true, userId: true } },
        seller: { select: { name: true, pickupLocation: true, userId: true } }
      },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // 2. Create Master Order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod,
        shippingAddress,
        status: "BOOKED",
        paymentStatus: "PAID",
        platformFee: orderData.platformFee || 0,
        shippingCost: orderData.shippingCost || 0,
      },
      include: { user: { select: { name: true, email: true, phone: true } } }
    });

    // 3. Group and create SubOrders
    const groups: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const info = productMap.get(item.productId);
      const key = info?.templeId ? `temple_${info.templeId}` : (info?.sellerId ? `seller_${info.sellerId}` : "admin");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    for (const [key, groupItems] of Object.entries(groups)) {
      const subOrderTotal = groupItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let templeId = key.startsWith("temple_") ? key.replace("temple_", "") : null;
      let sellerId = key.startsWith("seller_") ? key.replace("seller_", "") : null;
      let vendorType = templeId ? SlabType.TEMPLE : (sellerId ? SlabType.SELLER : SlabType.GLOBAL);
      let vendorId = templeId || sellerId;

      let commissionAmount = 0;
      if (vendorId) {
        const commissionResult = await getCommissionForAmount(subOrderTotal, vendorType, vendorId, CommissionCategory.MARKETPLACE);
        commissionAmount = commissionResult.totalCommission;
      }

      const subOrder = await tx.subOrder.create({
        data: {
          orderId: order.id,
          templeId,
          sellerId,
          totalAmount: subOrderTotal,
          commissionAmount,
          netEarning: subOrderTotal,
          status: "PAID",
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

      if (templeId || sellerId) {
        await tx.templeLedger.create({
          data: {
            templeId,
            sellerId,
            amount: subOrderTotal,
            grossAmount: subOrderTotal,
            commission: commissionAmount,
            type: "MARKETPLACE_EARNING",
            sourceId: order.id,
            description: `Earning from Order #${order.id.slice(-6).toUpperCase()}`,
            status: "COMPLETED"
          }
        });
      }

      // Update Stock
      for (const item of groupItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4. Shiprocket Sync
      const firstProd = productMap.get(groupItems[0].productId);
      if (!firstProd) {
        console.warn(`⚠️ Skipping Shiprocket/Notify for group ${key}: Product not found`);
        continue;
      }
      const vendorUserId = templeId ? (firstProd as any)?.temple?.userId : (firstProd as any)?.seller?.userId;

      try {
        const orderWithUser = await tx.order.findUnique({
          where: { id: order.id },
          include: { user: true }
        });

        const shippingAddr = shippingAddress as any;

        // Use the first product's vendor pickup location
        const pickupLocation = (templeId ? (firstProd as any)?.temple?.pickupLocation : (firstProd as any)?.seller?.pickupLocation) || "Primary";

        // Prepare Shiprocket Order Payload
        const shiprocketOrderData = {
          order_id: subOrder.id,
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: pickupLocation,
          billing_customer_name: shippingAddr.fullName || orderWithUser?.user?.name || "Customer",
          billing_last_name: "Customer",
          billing_address: shippingAddr.street || "N/A",
          billing_city: shippingAddr.city || "N/A",
          billing_pincode: shippingAddr.pincode || "000000",
          billing_state: shippingAddr.state || "N/A",
          billing_country: "India",
          billing_email: orderWithUser?.user?.email || "customer@example.com",
          billing_phone: shippingAddr.phone || orderWithUser?.user?.phone || "0000000000",
          shipping_is_billing: true,
          order_items: groupItems.map(item => {
            const p = productMap.get(item.productId);
            return {
              name: p?.name || "Product",
              sku: item.variantId,
              units: item.quantity,
              selling_price: item.price,
              discount: 0,
              tax: 0,
              hsn: 0
            };
          }),
          payment_method: paymentMethod === "COD" ? "COD" : "Prepaid",
          sub_total: subOrderTotal,
          length: Math.max(...groupItems.map(item => productMap.get(item.productId)?.length || 10)),
          breadth: Math.max(...groupItems.map(item => productMap.get(item.productId)?.width || 10)),
          height: Math.max(...groupItems.map(item => productMap.get(item.productId)?.height || 10)),
          weight: groupItems.reduce((sum, item) => sum + ((productMap.get(item.productId)?.weight || 0.5) * item.quantity), 0)
        };

        const srResponse = await createShiprocketOrder(shiprocketOrderData);

        if (srResponse && srResponse.order_id) {
          await tx.subOrder.update({
            where: { id: subOrder.id },
            data: {
              shiprocketOrderId: srResponse.order_id.toString(),
              status: "PROCESSING"
            }
          });
          console.log(`Shiprocket Order Created for SubOrder ${subOrder.id}: ${srResponse.order_id}`);
        } else {
          console.error(`Shiprocket Sync Failed for SubOrder ${subOrder.id}:`, srResponse);
        }
      } catch (srError: any) {
        console.error(`Shiprocket Sync Error for SubOrder ${subOrder.id}:`, srError.message);
      }

      // Notify Vendor (Temple or Seller)
      // Notify Vendor (Temple Owner or Seller Owner)
      if (vendorUserId) {
        try {
          await notifyUser(vendorUserId, templeId ? 'temple_admin' : 'seller', {
            title: 'New Product Order! 📦',
            body: `You have received a new order #${subOrder.id.slice(-6).toUpperCase()} for ₹${subOrderTotal}.`,
            data: { link: templeId ? `/temples/dashboard/orders/${subOrder.id}` : `/seller/dashboard/orders/${subOrder.id}`, orderId: subOrder.id }
          });
        } catch (notifyErr) {
          console.error(`❌ Vendor Notification Failed for ${vendorUserId}:`, notifyErr);
        }
      }
    }
    return { order, groups, productMap };
  });

  // --- POST-COMMIT SIDE EFFECTS (Notifications & Email) ---
  
  // Notify Devotee via Push Notification
  try {
    await notifyUser(userId, 'devotee', {
      title: 'Order Placed Successfully! 🎉',
      body: `Your order #${order.id.slice(-6).toUpperCase()} has been placed. We'll update you when it's shipped!`,
      data: { link: `/profile/orders/${order.id}`, orderId: order.id }
    });
  } catch (notifyErr) {
    console.error(`❌ Devotee Notification Failed for ${userId}:`, notifyErr);
  }

  // SEND EMAIL RECEIPT
  if (order.user && order.user.email) {
    try {
      const receipt = await generateOrderReceiptBuffer(order.id);
      if (receipt) {
        await sendOrderInvoiceEmail({
          orderId: order.id,
          customerName: order.user.name || "Customer",
          customerEmail: order.user.email as string,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          shippingAddress: order.shippingAddress,
          items: items.map((item: any) => ({
            productName: productMap.get(item.productId)?.name || "Sacred Item",
            price: item.price,
            quantity: item.quantity
          })),
          receiptBuffer: receipt.buffer,
          receiptFilename: receipt.filename
        } as any);
      }
    } catch (emailErr) {
      console.error("❌ Failed to send order invoice email:", emailErr);
    }
  }

  // Prepare details for Admin notification
  const userDisplayName = order.user?.name || "A Devotee";
  const productNames = items.map((item: any) => {
    const p = productMap.get(item.productId);
    return `${p?.name} (x${item.quantity})`;
  }).join(', ');

  const vendorSummary = Object.keys(groups).map(key => {
    if (key === 'admin') return 'DevBhakti Admin';
    const firstItem = groups[key][0];
    const info = productMap.get(firstItem.productId);
    return info?.temple?.name || info?.seller?.name || 'Vendor';
  }).join(', ');

  // Notify Admin (Comprehensive Order Alert)
  try {
    await notifyAdmins({
      title: 'New Master Order! 📢',
      body: `Customer: ${userDisplayName}\nProducts: ${productNames}\nVendors: ${vendorSummary}\nTotal Amount: ₹${totalAmount}`,
      data: { link: `/admin/products/orders?id=${order.id}`, orderId: order.id }
    });
  } catch (notifyErr) {
    console.error(`❌ Admin Notification Failed:`, notifyErr);
  }

  return order;
};

export const getMyOrders = async (req: any, res: Response) => {
  try {
    const userId = (req.user?.userId || req.params.userId) as string;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        OR: [
          { paymentMethod: "COD" },
          { paymentStatus: "PAID" },
          { paymentStatus: "FAILED" }
        ]
      },
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
            },
            seller: {
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
            temple: true,
            seller: true
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

export const getOrderInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        subOrders: {
          include: {
            temple: { select: { name: true, fullAddress: true } },
            seller: { select: { name: true, fullAddress: true } },
            items: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          }
        },
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const shippingAddress = order.shippingAddress as any;

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Calculate total items
    const totalItems = order.subOrders.reduce((acc, so) => acc + so.items.length, 0);

    const invoiceContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Invoice #${order.id.slice(-8).toUpperCase()}</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Roboto', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    color: #333; 
                    -webkit-print-color-adjust: exact; 
                    background: #f1f5f9;
                }
                .action-bar {
                    background: white;
                    padding: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-print { background: #794A05; color: white; border: none; }
                .action-bar.no-print { display: flex; }
                
                .page {
                    background: white;
                    width: 210mm;
                    min-height: 297mm;
                    margin: 40px auto;
                    padding: 30px;
                    box-sizing: border-box;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                
                .logo-section {
                    text-align: center;
                    margin-bottom: 15px;
                }
                .logo-section img {
                    height: 50px;
                    margin-bottom: 5px;
                }
                .logo-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #794A05;
                }
                
                .invoice-title-wrapper {
                    text-align: center;
                    border-bottom: 2px solid #ccc;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .invoice-title {
                    font-size: 22px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                
                .grid-3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                    font-size: 11px;
                }
                
                .column h4 {
                    font-size: 11px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                }
                
                .column-content {
                    line-height: 1.5;
                }
                
                .col-border {
                    border-left: 1px dashed #ccc;
                    padding-left: 15px;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 4px;
                }
                .detail-label {
                    width: 85px;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .detail-value {
                    flex: 1;
                }
                
                table.items {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }
                table.items th {
                    text-align: center;
                    text-transform: uppercase;
                    padding: 6px 4px;
                    border-top: 1px solid #eee;
                    border-bottom: 1px solid #ccc;
                    font-weight: 700;
                }
                table.items td {
                    padding: 10px 4px;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                }
                table.items td.text-left, table.items th.text-left {
                    text-align: left;
                }
                table.items td.text-right, table.items th.text-right {
                    text-align: right;
                }
                
                .totals-section {
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid #ccc;
                    border-bottom: 1px solid #ccc;
                    padding: 10px 0;
                    margin-bottom: 20px;
                }
                .totals-left {
                    flex: 1;
                }
                .totals-right {
                    width: 250px;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 11px;
                }
                .total-line.grand {
                    font-size: 13px;
                    font-weight: 700;
                    margin-top: 8px;
                }
                .total-line.text {
                    font-size: 11px;
                    font-weight: 500;
                }
                
                .footer-box {
                    border: 1px solid #999;
                    width: 180px;
                    height: 50px;
                    margin-bottom: 8px;
                }
                .footer-sign {
                    font-size: 10px;
                    font-weight: 700;
                }
                
                @media print {
                    .action-bar { display: none !important; }
                    body { background: white; }
                    .page { box-shadow: none; margin: 0; padding: 0; width: 100%; height: auto; }
                }
            </style>
        </head>
        <body>
            <div class="action-bar no-print">
                <button onclick="window.print()" class="btn btn-print">
                    Print / Download Invoice
                </button>
            </div>

            <div class="page">
                <div class="logo-section">
                    <div class="logo-title">DevBhakti</div>
                </div>
                
                <div class="invoice-title-wrapper">
                    <span class="invoice-title"> INVOICE</span>
                </div>

                <div class="grid-3">
                    <div class="column">
                        <h4>SHIPPING ADDRESS:</h4>
                        <div class="column-content">
                            <strong>${shippingAddress?.fullName || 'Customer'}</strong><br>
                            ${shippingAddress?.street || 'N/A'}<br>
                            ${shippingAddress?.city || ''} ${shippingAddress?.pincode || ''}<br>
                            ${shippingAddress?.state || ''}<br>
                            India<br>
                            Ph: ${shippingAddress?.phone || order.user?.phone || 'N/A'}
                        </div>
                    </div>
                    
                    <div class="column col-border">
                        <h4>SOLD BY:</h4>
                        <div class="column-content" style="text-align: left;">
                            ${order.subOrders.map((so: any) => {
      const vName = so.temple?.name || so.seller?.name || 'DevBhakti Marketplace';
      const vAddr = so.temple?.fullAddress || so.seller?.fullAddress || 'Indore, MP';
      return `<strong>${vName}</strong><br>${vAddr}<br>`;
    }).join('<br>')}
                            <br>
                            Website: DevBhakti.in<br>
                            Email: admin@devbhakti.in
                        </div>
                    </div>
                
                    <div class="column col-border">
                        <h4>INVOICE DETAILS:</h4>
                        <div class="column-content">
                            <div class="detail-row">
                                <span class="detail-label">INVOICE NO</span>
                                <span class="detail-value">: INV-${order.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">INVOICE DATE</span>
                                <span class="detail-value">: ${formatDate(order.createdAt)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">ORDER NO</span>
                                <span class="detail-value">: ${order.id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">ORDER DATE</span>
                                <span class="detail-value">: ${formatDate(order.createdAt)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">CHANNEL</span>
                                <span class="detail-value">: CUSTOM DEVBHAKTI</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">PAYMENT<br>METHOD</span>
                                <span class="detail-value">: ${order.paymentMethod === 'COD' ? 'cod' : 'prepaid'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">REMARK</span>
                                <span class="detail-value">: Custom Order</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table class="items">
                    <thead>
                        <tr>
                            <th class="text-left" style="width: 5%">S.NO</th>
                            <th class="text-left" style="width: 35%">PRODUCT NAME</th>
                            <th style="width: 5%">HSN</th>
                            <th style="width: 5%">QTY</th>
                            <th class="text-right" style="width: 10%">UNIT PRICE</th>
                            <th class="text-right" style="width: 10%">DISCOUNT</th>
                            <th class="text-right" style="width: 10%">TAXABLE<br>VALUE</th>
                            <th class="text-right" style="width: 10%">CGST<br>(Value | %)</th>
                            <th class="text-right" style="width: 10%">SGST<br>(Value | %)</th>
                            <th class="text-right" style="width: 10%">TOTAL<br>(Inc GST)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.subOrders.flatMap((so: any) => so.items).map((item: any, idx: number) => `
                            <tr>
                                <td class="text-left">${idx + 1}</td>
                                <td class="text-left">
                                    <strong>${item.product?.name || 'Item'}</strong> (${item.variantName || 'Standard'})<br>
                                    <span style="color: #666; font-size: 10px;">SKU: ${item.variantId}</span>
                                </td>
                                <td>0</td>
                                <td>${item.quantity}</td>
                                <td class="text-right">Rs. ${item.price.toFixed(2)}</td>
                                <td class="text-right">0.00</td>
                                <td class="text-right">${(item.price * item.quantity).toFixed(2)}</td>
                                <td class="text-right">0.00 | 0.00</td>
                                <td class="text-right">0.00 | 0.00</td>
                                <td class="text-right">${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals-section">
                    <div class="totals-left">
                        <div class="footer-box"></div>
                        <div class="footer-sign">
                            Authorized Signature for<br>
                            ${order.subOrders[0]?.temple?.name || order.subOrders[0]?.seller?.name || 'DevBhakti'}
                        </div>
                    </div>
                    
                    <div class="totals-right">
                        <div class="total-line">
                            <span>Subtotal (In Value)</span>
                            <span>Rs. ${(order.totalAmount - (order.platformFee || 0) - (order.shippingCost || 0)).toFixed(2)}</span>
                        </div>
                        <div class="total-line">
                            <span>Platform fee</span>
                            <span>Rs. ${(order.platformFee || 0).toFixed(2)}</span>
                        </div>
                        <div class="total-line">
                            <span>Shipping Costs</span>
                            <span>${(order.shippingCost || 0) > 0 ? 'Rs. ' + (order.shippingCost || 0).toFixed(2) : '0.00'}</span>
                        </div>
                        <div class="total-line grand">
                            <span>NET TOTAL (In Value)</span>
                            <span>Rs. ${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <br>
                        <div class="total-line text" style="justify-content: flex-end; font-size: 12px;">
                            Whether tax is payable under reverse charge - No
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(invoiceContent);

  } catch (error: any) {
    console.error("Invoice Error:", error);
    return res.status(500).send("Failed to generate invoice");
  }
};

export const generateOrderReceiptBuffer = async (orderId: string): Promise<{ buffer: Buffer, filename: string } | null> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        subOrders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!order) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const filename = `order-receipt-${order.id.slice(-6).toUpperCase()}.pdf`;
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), filename }));
      doc.on('error', (err) => reject(err));

      // --- Colors ---
      const primaryColor = '#794A05'; // DevBhakti Brown
      const textColor = '#1e293b';
      const lightGray = '#f8fafc';
      const borderColor = '#e2e8f0';

      // --- Header Section ---
      const logoPath = path.join(__dirname, '../../../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 60 });
        doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('DevBhakti', 120, 55);
        doc.fillColor(textColor).fontSize(10).font('Helvetica').text('Sacred Offerings & Temple Services', 120, 85);
      } else {
        doc.fillColor(primaryColor).fontSize(28).font('Helvetica-Bold').text('DevBhakti', { align: 'center' });
        doc.fillColor(textColor).fontSize(12).font('Helvetica').text('Sacred Offerings & Temple Services', { align: 'center' });
      }

      // Receipt Info (Top Right)
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text('OFFICIAL INVOICE', 400, 55, { align: 'right' });
      doc.font('Helvetica').fontSize(9).text(`Order ID: #${order.id.slice(-8).toUpperCase()}`, 400, 70, { align: 'right' });
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 400, 82, { align: 'right' });

      doc.moveDown(4);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(2);

      // --- Shipping & Billing Details ---
      const topOfDetails = doc.y;
      const shippingAddr = order.shippingAddress as any;

      // Shipping Column
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('SHIPPING ADDRESS', 50, topOfDetails);
      doc.moveDown(0.5);
      doc.fillColor(textColor).font('Helvetica-Bold').fontSize(12).text(shippingAddr?.fullName || order.user?.name || 'Customer');
      doc.font('Helvetica').fontSize(10).text(`${shippingAddr?.street || 'N/A'}`);
      doc.text(`${shippingAddr?.city || ''}, ${shippingAddr?.state || ''} - ${shippingAddr?.pincode || ''}`);
      doc.text(`Phone: ${shippingAddr?.phone || order.user?.phone || 'N/A'}`);

      // Order Summary Column (Right)
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('ORDER SUMMARY', 350, topOfDetails);
      doc.moveDown(0.5);
      doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold').text('PAYMENT: PREPAID (Razorpay)', 350, doc.y);
      doc.fillColor(textColor).font('Helvetica').fontSize(10).text(`Status: ${order.status}`, 350, doc.y + 2);
      doc.text(`Total Items: ${order.subOrders.reduce((acc, so) => acc + so.items.length, 0)}`, 350, doc.y + 2);

      doc.moveDown(4);

      // --- Items Table ---
      const tableTop = doc.y;
      doc.fillColor(lightGray).rect(50, tableTop, 500, 25).fill();
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('ITEM DESCRIPTION', 60, tableTop + 7);
      doc.text('QTY', 350, tableTop + 7, { width: 50, align: 'center' });
      doc.text('PRICE', 400, tableTop + 7, { width: 70, align: 'right' });
      doc.text('TOTAL', 470, tableTop + 7, { width: 70, align: 'right' });

      let currentY = tableTop + 35;
      order.subOrders.forEach(subOrder => {
        subOrder.items.forEach(item => {
          doc.fillColor(textColor).font('Helvetica').fontSize(10).text(item.product?.name || 'Product', 60, currentY, { width: 280 });
          doc.fontSize(9).fillColor('#666').text(`Variant: ${item.variantName || 'Default'}`, 60, doc.y + 2);

          doc.fillColor(textColor).fontSize(10).text(item.quantity.toString(), 350, currentY, { width: 50, align: 'center' });
          doc.text(`Rs. ${item.price.toFixed(2)}`, 400, currentY, { width: 70, align: 'right' });
          doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 470, currentY, { width: 70, align: 'right' });

          currentY = doc.y + 15;

          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
        });
      });

      doc.moveDown(2);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // --- Totals Section ---
      const totalsY = doc.y;
      doc.fillColor(textColor).font('Helvetica').fontSize(10).text('Subtotal:', 350, totalsY);
      doc.text(`Rs. ${(order.totalAmount - (order.platformFee || 0) - (order.shippingCost || 0)).toFixed(2)}`, 470, totalsY, { align: 'right' });

      doc.moveDown(0.5);
      doc.text('Platform Fee:', 350, doc.y);
      doc.text(`Rs. ${(order.platformFee || 0).toFixed(2)}`, 470, doc.y, { align: 'right' });

      doc.moveDown(0.5);
      doc.text('Shipping:', 350, doc.y);
      doc.text(`Rs. ${(order.shippingCost || 0).toFixed(2)}`, 470, doc.y, { align: 'right' });

      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(12).text('Grand Total:', 350, doc.y);
      doc.fillColor(primaryColor).text(`INR ${order.totalAmount.toFixed(2)}`, 470, doc.y - 12, { align: 'right' });

      // --- Footer ---
      doc.moveDown(8);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Oblique').text('Thank you for shopping with DevBhakti. Your purchase supports our local artisans and temple communities.', { align: 'center' });
      doc.moveDown(0.5);
      doc.text('This is a computer-generated invoice and does not require a physical signature.', { align: 'center' });
      doc.moveDown(1.5);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('www.devbhakti.com', { align: 'center' });

      doc.end();
    });

  } catch (error) {
    console.error('Error generating order receipt buffer:', error);
    return null;
  }
};

export const checkShippingAvailability = async (req: Request, res: Response) => {
  try {
    const { productId, pincode } = req.body;

    if (!productId || !pincode) {
      return res.status(400).json({ success: false, message: "Product ID and Pincode are required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        temple: { select: { fullAddress: true, location: true } },
        seller: { select: { fullAddress: true, location: true } }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Get Pickup Pincode
    const vendorAddress = product.temple?.fullAddress || product.temple?.location ||
      product.seller?.fullAddress || product.seller?.location;

    if (!vendorAddress) {
      return res.status(400).json({ success: false, message: "Vendor address not configured for this product" });
    }

    const pickupPincode = extractPincode(vendorAddress);

    // Call Shiprocket
    const srResponse = await checkShiprocketServiceability(
      pickupPincode,
      pincode.toString(),
      product.weight || 0.5,
      0 // Prepaid check
    );

    if (srResponse && srResponse.status === 200) {
      const { data } = srResponse;
      const courier = data.available_courier_companies?.[0]; // Get first available courier

      return res.json({
        success: true,
        serviceable: true,
        edd: courier?.etd || "3-5 Business Days",
        courier: courier?.courier_name || "Shiprocket Standard",
        pincode: pincode
      });
    } else {
      return res.json({
        success: true,
        serviceable: false,
        message: srResponse.message || "Delivery not available for this pincode"
      });
    }
  } catch (error: any) {
    console.error("Check Shipping Availability Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
