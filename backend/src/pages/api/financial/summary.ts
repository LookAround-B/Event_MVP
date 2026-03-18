import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withPermission } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

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
    const { startDate, endDate } = req.query;

    const where = {
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) }),
        },
      } : {}),
    };

    // Get transaction aggregates by status
    const [statisticsByStatus, transactionsByMethod, totalStats] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['status'],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.transaction.findMany({
        where,
        select: { paymentMethod: true, totalAmount: true },
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    // Calculate totals by status
    const totalsByStatus = statisticsByStatus.reduce((acc, stat) => ({
      ...acc,
      [stat.status]: stat._sum.totalAmount || 0,
    }), {});

    // Calculate totals by payment method
    const totalsByMethod = transactionsByMethod.reduce((acc, trans) => {
      const method = trans.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + trans.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      success: true,
      message: 'Financial summary retrieved successfully',
      statusCode: 200,
      data: {
        summary: {
          totalRevenue: totalStats._sum.totalAmount || 0,
          totalTransactions: totalStats._count.id || 0,
          averageTransaction: totalStats._count.id > 0 ? (totalStats._sum.totalAmount || 0) / totalStats._count.id : 0,
        },
        byStatus: totalsByStatus,
        byMethod: totalsByMethod,
        breakdown: {
          byStatus: statisticsByStatus,
          byPaymentMethod: Object.entries(totalsByMethod).map(([method, total]) => ({
            method,
            total,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Financial summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve financial summary',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withPermission('View', 'Financial')(handler);
