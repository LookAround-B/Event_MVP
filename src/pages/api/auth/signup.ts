import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { generateToken } from '@/lib/auth';
import { ApiResponse, AuthToken } from '@/types';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { validateInput, handleValidationError, commonSchemas } from '@/lib/validation';
import { createAppError, ErrorCode, logError } from '@/lib/errors';
import bcrypt from 'bcryptjs';

const signupSchema = {
  email: commonSchemas.email,
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
  password: {
    ...commonSchemas.password,
    message: 'Password must be at least 8 characters',
  },
  confirmPassword: {
    required: true,
    type: 'string',
    message: 'Password confirmation is required',
  },
};

async function handleSignup(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<AuthToken | null>>
) {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
  }

  const { email, password, confirmPassword, firstName, lastName } = req.body || {};

  // Validate input
  const validationErrors = validateInput(
    { email, password, confirmPassword, firstName, lastName },
    signupSchema
  );
  
  // Check password confirmation
  if (password !== confirmPassword) {
    validationErrors.confirmPassword = ['Passwords do not match'];
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return handleValidationError(res, validationErrors);
  }

  try {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'Email already in use', ErrorCode.DUPLICATE_EMAIL);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: 'rider', // Default role
    });

    const authToken: AuthToken = {
      token,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: 'rider',
      },
    };

    return sendSuccessResponse(res, 201, 'Signup successful', authToken);
  } catch (error) {
    logError(error, 'handleSignup');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export default withApiHandler(handleSignup, {
  allowedMethods: ['POST', 'OPTIONS'],
});
