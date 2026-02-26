import { NextApiResponse } from 'next';
import { sendErrorResponse } from './api-handler';
import { ApiResponse } from '@/types';

export interface ValidationRule {
  required?: boolean;
  type?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class ValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Validation failed');
    this.errors = errors;
  }
}

export function validateInput(
  data: Record<string, any>,
  schema: ValidationSchema
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  Object.entries(schema).forEach(([field, rule]) => {
    const value = data[field];
    const fieldErrors: string[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(rule.message || `${field} is required`);
    }

    if (value === undefined || value === null || value === '') {
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
      return;
    }

    // Check type
    if (rule.type) {
      if (typeof value !== rule.type) {
        fieldErrors.push(
          rule.message || `${field} must be of type ${rule.type}`
        );
      }
    }

    // Check min length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      fieldErrors.push(
        rule.message || `${field} must be at least ${rule.minLength} characters`
      );
    }

    // Check max length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      fieldErrors.push(
        rule.message || `${field} must be at most ${rule.maxLength} characters`
      );
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      fieldErrors.push(rule.message || `${field} format is invalid`);
    }

    // Check custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        fieldErrors.push(typeof result === 'string' ? result : `${field} is invalid`);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });

  return errors;
}

export function handleValidationError(
  res: NextApiResponse<ApiResponse>,
  errors: Record<string, string[]>
) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    error: 'VALIDATION_ERROR',
    errors,
    statusCode: 400,
  });
}

// Common validation schemas
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^\+?[\d\s\-()]{10,}$/;
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const commonSchemas = {
  email: {
    required: true,
    type: 'string',
    pattern: emailPattern,
    message: 'Valid email is required',
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    message: 'Password must be at least 8 characters',
  },
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters',
  },
  phone: {
    type: 'string',
    pattern: phonePattern,
    message: 'Valid phone number is required',
  },
};
