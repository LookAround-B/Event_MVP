import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { generateToken } from '@/lib/auth';
import { ApiResponse, AuthToken } from '@/types';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const updateProfileSchema = {
  firstName: {
    required: true,
    type: 'string',
    message: 'First name is required',
  },
  lastName: {
    required: true,
    type: 'string',
    message: 'Last name is required',
  },
  gender: {
    required: true,
    type: 'string',
    message: 'Gender is required',
  },
  phone: {
    required: true,
    type: 'string',
    message: 'Phone number is required',
  },
};

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<AuthToken | null>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED',
      statusCode: 405,
    });
  }

  try {
    const { firstName, lastName, gender, phone } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }

    const validationErrors = validateInput(
      { firstName, lastName, gender, phone },
      updateProfileSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        gender,
        phone,
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
        isApproved: true,
        roles: {
          select: { name: true },
        },
      },
    });

    // Generate new token with profileComplete: true
    const userRole = user.roles?.[0]?.name || 'rider';
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: userRole,
      isApproved: user.isApproved,
      profileComplete: user.profileComplete,
    });

    const authToken: AuthToken = {
      token: newToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: userRole,
        isApproved: user.isApproved,
        profileComplete: user.profileComplete,
      },
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      statusCode: 200,
      data: authToken,
    });
  } catch (error) {
    logError(error, 'updateProfile');
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withAuth(handler);
