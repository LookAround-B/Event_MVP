import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from './auth';
import { handleCORS, applySecurityHeaders } from './cors';
import { prisma } from './prisma/client';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // Handle CORS first, before authentication
    if (handleCORS(req, res)) {
      return;
    }

    applySecurityHeaders(res);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return handler(req, res);
  };
}

export function withRole(...allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any>) => {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!allowedRoles.includes(req.user?.role || '')) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
          error: 'FORBIDDEN',
          statusCode: 403,
        });
      }

      return handler(req, res);
    });
  };
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: string,
  action: string,
  resource: string
): Promise<boolean> {
  try {
    const permission = await prisma.permission.findUnique({
      where: {
        userId_action_resource: { userId, action, resource },
      },
    });
    return permission?.isGranted ?? false;
  } catch {
    return false;
  }
}

/**
 * Middleware: require a specific permission (action + resource).
 * Admins bypass permission checks.
 */
export function withPermission(action: string, resource: string) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any>) => {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      // Admins always pass
      if (req.user?.role === 'admin') {
        return handler(req, res);
      }

      const hasPermission = await checkPermission(req.user!.id, action, resource);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: requires ${action} on ${resource}`,
          error: 'FORBIDDEN',
          statusCode: 403,
        });
      }

      return handler(req, res);
    });
  };
}
