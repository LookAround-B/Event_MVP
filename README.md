# Equestrian Event Management Platform

A comprehensive Next.js + Prisma ORM backend API for managing equestrian events, clubs, riders, horses, and financial transactions at production scale.

## 🎯 Project Overview

This is a production-ready backend API built with:
- **Framework**: Next.js 14.0.0 with TypeScript 5.3.3
- **ORM**: Prisma 5.8.0 with PostgreSQL
- **Authentication**: JWT-based with bcryptjs password hashing
- **Security**: CORS, Security Headers, Input Validation, Role-Based Access Control (RBAC)
- **Database**: 20+ models covering Events, Clubs, Riders, Horses, Registrations, Financial Tracking, Audit Logs

## ✨ Production-Ready Features

### Security & Error Handling
- ✅ **CORS Configuration**: Serverless-compatible CORS handling for Vercel
- ✅ **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- ✅ **Input Validation**: Schema-based validation at API entry points
- ✅ **Error Codes**: Typed error codes for consistent client-side error handling
- ✅ **Audit Logging**: Track all CREATE, UPDATE, DELETE operations for compliance
- ✅ **RBAC**: Role-based access control with permission checking

### Architecture Patterns
- ✅ **API Handler Wrapper**: Consistent request/response handling with automatic error catching
- ✅ **Middleware Chain**: CORS → Security Headers → Error Handling → Handler
- ✅ **Prisma Singleton**: Production-grade connection pooling for Vercel Functions
- ✅ **Environment Configuration**: Flexible env-based settings for dev/prod/staging

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### 2. Environment Configuration

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/equestrian_db"

# JWT
JWT_SECRET="your-secret-key-min-32-characters-long"

# CORS (comma-separated origins)
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# Environment
NODE_ENV="development"
```

⚠️ **In Production (Vercel)**:
- `JWT_SECRET` is **required** - will error if missing
- `DATABASE_URL` must connect to PostgreSQL (not SQLite)
- `ALLOWED_ORIGINS` must be set to your domain

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb equestrian_db

# Run migrations
npx prisma migrate dev --name init

# Seed (optional)
npx prisma db seed
```

### 4. Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### 5. Production Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI:
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ALLOWED_ORIGINS
```

## 📁 Project Structure

```
src/
├── pages/api/
│   ├── auth/
│   │   ├── login.ts          # User authentication
│   │   └── signup.ts         # User registration
│   ├── events/
│   │   ├── index.ts          # List & create events
│   │   └── [id].ts           # Get, update, delete event
│   ├── clubs/
│   │   └── index.ts          # Club management
│   ├── riders/
│   │   ├── index.ts          # List & create riders
│   │   └── [id].ts           # Get, update, delete rider
│   ├── horses/
│   │   ├── index.ts          # List & create horses
│   │   └── [id].ts           # Get, update, delete horse
│   ├── registrations/
│   │   └── index.ts          # Event registration management
│   ├── financial/
│   │   └── index.ts          # Payment transactions
│   ├── users/
│   │   ├── index.ts          # User management
│   │   └── [id].ts           # Get, update, delete user
│   ├── settings/
│   │   └── index.ts          # System configuration
│   └── audit/
│       └── index.ts          # Audit logs
├── lib/
│   ├── prisma/client.ts      # Prisma singleton for serverless
│   ├── cors.ts               # CORS & security headers
│   ├── errors.ts             # Error handling & codes
│   ├── api-handler.ts        # Request/response wrapper
│   ├── auth.ts               # JWT token handling
│   ├── auth-middleware.ts    # Authentication & RBAC
│   ├── validation.ts         # Input validation
│   └── audit.ts              # Audit logging helpers
├── types/
│   └── index.ts              # TypeScript type definitions
└── pages/
    └── _app.tsx              # Next.js app initialization

prisma/
└── schema.prisma             # Database schema (20+ models)
```

## 🔑 API Overview

### Authentication

**POST `/api/auth/signup`**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**POST `/api/auth/login`**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response: `{ token: "jwt_token", user: {...} }`

### Events

**GET `/api/events?page=1&pageSize=10&search=query&eventType=KSEC`**

**POST `/api/events`**
```json
{
  "eventType": "KSEC",
  "name": "Spring Championship 2024",
  "startDate": "2024-05-01",
  "endDate": "2024-05-03",
  "venueName": "Equestrian Club",
  "categoryIds": ["cat-1", "cat-2"]
}
```

**GET `/api/events/[id]`** - Get event details with registrations

**PUT `/api/events/[id]`** - Update event

**DELETE `/api/events/[id]`** - Delete event (if no registrations)

### Riders

**GET `/api/riders?page=1&clubId=club-1&search=query`**

**POST `/api/riders`**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "competitionLevel": "ADVANCED",
  "clubId": "club-1"
}
```

**GET `/api/riders/[id]`**

**PUT `/api/riders/[id]`**

**DELETE `/api/riders/[id]`** (if no registrations)

### Horses

**GET `/api/horses?page=1&breed=Arabian`**

**POST `/api/horses`**
```json
{
  "name": "Thunder",
  "breed": "Arabian",
  "color": "Bay",
  "registrationNumber": "REG-123",
  "riderId": "rider-1"
}
```

**GET `/api/horses/[id]`**

**PUT `/api/horses/[id]`**

**DELETE `/api/horses/[id]`** (if no registrations)

