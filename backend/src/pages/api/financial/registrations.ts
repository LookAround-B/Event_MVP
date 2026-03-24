import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withPermission } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';
import { PaymentStatus } from '@prisma/client';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED',
      statusCode: 405,
    });
  }

  try {
    const { page = '1', limit = '15', eventId, categoryId, paymentStatus } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 15));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      ...(eventId && { eventId: eventId as string }),
      ...(categoryId && { categoryId: categoryId as string }),
      ...(paymentStatus && { paymentStatus: (paymentStatus as string).toUpperCase() as PaymentStatus }),
    };

    const [registrations, total, events, categories] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          event: { select: { id: true, name: true, startDate: true } },
          rider: { select: { id: true, firstName: true, lastName: true } },
          club: { select: { id: true, name: true } },
          horse: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.registration.count({ where }),
      prisma.event.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.eventCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Financial registrations retrieved successfully',
      statusCode: 200,
      data: {
        registrations,
        events,
        categories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Financial registrations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve financial registrations',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withPermission('View', 'Financial')(handler);
