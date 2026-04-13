import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function canAccessHorse(req: AuthenticatedRequest, horseId: string) {
  if (!req.user?.id || !req.user.role || req.user.role === 'admin') {
    return true;
  }

  const horse = await prisma.horse.findUnique({
    where: { id: horseId },
    select: { riderId: true, clubId: true, ownerId: true },
  });

  if (!horse) return false;

  if (horse.ownerId === req.user.id) {
    return true;
  }

  if (req.user.role === 'rider') {
    const rider = await prisma.rider.findFirst({
      where: { userId: req.user.id },
      select: { id: true },
    });
    return horse.riderId === rider?.id;
  }

  if (req.user.role === 'club') {
    const club = await prisma.club.findFirst({
      where: { primaryContactId: req.user.id },
      select: { id: true },
    });
    return horse.clubId === club?.id;
  }

  return false;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query;
  const horseId = id as string;

  if (req.method === 'GET') {
    try {
      if (!(await canAccessHorse(req, horseId))) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          error: 'FORBIDDEN',
          statusCode: 403,
        });
      }

      const horse = await prisma.horse.findUnique({
        where: { id: horseId },
        include: {
          registrations: {
            include: {
              event: true,
              rider: true,
            },
          },
        },
      });

      if (!horse) {
        return res.status(404).json({
          success: false,
          message: 'Horse not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Horse retrieved successfully',
        statusCode: 200,
        data: horse,
      });
    } catch (error) {
      console.error('Horse GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve horse',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      if (!(await canAccessHorse(req, horseId))) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          error: 'FORBIDDEN',
          statusCode: 403,
        });
      }

      const { name, breed, color, height, gender, yearOfBirth, passportNumber, horseCode, riderId, embassyId } = req.body;

      // Check if horse exists
      const existingHorse = await prisma.horse.findUnique({
        where: { id: horseId },
      });

      if (!existingHorse) {
        return res.status(404).json({
          success: false,
          message: 'Horse not found',
          error: 'NOT_FOUND',
          statusCode: 404,
        });
      }

      // Validate embassyId format if provided
      if (embassyId && typeof embassyId === 'string' && !/^EIRSHR\d{5}$/.test(embassyId)) {
        return res.status(400).json({
          success: false,
          message: 'Embassy ID must be in format EIRSHR00000 (e.g., EIRSHR00076)',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
        });
      }

      // Check embassyId uniqueness if changed
      if (embassyId && embassyId !== existingHorse.embassyId) {
        const existingEmbassy = await prisma.horse.findUnique({ where: { embassyId } });
        if (existingEmbassy) {
          return res.status(400).json({
            success: false,
            message: 'Embassy ID already in use',
            error: 'VALIDATION_ERROR',
            statusCode: 400,
          });
        }
      }

      const horse = await prisma.horse.update({
        where: { id: horseId },
        data: {
          ...(name && { name: name.trim() }),
          ...(breed !== undefined && { breed: breed || null }),
          ...(color !== undefined && { color: color || null }),
          ...(height !== undefined && { height: height ? parseFloat(height) : null }),
          ...(gender && { gender }),
          ...(yearOfBirth !== undefined && { yearOfBirth: yearOfBirth ? parseInt(yearOfBirth) : null }),
          ...(passportNumber !== undefined && { passportNumber: passportNumber || null }),
          ...(horseCode !== undefined && { horseCode: horseCode || null }),
          ...(embassyId !== undefined && { embassyId: embassyId || null }),
          ...(riderId !== undefined && { riderId: riderId || null }),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Horse updated successfully',
        statusCode: 200,
        data: horse,
      });
    } catch (error) {
      console.error('Horse PUT error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update horse',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      if (!(await canAccessHorse(req, horseId))) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          error: 'FORBIDDEN',
          statusCode: 403,
        });
      }

      await prisma.horse.delete({
        where: { id: horseId },
      });

      return res.status(200).json({
        success: true,
        message: 'Horse deleted successfully',
        statusCode: 200,
      });
    } catch (error) {
      console.error('Horse DELETE error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete horse',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    error: 'METHOD_NOT_ALLOWED',
    statusCode: 405,
  });
}

export default withAuth(handler);
