# Vercel Deployment Guide

This guide addresses production deployment to Vercel with focus on avoiding CORS and middleware issues that plagued previous deployments.

## 🚨 Critical Production Issues & Solutions

### Issue #1: CORS Errors in Production (❌ NOT Solved by Global Middleware)

**Previous Problem**: Global `_middleware.ts` causing timeouts and CORS failures on Vercel Functions

**✅ Solution Implemented**: Route-level CORS handling in `src/lib/cors.ts`

```typescript
// ❌ DON'T do this - causes timeouts on Vercel:
// _middleware.ts (GLOBAL middleware - blocks every request)

// ✅ DO this instead - handled per route:
// src/lib/cors.ts with withApiHandler wrapper
export default withApiHandler(handler, {
  allowedMethods: ['GET', 'POST', 'OPTIONS']
});
```

**Why it works on Vercel**:
- Vercel Functions are stateless and can timeout with global middleware
- OPTIONS requests are handled before hitting handler function
- No middleware pipeline delays requests

### Issue #2: Database Connection Pool Exhaustion

**Previous Problem**: "too many connections" errors on Vercel after a few requests

**✅ Solution Implemented**: Prisma singleton pattern in `src/lib/prisma/client.ts`

```typescript
// ✅ Production-ready: Reuses connection across function invocations
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}
```

**Why it works**:
- Reuses single connection across warm function invocations
- Prevents connection pool from being exhausted
- Each cold start gets fresh connection

### Issue #3: Middleware Breaking in Production

**Previous Problem**: Auth middleware causing 502/503 errors on Vercel

**✅ Solution Implemented**: Middleware integrated into route handlers, not global

```typescript
// ✅ Each route wraps with middleware explicitly:
export default withApiHandler(
  withRoleMiddleware(['ADMIN'])(handler),
  { allowedMethods: ['GET', 'POST', 'OPTIONS'] }
);
```

