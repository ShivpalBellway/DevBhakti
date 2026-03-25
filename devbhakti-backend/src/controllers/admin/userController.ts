import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

const getRecurringDateConditions = (start: string, end: string, field: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // If the range is in the past (before current year), use standard full-date filtering
    if (startDate.getFullYear() < new Date().getFullYear() && endDate.getFullYear() < new Date().getFullYear()) {
        return { [field]: { gte: start, lte: end } };
    }

    // Otherwise, treat as a recurring month-day range
    const days: string[] = [];
    const tempDate = new Date(startDate);
    // Cap at 366 days to prevent massive queries
    let count = 0;
    while (tempDate <= endDate && count < 366) {
        const mm = String(tempDate.getMonth() + 1).padStart(2, '0');
        const dd = String(tempDate.getDate()).padStart(2, '0');
        days.push(`-${mm}-${dd}`);
        tempDate.setDate(tempDate.getDate() + 1);
        count++;
    }

    if (days.length === 0) return null;
    return {
        OR: days.map(day => ({ [field]: { contains: day } }))
    };
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '', role, startDate, endDate, dob, anniversary, dobStart, dobEnd, anniversaryStart, anniversaryEnd } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const andConditions: any[] = [{ role: { not: 'ADMIN' } }];

        if (role && role !== 'all') {
            if (role === 'institution' || role === 'temple_admin') {
                andConditions.push({ role: UserRole.INSTITUTION });
            } else if (role === 'devotee') {
                andConditions.push({ role: UserRole.DEVOTEE });
            } else if (role === 'seller') {
                andConditions.push({ role: UserRole.SELLER });
            }
        }

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { email: { contains: String(search), mode: 'insensitive' } },
                    { phone: { contains: String(search), mode: 'insensitive' } },
                ]
            });
        }



        if (dobStart || dobEnd) {
            const cond = getRecurringDateConditions(String(dobStart || '1900-01-01'), String(dobEnd || '2100-12-31'), 'dob');
            if (cond) andConditions.push(cond);
        } else if (dob) {
            if (dob === 'upcoming') {
                const today = new Date();
                const upcomingDays = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(today.getDate() + i);
                    upcomingDays.push(`-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                }
                andConditions.push({
                    OR: upcomingDays.map(day => ({ dob: { contains: day } }))
                });
            } else {
                andConditions.push({ dob: { contains: String(dob) } });
            }
        }

        if (anniversaryStart || anniversaryEnd) {
            const cond = getRecurringDateConditions(String(anniversaryStart || '1900-01-01'), String(anniversaryEnd || '2100-12-31'), 'anniversary');
            if (cond) andConditions.push(cond);
        } else if (anniversary) {
            if (anniversary === 'upcoming') {
                const today = new Date();
                const upcomingDays = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(today.getDate() + i);
                    upcomingDays.push(`-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                }
                andConditions.push({
                    OR: upcomingDays.map(day => ({ anniversary: { contains: day } }))
                });
            } else {
                andConditions.push({ anniversary: { contains: String(anniversary) } });
            }
        }

        // New: Pooja Last Year Filter
        if (req.query.filterType === 'pooja_last_year') {
            const lastYear = new Date().getFullYear() - 1;
            const startOfLastYear = new Date(lastYear, 0, 1);
            const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);

            const lastYearBookers = await prisma.poojaBooking.findMany({
                where: {
                    createdAt: {
                        gte: startOfLastYear,
                        lte: endOfLastYear
                    },
                    status: 'COMPLETED'
                },
                select: { userId: true }
            });

            const uniqueUserIds = Array.from(new Set(lastYearBookers.map(b => b.userId)));
            andConditions.push({ id: { in: uniqueUserIds } });
        }

        if (startDate || endDate) {
            const createdAt: any = {};
            if (startDate) createdAt.gte = new Date(String(startDate));
            if (endDate) createdAt.lte = new Date(String(endDate));
            andConditions.push({ createdAt });
        }

        const where: any = { AND: andConditions };

        const [users, total, filteredStats] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            bookings: { where: { status: { not: 'PENDING' } } },
                            orders: true,
                        }
                    }
                }
            }) as unknown as any[],


            prisma.user.count({ where }),
            prisma.user.aggregate({
                where,
                _count: {
                    id: true
                }
            })
        ]);

        // Get total bookings and orders count for the filtered users
        const filteredUserIds = await prisma.user.findMany({ where, select: { id: true } });
        const userIds = filteredUserIds.map(u => u.id);

        const [filteredBookings, filteredOrders] = await Promise.all([
            prisma.poojaBooking.count({
                where: {
                    userId: { in: userIds },
                    status: { not: 'PENDING' }
                }
            }),
            prisma.subOrder.count({
                where: {
                    order: {
                        userId: { in: userIds }
                    }
                }
            })
        ]);

        // Get stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Static stats (total counts)
        const [totalUsersCount, totalDevotees, totalInstitutions, totalSellers, newThisMonth] = await Promise.all([
            prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
            prisma.user.count({ where: { role: 'DEVOTEE' } }),
            prisma.user.count({ where: { role: 'INSTITUTION' } }),
            prisma.user.count({ where: { role: 'SELLER' } }),
            prisma.user.count({
                where: {
                    role: { not: 'ADMIN' },
                    createdAt: { gte: startOfMonth }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    bookings: user._count.bookings,
                    orders: user._count.orders,
                    joinedDate: user.createdAt,
                    dob: user.dob,
                    anniversary: user.anniversary,
                    profileImage: user.profileImage,
                    isActive: user.isActive,
                })),
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / take)
                },
                stats: {
                    totalUsers: totalUsersCount, // Global total
                    totalDevotees,
                    totalInstitutions,
                    totalSellers,
                    newThisMonth,
                    filteredCount: total, // Count for current search/filter
                    filteredBookings,
                    filteredOrders
                }
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getUserDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: id as string },
            include: {
                bookings: {
                    where: {
                        status: { not: 'PENDING' }
                    },
                    include: {
                        pooja: {
                            select: { name: true }
                        },
                        temple: {
                            select: { name: true }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                orders: {
                    where: {
                        OR: [
                            { paymentMethod: 'COD' },
                            { paymentStatus: 'PAID' }
                        ]
                    },
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
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                donations: {
                    where: {
                        status: 'SUCCESS'
                    },
                    include: {
                        temple: {
                            select: { name: true }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                sellerProfile: {
                    include: {
                        products: true,
                        withdrawals: true,
                    }
                },
                temple: {
                    include: {
                        poojas: true,
                        products: true,
                        bookings: true,
                        withdrawals: true,
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user detail:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const downloadUsersExcel = async (req: Request, res: Response) => {
    try {
        const { search = '', role, startDate, endDate, dob, anniversary, dobStart, dobEnd, anniversaryStart, anniversaryEnd } = req.query;

        const where: any = { role: { not: 'ADMIN' } };
        if (role && role !== 'all') {
            if (role === 'institution') where.role = UserRole.INSTITUTION;
            else if (role === 'devotee') where.role = UserRole.DEVOTEE;
            else if (role === 'seller') where.role = UserRole.SELLER;
        }

        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (dobStart || dobEnd) {
            const cond = getRecurringDateConditions(String(dobStart || '1900-01-01'), String(dobEnd || '2100-12-31'), 'dob');
            if (cond) where.AND = [...(where.AND || []), cond];
        } else if (dob) {
            where.dob = { contains: String(dob) };
        }

        if (anniversaryStart || anniversaryEnd) {
            const cond = getRecurringDateConditions(String(anniversaryStart || '1900-01-01'), String(anniversaryEnd || '2100-12-31'), 'anniversary');
            if (cond) where.AND = [...(where.AND || []), cond];
        } else if (anniversary) {
            where.anniversary = { contains: String(anniversary) };
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
        }

        const usersList = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, include: { _count: { select: { bookings: true, orders: true } } } });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users Report');
        worksheet.columns = [
            { header: 'User ID', key: 'id', width: 25 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Role', key: 'role', width: 15 },
            { header: 'Date of Birth', key: 'dob', width: 15 },
            { header: 'Anniversary', key: 'anniversary', width: 15 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Bookings', key: 'bookings', width: 12 },
            { header: 'Orders', key: 'orders', width: 12 },
            { header: 'Joined Date', key: 'joined', width: 20 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF794A05' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        usersList.forEach((u) => {
            worksheet.addRow({
                id: u.id,
                name: u.name || "N/A",
                email: u.email || "N/A",
                phone: u.phone || "N/A",
                role: u.role,
                dob: u.dob ? new Date(u.dob).toLocaleDateString() : 'N/A',
                anniversary: u.anniversary ? new Date(u.anniversary).toLocaleDateString() : 'N/A',
                address: u.address || "N/A",
                bookings: u._count.bookings,
                orders: u._count.orders,
                joined: new Date(u.createdAt).toLocaleString(),
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().slice(0, 10)}.xlsx`);

        return res.status(200).send(buffer);
    } catch (error: any) {
        console.error("Users Export Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await prisma.user.update({
            where: { id: id as string },
            data: { isActive },
            select: { id: true, isActive: true }
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const bulkToggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { ids, isActive } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty user IDs' });
        }

        await prisma.user.updateMany({
            where: { id: { in: ids } },
            data: { isActive }
        });

        res.json({
            success: true,
            message: `${ids.length} users ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Error bulk toggling user status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const downloadUsersAiSensyCSV = async (req: Request, res: Response) => {
    try {
        const { ids, search, role, dob, anniversary, dobStart, dobEnd, anniversaryStart, anniversaryEnd, filterType } = req.query;
        const andConditions: any[] = [{ role: { not: 'ADMIN' } }];

        if (ids) {
            const idList = String(ids).split(',');
            andConditions.push({ id: { in: idList } });
        } else {
            if (role && role !== 'all') {
                if (role === 'institution' || role === 'temple_admin') andConditions.push({ role: UserRole.INSTITUTION });
                else if (role === 'devotee') andConditions.push({ role: UserRole.DEVOTEE });
                else if (role === 'seller') andConditions.push({ role: UserRole.SELLER });
            }
            if (search) {
                andConditions.push({
                    OR: [
                        { name: { contains: String(search), mode: 'insensitive' } },
                        { email: { contains: String(search), mode: 'insensitive' } },
                        { phone: { contains: String(search), mode: 'insensitive' } },
                    ]
                });
            }
            if (dobStart || dobEnd) {
                const cond = getRecurringDateConditions(String(dobStart || '1900-01-01'), String(dobEnd || '2100-12-31'), 'dob');
                if (cond) andConditions.push(cond);
            } else if (dob) {
                if (dob === 'upcoming') {
                    const today = new Date();
                    const upcomingDays = [];
                    for (let i = 0; i < 7; i++) {
                        const d = new Date(); d.setDate(today.getDate() + i);
                        upcomingDays.push(`-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                    }
                    andConditions.push({ OR: upcomingDays.map(day => ({ dob: { contains: day } })) });
                } else {
                    andConditions.push({ dob: { contains: String(dob) } });
                }
            }
            if (anniversaryStart || anniversaryEnd) {
                const cond = getRecurringDateConditions(String(anniversaryStart || '1900-01-01'), String(anniversaryEnd || '2100-12-31'), 'anniversary');
                if (cond) andConditions.push(cond);
            } else if (anniversary) {
                andConditions.push({ anniversary: { contains: String(anniversary) } });
            }
            if (filterType === 'pooja_last_year') {
                const lastYear = new Date().getFullYear() - 1;
                const startOfLastYear = new Date(lastYear, 0, 1);
                const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);
                const lastYearBookers = await prisma.poojaBooking.findMany({
                    where: { createdAt: { gte: startOfLastYear, lte: endOfLastYear }, status: 'COMPLETED' },
                    select: { userId: true }
                });
                const uniqueUserIds = Array.from(new Set(lastYearBookers.map(b => b.userId)));
                andConditions.push({ id: { in: uniqueUserIds } });
            }
        }

        const usersList = await prisma.user.findMany({
            where: { AND: andConditions },
            orderBy: { name: 'asc' },
            select: {
                name: true,
                phone: true,
                email: true,
                role: true,
                dob: true,
                anniversary: true,
                nativePlace: true
            }
        });

        let csvContent = "destination,userName,email,role,dob,anniversary,nativePlace\n";
        usersList.forEach(u => {
            const phone = u.phone ? (u.phone.startsWith('+') ? u.phone : `+91${u.phone}`) : '';
            if (phone) {
                const safeName = u.name?.replace(/"/g, '""') || 'Bhakt';
                const safeEmail = u.email || '';
                const safeRole = u.role || '';
                const safeDob = u.dob || '';
                const safeAnniversary = u.anniversary || '';
                const safeNativePlace = u.nativePlace?.replace(/"/g, '""') || '';

                csvContent += `${phone},"${safeName}","${safeEmail}","${safeRole}","${safeDob}","${safeAnniversary}","${safeNativePlace}"\n`;
            }
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=aisensy_export_${new Date().toISOString().slice(0, 10)}.csv`);

        return res.status(200).send(csvContent);
    } catch (error: any) {
        console.error("AiSensy Export Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
