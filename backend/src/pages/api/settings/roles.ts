import type { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    try {
      const roles = await prisma.role.findMany({
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Roles retrieved successfully',
        data: roles,
      });
    } catch (error) {
      console.error('GET roles error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve roles',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Role name is required',
        });
      }

      const role = await prisma.role.create({
        data: { name: name.trim(), description: description || null },
      });

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      console.error('POST role error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to create role',
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Role ID is required',
        });
      }

      await prisma.role.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      console.error('DELETE role error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to delete role',
      });
    }
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${req.method} not allowed`,
  });
}

export default withRole('admin')(handler);
