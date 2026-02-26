export enum ErrorCode {
  // Auth Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_DISABLED = 'USER_DISABLED',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: any;
}

export function createAppError(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: any
): AppError {
  return { code, message, statusCode, details };
}

export function logError(error: any, context: string = 'Unknown'): void {
  console.error(`[ERROR - ${context}] ${error?.message || error}`);
  if (process.env.LOG_LEVEL === 'debug') {
    console.error(error);
  }
}

export const errorCodeToStatusCode: Record<ErrorCode, number> = {
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.USER_DISABLED]: 403,
  [ErrorCode.DUPLICATE_EMAIL]: 409,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
};
