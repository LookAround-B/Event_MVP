import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

async function handleGetEvent(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Event ID is required', ErrorCode.BAD_REQUEST);
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        categories: true,
        registrations: {
          include: {
            rider: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return sendErrorResponse(res, 404, 'Event not found', ErrorCode.NOT_FOUND);
    }

    return sendSuccessResponse(res, 200, 'Event retrieved successfully', event);
  } catch (error) {
    logError(error, 'handleGetEvent');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleUpdateEvent(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Event ID is required', ErrorCode.BAD_REQUEST);
    }

    // Verify event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return sendErrorResponse(res, 404, 'Event not found', ErrorCode.NOT_FOUND);
    }

    const {
      eventType,
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      venueName,
      venueAddress,
      venueLat,
      venueLng,
      termsAndConditions,
      isPublished,
      categoryIds = [],
    } = req.body || {};

    // Validate input - only required for create operations
    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length < 3 || name.length > 200) {
        return sendErrorResponse(res, 400, 'Event name must be between 3 and 200 characters', ErrorCode.BAD_REQUEST);
      }
      updates.name = name;
    }

    if (startDate !== undefined || endDate !== undefined) {
      const start = startDate ? new Date(startDate) : existingEvent.startDate;
      const end = endDate ? new Date(endDate) : existingEvent.endDate;

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return sendErrorResponse(res, 400, 'Invalid date format', ErrorCode.BAD_REQUEST);
      }

      if (start >= end) {
        return sendErrorResponse(res, 400, 'Start date must be before end date', ErrorCode.BAD_REQUEST);
      }

      if (startDate !== undefined) updates.startDate = start;
      if (endDate !== undefined) updates.endDate = end;
    }

    if (eventType !== undefined) updates.eventType = eventType;
    if (description !== undefined) updates.description = description;
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (venueName !== undefined) updates.venueName = venueName;
    if (venueAddress !== undefined) updates.venueAddress = venueAddress;
    if (venueLat !== undefined) updates.venueLat = parseFloat(venueLat);
    if (venueLng !== undefined) updates.venueLng = parseFloat(venueLng);
    if (termsAndConditions !== undefined) updates.termsAndConditions = termsAndConditions;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    // Update categories if provided
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      updates.categories = {
        set: categoryIds.map((catId: string) => ({ id: catId })),
      };
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updates,
      include: {
        venue: true,
        categories: true,
      },
    });

    return sendSuccessResponse(res, 200, 'Event updated successfully', updatedEvent);
  } catch (error) {
    logError(error, 'handleUpdateEvent');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleDeleteEvent(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Event ID is required', ErrorCode.BAD_REQUEST);
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return sendErrorResponse(res, 404, 'Event not found', ErrorCode.NOT_FOUND);
    }

    if (event._count.registrations > 0) {
      return sendErrorResponse(
        res,
        400,
        'Cannot delete event with existing registrations. Please remove registrations first.',
        ErrorCode.BAD_REQUEST
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return sendSuccessResponse(res, 200, 'Event deleted successfully', { id });
  } catch (error) {
    logError(error, 'handleDeleteEvent');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetEvent(req, res);
  }

  if (req.method === 'PUT') {
    return handleUpdateEvent(req, res);
  }

  if (req.method === 'DELETE') {
    return handleDeleteEvent(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  {
    allowedMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
  }
);
