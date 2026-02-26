# 🏗️ Project Structure Update

The Equestrian Event Management Platform has been reorganized into a **monorepo structure** with clear separation between backend and frontend.

## Folder Organization

```
equestrian-event-management/
├── backend/        # REST API (Next.js on port 3001)
├── frontend/       # Web UI (Next.js on port 3000)
├── package.json    # Root monorepo config
└── README.md       # This file
```

### Backend (`/backend`)
- **Purpose**: REST API server with PostgreSQL database
- **Port**: 3001
- **Includes**: Prisma ORM, JWT auth, CORS, validation, audit logging
- **API Endpoints**: 18+ production-ready endpoints
- **View**: [backend/README.md](./backend) (coming soon)

### Frontend (`/frontend`)
- **Purpose**: React/Next.js web application with Tailwind CSS
- **Port**: 3000
- **Includes**: Authentication pages, user dashboard, data management UI
- **Routes**: Dashboard, Events, Riders, Horses, Registrations, Financial
- **View**: [frontend/README.md](./frontend) (coming soon)

## Quick Start

### Option 1: Run Both Together
```bash
npm install-all           # Install dependencies for root, backend, and frontend
npm run dev              # Starts both backend (3001) and frontend (3000)
```

### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

## Prerequisites
- Node.js 18+
- PostgreSQL 15 running in Docker (see setup below)

## Database Setup
```bash
# Start PostgreSQL Docker container
docker run --name equestrian-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=equestrian_db \
  -p 5432:5432 \
  -d postgres:15

# Run migrations
cd backend
npx prisma migrate dev --name init
```

## Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Test Auth**: Sign up at http://localhost:3000/auth/signup

## Key Features
✅ Separate backends and frontend codebases  
✅ Production-ready API with 18+ endpoints  
✅ JWT authentication with RBAC  
✅ PostgreSQL with Prisma ORM  
✅ Responsive Tailwind CSS UI  
✅ Audit logging and error handling  
✅ CORS protection and security headers  

## Development Scripts

### Backend Commands
```bash
cd backend
npm run dev           # Start development server (port 3001)
npm run build         # Build for production
npm run start         # Start production server
npx prisma migrate   # Run database migrations
npx prisma studio   # Open Prisma Studio UI
```

### Frontend Commands
```bash
cd frontend
npm run dev     # Start development server (port 3000)
npm run build   # Build for production
npm run start   # Start production server
```

## File Organization

Each folder (backend/frontend) is a complete standalone Next.js application with:
- Own `package.json` with dependencies
- Own `tsconfig.json` with configurations
- Own `.env` environment variables
- Own application code

This keeps each part modular and independently deployable.

## API Documentation

See **backend/README.md** for:
- Complete API endpoint reference
- Request/response examples
- Error handling
- Authentication flow

See **frontend/README.md** for:
- UI components
- Page structure
- Form handling
- API integration

## Database Schema

See **backend/prisma/schema.prisma** for:
- Complete data model
- 10+ entities with relationships
- Database indexes
- Validation rules

## Deployment

### Backend Deployment (Vercel)
```bash
cd backend
vercel deploy
```

### Frontend Deployment (Vercel)
```bash
cd frontend
# Set NEXT_PUBLIC_API_URL to deployed backend URL
vercel deploy
```

See **VERCEL_DEPLOYMENT.md** for full production setup guide.

## Troubleshooting

- **Port 3000/3001 in use?** Kill the process: `lsof -i :3000` or use different port
- **Database connection error?** Verify PostgreSQL running: `docker ps | grep equestrian`
- **Module not found?** Run `npm install` in the specific folder
- **Prisma errors?** Run `npx prisma generate` to regenerate client

## Architecture Benefits

✅ **Separation of Concerns**: API logic separate from UI  
✅ **Independent Scaling**: Deploy each independently  
✅ **Team Collaboration**: Frontend/backend teams work in parallel  
✅ **Easier Testing**: Test each part separately  
✅ **Clear Dependencies**: Each folder has explicit dependencies  
✅ **Better Maintainability**: Self-contained applications  

## Next Steps

1. Review backend API endpoints: `backend/README.md`
2. Explore frontend pages: `frontend/src/pages/`
3. Check database schema: `backend/prisma/schema.prisma`
4. Run test requests to verify authentication
5. Add more API endpoints as needed
6. Build frontend pages for remaining features

## Support

For questions or issues:
- Check README in respective folder (backend/frontend)
- Review API documentation
- Check Prisma schema
- Review middleware and utilities in backend/src/lib

---

**Status**: ✅ Backend API running (port 3001)  
**Status**: ✅ Frontend UI ready (port 3000)  
**Status**: ✅ Database schema initialized  
**Status**: ✅ Authentication working end-to-end
