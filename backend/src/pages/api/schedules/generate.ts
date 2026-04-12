import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { ApiResponse } from '@/types';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ErrorCode } from '@/lib/errors';
import { assignStartPositions } from '@/lib/scheduling';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { categoryId, eventId } = req.body as { categoryId?: string; eventId?: string };

  if (!categoryId || !eventId) {
    return sendErrorResponse(res, 400, 'categoryId and eventId are required', ErrorCode.VALIDATION_ERROR);
  }

  const entries = await prisma.registration.findMany({
    where: { eventId, categoryId },
    select: { id: true, riderId: true },
  });

  if (entries.length === 0) {
    return sendErrorResponse(
      res,
      400,
      `No registrations found for categoryId="${categoryId}" in eventId="${eventId}". Ensure registrations exist before generating a schedule.`,
      ErrorCode.VALIDATION_ERROR
    );
  }

  const positioned = assignStartPositions(entries);

  const updates = positioned.map(({ id, startPosition }) =>
    prisma.registration.update({
      where: { id },
      data: { startPosition, isScheduled: true },
      select: { id: true, riderId: true, startPosition: true },
    })
  );

  const results = await prisma.$transaction(updates);

  return sendSuccessResponse(res, 200, 'Schedule generated successfully', {
    success: true,
    count: results.length,
    schedule: results,
  });
}

export default withApiHandler(withRole('admin', 'club_manager')(handler), {
  allowedMethods: ['POST', 'OPTIONS'],
});
