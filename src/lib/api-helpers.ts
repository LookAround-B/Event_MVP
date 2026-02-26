import { NextApiResponse } from 'next';
import { ApiResponse } from '@/types';

export const sendResponse = <T>(
  res: NextApiResponse<ApiResponse<T>>,
  statusCode: number,
  message: string,
  data?: T,
  error?: string
) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    error,
    statusCode,
  });
};

export const sendError = (
  res: NextApiResponse<ApiResponse>,
  statusCode: number,
  message: string,
  error?: string | Record<string, string[]>
) => {
  const isFieldErrors = typeof error === 'object' && !Array.isArray(error);
  
  return res.status(statusCode).json({
    success: false,
    message,
    error: isFieldErrors ? undefined : (error as string),
    errors: isFieldErrors ? (error as Record<string, string[]>) : undefined,
    statusCode,
  });
};

export const createPaginationMeta = (
  total: number,
  page: number,
  pageSize: number
) => {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getPaginationParams = (
  query: any
): { page: number; pageSize: number; skip: number } => {
  const page = Math.max(1, parseInt(query.page || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '10')));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
};
