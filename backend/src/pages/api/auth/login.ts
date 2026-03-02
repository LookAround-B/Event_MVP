import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { generateToken } from '@/lib/auth';
import { ApiResponse, AuthToken } from '@/types';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { validateInput, handleValidationError, commonSchemas } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';
import bcrypt from 'bcryptjs';

const loginSchema = {
  email: commonSchemas.email,
  password: {
    required: true,
    type: 'string',
    message: 'Password is required',
  },
};

async function handleLogin(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<AuthToken | null>>
) {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
  }

  const { email, password } = req.body || {};

  const validationErrors = validateInput({ email, password }, loginSchema);
  if (Object.keys(validationErrors).length > 0) {
    return handleValidationError(res, validationErrors);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        isActive: true,
        isApproved: true,
        profileComplete: true,
        roles: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      return sendErrorResponse(res, 403, 'User account is disabled', ErrorCode.USER_DISABLED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendErrorResponse(res, 401, 'Invalid email or password', ErrorCode.INVALID_CREDENTIALS);
    }

    // Get user role - use first role or default to 'rider'
    const userRole = user.roles?.[0]?.name || 'rider';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: userRole,
      isApproved: user.isApproved,
      profileComplete: user.profileComplete,
    });

    const authToken: AuthToken = {
      token,
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

    return sendSuccessResponse(res, 200, 'Login successful', authToken);
  } catch (error) {
    logError(error, 'handleLogin');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export default withApiHandler(handleLogin, {
  allowedMethods: ['POST', 'OPTIONS'],
});
