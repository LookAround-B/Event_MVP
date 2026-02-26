import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware, withAuthMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const createRiderSchema = {
  firstName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'First name must be between 2 and 100 characters',
  },
  lastName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Last name must be between 2 and 100 characters',
  },
  email: {
    required: false,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
  },
  phone: {
    required: false,
    type: 'string',
    pattern: /^[\d\s\-\+\(\)]+$/,
    message: 'Invalid phone format',
  },
};

async function handleGetRiders(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '10')));
    const skip = (page - 1) * pageSize;

    const { search, clubId, competitionLevel } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (clubId) {
      where.clubId = clubId as string;
    }

    if (competitionLevel) {
      where.competitionLevel = competitionLevel as string;
    }

    const [riders, total] = await Promise.all([
      prisma.rider.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          club: {
            select: { id: true, name: true },
          },
          horses: {
            select: { id: true, name: true },
          },
          registrations: {
            select: { id: true, event: { select: { id: true, name: true } } },
          },
          _count: {
            select: {
              horses: true,
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rider.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Riders retrieved successfully', {
      data: riders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError(error, 'handleGetRiders');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateRider(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      clubId,
      competitionLevel,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { firstName, lastName, email, phone },
      createRiderSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Check for duplicate email if provided
    if (email) {
      const existingRider = await prisma.rider.findFirst({
        where: { email },
      });

      if (existingRider) {
        return sendErrorResponse(
          res,
          400,
          'Email already registered',
          ErrorCode.DUPLICATE_EMAIL
        );
      }
    }

    // Verify club exists if clubId provided
    if (clubId) {
      const club = await prisma.club.findUnique({
        where: { id: clubId },
      });

      if (!club) {
        return sendErrorResponse(res, 400, 'Club not found', ErrorCode.BAD_REQUEST);
      }
    }

    const rider = await prisma.rider.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        clubId,
        competitionLevel,
        emergencyContactName,
        emergencyContactPhone,
      },
      include: {
        club: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            horses: true,
            registrations: true,
          },
        },
      },
    });

    return sendSuccessResponse(res, 201, 'Rider created successfully', rider);
  } catch (error) {
    logError(error, 'handleCreateRider');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetRiders(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateRider(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
