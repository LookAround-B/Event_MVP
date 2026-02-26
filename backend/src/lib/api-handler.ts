import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/types';
import { handleCORS, applySecurityHeaders } from './cors';
import { ErrorCode, errorCodeToStatusCode } from './errors';

export function sendSuccessResponse<T>(
  res: NextApiResponse<ApiResponse<T>>,
  statusCode: number,
  message: string,
  data?: T
) {
  applySecurityHeaders(res);
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode,
  });
}

export function sendErrorResponse(
  res: NextApiResponse<ApiResponse>,
  statusCode: number,
  message: string,
  errorCode: ErrorCode
) {
  applySecurityHeaders(res);
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorCode,
    statusCode,
  });
}

export function sendValidationErrorResponse(
  res: NextApiResponse<ApiResponse>,
  errors: Record<string, string[]>
) {
  applySecurityHeaders(res);
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    error: ErrorCode.VALIDATION_ERROR,
    errors,
    statusCode: 400,
  });
}

type ApiHandlerMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface ApiHandlerOptions {
  allowedMethods?: ApiHandlerMethod[];
}

export function withApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>,
  options: ApiHandlerOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { allowedMethods = ['GET', 'POST'] } = options;

    // Handle CORS
    if (handleCORS(req, res)) {
      return;
    }

    // Check method
    if (!allowedMethods.includes(req.method as ApiHandlerMethod)) {
      applySecurityHeaders(res);
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
        error: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 405,
      });
    }

    try {
      return await handler(req, res);
    } catch (error: any) {
      console.error('API Handler Error:', error);
      applySecurityHeaders(res);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: ErrorCode.INTERNAL_SERVER_ERROR,
        statusCode: 500,
      });
    }
  };
}
