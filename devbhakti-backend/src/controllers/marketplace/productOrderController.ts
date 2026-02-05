import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { createShiprocketOrder } from "../../services/shiprocketService";
import razorpay from "../../lib/razorpay";
import { SlabType, CommissionCategory } from "@prisma/client";
import { getCommissionForAmount } from "../admin/commissionSlabController";

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

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // 1. Fetch all products to group by templeId or sellerId
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        templeId: true,
        sellerId: true,
        name: true,
        weight: true,
        length: true,
        width: true,
        height: true
      },
    });

    const productMap = new Map();
    products.forEach((p) => {
      productMap.set(p.id, p);
    });

    // 2. Create Master Order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod,
        shippingAddress,
        status: "PENDING",
        paymentStatus: "PENDING",
      },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

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

      let templeId: string | null = null;
      let sellerId: string | null = null;
      let vendorType: SlabType = SlabType.GLOBAL;
      let vendorId: string | null = null;

      if (key.startsWith("temple_")) {
        templeId = key.replace("temple_", "");
        vendorId = templeId;
        vendorType = SlabType.TEMPLE;
      } else if (key.startsWith("seller_")) {
        sellerId = key.replace("seller_", "");
        vendorId = sellerId;
        vendorType = SlabType.SELLER;
      }

      // Calculate commission using Slabs
      let commissionAmount = 0;
      if (vendorId) {
        const commissionResult = await getCommissionForAmount(
          subOrderTotal,
          vendorType,
          vendorId,
          CommissionCategory.MARKETPLACE
        );
        commissionAmount = commissionResult.totalCommission;
      }

      // Since platform fee is added on top and charged to user, vendor gets full price
      const netEarning = subOrderTotal;

      const subOrder = await prisma.subOrder.create({
        data: {
          orderId: order.id,
          templeId,
          sellerId,
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

      // Create a pending ledger entry (if not admin)
      if (templeId || sellerId) {
        await prisma.templeLedger.create({
          data: {
            templeId,
            sellerId,
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

      // 5. Update Stock
      for (const item of groupItems) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 6. Sync with Shiprocket (Async - don't block order success)
      try {
        const srItems = groupItems.map(item => {
          const pInfo = productMap.get(item.productId);
          return {
            name: pInfo?.name || item.productId,
            sku: item.variantId,
            units: item.quantity,
            selling_price: item.price,
            discount: 0,
            tax: 0,
          };
        });

        // Calculate package dimensions (Total weight, Max dimensions)
        const totalWeight = groupItems.reduce((acc, item) => {
          const pInfo = productMap.get(item.productId);
          return acc + (Number(pInfo?.weight || 0.5) * item.quantity);
        }, 0);

        const maxLength = Math.max(...groupItems.map(item => Number(productMap.get(item.productId)?.length || 10)));
        const maxWidth = Math.max(...groupItems.map(item => Number(productMap.get(item.productId)?.width || 10)));
        const maxHeight = Math.max(...groupItems.map(item => Number(productMap.get(item.productId)?.height || 10)));

        const pickupLocation = key.startsWith("temple_")
          ? (await prisma.temple.findUnique({ where: { id: templeId! }, select: { pickupLocation: true } }))?.pickupLocation
          : (await prisma.sellerProfile.findUnique({ where: { id: sellerId! }, select: { pickupLocation: true } }))?.pickupLocation;

        const shiprocketData = {
          order_id: subOrder.id,
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: pickupLocation || "Primary",
          billing_customer_name: shippingAddress.fullName.split(' ')[0],
          billing_last_name: shippingAddress.fullName.split(' ').slice(1).join(' ') || "User",
          billing_address: shippingAddress.street,
          billing_city: shippingAddress.city,
          billing_pincode: shippingAddress.pincode,
          billing_state: shippingAddress.state || "Delhi",
          billing_country: "India",
          billing_email: order.user.email || "customer@devbhakti.in",
          billing_phone: shippingAddress.phone || order.user.phone || "9999999999",
          shipping_is_billing: true,
          order_items: srItems,
          payment_method: "Prepaid",
          sub_total: subOrderTotal,
          length: maxLength,
          width: maxWidth,
          height: maxHeight,
          weight: totalWeight
        };

        const srResponse = await createShiprocketOrder(shiprocketData);
        if (srResponse && srResponse.order_id) {
          await prisma.subOrder.update({
            where: { id: subOrder.id },
            data: {
              shiprocketOrderId: srResponse.order_id.toString()
            }
          });
        }
      } catch (srError) {
        console.error("Shiprocket Sync Error for SubOrder", subOrder.id, srError);
      }
    }

    // 7. Handle Razorpay Order Creation
    if (paymentMethod === "RAZORPAY") {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Amount in paise
        currency: "INR",
        receipt: `order_rcpt_${order.id.slice(-10)}`,
      });

      return res.status(201).json({
        success: true,
        message: "Order initiated. Complete payment to confirm.",
        data: order,
        razorpayOrder
      });
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
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #794A05;
                    --primary-light: #FFF8EB;
                    --text-main: #1e293b;
                    --text-muted: #64748b;
                    --border: #e2e8f0;
                }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #f8fafc; 
                    margin: 0; 
                    padding: 0; 
                    color: var(--text-main); 
                    -webkit-print-color-adjust: exact; 
                }
                
                /* Action Bar for Screen Only */
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
                    border-bottom: 1px solid var(--border);
                }
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    text-decoration: none;
                }
                .btn-print {
                    background: white;
                    color: var(--text-main);
                    border: 1px solid var(--border);
                }
                .btn-print:hover { background: #f1f5f9; }
                .btn-download {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(121, 74, 5, 0.2);
                }
                .btn-download:hover { background: #5d3904; transform: translateY(-1px); }

                /* Invoice Container */
                .page {
                    background: white;
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 48px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    border-radius: 12px;
                }

                /* Header */
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 48px;
                    padding-bottom: 24px;
                    border-bottom: 2px solid var(--border);
                }
                .brand h1 {
                    font-size: 28px;
                    font-weight: 800;
                    color: var(--primary);
                    margin: 0;
                    letter-spacing: -0.5px;
                }
                .brand p {
                    margin: 4px 0 0;
                    color: var(--text-muted);
                    font-size: 14px;
                }
                .invoice-meta {
                    text-align: right;
                }
                .invoice-meta h2 {
                    font-size: 32px;
                    font-weight: 300;
                    color: var(--text-main);
                    margin: 0;
                    letter-spacing: 2px;
                }
                .meta-group {
                    margin-top: 8px;
                }
                .meta-label {
                    color: var(--text-muted);
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }
                .meta-value {
                    font-weight: 600;
                    color: var(--text-main);
                    font-size: 15px;
                }

                /* Address Section */
                .addresses {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 48px;
                    margin-bottom: 48px;
                }
                .address-card h3 {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-muted);
                    margin-bottom: 12px;
                    font-weight: 700;
                }
                .address-content {
                    font-size: 14px;
                    line-height: 1.6;
                }
                .address-name {
                    font-weight: 700;
                    color: var(--text-main);
                    margin-bottom: 4px;
                    display: block;
                }

                /* Table */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 40px;
                }
                th {
                    text-align: left;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-muted);
                    padding: 16px 8px;
                    border-bottom: 1px solid var(--border);
                    background: #f8fafc;
                }
                td {
                    padding: 16px 8px;
                    border-bottom: 1px solid var(--border);
                    font-size: 14px;
                    vertical-align: top;
                }
                .item-main {
                    font-weight: 600;
                    color: var(--text-main);
                }
                .item- sub {
                    font-size: 12px;
                    color: var(--text-muted);
                    margin-top: 2px;
                }

                /* Totals */
                .totals {
                    display: flex;
                    justify-content: flex-end;
                }
                .totals-box {
                    width: 320px;
                    background: #f8fafc;
                    padding: 24px;
                    border-radius: 8px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 14px;
                    color: var(--text-muted);
                }
                .total-row.final {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 2px solid #cbd5e1;
                    color: var(--text-main);
                    font-weight: 700;
                    font-size: 18px;
                }
                .total-row.final span:last-child {
                    color: var(--primary);
                }

                /* Footer */
                .footer {
                    margin-top: 60px;
                    padding-top: 24px;
                    border-top: 1px solid var(--border);
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 12px;
                }
                .footer p { margin: 4px 0; }

                /* Print Styles */
                @media print {
                    .action-bar { display: none; }
                    body { background: white; }
                    .page { 
                        box-shadow: none; 
                        margin: 0; 
                        padding: 0; 
                        max-width: none; 
                    }
                }
            </style>
        </head>
        <body>
            <div class="action-bar no-print">
                <button onclick="window.print()" class="btn btn-print">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9V2h12v7"></path>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <path d="M6 14h12v8H6z"></path>
                    </svg>
                    Print Invoice
                </button>
                <button onclick="window.print()" class="btn btn-download">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download as PDF
                </button>
            </div>

            <div class="page">
                <div class="header">
                    <div class="brand">
                        <h1>DevBhakti</h1>
                        <p>Sacred Offerings & Blessings</p>
                    </div>
                    <div class="invoice-meta">
                        <h2>INVOICE</h2>
                        <div class="meta-group">
                            <span class="meta-label">Invoice No:</span>
                            <span class="meta-value">#${order.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div class="meta-group">
                            <span class="meta-label">Date:</span>
                            <span class="meta-value">${formatDate(order.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div class="addresses">
                    <div class="address-card">
                        <h3>Bill To</h3>
                        <div class="address-content">
                            <span class="address-name">${shippingAddress?.fullName || 'N/A'}</span>
                            ${shippingAddress?.street ? `<div>${shippingAddress.street}</div>` : ''}
                            <div>
                                ${shippingAddress?.city || ''}${shippingAddress?.state ? `, ${shippingAddress.state}` : ''} 
                                ${shippingAddress?.pincode ? `- ${shippingAddress.pincode}` : ''}
                            </div>
                            ${shippingAddress?.phone ? `<div style="margin-top: 4px; color: var(--text-muted)">Ph: ${shippingAddress.phone}</div>` : ''}
                        </div>
                    </div>
                    <div class="address-card">
                        <h3>Sold By</h3>
                        <div class="address-content">
                            <span class="address-name">DevBhakti Marketplace</span>
                            <div>Officially Authorized Platform</div>
                            <div>Pan-India Distribution</div>
                            <div style="margin-top: 4px; color: var(--text-muted)">admin@devbhakti.in</div>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%">Description</th>
                            <th style="width: 15%; text-align: center">Quantity</th>
                            <th style="width: 15%; text-align: right">Unit Price</th>
                            <th style="width: 20%; text-align: right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.subOrders.flatMap((so: any) => so.items).map((item: any) => `
                            <tr>
                                <td>
                                    <div class="item-main">${item.product?.name || 'Unknown Product'}</div>
                                    <div class="item-sub">${item.variantName || 'Standard Variant'}</div>
                                </td>
                                <td style="text-align: center; vertical-align: middle;">${item.quantity}</td>
                                <td style="text-align: right; vertical-align: middle;">₹${item.price.toLocaleString()}</td>
                                <td style="text-align: right; vertical-align: middle; font-weight: 500;">₹${(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="totals-box">
                        <div class="total-row">
                            <span>Subtotal</span>
                            <span>₹${order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping Costs</span>
                            <span style="color: #10b981; font-weight: 600;">FREE</span>
                        </div>
                        <div class="total-row final">
                            <span>Grand Total</span>
                            <span>₹${order.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for choosing DevBhakti for your spiritual journey.</p>
                    <p>This is a computer-generated invoice and requires no signature.</p>
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
