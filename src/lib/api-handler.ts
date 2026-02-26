import { NextApiRequest, NextApiResponse } from 'next';
import { handleCORS, applySecurityHeaders } from './cors';
import { isAppError, logError } from './errors';
import { ApiResponse } from '@/types';

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  user?: { id: string; email: string; role: string }
) => Promise<void>;

/**
 * Production-ready API route wrapper
 * Handles: CORS, Security Headers, Error Handling, Authentication
 */
export function withApiHandler(handler: ApiHandler, options?: {
  allowedMethods?: string[];
  requireAuth?: boolean;
  allowedRoles?: string[];
  allowedOrigins?: string[];
}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Apply security headers first
      applySecurityHeaders(res);

      // Handle CORS
      if (handleCORS(req, res, options?.allowedOrigins)) {
        return;
      }

      // Check allowed methods
      if (options?.allowedMethods && !options.allowedMethods.includes(req.method || 'GET')) {
        return sendErrorResponse(res, 405, 'Method not allowed');
      }

      // Call the handler
      await handler(req, res);
    } catch (error) {
      logError(error, 'API Handler');

      if (isAppError(error)) {
        return sendErrorResponse(res, error.statusCode, error.message, error.code);
      }

      return sendErrorResponse(res, 500, 'Internal server error');
    }
  };
}

export function sendErrorResponse(
  res: NextApiResponse<ApiResponse>,
  statusCode: number,
  message: string,
  code?: string,
  details?: any
) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: code || 'ERROR',
    statusCode,
    ...(process.env.NODE_ENV === 'development' && details && { details }),
  });
}

export function sendSuccessResponse<T>(
  res: NextApiResponse<ApiResponse<T>>,
  statusCode: number,
  message: string,
  data?: T
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode,
  });
}
