import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { ErrorCode, logError } from '@/lib/errors';

async function handleGetUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'User ID is required', ErrorCode.BAD_REQUEST);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found', ErrorCode.NOT_FOUND);
    }

    return sendSuccessResponse(res, 200, 'User retrieved successfully', user);
  } catch (error) {
    logError(error, 'handleGetUser');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleUpdateUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'User ID is required', ErrorCode.BAD_REQUEST);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return sendErrorResponse(res, 404, 'User not found', ErrorCode.NOT_FOUND);
    }

    const {
      email,
      firstName,
      lastName,
      phone,
      isActive,
      roleIds = [],
    } = req.body || {};

    // Check email uniqueness if updating
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return sendErrorResponse(
          res,
          400,
          'Email already in use',
          ErrorCode.DUPLICATE_EMAIL
        );
      }
    }

    // Verify roles exist if updating
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

    const updates: any = {};
    if (email !== undefined) updates.email = email;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (isActive !== undefined) updates.isActive = isActive;

    // Update roles if provided
    if (roleIds.length > 0) {
      updates.roles = {
        set: roleIds.map((roleId: string) => ({ id: roleId })),
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sendSuccessResponse(res, 200, 'User updated successfully', updatedUser);
  } catch (error) {
    logError(error, 'handleUpdateUser');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleDeleteUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'User ID is required', ErrorCode.BAD_REQUEST);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found', ErrorCode.NOT_FOUND);
    }

    // Prevent deletion of admin users with special permissions
    const adminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      const adminUserCount = await prisma.user.count({
        where: {
          roles: {
            some: {
              id: adminRole.id,
            },
          },
        },
      });

      if (adminUserCount <= 1) {
        const userRoles = await prisma.user.findUnique({
          where: { id },
          select: {
            roles: {
              where: { id: adminRole.id },
            },
          },
        });

        if (userRoles?.roles.length === 1) {
          return sendErrorResponse(
            res,
            400,
            'Cannot delete the last admin user',
            ErrorCode.BAD_REQUEST
          );
        }
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return sendSuccessResponse(res, 200, 'User deleted successfully', { id });
  } catch (error) {
    logError(error, 'handleDeleteUser');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetUser(req, res);
  }

  if (req.method === 'PUT') {
    return handleUpdateUser(req, res);
  }

  if (req.method === 'DELETE') {
    return handleDeleteUser(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  {
    allowedMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
  }
);
