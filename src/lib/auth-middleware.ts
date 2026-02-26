import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, getTokenFromHeader } from './auth';
import { createAppError, ErrorCode, logError } from './errors';
import { sendErrorResponse } from './api-handler';

export interface ProtectedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function withAuthMiddleware(
  handler: (req: ProtectedRequest, res: NextApiResponse, user: any) => Promise<void> | void
) {
  return async (req: ProtectedRequest, res: NextApiResponse) => {
    try {
      const token = getTokenFromHeader(req.headers.authorization);

      if (!token) {
        return sendErrorResponse(res, 401, 'Missing authentication token', ErrorCode.UNAUTHORIZED);
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return sendErrorResponse(res, 401, 'Invalid or expired token', ErrorCode.TOKEN_EXPIRED);
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      return handler(req, res, req.user);
    } catch (error) {
      logError(error, 'withAuthMiddleware');
      return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
    }
  };
}

export function withRoleMiddleware(allowedRoles: string[]) {
  return (
    handler: (req: ProtectedRequest, res: NextApiResponse, user: any) => Promise<void> | void
  ) => {
    return withAuthMiddleware(async (req: ProtectedRequest, res: NextApiResponse, user: any) => {
      if (!user || !allowedRoles.includes(user.role)) {
        return sendErrorResponse(res, 403, 'Insufficient permissions', ErrorCode.FORBIDDEN);
      }

      return handler(req, res, user);
    });
  };
}

/**
 * Check if user has specific permission
 */
export async function checkPermission(
  userId: string,
  action: string,
  resource: string
): Promise<boolean> {
  try {
    const prisma = (await import('./prisma/client')).default;
    
    const permission = await prisma.permission.findUnique({
      where: {
        userId_action_resource: {
          userId,
          action,
          resource,
        },
      },
    });

    return permission?.isGranted ?? false;
  } catch (error) {
    logError(error, 'checkPermission');
    return false;
  }
}
