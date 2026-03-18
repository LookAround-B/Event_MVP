import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id: userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'User ID is required', statusCode: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: { select: { id: true, name: true } } },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', statusCode: 404 });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'User roles retrieved',
      statusCode: 200,
      data: user.roles,
    });
  }

  if (req.method === 'PUT') {
    try {
      const { roleIds } = req.body;

      if (!Array.isArray(roleIds)) {
        return res.status(400).json({
          success: false,
          message: 'roleIds must be an array of role IDs',
          statusCode: 400,
        });
      }

      // Verify all role IDs exist
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true },
      });

      if (roles.length !== roleIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more role IDs are invalid',
          statusCode: 400,
        });
      }

      // Update user roles (disconnect all, reconnect selected)
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          roles: {
            set: roleIds.map((id: string) => ({ id })),
          },
        },
        select: {
          id: true,
          email: true,
          roles: { select: { id: true, name: true } },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'User roles updated successfully',
        statusCode: 200,
        data: updated,
      });
    } catch (error) {
      console.error('User roles PUT error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update roles', statusCode: 500 });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed', statusCode: 405 });
}

export default withRole('admin')(handler);
