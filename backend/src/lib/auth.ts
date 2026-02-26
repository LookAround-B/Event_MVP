import jwt from 'jsonwebtoken';
import { DecodedToken } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(payload: any, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as DecodedToken;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as DecodedToken;
  } catch (error) {
    return null;
  }
}
