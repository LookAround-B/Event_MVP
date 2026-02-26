// Production-level error handling

export enum ErrorCode {
  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_DISABLED = 'USER_DISABLED',

  // Resource
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  DUPLICATE_CODE = 'DUPLICATE_CODE',
}

interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  isDevelopment?: boolean;
}

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, any>;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export const errorMap: Record<ErrorCode, { statusCode: number; message: string }> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: { statusCode: 500, message: 'Internal server error' },
  [ErrorCode.NOT_FOUND]: { statusCode: 404, message: 'Resource not found' },
  [ErrorCode.BAD_REQUEST]: { statusCode: 400, message: 'Bad request' },
  [ErrorCode.UNAUTHORIZED]: { statusCode: 401, message: 'Unauthorized' },
  [ErrorCode.FORBIDDEN]: { statusCode: 403, message: 'Forbidden' },
  [ErrorCode.CONFLICT]: { statusCode: 409, message: 'Conflict' },
  [ErrorCode.VALIDATION_ERROR]: { statusCode: 400, message: 'Validation error' },
  [ErrorCode.INVALID_CREDENTIALS]: { statusCode: 401, message: 'Invalid email or password' },
  [ErrorCode.TOKEN_EXPIRED]: { statusCode: 401, message: 'Token has expired' },
  [ErrorCode.INVALID_TOKEN]: { statusCode: 401, message: 'Invalid token' },
  [ErrorCode.USER_NOT_FOUND]: { statusCode: 404, message: 'User not found' },
  [ErrorCode.USER_DISABLED]: { statusCode: 403, message: 'User account is disabled' },
  [ErrorCode.RESOURCE_NOT_FOUND]: { statusCode: 404, message: 'Resource not found' },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: { statusCode: 409, message: 'Resource already exists' },
  [ErrorCode.DUPLICATE_EMAIL]: { statusCode: 409, message: 'Email already in use' },
  [ErrorCode.DUPLICATE_CODE]: { statusCode: 409, message: 'Code already in use' },
};

export function createAppError(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, any>
): AppError {
  const errorInfo = errorMap[code];
  const message = customMessage || errorInfo.message;
  return new AppError(code, message, errorInfo.statusCode, details);
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function logError(error: any, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR${context ? ` - ${context}` : ''}]`, error);
  } else {
    // In production, send to a logging service (e.g., Sentry, LogRocket, etc.)
    // For now, just log the error code and message
    const errorMessage = isAppError(error) ? error.message : 'Unknown error';
    const errorCode = isAppError(error) ? error.code : 'UNKNOWN';
    console.error(`[${errorCode}] ${errorMessage}`);
  }
}
