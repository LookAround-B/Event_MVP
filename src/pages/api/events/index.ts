import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError, commonSchemas } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';
import { ApiResponse } from '@/types';

const createEventSchema = {
  eventType: {
    required: true,
    type: 'string',
    custom: (value: string) => ['KSEC', 'EPL', 'EIRS Show'].includes(value),
    message: 'Invalid event type',
  },
  name: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200,
    message: 'Event name must be between 3 and 200 characters',
  },
  startDate: {
    required: true,
    type: 'string',
    message: 'Start date is required',
  },
  endDate: {
    required: true,
    type: 'string',
    message: 'End date is required',
  },
};

async function handleGetEvents(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt((req.query.pageSize as string) || '20')));
    const skip = (page - 1) * pageSize;

    const { search, status, eventType, startDate, endDate } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.isPublished = status === 'published';
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate as string) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate as string) };
    }

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          eId: true,
          name: true,
          eventType: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          venueName: true,
          venueAddress: true,
          isPublished: true,
          createdAt: true,
          categories: {
            select: { id: true, eId: true, name: true, price: true, isActive: true },
          },
          _count: { select: { registrations: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      prisma.event.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Events retrieved successfully', {
      data: events,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError(error, 'handleGetEvents');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateEvent(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
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
      categoryIds = [],
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { eventType, name, startDate, endDate },
      createEventSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return sendErrorResponse(res, 400, 'Invalid date format', ErrorCode.BAD_REQUEST);
    }

    if (parsedStartDate >= parsedEndDate) {
      return sendErrorResponse(res, 400, 'Start date must be before end date', ErrorCode.BAD_REQUEST);
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        eventType,
        name,
        description,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        startTime,
        endTime,
        venueName,
        venueAddress,
        venueLat: venueLat ? parseFloat(venueLat) : undefined,
        venueLng: venueLng ? parseFloat(venueLng) : undefined,
        termsAndConditions,
        categories: {
          connect: Array.isArray(categoryIds)
            ? categoryIds.map((id: string) => ({ id }))
            : [],
        },
      },
      include: {
        venue: true,
        categories: true,
      },
    });

    return sendSuccessResponse(res, 201, 'Event created successfully', event);
  } catch (error) {
    logError(error, 'handleCreateEvent');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetEvents(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateEvent(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