**Why it works**:
- No global middleware intercepting all requests
- Middleware is isolated per route
- Failed middleware just returns error (doesn't cause 502)

## 📋 Pre-Deployment Checklist

### 1. Environment Variables (CRITICAL)

```bash
# Set in Vercel dashboard or via CLI:
vercel env add DATABASE_URL "postgresql://..."
vercel env add JWT_SECRET "your-32-char-minimum-secret-key"
vercel env add ALLOWED_ORIGINS "https://yourdomain.com"
```

**Verification**:
```bash
# List all env vars in Vercel
vercel env ls

# Verify JWT_SECRET is set (production requirement)
# If missing: Function will error at runtime - PRODUCTION WILL FAIL
```

### 2. PostgreSQL Database

```bash
# Create PostgreSQL database (NOT SQLite)
# Recommended: Heroku Postgres, Amazon RDS, or Railway

# Run migrations on production database BEFORE deploying:
npx dotenv -e .env.production run \
  npx prisma migrate deploy

# Verify schema is created:
npx prisma db execute --stdin < scripts/verify-schema.sql
```

### 3. CORS Origins Configuration

```env
# In Vercel dashboard, set ALLOWED_ORIGINS to:
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com,https://admin.yourdomain.com"

# NOT localhost:3000 in production!
```

### 4. JWT Secret Generation

```bash
# Generate strong JWT secret (minimum 32 characters):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Output example: abc123def456ghi789jkl012mno345pqr567stu890vwx
```

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Connect Repository

```bash
# From project root:
vercel

# This will:
# - Link Vercel project
# - Ask deployment directory (✓ use default)
# - Deploy to vercel.app domain
```

### Step 3: Set Environment Variables

**Option A: Via Vercel CLI**

```bash
vercel env add DATABASE_URL
# Paste: postgresql://user:pass@host:5432/db

vercel env add JWT_SECRET
# Paste: your-32-character-minimum-secret-key

vercel env add ALLOWED_ORIGINS
# Paste: https://yourdomain.com
```

**Option B: Via Vercel Dashboard**

1. Go to `https://vercel.com/dashboard`
2. Select project
3. Settings → Environment Variables
4. Add all three variables

### Step 4: Deploy

```bash
# Deploy to production
vercel --prod

# Or use Git (recommended for production):
# Push to GitHub/GitLab/Bitbucket → Auto-deploys on push
```

### Step 5: Verify Deployment

```bash
# Test API endpoint
curl https://yourdomain.vercel.app/api/health

# Test CORS headers
curl -X OPTIONS https://yourdomain.vercel.app/api/events \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: https://yourdomain.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# X-Content-Type-Options: nosniff
```

## 🔒 Production Security Checklist

- [ ] JWT_SECRET is NOT `your-secret-key-here`
- [ ] ALLOWED_ORIGINS does NOT include `localhost`
- [ ] DATABASE_URL connects to PostgreSQL (not SQLite)
- [ ] All environment variables are set in Vercel dashboard
- [ ] No `.env.local` file committed to git
- [ ] HTTPS only (Vercel provides SSL by default)
- [ ] Database backups configured
- [ ] Monitoring/alerts enabled

## 📊 Monitoring Production

### View Logs

```bash
# Stream logs from Vercel
vercel logs --prod

# Filter by function
vercel logs /api/auth/login --prod

# Export logs
vercel logs --prod > logs.txt
```

### Monitor Errors

```bash
# Use Vercel Dashboard:
# Settings → Monitoring (requires Premium)

# Or use external monitoring:
# - Sentry for error tracking
# - DataDog for performance monitoring
# - LogRocket for session replay
```

### Performance Metrics

```bash
# View function execution times
vercel analytics --prod

# Monitor database performance
# Use PostgreSQL native tools or pg_stat_statements
```

## 🚨 Common Production Errors & Solutions

### Error: "CORS error" on Frontend

**Check**:
```bash
# 1. Is ALLOWED_ORIGINS set in Vercel?
vercel env ls | grep ALLOWED_ORIGINS

# 2. Is your frontend origin in ALLOWED_ORIGINS?
echo $ALLOWED_ORIGINS | grep yourdomain

# 3. Are OPTIONS requests returning 200?
curl -X OPTIONS https://yourdomain.vercel.app/api/events \
  -H "Origin: https://yourdomain.com" \
  -i
```

**Solution**:
1. Add frontend origin to ALLOWED_ORIGINS
2. Restart deployment: `vercel --prod`
3. Clear browser cache (Ctrl+Shift+Delete)

### Error: "unavailable, status code 503"

**Check**:
- Database connection: `psql $DATABASE_URL`
- JWT_SECRET is set: `vercel env ls | grep JWT_SECRET`
- Prisma schema matches database: `npx prisma validate`

**Solution**:
```bash
# Re-run migrations on production DB
DATABASE_URL="your-prod-db" npx prisma migrate deploy

# Restart deployment
vercel --prod

# Check logs for specific error
vercel logs --prod --tail
```

### Error: "MODULE_NOT_FOUND" at runtime

**Check**:
- All imports are relative: `@/lib/cors` not `./lib/cors`
- TypeScript compiled correctly: `npm run build`

**Solution**:
```bash
# Rebuild locally
npm run build

# Check for errors
npm run typecheck

# Deploy again
vercel --prod
```

### Error: "Timeout waiting for database connection"

**Check**:
- DATABASE_URL is correct and PostgreSQL is running
- Firewall allows connections from Vercel IPs
- Prisma connection limit is not exceeded

**Solution**:
```bash
# Use connection pooling (PgBouncer)
DATABASE_URL="postgresql://...?schema=public&sslmode=require&pgbouncer=true"

# Or increase pool size
DATABASE_URL="postgresql://...?connection_limit=20"

# Restart deployment
vercel --prod
```

## 📈 Scaling to Production Load

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_event_start_date ON "Event"("startDate");
CREATE INDEX idx_registration_event_rider ON "Registration"("eventId", "riderId");
CREATE INDEX idx_user_email ON "User"("email");
```

### Caching Strategy

```typescript
// Cache event list (invalidate on event creation)
const cacheControl = 'public, max-age=300'; // 5 minutes
res.setHeader('Cache-Control', cacheControl);
```

### Connection Pooling

```env
# Use connection pooling service (recommended for Vercel):
# Skip the @ in connection string for PgBouncer
DATABASE_URL="postgresql://user:pass@pooling-service:6432/db"
```

## 💡 Best Practices

### 1. Use Git for Deployments

```bash
# Enable automatic deployments on git push
# Vercel Dashboard → Settings → Git → Auto-deploy on push
```

### 2. Use Preview Environments

```bash
# Create preview environment for testing
# Create new branch → Push → Vercel creates preview URL

git checkout -b staging
git push origin staging
# Vercel automatically creates preview.yourdomain.vercel.app
```

### 3. Implementation Secrets Management

```typescript
// ✅ DO: Use environment variables
const apiKey = process.env.STRIPE_API_KEY;

// ❌ DON'T: Hardcode secrets
const apiKey = 'sk_live_abc123...';
```

### 4. Test Production Endpoints

```bash
# Use GitHub Workflows for production tests
# .github/workflows/production-test.yml
```

## 📞 Support & Troubleshooting

### Vercel Support Resources

- Dashboard Logs: `https://vercel.com/dashboard/project-name`
- Status Page: `https://www.vercel-status.com/`
- Community: `https://github.com/vercel/next.js/discussions`

### Database Support

- PostgreSQL Docs: `https://www.postgresql.org/docs/`
- Prisma Issues: `https://github.com/prisma/prisma/issues`

### This Project Issues

- Check Audit Logs: `/api/audit`
- Check Error Codes: `src/lib/errors.ts`
- Check CORS Config: `src/lib/cors.ts`

---

## ✅ Final Verification

After deployment to Vercel, run:

```bash
# 1. Test authentication
curl -X POST https://yourdomain.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Test",
    "lastName":"User",
    "email":"test@example.com",
    "password":"SecurePass123"
  }'

# 2. Test protected endpoint
DB_URL=your-prod-db npx ts-node scripts/test-auth.ts

# 3. Test CORS from frontend origin
curl -X GET https://yourdomain.vercel.app/api/events \
  -H "Origin: https://frontend.yourdomain.com" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -i

# 4. Monitor logs for errors
vercel logs --prod --tail
```

🎉 If all checks pass, your production deployment is ready!
