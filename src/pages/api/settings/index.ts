import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withApiHandler, sendSuccessResponse, sendErrorResponse } from '@/lib/api-handler';
import { withRoleMiddleware } from '@/lib/auth-middleware';
import { validateInput, handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const updateSettingsSchema = {
  key: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
    message: 'Setting key is required',
  },
  value: {
    required: true,
    type: 'string',
    message: 'Setting value is required',
  },
};

async function handleGetSettings(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object for easier frontend consumption
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        // Try to parse JSON values
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        // If not JSON, use as string
        settingsMap[setting.key] = setting.value;
      }
    });

    return sendSuccessResponse(res, 200, 'Settings retrieved successfully', settingsMap);
  } catch (error) {
    logError(error, 'handleGetSettings');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handleUpdateSettings(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { key, value } = req.body || {};

    // Validate input
    const validationErrors = validateInput(
      { key, value },
      updateSettingsSchema
    );

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    // Parse value if it's a JSON string
    let parsedValue = value;
    try {
      parsedValue = JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value);
    } catch {
      parsedValue = String(value);
    }

    // Upsert setting
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value: parsedValue },
      create: { key, value: parsedValue },
    });

    return sendSuccessResponse(res, 200, 'Setting updated successfully', {
      key: setting.key,
      value: typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value,
    });
  } catch (error) {
    logError(error, 'handleUpdateSettings');
    return sendErrorResponse(res, 500, 'Internal server error', ErrorCode.INTERNAL_SERVER_ERROR);
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGetSettings(req, res);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    return handleUpdateSettings(req, res);
  }

  return sendErrorResponse(res, 405, 'Method not allowed', ErrorCode.INTERNAL_SERVER_ERROR);
}

export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  {
    allowedMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  }
);
