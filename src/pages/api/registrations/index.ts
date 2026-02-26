import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const createRegistrationSchema = {
  eventId: {
    required: true,
    type: 'string',
    message: 'Event ID is required',
  },
  riderId: {
    required: true,
    type: 'string',
    message: 'Rider ID is required',
  },
  horseId: {
    required: true,
    type: 'string',
    message: 'Horse ID is required',
  },
  categoryId: {
    required: true,
    type: 'string',
    message: 'Category ID is required',
  },
};

async function handleGetRegistrations(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '10')));
    const skip = (page - 1) * pageSize;

    const { eventId, riderId, paymentStatus } = req.query;

    const where: any = {};

    if (eventId) {
      where.eventId = eventId as string;
    }

    if (riderId) {
      where.riderId = riderId as string;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as string;
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
          rider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              club: { select: { id: true, name: true } },
            },
          },
          horse: {
            select: {
              id: true,
              name: true,
              breed: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.registration.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Registrations retrieved successfully', {
      data: registrations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError(error, 'handleGetRegistrations');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateRegistration(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      eventId,
      riderId,
      horseId,
      categoryId,
      fee = 0,
      gst = 0,
      notes,
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { eventId, riderId, horseId, categoryId },
      createRegistrationSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Verify all entities exist
    const [event, rider, horse, category] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.rider.findUnique({ where: { id: riderId } }),
      prisma.horse.findUnique({ where: { id: horseId } }),
      prisma.eventCategory.findUnique({ where: { id: categoryId } }),
    ]);

    if (!event || !rider || !horse || !category) {
      return sendErrorResponse(
        res,
        400,
        'Invalid event, rider, horse, or category',
        ErrorCode.BAD_REQUEST
      );
    }

    // Check for duplicate registration
    const existingReg = await prisma.registration.findFirst({
      where: {
        eventId,
        riderId,
        horseId,
        categoryId,
      },
    });

    if (existingReg) {
      return sendErrorResponse(
        res,
        400,
        'Rider already registered for this event/category combination',
        ErrorCode.BAD_REQUEST
      );
    }

    const totalFee = fee + gst;

    const registration = await prisma.registration.create({
      data: {
        eventId,
        riderId,
        horseId,
        categoryId,
        fee,
        gst,
        totalAmount: totalFee,
        notes,
        paymentStatus: 'PENDING',
      },
      include: {
        event: {
          select: { id: true, name: true },
        },
        rider: {
          select: { id: true, firstName: true, lastName: true },
        },
        horse: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return sendSuccessResponse(res, 201, 'Registration created successfully', registration);
  } catch (error) {
    logError(error, 'handleCreateRegistration');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetRegistrations(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateRegistration(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
