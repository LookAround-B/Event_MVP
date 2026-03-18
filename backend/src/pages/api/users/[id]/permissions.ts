import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

// Standard permission matrix
const RESOURCES = ['Event', 'Registration', 'Financial', 'User', 'Rider', 'Horse', 'Club', 'Stable', 'Settings'] as const;
const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Export'] as const;

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id: userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'User ID is required', statusCode: 400 });
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', statusCode: 404 });
  }

  if (req.method === 'GET') {
    try {
      const permissions = await prisma.permission.findMany({
        where: { userId },
        select: { id: true, action: true, resource: true, isGranted: true },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });

      return res.status(200).json({
        success: true,
        message: 'Permissions retrieved successfully',
        statusCode: 200,
        data: {
          user: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` },
          permissions,
          availableResources: RESOURCES,
          availableActions: ACTIONS,
        },
      });
    } catch (error) {
      console.error('Permissions GET error:', error);
      return res.status(500).json({ success: false, message: 'Failed to retrieve permissions', statusCode: 500 });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'permissions must be an array of { action, resource, isGranted }',
          statusCode: 400,
        });
      }

      // Validate all entries
      for (const perm of permissions) {
        if (!perm.action || !perm.resource || typeof perm.isGranted !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: 'Each permission must have action, resource, and isGranted (boolean)',
            statusCode: 400,
          });
        }
      }

      // Upsert each permission
      const results = await Promise.all(
        permissions.map((perm: { action: string; resource: string; isGranted: boolean }) =>
          prisma.permission.upsert({
            where: {
              userId_action_resource: {
                userId,
                action: perm.action,
                resource: perm.resource,
              },
            },
            update: { isGranted: perm.isGranted },
            create: {
              userId,
              action: perm.action,
              resource: perm.resource,
              isGranted: perm.isGranted,
            },
          })
        )
      );

      return res.status(200).json({
        success: true,
        message: 'Permissions updated successfully',
        statusCode: 200,
        data: results,
      });
    } catch (error) {
      console.error('Permissions PUT error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update permissions', statusCode: 500 });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 });
}

export default withRole('admin')(handler);
