import { NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma/client';
import { generateToken } from '@/lib/auth';
import { ApiResponse, AuthToken } from '@/types';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { handleValidationError } from '@/lib/validation';
import { ErrorCode, logError } from '@/lib/errors';

const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const nullableString = (value: unknown) => {
  const normalized = normalizeString(value);
  return normalized ? normalized : null;
};

const normalizeSocialLinks = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const cleaned = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, link]) => [key, normalizeString(link)])
      .filter(([, link]) => !!link)
  );

  return Object.keys(cleaned).length > 0 ? cleaned : null;
};

const parseOptionalDate = (value: unknown) => {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

async function generateNextRiderEId(tx: any) {
  const lastRider = await tx.rider.findFirst({
    where: { eId: { startsWith: 'EIRSD' } },
    orderBy: { eId: 'desc' },
    select: { eId: true },
  });

  const nextNumber = lastRider?.eId
    ? parseInt(lastRider.eId.replace('EIRSD', ''), 10) + 1
    : 1;

  return `EIRSD${String(Number.isNaN(nextNumber) ? 1 : nextNumber).padStart(5, '0')}`;
}

async function generateNextClubEId(tx: any) {
  const lastClub = await tx.club.findFirst({
    where: { eId: { startsWith: 'EIRSCL' } },
    orderBy: { eId: 'desc' },
    select: { eId: true },
  });

  const nextNumber = lastClub?.eId
    ? parseInt(lastClub.eId.replace('EIRSCL', ''), 10) + 1
    : 1;

  return `EIRSCL${String(Number.isNaN(nextNumber) ? 1 : nextNumber).padStart(5, '0')}`;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse<AuthToken | null>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'METHOD_NOT_ALLOWED',
      statusCode: 405,
    });
  }

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED',
        statusCode: 401,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isApproved: true,
        roles: {
          select: { name: true },
          take: 1,
        },
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'NOT_FOUND',
        statusCode: 404,
      });
    }

    const userRole = existingUser.roles?.[0]?.name || 'rider';
    const validationErrors: Record<string, string[]> = {};

    const firstName = normalizeString(req.body.firstName);
    const lastName = normalizeString(req.body.lastName);
    const gender = normalizeString(req.body.gender);
    const phone = normalizeString(req.body.phone);
    const dob = parseOptionalDate(req.body.dob);

    if (userRole === 'rider') {
      if (!firstName) validationErrors.firstName = ['First name is required'];
      if (!lastName) validationErrors.lastName = ['Last name is required'];
      if (!gender) validationErrors.gender = ['Gender is required'];
      if (!phone) validationErrors.phone = ['Phone number is required'];
      if (!normalizeString(req.body.dob)) validationErrors.dob = ['Date of birth is required'];
      if (dob === undefined) validationErrors.dob = ['A valid date of birth is required'];

      if (!normalizeString(req.body.efiRiderId)) {
        validationErrors.efiRiderId = ['EFI Rider ID is required'];
      }

      if (!normalizeString(req.body.aadhaarNumber)) {
        validationErrors.aadhaarNumber = ['Aadhaar number is required'];
      }
    }

    if (userRole === 'club') {
      if (!normalizeString(req.body.clubName)) {
        validationErrors.clubName = ['Club name is required'];
      }

      if (!normalizeString(req.body.shortCode)) {
        validationErrors.shortCode = ['Club short code is required'];
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return handleValidationError(res, validationErrors);
    }

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data:
          userRole === 'rider'
            ? {
                firstName,
                lastName,
                gender,
                phone,
                dob: dob ?? null,
                profileComplete: true,
                optionalPhone: nullableString(req.body.optionalPhone),
                address: nullableString(req.body.address),
                efiRiderId: nullableString(req.body.efiRiderId),
                imageUrl: nullableString(req.body.imageUrl),
              }
            : {
                profileComplete: true,
              },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          phone: true,
          profileComplete: true,
          isApproved: true,
          roles: {
            select: { name: true },
            take: 1,
          },
        },
      });

      if (userRole === 'rider') {
        const existingRider = await tx.rider.findFirst({
          where: { userId },
          select: { id: true },
        });

        const duplicateRiderEmail = await tx.rider.findFirst({
          where: {
            email: updatedUser.email,
            ...(existingRider ? { id: { not: existingRider.id } } : {}),
          },
          select: { id: true },
        });

        if (duplicateRiderEmail) {
          throw new Error('A rider profile already exists for this email address');
        }

        const riderPayload = {
          firstName,
          lastName,
          email: updatedUser.email,
          efiRiderId: normalizeString(req.body.efiRiderId),
          mobile: phone,
          optionalPhone: nullableString(req.body.optionalPhone),
          dob: dob ?? null,
          gender,
          address: nullableString(req.body.address),
          aadhaarNumber: nullableString(req.body.aadhaarNumber),
          imageUrl: nullableString(req.body.imageUrl),
          socialLinks: normalizeSocialLinks(req.body.socialLinks),
          userId,
        };

        if (existingRider) {
          await tx.rider.update({
            where: { id: existingRider.id },
            data: riderPayload,
          });
        } else {
          await tx.rider.create({
            data: {
              eId: await generateNextRiderEId(tx),
              ...riderPayload,
            },
          });
        }
      }

      if (userRole === 'club') {
        const existingClub = await tx.club.findFirst({
          where: { primaryContactId: userId },
          select: { id: true },
        });

        const shortCode = normalizeString(req.body.shortCode)
          .toUpperCase()
          .replace(/\s+/g, '');

        const duplicateShortCode = await tx.club.findFirst({
          where: {
            shortCode,
            ...(existingClub ? { id: { not: existingClub.id } } : {}),
          },
          select: { id: true },
        });

        if (duplicateShortCode) {
          throw new Error('Club short code is already in use');
        }

        const clubPayload = {
          name: normalizeString(req.body.clubName),
          shortCode,
          registrationNumber: nullableString(req.body.registrationNumber),
          contactNumber: nullableString(req.body.contactNumber),
          optionalPhone: nullableString(req.body.optionalPhone),
          email: nullableString(req.body.clubEmail),
          address: nullableString(req.body.address),
          city: nullableString(req.body.city),
          state: nullableString(req.body.state),
          country: nullableString(req.body.country),
          pincode: nullableString(req.body.pincode),
          gstNumber: nullableString(req.body.gstNumber),
          description: nullableString(req.body.description),
          socialLinks: normalizeSocialLinks(req.body.socialLinks),
          primaryContactId: userId,
        };

        if (existingClub) {
          await tx.club.update({
            where: { id: existingClub.id },
            data: clubPayload,
          });
        } else {
          await tx.club.create({
            data: {
              eId: await generateNextClubEId(tx),
              ...clubPayload,
            },
          });
        }
      }

      return updatedUser;
    });

    const resolvedRole = user.roles?.[0]?.name || 'rider';
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: resolvedRole,
      isApproved: user.isApproved,
      profileComplete: user.profileComplete,
    });

    const authToken: AuthToken = {
      token: newToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: resolvedRole,
        isApproved: user.isApproved,
        profileComplete: user.profileComplete,
      },
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      statusCode: 200,
      data: authToken,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        'A rider profile already exists for this email address',
        'Club short code is already in use',
      ].includes(error.message)
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
      });
    }

    logError(error, 'updateProfile');
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  }
}

export default withAuth(handler);
