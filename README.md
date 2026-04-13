<div align="center">

# Equestrian Event Management Platform

**The all-in-one platform for organising, managing, and running equestrian competitions at scale.**

Built for event organisers, club managers, and riders — from registration to results, scheduling to payments.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-14_|_16-black?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=flat-square&logo=tailwindcss)

</div>

---

## Overview

The Equestrian Event Management Platform is a full-stack monorepo application that handles the complete lifecycle of equestrian competitions — from event creation and club management through rider/horse registration, automated schedule generation, stable bookings, financial tracking, and compliance audit logging.

The platform is structured as two independent Next.js applications sharing a single Prisma schema, designed for deployment on Vercel.

---

## Features

### Event Management
- Create and publish events with venue details, categories, and terms & conditions
- Interactive map-based venue picker with GPS coordinates
- Rich text editor for event descriptions and announcements
- Auto-generate competition schedules by category with email distribution

### Club, Rider & Horse Management
- Full CRUD for clubs, riders, and horses with profile photos
- Club manager portal with scoped access to own club's data
- Rider self-service portal for profile updates and registration history
- Horse ownership tracking with competition history

### Registration & Approvals
- Online event registration with fee and GST capture
- Multi-stage approval workflow with admin and club manager gates
- Pending approval queue with bulk approve/reject actions
- Real-time registration status notifications

### Financial Tracking
- Transaction recording with multiple payment methods
- Per-event and per-registration financial summaries
- Exportable financial reports (Excel, PDF)

### Scheduling
- Automated schedule generation from registration data
- Per-category schedule management
- One-click email dispatch of schedules to registered participants

### Stable Booking
- Stable availability management per event
- Stable booking linked to registrations

### Administration
- Role-based access control (ADMIN, CLUB_MANAGER, RIDER, VIEWER)
- Granular per-user permissions (Can Edit Event, Can View Financial, Can Export, etc.)
- Full audit log of all CREATE / UPDATE / DELETE operations
- System settings management
- User approval workflow for new accounts

### Platform
- Google OAuth + email/password authentication
- Dark/light theme with smooth transitions
- Responsive design for desktop and tablet
- Dashboard with live KPIs and charts
- In-app notification centre

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 14, TypeScript 5.3 |
| **Backend Framework** | Next.js 16, TypeScript 5.3 |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 5.8 |
| **Authentication** | JWT + bcryptjs, Google OAuth |
| **UI Components** | Radix UI, shadcn/ui |
| **Styling** | Tailwind CSS, Framer Motion |
| **Rich Text** | Tiptap |
| **Charts** | Recharts |
| **Maps** | Leaflet |
| **State Management** | Zustand, TanStack Query |
| **Forms** | React Hook Form |
| **Exports** | ExcelJS, jsPDF, html2canvas |
| **Email** | Nodemailer |
| **Deployment** | Vercel |

---

## Repository Structure

```
Event_MVP/
├── backend/                  # Next.js API server — runs on port 4000
│   ├── src/
│   │   ├── pages/api/        # REST API routes
│   │   ├── lib/              # Auth, CORS, validation, email, scheduling
│   │   └── types/            # Shared TypeScript types
│   └── package.json
│
├── frontend/                 # Next.js UI — runs on port 4001
│   ├── src/
│   │   ├── pages/            # Application pages
│   │   ├── components/       # UI components (Radix + shadcn/ui)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React context providers
│   │   ├── lib/              # API client, utilities
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── prisma/
│   ├── schema.prisma         # Shared database schema (16 models)
│   └── migrations/           # Migration history
│
└── package.json              # Root — runs both apps concurrently
```

---

## Database Schema

16 models across 6 domains:

| Domain | Models |
|--------|--------|
| Auth & Access | `User`, `Role`, `Permission` |
| Events | `Event`, `EventCategory`, `EventType` |
| Participants | `Club`, `Rider`, `Horse` |
| Registrations | `Registration` |
| Venue & Infrastructure | `Venue`, `Stable`, `StableBooking` |
| Finance & System | `Transaction`, `AuditLog`, `Settings` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or hosted)
- npm 9+

