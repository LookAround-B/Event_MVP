import { NextApiRequest, NextApiResponse } from 'next';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma/client';
import { generateToken } from '@/lib/auth';
import { ApiResponse, AuthToken } from '@/types';
import { sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { ErrorCode, logError } from '@/lib/errors';
import { handleCORS, SECURITY_HEADERS } from '@/lib/cors';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function handleGoogleAuth(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<AuthToken | null>>
) {
  // Handle CORS
  handleCORS(req, res);
  
  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED',
      statusCode: 405,
    });
  }

  try {
    const { token, role = 'rider' } = req.body;

    if (!token) {
      return sendErrorResponse(res, 400, 'Google token is required', ErrorCode.VALIDATION_ERROR);
    }

    if (!['club', 'rider'].includes(role)) {
      return sendErrorResponse(res, 400, 'Role must be club or rider', ErrorCode.VALIDATION_ERROR);
    }

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return sendErrorResponse(res, 401, 'Invalid token', ErrorCode.INVALID_CREDENTIALS);
    }

    const { email, given_name: firstName, family_name: lastName, picture } = payload;

    if (!email) {
      return sendErrorResponse(res, 400, 'Email not provided by Google', ErrorCode.VALIDATION_ERROR);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isApproved: true,
        profileComplete: true,
        isGoogleAuth: true,
        roles: {
          select: { name: true },
        },
      },
    });

    // If user doesn't exist, create one
    if (!user) {
      // Generate a random password for OAuth users
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      let userRole = await prisma.role.findUnique({
        where: { name: role },
      });

      if (!userRole) {
        userRole = await prisma.role.create({
          data: {
            name: role,
            description: `${role.charAt(0).toUpperCase() + role.slice(1)} role`,
            isActive: true,
          },
        });
      }

      user = await prisma.user.create({
        data: {
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          password: randomPassword,
          isActive: true,
          isApproved: false,
          profileComplete: false,
          isGoogleAuth: true,
          roles: {
            connect: [{ id: userRole.id }],
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
          isGoogleAuth: true,
          roles: {
            select: { name: true },
          },
        },
      });
    }

    if (!user.isActive) {
      return sendErrorResponse(res, 403, 'User account is disabled', ErrorCode.USER_DISABLED);
    }

    // Get user role
    const userRole = user.roles?.[0]?.name || 'rider';

    const authToken = generateToken({
      id: user.id,
      email: user.email,
      role: userRole,
      isApproved: user.isApproved,
      profileComplete: user.profileComplete,
    });

    const authTokenResponse: AuthToken = {
      token: authToken,
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

    return sendSuccessResponse(res, 200, 'Login successful', authTokenResponse);
  } catch (error: any) {
    if (error.message?.includes('Token used too late')) {
      return sendErrorResponse(res, 401, 'Token expired. Please sign in again.', ErrorCode.INVALID_CREDENTIALS);
    }
    console.error('Google Auth Error Details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    logError(error, 'handleGoogleAuth');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export default handleGoogleAuth;
