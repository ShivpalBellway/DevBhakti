import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMandalDevotees = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner?.ownerId || (req as any).user?.ownerId;
    if (!mandalId) {
      return res.status(400).json({ success: false, message: "Mandal context not found" });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = ((req.query.search as string) || "").trim().toLowerCase();
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // 1. Fetch Donations for Mandal
    const donationWhere: any = { mandalId, status: "SUCCESS" };
    if (Object.keys(dateFilter).length > 0) donationWhere.createdAt = dateFilter;
    const donations = await prisma.donation.findMany({
      where: donationWhere,
      include: { user: { select: { name: true, phone: true, email: true, address: true } } },
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch Pooja Bookings for Mandal
    const poojaWhere: any = { mandalId, status: { not: "PENDING" } };
    if (Object.keys(dateFilter).length > 0) poojaWhere.createdAt = dateFilter;
    const poojaBookings = await prisma.poojaBooking.findMany({
      where: poojaWhere,
      include: { user: { select: { name: true, phone: true, email: true, address: true } } },
      orderBy: { createdAt: "desc" }
    });

    // 3. Fetch SubOrders (Marketplace) for Mandal
    const orderWhere: any = { mandalId };
    if (Object.keys(dateFilter).length > 0) orderWhere.createdAt = dateFilter;
    const subOrders = await prisma.subOrder.findMany({
      where: orderWhere,
      include: { order: { include: { user: { select: { name: true, phone: true, email: true, address: true } } } } },
      orderBy: { createdAt: "desc" }
    });

    // 4. Fetch Darshan Tickets for Mandal
    const darshanWhere: any = { mandalId, status: { not: "PENDING" } };
    if (Object.keys(dateFilter).length > 0) darshanWhere.createdAt = dateFilter;
    const darshanTickets = await prisma.mandalDarshanTicket.findMany({
      where: darshanWhere,
      include: { user: { select: { name: true, phone: true, email: true, address: true } } },
      orderBy: { createdAt: "desc" }
    });

    // 5. Fetch Teller Counter Orders for Mandal
    const tellerWhere: any = { mandalId };
    if (Object.keys(dateFilter).length > 0) tellerWhere.createdAt = dateFilter;
    const tellerOrders = await prisma.tellerOrder.findMany({
      where: tellerWhere,
      include: { devotee: { select: { name: true, phone: true, email: true, address: true } } },
      orderBy: { createdAt: "desc" }
    });

    // Consolidate into Unique Devotees Grouped by Key (Phone/Email/Name)
    const devoteeMap = new Map<string, any>();

    const getDevoteeKey = (name: string, phone: string, email: string) => {
      const cleanPhone = (phone || "").replace(/\D/g, "");
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanName = (name || "").trim().toLowerCase();
      if (cleanPhone && cleanPhone.length >= 10) return `phone_${cleanPhone.slice(-10)}`;
      if (cleanEmail) return `email_${cleanEmail}`;
      if (cleanName) return `name_${cleanName}`;
      return "anonymous";
    };

    const addRecordToDevotee = (
      name: string,
      phone: string,
      email: string,
      address: string | null,
      panNumber: string | null,
      is80GRequired: boolean,
      amount: number,
      date: Date,
      record: any
    ) => {
      const key = getDevoteeKey(name, phone, email);
      if (key === "anonymous" && !name && !phone && !email) return;

      if (!devoteeMap.has(key)) {
        devoteeMap.set(key, {
          key,
          donorName: name || "Devotee",
          donorPhone: phone || "",
          donorEmail: email || "",
          address: address || "",
          panNumber: panNumber || "",
          is80GRequired: !!is80GRequired,
          totalAmount: 0,
          donationCount: 0,
          lastDonationDate: date.toISOString(),
          firstDonationDate: date.toISOString(),
          donations: []
        });
      }

      const dev = devoteeMap.get(key);
      dev.totalAmount += amount;
      dev.donationCount += 1;
      dev.donations.push(record);

      if (!dev.address && address) dev.address = address;
      if (!dev.panNumber && panNumber) dev.panNumber = panNumber;
      if (is80GRequired) dev.is80GRequired = true;
      if (!dev.donorPhone && phone) dev.donorPhone = phone;
      if (!dev.donorEmail && email) dev.donorEmail = email;
      if (dev.donorName === "Devotee" && name) dev.donorName = name;

      if (date > new Date(dev.lastDonationDate)) dev.lastDonationDate = date.toISOString();
      if (date < new Date(dev.firstDonationDate)) dev.firstDonationDate = date.toISOString();
    };

    // Process Donations
    donations.forEach(d => {
      const name = d.user?.name || d.donorName || "Devotee";
      const phone = d.user?.phone || d.donorPhone || "";
      const email = d.user?.email || d.donorEmail || "";
      const address = d.user?.address || d.address || "";
      addRecordToDevotee(name, phone, email, address, d.panNumber, d.is80GRequired, d.amount, d.createdAt, {
        id: d.id,
        displayId: d.id.slice(-8).toUpperCase(),
        type: "DONATION",
        amount: d.amount,
        createdAt: d.createdAt,
        status: d.status,
        paymentMethod: d.paymentMethod,
        message: d.message,
        is80GRequired: d.is80GRequired
      });
    });

    // Process Pooja Bookings
    poojaBookings.forEach(pb => {
      const name = pb.user?.name || (pb as any).devoteeName || "Devotee";
      const phone = pb.user?.phone || (pb as any).devoteePhone || "";
      const email = pb.user?.email || "";
      const address = pb.user?.address || "";
      addRecordToDevotee(name, phone, email, address, null, false, pb.packagePrice, pb.createdAt, {
        id: pb.id,
        displayId: (pb as any).bookingNo || pb.id.slice(-8).toUpperCase(),
        type: "POOJA",
        amount: pb.packagePrice,
        createdAt: pb.createdAt,
        status: pb.status,
        paymentMethod: pb.razorpayPaymentId ? "ONLINE" : "CASH"
      });
    });

    // Process SubOrders
    subOrders.forEach(so => {
      const u = so.order?.user;
      const name = u?.name || "Devotee";
      const phone = u?.phone || "";
      const email = u?.email || "";
      const address = u?.address || "";
      addRecordToDevotee(name, phone, email, address, null, false, so.totalAmount, so.createdAt, {
        id: so.id,
        displayId: (so as any).subOrderNumber || so.id.slice(-8).toUpperCase(),
        type: "MARKETPLACE",
        amount: so.totalAmount,
        createdAt: so.createdAt,
        status: so.order?.status || "PAID",
        paymentMethod: "ONLINE"
      });
    });

    // Process Darshan Tickets
    darshanTickets.forEach(dt => {
      const name = dt.user?.name || dt.visitorName || "Devotee";
      const phone = dt.user?.phone || dt.visitorPhone || "";
      const email = dt.user?.email || dt.visitorEmail || "";
      const address = dt.user?.address || "";
      addRecordToDevotee(name, phone, email, address, null, false, dt.totalAmount, dt.createdAt, {
        id: dt.id,
        displayId: dt.displayId || dt.id.slice(-8).toUpperCase(),
        type: "DARSHAN",
        amount: dt.totalAmount,
        createdAt: dt.createdAt,
        status: dt.status,
        paymentMethod: (dt as any).bookingSource === "ONLINE" ? "ONLINE" : "CASH"
      });
    });

    // Process Teller Orders
    tellerOrders.forEach(to => {
      const name = to.devotee?.name || to.devoteeName || "Devotee";
      const phone = to.devotee?.phone || to.devoteePhone || "";
      const email = to.devotee?.email || to.devoteeEmail || "";
      const address = to.devotee?.address || "";
      addRecordToDevotee(name, phone, email, address, null, false, to.totalAmount, to.createdAt, {
        id: to.id,
        displayId: to.displayId || to.id.slice(-8).toUpperCase(),
        type: "TELLER_COUNTER",
        amount: to.totalAmount,
        createdAt: to.createdAt,
        status: to.paymentStatus,
        paymentMethod: to.paymentMethod || "CASH"
      });
    });

    let allDevotees = Array.from(devoteeMap.values()).sort(
      (a, b) => new Date(b.lastDonationDate).getTime() - new Date(a.lastDonationDate).getTime()
    );

    // Apply Search Filter if provided
    if (search) {
      allDevotees = allDevotees.filter(d =>
        d.donorName.toLowerCase().includes(search) ||
        d.donorPhone.toLowerCase().includes(search) ||
        d.donorEmail.toLowerCase().includes(search)
      );
    }

    const totalDevotees = allDevotees.length;
    const totalCollection = allDevotees.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalTransactionsCount = allDevotees.reduce((sum, d) => sum + d.donationCount, 0);

    // Pagination
    const totalPages = Math.ceil(totalDevotees / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedDevotees = allDevotees.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      data: paginatedDevotees,
      stats: {
        totalAmount: totalCollection,
        totalDonors: totalDevotees,
        successCount: totalTransactionsCount
      },
      pagination: {
        page,
        limit,
        total: totalDevotees,
        totalPages
      }
    });

  } catch (error: any) {
    console.error("Get Mandal Devotees Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch mandal devotees" });
  }
};
