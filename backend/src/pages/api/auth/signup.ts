import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { generateToken } from '@/lib/auth';
import { ApiResponse, AuthToken } from '@/types';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { validateInput, handleValidationError, commonSchemas } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';
import bcrypt from 'bcryptjs';

const signupSchema = {
  email: commonSchemas.email,
  firstName: {
    required: false,
    type: 'string',
    message: 'First name is required',
  },
  lastName: {
    required: false,
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
  role: {
    required: false,
    type: 'string',
    message: 'Role must be club or rider',
  },
};

async function handleSignup(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<AuthToken | null>>
) {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
  }

  const { email, password, confirmPassword, firstName, lastName, role = 'rider' } = req.body || {};

  const validationErrors = validateInput(
    { email, password, confirmPassword, firstName, lastName },
    signupSchema
  );

  // Public signup is only for rider and club accounts.
  if (!['club', 'rider'].includes(role)) {
    validationErrors.role = ['Role must be club or rider'];
  }

  if (role === 'rider') {
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      validationErrors.firstName = ['First name is required'];
    }

    if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
      validationErrors.lastName = ['Last name is required'];
    }
  }
  
  if (password !== confirmPassword) {
    validationErrors.confirmPassword = ['Passwords do not match'];
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return handleValidationError(res, validationErrors);
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendErrorResponse(res, 409, 'Email already in use', ErrorCode.DUPLICATE_EMAIL);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Get or create the role
    let roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          name: role,
          description: `${role.charAt(0).toUpperCase() + role.slice(1)} role`,
          isActive: true,
        },
      });
    }

    // Generate next EIRS code
    const lastUser = await prisma.user.findFirst({
      where: { eId: { startsWith: 'EIRSD' } },
      orderBy: { eId: 'desc' },
      select: { eId: true },
    });
    const nextNum = lastUser?.eId ? parseInt(lastUser.eId.replace('EIRSD', ''), 10) + 1 : 1;
    const eId = `EIRSD${String(nextNum).padStart(5, '0')}`;

    const derivedClubName =
      role === 'club'
        ? (typeof email === 'string' && email.includes('@') ? email.split('@')[0] : 'Club')
        : '';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: role === 'club' ? derivedClubName : firstName,
        lastName: role === 'club' ? '' : lastName,
        eId,
        isActive: true,
        isApproved: false,
        profileComplete: false,
        roles: {
          connect: [{ id: roleRecord.id }],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isApproved: true,
        profileComplete: true,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role,
      isApproved: user.isApproved,
      profileComplete: user.profileComplete,
    });

    const authToken: AuthToken = {
      token,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role,
        isApproved: user.isApproved,
        profileComplete: user.profileComplete,
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
