import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { ApiResponse } from '@/types';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { ErrorCode } from '@/lib/errors';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { categoryId, eventId } = req.query as { categoryId: string; eventId?: string };

  if (!eventId) {
    return sendErrorResponse(res, 400, 'eventId query parameter is required', ErrorCode.VALIDATION_ERROR);
  }

  const entries = await prisma.registration.findMany({
    where: { categoryId, eventId },
    select: {
      id: true,
      startPosition: true,
      riderId: true,
      horseId: true,
      rider: { select: { firstName: true, lastName: true } },
      horse: { select: { name: true } },
    },
    orderBy: { startPosition: 'asc' },
  });

  return sendSuccessResponse(res, 200, 'Schedule retrieved successfully', entries);
}

export default withApiHandler(handler, {
  allowedMethods: ['GET', 'OPTIONS'],
});
