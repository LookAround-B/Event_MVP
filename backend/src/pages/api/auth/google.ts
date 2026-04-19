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

type GoogleProfile = {
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
};

async function getGoogleProfile(token: string): Promise<GoogleProfile> {
  const isAccessToken = token.startsWith('ya29.') || token.split('.').length !== 3;

  if (!isAccessToken) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new Error('Email not provided by Google');
    return {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    };
  }

  const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const userInfo = (await userInfoResponse.json()) as {
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!userInfo.email) throw new Error('Email not provided by Google');

  return {
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    picture: userInfo.picture,
  };
}

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
    const requestedRole = typeof role === 'string' ? role : 'rider';

    if (!token) {
      return sendErrorResponse(res, 400, 'Google token is required', ErrorCode.VALIDATION_ERROR);
    }

    if (!['admin', 'club', 'rider'].includes(requestedRole)) {
      return sendErrorResponse(res, 400, 'Role must be admin, club, or rider', ErrorCode.VALIDATION_ERROR);
    }

    const { email, firstName, lastName, picture } = await getGoogleProfile(token);

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

    const userRoles = user?.roles?.map((userRole) => userRole.name) || [];
    const isAdminLogin = requestedRole === 'admin';

    if (isAdminLogin && !user) {
      return sendErrorResponse(
        res,
        403,
        'Admin Google sign-in is only available for existing admin accounts.',
        ErrorCode.FORBIDDEN
      );
    }

    if (isAdminLogin && !userRoles.includes('admin')) {
      return sendErrorResponse(
        res,
        403,
        'This Google account is not authorized for admin access.',
        ErrorCode.FORBIDDEN
      );
    }

    // If user doesn't exist, create one
    if (!user) {
      // Generate a random password for OAuth users
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      let userRole = await prisma.role.findUnique({
        where: { name: requestedRole },
      });

      if (!userRole) {
        userRole = await prisma.role.create({
          data: {
            name: requestedRole,
            description: `${requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)} role`,
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

    const assignedRoles = user.roles?.map((userRole) => userRole.name) || [];
    const userRole = assignedRoles.includes(requestedRole)
      ? requestedRole
      : assignedRoles[0] || requestedRole;

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
    if (error.message?.includes('Wrong recipient') || error.message?.includes('invalid_token')) {
      return sendErrorResponse(res, 401, 'Invalid Google token', ErrorCode.INVALID_CREDENTIALS);
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
