import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const createUserSchema = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
  },
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
  roleId: {
    required: true,
    type: 'string',
    message: 'Role ID is required',
  },
};

async function handleGetUsers(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt((req.query.pageSize as string) || '10')));
    const skip = (page - 1) * pageSize;

    const { search, roleId, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccessResponse(res, 200, 'Users retrieved successfully', {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logError(error, 'handleGetUsers');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      roleIds = [],
    } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { email, firstName, lastName },
      createUserSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Check email doesn't already exist
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendErrorResponse(
        res,
        400,
        'Email already registered',
        ErrorCode.DUPLICATE_EMAIL
      );
    }

    // Verify all roles exist if provided
    if (roleIds.length > 0) {
      const roleCount = await prisma.role.count({
        where: {
          id: {
            in: roleIds,
          },
        },
      });

      if (roleCount !== roleIds.length) {
        return sendErrorResponse(res, 400, 'One or more roles not found', ErrorCode.BAD_REQUEST);
      }
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const hashedPassword = require('bcryptjs').hashSync(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        password: hashedPassword,
        isActive: true,
        roles: {
          connect: roleIds.map((id: string) => ({ id })),
        },
      },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return sendSuccessResponse(res, 201, 'User created successfully', {
      ...userWithoutPassword,
      tempPassword: tempPassword, // Should be sent via email in production
    });
  } catch (error) {
    logError(error, 'handleCreateUser');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetUsers(req, res);
  }

  if (req.method === 'POST') {
    return handleCreateUser(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
  }
);
