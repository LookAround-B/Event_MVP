import { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-handler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.json({ success: true, message: 'API is running', statusCode: 200 });
}

export default withApiHandler(handler, { allowedMethods: ['GET', 'OPTIONS'] });