### Event Registrations

**GET `/api/registrations?eventId=event-1&paymentStatus=PENDING`**

**POST `/api/registrations`**
```json
{
  "eventId": "event-1",
  "riderId": "rider-1",
  "horseId": "horse-1",
  "categoryId": "category-1",
  "fee": 250,
  "gst": 45
}
```

### Financial Transactions

**GET `/api/financial?registrationId=reg-1&paymentMethod=CARD`**

**POST `/api/financial`**
```json
{
  "registrationId": "reg-1",
  "amount": 295,
  "paymentMethod": "CARD",
  "referenceNumber": "TXN-123"
}
```

### Users (Admin Only)

**GET `/api/users?page=1&isActive=true`**

**POST `/api/users`**
```json
{
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "roleIds": ["role-admin"]
}
```

### Settings (Admin Only)

**GET `/api/settings`** - Get all system settings

**POST `/api/settings`**
```json
{
  "key": "PLATFORM_NAME",
  "value": "\"Equestrian Event Manager\""
}
```

### Audit Logs (Admin Only)

**GET `/api/audit?userId=user-1&startDate=2024-01-01&action=UPDATE`**

## 🔐 Authentication & Authorization

All protected endpoints require:
1. **JWT Token** in `Authorization: Bearer <token>` header
2. **Role-Based Access** based on user's assigned roles

### Default Roles

- **ADMIN**: Full platform access
- **CLUB_MANAGER**: Manage own club's riders, horses, registrations
- **RIDER**: Can view own profile and event results
- **VIEWER**: Read-only access to public information

### Protected Route Example

```typescript
export default withApiHandler(
  withRoleMiddleware(['ADMIN', 'CLUB_MANAGER'])(handler),
  { allowedMethods: ['GET', 'POST', 'OPTIONS'] }
);
```

## 🚨 Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "email": ["Invalid email format"]
    }
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `BAD_REQUEST` | 400 | Invalid input or request |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_EMAIL` | 400 | Email already registered |
| `INTERNAL_SERVER_ERROR` | 500 | Server error (safe to retry) |

## 🛡️ CORS & Security

### How CORS Works in Production

1. **Preflight Handling**: OPTIONS requests bypass handlers, return CORS headers immediately
2. **Security Headers**: All responses include `X-Content-Type-Options`, `X-Frame-Options`, etc.
3. **Origin Validation**: Only requests from `ALLOWED_ORIGINS` are accepted

### Vercel Deployment CORS Checklist

✅ CORS handled in `src/lib/cors.ts` (no global middleware causing timeouts)
✅ OPTIONS method handled at API route level
✅ Security headers applied to all responses
✅ Environment-based `ALLOWED_ORIGINS`
✅ No blocking middleware in serverless functions
✅ Prisma connection pooling configured for Vercel

## 📊 Database Schema

20+ Prisma models including:

- **Auth**: User, Role, Permission
- **Events**: Event, EventCategory, EventType, Venue
- **Participants**: Rider, Horse, Club
- **Registrations**: Registration
- **Financial**: Transaction
- **Infrastructure**: StableBooking, Stable
- **System**: AuditLog, Settings

## 🧪 Testing the API

### Using cURL

```bash
# Authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get Events (with token)
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create Event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"eventType":"KSEC","name":"My Event","startDate":"2024-05-01","endDate":"2024-05-03"}'
```

### Using Postman

1. Create new Collection "Equestrian API"
2. Add Authorization header: `Authorization: Bearer {{token}}`
3. Set variables: `base_url=http://localhost:3000`
4. Create requests for each endpoint

## 🚀 Deployment Checklist

### Before Deployment to Vercel

- [ ] Update `ALLOWED_ORIGINS` to your domain
- [ ] Generate strong `JWT_SECRET` (min 32 characters)
- [ ] Set up PostgreSQL database (not SQLite)
- [ ] Run `npx prisma migrate deploy`
- [ ] Test all endpoints locally
- [ ] Set environment variables in Vercel dashboard
- [ ] No hardcoded secrets in code

### Post-Deployment Verification

```bash
# Test production endpoint
curl -X GET https://yourdomain.vercel.app/api/health

# Check CORS headers
curl -X OPTIONS https://yourdomain.vercel.app/api/events \
  -H "Origin: https://yourdomain.com" \
  -v
```

## 🐛 Troubleshooting

### CORS Errors in Production

**Issue**: `OPTIONS 405` or `CORS error` on Vercel
**Solution**: CORS is handled directly in each API route via `withApiHandler`. Check `src/lib/cors.ts` and ensure `ALLOWED_ORIGINS` env var is set.

### Prisma Connection Errors

**Issue**: `too many connections` on Vercel
**Solution**: Using Prisma singleton pattern in `src/lib/prisma/client.ts`. Ensure `DATABASE_URL` uses connection pooling.

### JWT Errors in Production

**Issue**: `JWT_SECRET not found` error
**Solution**: Set `JWT_SECRET` env var in Vercel dashboard. Must be min 32 characters.

### 404 on API Routes

**Issue**: Routes return 404 in production
**Solution**: Ensure routes are in `/src/pages/api/` directory (not `/api/`). Vercel uses file-based routing.

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Vercel Docs](https://vercel.com/docs)

## 📝 License

Proprietary - All rights reserved

## 👥 Support

For issues, contact: admin@equestrian-events.app