### 1. Clone & Install

```bash
git clone <repository-url>
cd Event_MVP

npm run install-all
```

> `install-all` installs dependencies for the root, backend, and frontend in one command.

### 2. Configure Environment

**`backend/.env.local`**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/equestrian_db"
JWT_SECRET="your-secret-key-minimum-32-characters-long"
ALLOWED_ORIGINS="http://localhost:4001"
NODE_ENV="development"

# Email (optional — required for schedule dispatch)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-oauth-client-id"
```

### 3. Set Up the Database

```bash
# Run migrations
npx prisma migrate dev --name init --schema=prisma/schema.prisma

# Seed with initial data
cd backend && npm run prisma:seed
```

### 4. Start Development

```bash
# From root — starts both servers concurrently
npm run dev
```

| App | URL |
|-----|-----|
| Frontend | http://localhost:4001 |
| Backend API | http://localhost:4000/api |
| Prisma Studio | `cd backend && npm run prisma:studio` |

---

## Access & Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access — users, settings, approvals, all data |
| **Club Manager** | Manage own club's riders, horses, registrations, and financials |
| **Rider** | Self-service portal — own profile, registrations, and results |
| **Viewer** | Read-only access to published events and public data |

New accounts go through an admin approval step before gaining platform access.

---

## Deployment

The platform deploys as two independent Vercel projects.

### Pre-deployment Checklist

- [ ] PostgreSQL database provisioned (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))
- [ ] Production migrations applied: `npx prisma migrate deploy`
- [ ] `JWT_SECRET` is a strong random string (min 32 characters)
- [ ] `ALLOWED_ORIGINS` is set to the live frontend URL
- [ ] `NEXT_PUBLIC_API_URL` is set to the live backend URL
- [ ] Google OAuth credentials configured for the production domain

### Deploy Backend

```bash
cd backend
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ALLOWED_ORIGINS
vercel --prod
```

### Deploy Frontend

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
vercel --prod
```

---

## Scripts Reference

### Root

```bash
npm run dev           # Start backend + frontend concurrently
npm run build         # Build both apps
npm run install-all   # Install all dependencies
```

### Backend

```bash
npm run dev               # Start API server (port 4000)
npm run build             # Production build
npm run prisma:generate   # Regenerate Prisma client after schema changes
npm run prisma:migrate    # Create and apply a new migration
npm run prisma:studio     # Open Prisma Studio database GUI
npm run prisma:seed       # Seed database with initial data
npm run prisma:seed-demo  # Seed demo schedule data
```

### Frontend

```bash
npm run dev     # Start UI (port 4001)
npm run build   # Production build
npm run lint    # ESLint check
```

---

## Troubleshooting

<details>
<summary><strong>CORS errors in production</strong></summary>

Ensure `ALLOWED_ORIGINS` is set to your exact frontend domain (no trailing slash). CORS is applied per-route via the `withApiHandler` wrapper in the backend.
</details>

<details>
<summary><strong>Too many database connections on Vercel</strong></summary>

The backend uses a Prisma singleton to reuse connections across serverless invocations. For high traffic, configure a connection pooler such as [PgBouncer](https://www.pgbouncer.org/) or use [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate).
</details>

<details>
<summary><strong>JWT_SECRET missing in production</strong></summary>

Set `JWT_SECRET` via `vercel env add JWT_SECRET` or in the Vercel dashboard under Project → Settings → Environment Variables. The value must be at least 32 characters.
</details>

<details>
<summary><strong>Prisma client out of sync after schema changes</strong></summary>

Run `npm run prisma:generate` inside the `backend/` directory, then restart the dev server.
</details>

---

## License

Proprietary — All rights reserved.
