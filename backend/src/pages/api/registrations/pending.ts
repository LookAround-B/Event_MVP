import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
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
    const { page = '1', limit = '20', eventId, approvalStatus = 'PENDING' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (approvalStatus && approvalStatus !== 'ALL') {
      where.approvalStatus = approvalStatus as string;
    }
    if (eventId) {
      where.eventId = eventId as string;
    }

    const [registrations, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          rider: { select: { id: true, firstName: true, lastName: true, email: true } },
          horse: { select: { id: true, name: true, color: true } },
          event: { select: { id: true, name: true, startDate: true } },
          category: { select: { id: true, name: true, price: true } },
          club: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.registration.count({ where }),
      prisma.registration.count({ where: { ...where, approvalStatus: 'PENDING' } }),
      prisma.registration.count({ where: { ...where, approvalStatus: 'APPROVED' } }),
      prisma.registration.count({ where: { ...where, approvalStatus: 'REJECTED' } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Pending approvals retrieved successfully',
      statusCode: 200,
      data: {
        registrations,
        counts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Pending approvals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending approvals',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withAuth(handler);
