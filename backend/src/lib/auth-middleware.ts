import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from './auth';
import { handleCORS, applySecurityHeaders } from './cors';

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
