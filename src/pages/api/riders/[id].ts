import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { ErrorCode, logError } from '@/lib/errors';

async function handleGetRider(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Rider ID is required', ErrorCode.BAD_REQUEST);
    }

    const rider = await prisma.rider.findUnique({
      where: { id },
      include: {
        club: {
          select: { id: true, name: true },
        },
        horses: {
          select: {
            id: true,
            name: true,
            breed: true,
            color: true,
            registrationNumber: true,
          },
        },
        registrations: {
          select: {
            id: true,
            paymentStatus: true,
            fee: true,
            gst: true,
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

    if (!rider) {
      return sendErrorResponse(res, 404, 'Rider not found', ErrorCode.NOT_FOUND);
    }

    return sendSuccessResponse(res, 200, 'Rider retrieved successfully', rider);
  } catch (error) {
    logError(error, 'handleGetRider');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleUpdateRider(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Rider ID is required', ErrorCode.BAD_REQUEST);
    }

    const existingRider = await prisma.rider.findUnique({
      where: { id },
    });

    if (!existingRider) {
      return sendErrorResponse(res, 404, 'Rider not found', ErrorCode.NOT_FOUND);
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      competitionLevel,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body || {};

    // Validate email if updating
    if (email && email !== existingRider.email) {
      const emailExists = await prisma.rider.findFirst({
        where: { email, NOT: { id } },
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

    const updates: any = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updates.gender = gender;
    if (competitionLevel !== undefined) updates.competitionLevel = competitionLevel;
    if (emergencyContactName !== undefined) updates.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) updates.emergencyContactPhone = emergencyContactPhone;

    const updatedRider = await prisma.rider.update({
      where: { id },
      data: updates,
      include: {
        club: {
          select: { id: true, name: true },
        },
        horses: {
          select: { id: true, name: true },
        },
      },
    });

    return sendSuccessResponse(res, 200, 'Rider updated successfully', updatedRider);
  } catch (error) {
    logError(error, 'handleUpdateRider');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleDeleteRider(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendErrorResponse(res, 400, 'Rider ID is required', ErrorCode.BAD_REQUEST);
    }

    const rider = await prisma.rider.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!rider) {
      return sendErrorResponse(res, 404, 'Rider not found', ErrorCode.NOT_FOUND);
    }

    if (rider._count.registrations > 0) {
      return sendErrorResponse(
        res,
        400,
        'Cannot delete rider with active registrations',
        ErrorCode.BAD_REQUEST
      );
    }

    await prisma.rider.delete({
      where: { id },
    });

    return sendSuccessResponse(res, 200, 'Rider deleted successfully', { id });
  } catch (error) {
    logError(error, 'handleDeleteRider');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetRider(req, res);
  }

  if (req.method === 'PUT') {
    return handleUpdateRider(req, res);
  }

  if (req.method === 'DELETE') {
    return handleDeleteRider(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  {
    allowedMethods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
  }
);
