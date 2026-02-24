import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * POST /api/notifications/register-token
 * Save FCM token for a user (devotee, admin, temple_admin)
 * Body: { token: string, userType: 'devotee' | 'admin' | 'temple_admin', userId: number }
 */
router.post('/register-token', async (req: Request, res: Response) => {
  const { token, userType, userId } = req.body;

  if (!token || !userType || !userId) {
    return res.status(400).json({ success: false, message: 'token, userType and userId are required' });
  }

  try {
    // Store token in DB - upsert to avoid duplicates
    await prisma.fCMToken.upsert({
      where: { token },
      update: {
        userType,
        userId: String(userId),
        updatedAt: new Date(),
      },
      create: {
        token,
        userType,
        userId: String(userId),
      },
    });

    return res.json({ success: true, message: 'FCM token registered' });
  } catch (error: any) {
    console.error('FCM token register error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to register token' });
  }
});

/**
 * DELETE /api/notifications/remove-token
 * Remove FCM token when user logs out
 */
router.delete('/remove-token', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'token is required' });
  }

  try {
    await prisma.fCMToken.deleteMany({ where: { token } });
    return res.json({ success: true, message: 'FCM token removed' });
  } catch (error: any) {
    console.error('FCM token remove error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to remove token' });
  }
});

/**
 * GET /api/notifications
 * Fetch notifications for a user
 * Query: ?userId=xxx&userType=xxx&page=1&limit=20
 */
router.get('/', async (req: Request, res: Response) => {
  const { userId, userType } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  if (!userId || !userType) {
    return res.status(400).json({ success: false, message: 'userId and userType are required' });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: String(userId),
        userType: String(userType)
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: String(userId),
        userType: String(userType),
        isRead: false
      }
    });

    return res.json({ 
      success: true, 
      data: notifications,
      unreadCount
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.notification.update({
      where: { id: id as string },
      data: { isRead: true }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications for a user as read
 */
router.patch('/mark-all-read', async (req: Request, res: Response) => {
  const { userId, userType } = req.body;

  try {
    await prisma.notification.updateMany({
      where: { 
        userId: String(userId),
        userType: String(userType),
        isRead: false
      },
      data: { isRead: true }
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
