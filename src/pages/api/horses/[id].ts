import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { ErrorCode, logError } from '@/lib/errors';

async function handleGetHorse(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Horse ID is required', ErrorCode.BAD_REQUEST);
    }

    const horse = await prisma.horse.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            club: { select: { id: true, name: true } },
          },
        },
        registrations: {
          select: {
            id: true,
            paymentStatus: true,
            fee: true,
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!horse) {
      return sendErrorResponse(res, 404, 'Horse not found', ErrorCode.NOT_FOUND);
    }

    return sendSuccessResponse(res, 200, 'Horse retrieved successfully', horse);
  } catch (error) {
    logError(error, 'handleGetHorse');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleUpdateHorse(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Horse ID is required', ErrorCode.BAD_REQUEST);
    }

    const existingHorse = await prisma.horse.findUnique({
      where: { id },
    });

    if (!existingHorse) {
      return sendErrorResponse(res, 404, 'Horse not found', ErrorCode.NOT_FOUND);
    }

    const {
      name,
      breed,
      color,
      registrationNumber,
      dateOfBirth,
      description,
    } = req.body || {};

    // Validate registration number uniqueness if updating
    if (registrationNumber && registrationNumber !== existingHorse.registrationNumber) {
      const regNumberExists = await prisma.horse.findFirst({
        where: { registrationNumber, NOT: { id } },
      });

      if (regNumberExists) {
        return sendErrorResponse(
          res,
          400,
          'Registration number already in use',
          ErrorCode.BAD_REQUEST
        );
      }
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (breed !== undefined) updates.breed = breed;
    if (color !== undefined) updates.color = color;
    if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (description !== undefined) updates.description = description;

    const updatedHorse = await prisma.horse.update({
      where: { id },
      data: updates,
      include: {
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return sendSuccessResponse(res, 200, 'Horse updated successfully', updatedHorse);
  } catch (error) {
    logError(error, 'handleUpdateHorse');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleDeleteHorse(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Horse ID is required', ErrorCode.BAD_REQUEST);
    }

    const horse = await prisma.horse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!horse) {
      return sendErrorResponse(res, 404, 'Horse not found', ErrorCode.NOT_FOUND);
    }

    if (horse._count.registrations > 0) {
      return sendErrorResponse(
        res,
        400,
        'Cannot delete horse with active registrations',
        ErrorCode.BAD_REQUEST
      );
    }

    await prisma.horse.delete({
      where: { id },
    });

    return sendSuccessResponse(res, 200, 'Horse deleted successfully', { id });
  } catch (error) {
    logError(error, 'handleDeleteHorse');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetHorse(req, res);
  }

  if (req.method === 'PUT') {
    return handleUpdateHorse(req, res);
  }

  if (req.method === 'DELETE') {
    return handleDeleteHorse(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  {
    allowedMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
  }
);
