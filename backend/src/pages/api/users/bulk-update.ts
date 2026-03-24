import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const origin = req.headers.origin || 'http://localhost:4000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      statusCode: 405,
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    const { userIds, action, roleId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'userIds array is required and must not be empty',
      });
    }

    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Cannot update more than 100 users at once',
      });
    }

    // Validate all IDs are strings
    if (!userIds.every((id: unknown) => typeof id === 'string')) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'All userIds must be strings',
      });
    }

    const allowedActions = ['approve', 'deactivate', 'activate', 'assignRole'];
    if (!action || !allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Action must be one of: ${allowedActions.join(', ')}`,
      });
    }

    let result;

    switch (action) {
      case 'approve':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isApproved: true },
        });
        break;

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false },
        });
        break;

      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true },
        });
        break;

      case 'assignRole':
        if (!roleId || typeof roleId !== 'string') {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'roleId is required for assignRole action',
          });
        }

        // Verify role exists
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
          return res.status(404).json({
            success: false,
            statusCode: 404,
            message: 'Role not found',
          });
        }

        // Assign role to each user
        await Promise.all(
          userIds.map((userId: string) =>
            prisma.user.update({
              where: { id: userId },
              data: { roles: { connect: { id: roleId } } },
            })
          )
        );
        result = { count: userIds.length };
        break;
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Successfully updated ${result?.count || 0} users`,
      data: result,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to bulk update users',
    });
  }
}

export default withRole('admin')(handler);
