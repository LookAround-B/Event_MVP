export const commonSchemas = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email address',
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
};

export function validateInput(
  data: Record<string, any>,
  schema: Record<string, any>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  Object.keys(schema).forEach((field) => {
    const rules = schema[field];
    const value = data[field];

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = [rules.message || `${field} is required`];
      return;
    }

    if (value === undefined || value === null || value === '') {
      return;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors[field] = [rules.message || `${field} must be of type ${rules.type}`];
      return;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = [rules.message || `${field} is invalid`];
      return;
    }

    // Min Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = [rules.message || `${field} must be at least ${rules.minLength} characters`];
      return;
    }

    // Max Length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = [rules.message || `${field} must be at most ${rules.maxLength} characters`];
      return;
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      errors[field] = [rules.message || `${field} is invalid`];
      return;
    }
  });

  return errors;
}

export function handleValidationError(res: any, errors: Record<string, string[]>) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    error: 'VALIDATION_ERROR',
    errors,
    statusCode: 400,
  });
}
