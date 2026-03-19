import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }

  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '20', unreadOnly } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = { userId };
      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Notifications retrieved',
        statusCode: 200,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Notifications GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  // POST: Mark notifications as read
  if (req.method === 'POST') {
    try {
      const { notificationIds, markAll } = req.body;

      if (markAll) {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        await prisma.notification.updateMany({
          where: { id: { in: notificationIds }, userId },
          data: { isRead: true },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Provide notificationIds array or markAll flag',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notifications marked as read',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Notifications POST error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update notifications',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    error: 'METHOD_NOT_ALLOWED',
    statusCode: 405,
  });
}

export default withAuth(handler);
