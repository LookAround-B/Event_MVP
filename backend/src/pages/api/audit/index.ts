import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { ApiResponse } from '@/types';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { ErrorCode, logError } from '@/lib/errors';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';

interface AuditLogEntry {
  id: string;
  entity: string;
  action: string;
  entityId: string;
  changes: string[];
  oldValues: any;
  newValues: any;
  userId: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

async function handleAuditLogs(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<AuditLogEntry[] | null>>
) {
  if (req.method !== 'GET') {
    return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
  }

  try {
    const { page = 1, limit = 20, entity, action } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          entity: true,
          action: true,
          entityId: true,
          changes: true,
          oldValues: true,
          newValues: true,
          userId: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Audit logs fetched successfully', {
      data: auditLogs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })) as AuditLogEntry[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    } as any);
  } catch (error) {
    logError(error, 'handleAuditLogs');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export default withApiHandler(withRole('admin')(handleAuditLogs), {
  allowedMethods: ['GET', 'OPTIONS'],
});
