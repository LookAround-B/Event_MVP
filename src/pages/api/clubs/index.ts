import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError, commonSchemas } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';
import { ApiResponse } from '@/types';

const createClubSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200,
    message: 'Club name must be between 3 and 200 characters',
  },
  location: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200,
    message: 'Location must be between 3 and 200 characters',
  },
  primaryContactName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Primary contact name must be between 2 and 100 characters',
  },
  primaryContactEmail: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
  },
  primaryContactPhone: {
    required: false,
    type: 'string',
    pattern: /^[\d\s\-\+\(\)]+$/,
    message: 'Invalid phone format',
  },
};

async function handleGetClubs(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '10')));
    const skip = (page - 1) * pageSize;

    const { search, location } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { primaryContactName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    const [clubs, total] = await Promise.all([
      prisma.club.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          primaryContact: {
            select: {
              id: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              riders: true,
              horses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.club.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Clubs retrieved successfully', {
      data: clubs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError(error, 'handleGetClubs');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateClub(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      name,
      location,
      description,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      {
        name,
        location,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
      },
      createClubSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: primaryContactEmail },
    });

    if (existingUser) {
      return sendErrorResponse(
        res,
        400,
        'Email already registered',
        ErrorCode.DUPLICATE_EMAIL
      );
    }

    // Hash password for primary contact
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create club with primary contact user
    const club = await prisma.club.create({
      data: {
        name,
        location,
        description,
        primaryContactName,
        primaryContact: {
          create: {
            email: primaryContactEmail,
            phone: primaryContactPhone,
            password: hashedPassword,
            firstName: primaryContactName.split(' ')[0],
            lastName: primaryContactName.split(' ').slice(1).join(' ') || '',
            isActive: true,
            roles: {
              connect: {
                name: 'CLUB_MANAGER',
              },
            },
          },
        },
      },
      include: {
        primaryContact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        _count: {
          select: {
            riders: true,
            horses: true,
          },
        },
      },
    });

    return sendSuccessResponse(res, 201, 'Club created successfully', {
      ...club,
      tempPassword: tempPassword, // Send temp password - should be sent via email in production
    });
  } catch (error) {
    logError(error, 'handleCreateClub');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetClubs(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateClub(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
