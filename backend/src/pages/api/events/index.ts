import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { withAuth } from '@/lib/auth-middleware';
import { validateInput } from '@/lib/validation';
import { ApiResponse } from '@/types';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { method } = req;

  // GET is public for form dropdowns, POST requires auth
  if (method === 'GET') {
    try {
      const { page = '1', limit = '10', search = '', format } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where = search
        ? {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { venueName: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
              { description: { contains: search as string, mode: 'insensitive' as 'insensitive' } },
            ],
          }
        : {};

      if (format === 'csv') {
        const allEvents = await prisma.event.findMany({
          where,
          select: {
            name: true, startDate: true, endDate: true, venueName: true, isPublished: true, _count: { select: { registrations: true } },
          },
          orderBy: { startDate: 'asc' },
        });
        const header = 'Name,Venue,Start Date,End Date,Published,Registrations';
        const rows = allEvents.map(e =>
          `"${e.name}","${e.venueName || ''}","${e.startDate.toISOString().split('T')[0]}","${e.endDate.toISOString().split('T')[0]}","${e.isPublished ? 'Yes' : 'No'}","${e._count.registrations}"`
        );
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=events.csv');
        res.write(csv as any);
        return res.end();
      }

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            description: true,
            venueName: true,
            isPublished: true,
            createdAt: true,
            _count: {
              select: { registrations: true },
            },
          },
          orderBy: { startDate: 'asc' },
        }),
        prisma.event.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Events retrieved successfully',
        statusCode: 200,
        data: {
          events: events.map(e => ({
            ...e,
            registrationCount: e._count.registrations,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Events GET error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve events',
        error: 'INTERNAL_ERROR',
        statusCode: 500,
      });
    }
  }

  if (method === 'POST') {
    return withAuth(async (authReq, authRes) => {
      try {
        const { 
          eventType, name, description, startDate, startTime, endDate, endTime, 
          fileUrl, venueAddress, venueLat, venueLng, venueName, 
          termsAndConditions, categoryIds 
        } = authReq.body;

        // Validation - all fields mandatory per PRD Section 3.2
        if (!eventType || !name || !startDate || !endDate) {
          return authRes.status(400).json({
            success: false,
            message: 'Event type, name, start date and end date are required',
            error: 'VALIDATION_ERROR',
            statusCode: 400,
          });
        }

        if (!['KSEC', 'EPL', 'EIRS Show'].includes(eventType)) {
          return authRes.status(400).json({
            success: false,
            message: 'Invalid event type. Must be KSEC, EPL, or EIRS Show',
            error: 'VALIDATION_ERROR',
            statusCode: 400,
          });
        }

        const event = await prisma.event.create({
          data: {
            eventType,
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime: startTime || '06:00',
            endTime: endTime || '18:00',
            fileUrl: fileUrl || null,
            venueName: venueName || '',
            venueAddress: venueAddress || '',
            venueLat: venueLat ? parseFloat(venueLat) : null,
            venueLng: venueLng ? parseFloat(venueLng) : null,
            termsAndConditions: termsAndConditions || '',
            isPublished: false,
            ...(categoryIds && categoryIds.length > 0 && {
              categories: {
                connect: categoryIds.map((id: string) => ({ id })),
              },
            }),
          },
          include: {
            categories: true,
          },
        });

        // Create audit log for event creation
        await prisma.auditLog.create({
          data: {
            userId: authReq.user?.id || 'system',
            action: 'EventCreated',
            entity: 'Event',
            entityId: event.id,
            newValues: event,
          },
        }).catch(err => console.error('Audit log error:', err));

        return authRes.status(201).json({
          success: true,
          message: 'Event created successfully',
          statusCode: 201,
          data: event,
        });
      } catch (error) {
        console.error('Events POST error:', error);
        return authRes.status(500).json({
          success: false,
          message: 'Failed to create event',
          error: 'INTERNAL_ERROR',
          statusCode: 500,
        });
      }
    })(req, res);
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    error: 'METHOD_NOT_ALLOWED',
    statusCode: 405,
  });
}

// Apply auth only to POST/DELETE, not GET (GET is public for form dropdowns)
export default async function wrappedHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handler(req, res);
  }
  return withAuth(handler)(req, res);
}
