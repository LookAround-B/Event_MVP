import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    return withAuth(async (authReq, authRes) => {
      try {
        const userId = authReq.user?.id;

        if (!userId) {
          return authRes.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'UNAUTHORIZED',
            statusCode: 401,
          });
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            eId: true,
            email: true,
            firstName: true,
            lastName: true,
            designation: true,
            phone: true,
            optionalPhone: true,
            gender: true,
            dob: true,
            address: true,
            efiRiderId: true,
            imageUrl: true,
            isGoogleAuth: true,
            createdAt: true,
            roles: {
              select: { name: true },
            },
          },
        });

        if (!user) {
          return authRes.status(404).json({
            success: false,
            message: 'User not found',
            error: 'NOT_FOUND',
            statusCode: 404,
          });
        }

        return authRes.status(200).json({
          success: true,
          message: 'User profile retrieved successfully',
          statusCode: 200,
          data: {
            ...user,
            role: user.roles?.[0]?.name || 'rider',
          },
        });
      } catch (error) {
        console.error('User profile GET error:', error);
        return authRes.status(500).json({
          success: false,
          message: 'Failed to retrieve user profile',
          error: 'INTERNAL_ERROR',
          statusCode: 500,
        });
      }
    })(req, res);
  }

  if (req.method === 'PUT') {
    return withAuth(async (authReq, authRes) => {
      try {
        const userId = authReq.user?.id;
        const { firstName, lastName, designation, phone, optionalPhone, gender, address, dob, efiRiderId, imageUrl } = authReq.body;

        if (!userId) {
          return authRes.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: 'UNAUTHORIZED',
            statusCode: 401,
          });
        }

        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(designation !== undefined && { designation }),
            ...(phone !== undefined && { phone }),
            ...(optionalPhone !== undefined && { optionalPhone }),
            ...(gender !== undefined && { gender }),
            ...(address !== undefined && { address }),
            ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
            ...(efiRiderId !== undefined && { efiRiderId }),
            ...(imageUrl !== undefined && { imageUrl }),
          },
          select: {
            id: true,
            eId: true,
            email: true,
            firstName: true,
            lastName: true,
            designation: true,
            phone: true,
            optionalPhone: true,
            gender: true,
            dob: true,
            address: true,
            efiRiderId: true,
            imageUrl: true,
            isGoogleAuth: true,
            createdAt: true,
            roles: {
              select: { name: true },
            },
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            userId: userId,
            action: 'ProfileUpdated',
            entity: 'User',
            entityId: userId,
            newValues: user,
          },
        }).catch(err => console.error('Audit log error:', err));

        return authRes.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          statusCode: 200,
          data: user,
        });
      } catch (error) {
        console.error('User profile PUT error:', error);
        return authRes.status(500).json({
          success: false,
          message: 'Failed to update profile',
          error: 'INTERNAL_ERROR',
          statusCode: 500,
        });
      }
    })(req, res);
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    error: 'METHOD_NOT_ALLOWED',
    statusCode: 405,
  });
}

export default handler;
