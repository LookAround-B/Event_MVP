import { NextApiRequest, NextApiResponse } from 'next';
import { getTokenFromHeader, verifyToken } from './auth';
import { sendError } from './api-helpers';

export interface ProtectedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function withAuth(
  handler: (req: ProtectedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: ProtectedRequest, res: NextApiResponse) => {
    try {
      const token = getTokenFromHeader(req.headers.authorization);

      if (!token) {
        return sendError(res, 401, 'Missing authentication token');
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return sendError(res, 401, 'Invalid or expired token');
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      return handler(req, res);
    } catch (error) {
      return sendError(res, 500, 'Internal server error');
    }
  };
}

export function withRole(...allowedRoles: string[]) {
  return (
    handler: (req: ProtectedRequest, res: NextApiResponse) => Promise<void> | void
  ) => {
    return withAuth(async (req: ProtectedRequest, res: NextApiResponse) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return sendError(res, 403, 'Forbidden: Insufficient permissions');
      }

      return handler(req, res);
    });
  };
}
