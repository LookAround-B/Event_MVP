import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: {
          isApproved: false,
          profileComplete: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          profileComplete: true,
          createdAt: true,
          roles: {
            select: {
              name: true,
            },
            take: 1,
          },
          clubs: {
            select: {
              name: true,
              shortCode: true,
            },
            take: 1,
          },
          riders: {
            select: {
              efiRiderId: true,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Pending users retrieved successfully',
        data: pendingUsers.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          gender: user.gender,
          phone: user.phone,
          profileComplete: user.profileComplete,
          createdAt: user.createdAt,
          role: user.roles?.[0]?.name || 'rider',
          clubName: user.clubs?.[0]?.name || null,
          clubShortCode: user.clubs?.[0]?.shortCode || null,
          efiRiderId: user.riders?.[0]?.efiRiderId || null,
        })),
      });
    } catch (error) {
      console.error('GET pending users error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve pending users',
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User ID is required',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isApproved: true,
          profileComplete: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: 'User not found',
        });
      }

      if (user.isApproved) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User is already approved',
        });
      }

      if (!user.profileComplete) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User must complete their rider or club profile before approval',
        });
      }

      const approvedUser = await prisma.user.update({
        where: { id: userId },
        data: { isApproved: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isApproved: true,
        },
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User approved successfully',
        data: approvedUser,
      });
    } catch (error) {
      console.error('POST approve user error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to approve user',
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
