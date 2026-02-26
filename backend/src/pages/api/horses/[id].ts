import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id } = req.query;
  const horseId = id as string;

  if (req.method === 'GET') {
    try {
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
      const { name, color, gender, yearOfBirth, passportNumber, horseCode } = req.body;

      const validation = validateInput({
        name: { type: 'string', required: false, min: 1, max: 100 },
        color: { type: 'string', required: false, max: 100 },
        gender: { type: 'string', required: false, min: 1, max: 50 },
        yearOfBirth: { type: 'number', required: false, min: 1900 },
        passportNumber: { type: 'string', required: false, max: 100 },
        horseCode: { type: 'string', required: false, max: 100 },
      }, req.body);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          statusCode: 400,
          data: validation.errors,
        });
      }

      const horse = await prisma.horse.update({
        where: { id: horseId },
        data: {
          ...(name && { name }),
          ...(color !== undefined && { color }),
          ...(gender && { gender }),
          ...(yearOfBirth !== undefined && { yearOfBirth }),
          ...(passportNumber && { passportNumber }),
          ...(horseCode && { horseCode }),
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
