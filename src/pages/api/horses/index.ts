import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const createHorseSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Horse name must be between 2 and 100 characters',
  },
  breed: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Breed must be between 2 and 100 characters',
  },
  color: {
    required: false,
    type: 'string',
    maxLength: 100,
  },
};

async function handleGetHorses(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '10')));
    const skip = (page - 1) * pageSize;

    const { search, riderId, breed } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (riderId) {
      where.riderId = riderId as string;
    }

    if (breed) {
      where.breed = { contains: breed as string, mode: 'insensitive' };
    }

    const [horses, total] = await Promise.all([
      prisma.horse.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          breed: true,
          color: true,
          registrationNumber: true,
          rider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.horse.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Horses retrieved successfully', {
      data: horses,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError(error, 'handleGetHorses');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateHorse(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      name,
      breed,
      color,
      registrationNumber,
      dateOfBirth,
      riderId,
      description,
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { name, breed, color },
      createHorseSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Verify rider exists if riderId provided
    if (riderId) {
      const rider = await prisma.rider.findUnique({
        where: { id: riderId },
      });

      if (!rider) {
        return sendErrorResponse(res, 400, 'Rider not found', ErrorCode.BAD_REQUEST);
      }
    }

    // Check for duplicate registration number if provided
    if (registrationNumber) {
      const existingHorse = await prisma.horse.findFirst({
        where: { registrationNumber },
      });

      if (existingHorse) {
        return sendErrorResponse(
          res,
          400,
          'Registration number already in use',
          ErrorCode.BAD_REQUEST
        );
      }
    }

    const horse = await prisma.horse.create({
      data: {
        name,
        breed,
        color,
        registrationNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        description,
        riderId,
      },
      include: {
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return sendSuccessResponse(res, 201, 'Horse created successfully', horse);
  } catch (error) {
    logError(error, 'handleCreateHorse');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetHorses(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateHorse(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
