import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '', role, startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: any = {
            role: {
                not: 'ADMIN' // Exclude admins from the general user list
            }
        };

        if (role && role !== 'all') {
            if (role === 'institution') {
                where.role = UserRole.INSTITUTION;
            } else if (role === 'devotee') {
                where.role = UserRole.DEVOTEE;
            } else if (role === 'seller') {
                where.role = UserRole.SELLER;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search), mode: 'insensitive' } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            bookings: true,
                            orders: true,
                        }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        // Get stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalUsers, totalDevotees, totalInstitutions, newThisMonth] = await Promise.all([
            prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
            prisma.user.count({ where: { role: 'DEVOTEE' } }),
            prisma.user.count({ where: { role: 'INSTITUTION' } }),
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
                    profileImage: user.profileImage,
                })),
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / take)
                },
                stats: {
                    totalUsers,
                    totalDevotees,
                    totalInstitutions,
                    newThisMonth
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
