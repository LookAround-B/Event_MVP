import { NextApiRequest, NextApiResponse } from 'next';

export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400',
};

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export function handleCORS(
  req: NextApiRequest,
  res: NextApiResponse,
  origin?: string | string[]
): boolean {
  const requestOrigin = req.headers.origin || '';
  const allowedOrigins = Array.isArray(origin) ? origin : origin ? [origin] : ALLOWED_ORIGINS;

  if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true;
    }
  }

  return false;
}

export function applySecurityHeaders(res: NextApiResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}
