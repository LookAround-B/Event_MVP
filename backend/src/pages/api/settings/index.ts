import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withRole, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ApiResponse } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const origin = req.headers.origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const settings = await prisma.settings.findMany({
        orderBy: { key: 'asc' },
      });

      const parsed: Record<string, any> = {};
      settings.forEach(setting => {
        try {
          if (setting.valueType === 'json') {
            parsed[setting.key] = JSON.parse(setting.value);
          } else if (setting.valueType === 'number') {
            parsed[setting.key] = parseFloat(setting.value);
          } else if (setting.valueType === 'boolean') {
            parsed[setting.key] = setting.value === 'true';
          } else {
            parsed[setting.key] = setting.value;
          }
        } catch {
          parsed[setting.key] = setting.value;
        }
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Settings retrieved successfully',
        data: parsed,
      });
    } catch (error) {
      console.error('GET settings error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to retrieve settings',
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const updates = req.body; // { key: value, ... }

      for (const [key, value] of Object.entries(updates)) {
        let valueType = 'string';
        let stringValue = String(value);

        if (typeof value === 'number') {
          valueType = 'number';
        } else if (typeof value === 'boolean') {
          valueType = 'boolean';
          stringValue = value ? 'true' : 'false';
        } else if (typeof value === 'object') {
          valueType = 'json';
          stringValue = JSON.stringify(value);
        }

        await prisma.settings.upsert({
          where: { key },
          update: { value: stringValue, valueType },
          create: { key, value: stringValue, valueType },
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      console.error('PUT settings error:', error);
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to update settings',
      });
    }
  }

  return res.status(405).json({
    success: false,
    statusCode: 405,
    message: `Method ${req.method} not allowed`,
  });
}

export default withRole('admin')(handler);
