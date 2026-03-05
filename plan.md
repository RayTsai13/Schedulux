# Schedulux: Production Release Plan

## Context

Schedulux is a functioning appointment marketplace (Express+TS backend, React+Vite frontend, PostgreSQL). Core features work: auth, storefronts, services, scheduling, appointments, drops, marketplace search, admin dashboard. However, the platform cannot go to production because it lacks deployment infrastructure, email notifications, password reset, and rate limiting. This plan covers all four must-haves plus frontend hardening.

**Deployment target:** AWS (ECS + RDS)
**Email provider:** SendGrid
**Homepage strategy:** /explore marketplace (no separate landing page)

---

## Phase 1: Infrastructure — Docker, Env Vars, CI/CD (1A–1C ✅ | 1D–1G remaining)

**Goal:** Containerize both services, externalize config, set up CI/CD.

### 1A. Externalize environment variables ✅

**`backend/src/index.ts`** — Replace hardcoded `allowedOrigins` (lines 92–99):
```ts
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
```

**`frontend/src/services/api.ts`** — Replace hardcoded API URL (line 9):
```ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

### 1B. Create `.env.example` files ✅

**`backend/.env.example`** — DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, NODE_ENV, PORT, ALLOWED_ORIGINS, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME, FRONTEND_URL

**`frontend/.env.example`** — VITE_API_URL

### 1C. Backend build/start scripts ✅

**`backend/package.json`** — Add:
```json
"build": "tsc",
"start": "node dist/index.js"
```
(tsconfig already has `outDir: "./dist"`, `rootDir: "./src"`)

### 1D. Dockerfiles (multi-stage)

| File | Build stage | Run stage |
|------|-------------|-----------|
| `backend/Dockerfile` | `node:20-alpine`, `npm ci`, `npm run build` | `node:20-alpine`, `npm ci --omit=dev`, copy `dist/` + `migrations/` |
| `frontend/Dockerfile` | `node:20-alpine`, `npm ci`, `npm run build` (with `VITE_API_URL` build arg) | `nginx:alpine`, copy `dist/` |
| `frontend/nginx.conf` | — | `try_files $uri $uri/ /index.html` (SPA fallback) |

### 1E. Docker Compose (local dev)

**`docker-compose.yml`** (project root) — 3 services: `db` (postgres:15-alpine), `backend` (port 3000), `frontend` (port 5173→80)

### 1F. `.dockerignore` files

**`backend/.dockerignore`** — `node_modules`, `dist`, `.env`
**`frontend/.dockerignore`** — `node_modules`, `dist`, `.env*`

### 1G. GitHub Actions CI/CD

**`.github/workflows/deploy.yml`**:
- **`lint-and-build`** job (all PRs + pushes): checkout → setup node 20 → `npm ci` + `npm run lint` (frontend) → `npm ci` + `npm run build` (backend) → `npm run build` (frontend)
- **`deploy`** job (main branch pushes only): configure AWS creds (OIDC) → ECR login → docker build+push backend → docker build+push frontend (with `VITE_API_URL` build arg) → `aws ecs update-service --force-new-deployment` for both services

### Files created/modified

| Action | File |
|--------|------|
| Edit | `backend/src/index.ts` — CORS from env |
| Edit | `backend/package.json` — build/start scripts |
| Edit | `frontend/src/services/api.ts` — VITE_API_URL |
| Create | `backend/.env.example` |
| Create | `frontend/.env.example` |
| Create | `backend/Dockerfile` |
| Create | `backend/.dockerignore` |
| Create | `frontend/Dockerfile` |
| Create | `frontend/.dockerignore` |
| Create | `frontend/nginx.conf` |
| Create | `docker-compose.yml` |
| Create | `.github/workflows/deploy.yml` |

### Verification

- [ ] `docker compose build` succeeds
- [ ] `docker compose up` → backend health check returns 200, frontend loads and calls APIs
- [x] `ALLOWED_ORIGINS` env var correctly restricts CORS in backend
- [x] `VITE_API_URL` build arg changes API base URL in frontend bundle
- [ ] GitHub Actions lint-and-build passes on PR

---

## Phase 2: Rate Limiting ✅

**Goal:** Protect auth endpoints from brute force, general API abuse prevention.

### 2A. Install dependency ✅

```bash
cd backend && npm install express-rate-limit
```

### 2B. Create rate limiter middleware ✅

**Create `backend/src/middleware/rateLimiter.ts`**:

```ts
import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../types';

// Strict limiter for auth endpoints (login, register, forgot-password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many attempts. Please try again in 15 minutes.',
  } as ApiResponse<null>,
});

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many requests. Please slow down.',
  } as ApiResponse<null>,
});
```

### 2C. Apply in index.ts ✅

**`backend/src/index.ts`** — Add after body parsing, before routes:

```ts
import { authLimiter, apiLimiter } from './middleware/rateLimiter';

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
```

### Files created/modified

| Action | File |
|--------|------|
| Create | `backend/src/middleware/rateLimiter.ts` |
| Edit | `backend/src/index.ts` — import + app.use() |
| Edit | `backend/package.json` — add express-rate-limit |

### Verification

- [x] `POST /api/auth/login` returns 429 after 10 rapid requests
- [x] `GET /api/marketplace/search` returns 429 after 100 rapid requests
- [x] Response body matches `ApiResponse` shape: `{ success: false, data: null, message: "..." }`
- [x] `RateLimit-*` headers present in responses

---

## Phase 3: Email Notifications (SendGrid) ✅

**Goal:** Transactional email for registration, appointments, and password reset.

**Depends on:** Phase 1 (env vars for SENDGRID_API_KEY, FRONTEND_URL)

### 3A. Install dependency ✅

```bash
cd backend && npm install @sendgrid/mail
```

### 3B. Create EmailService ✅

**Create `backend/src/services/EmailService.ts`** — Static methods, follows existing service pattern:

```
EmailService
├── private isConfigured()          — checks SENDGRID_API_KEY exists
├── private send(to, subject, html) — sends via sgMail, logs on failure, NEVER throws
├── private wrapTemplate(content)   — consistent email layout wrapper (inline CSS)
├── sendWelcome(email, firstName)
├── sendAppointmentConfirmation(email, details)
├── sendAppointmentStatusChange(email, details)  — for confirmed/cancelled/declined
├── sendNewBookingNotification(email, details)   — to vendor when client books
└── sendPasswordReset(email, token)              — link: FRONTEND_URL/reset-password?token=...
```

**Key design: fire-and-forget** — email failures are logged but never thrown. No `await` in calling code to avoid blocking business operations. When `SENDGRID_API_KEY` is unset, methods log what they would send (dev-friendly).

### 3C. Integrate into existing services ✅

**`backend/src/services/UserService.ts`** — In `register()` after `UserModel.create()`:

```ts
EmailService.sendWelcome(newUser.email, newUser.first_name);
```

**`backend/src/services/AppointmentService.ts`** — After appointment creation (post-transaction):

```ts
const clientUser = await UserModel.findById(clientId);
const vendorUser = await UserModel.findById(storefront.vendor_id);
EmailService.sendAppointmentConfirmation(clientUser.email, { ... });
EmailService.sendNewBookingNotification(vendorUser.email, { ... });
```

Also in approve/decline/cancel handlers — send status change email to client.

### Files created/modified

| Action | File |
|--------|------|
| Create | `backend/src/services/EmailService.ts` |
| Edit | `backend/src/services/UserService.ts` — welcome email |
| Edit | `backend/src/services/AppointmentService.ts` — booking + status emails |
| Edit | `backend/package.json` — add @sendgrid/mail |

### Verification

- [x] Without `SENDGRID_API_KEY`: logs "would send" messages, no crashes
- [x] Registration sends welcome email
- [x] Appointment creation sends confirmation to client + notification to vendor
- [x] Approve/decline sends status change email
- [ ] All emails render in Gmail/Apple Mail (inline styles) — requires live SendGrid key

---

## Phase 4: Password Reset Flow ✅

**Goal:** Complete forgot/reset password, backend + frontend.

**Depends on:** Phase 3 (uses `EmailService.sendPasswordReset`)

### 4A. Database migration ✅

**Create `backend/migrations/010_password_reset_tokens.sql`**:

```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prt_token ON password_reset_tokens(token);
CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);
```

### 4B. Backend model ✅

**Create `backend/src/models/PasswordResetToken.ts`**:

```ts
import { query } from '../config/database';
import crypto from 'crypto';

export class PasswordResetTokenModel {
  // Invalidates existing tokens, generates 32-byte hex token, 1hr expiry
  static async create(userId: number): Promise<string> {
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
    return token;
  }

  // Returns { user_id } if unused + not expired, null otherwise
  static async findValidToken(token: string): Promise<{ user_id: number } | null> {
    const result = await query(
      `SELECT user_id FROM password_reset_tokens WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  }

  // Marks token as used
  static async markUsed(token: string): Promise<void> {
    await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`, [token]);
  }
}
```

### 4C. Backend service + routes ✅

**Edit `backend/src/models/User.ts`** — Add:

```ts
static async updatePassword(userId: number, passwordHash: string): Promise<boolean> {
  const result = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING id`,
    [passwordHash, userId]
  );
  return result.rows.length > 0;
}
```

**Edit `backend/src/services/UserService.ts`** — Add:

- `requestPasswordReset(email)` — finds user (silent no-op if not found to prevent enumeration), creates token, sends email via EmailService
- `resetPassword(token, newPassword)` — validates password, finds valid token, updates hash, marks token used

**Edit `backend/src/routes/auth.ts`** — Add 2 routes:

- `POST /api/auth/forgot-password` — body: `{ email }`, always returns 200 (prevents user enumeration)
- `POST /api/auth/reset-password` — body: `{ token, password }`, returns 200 or 400

Both use `express-validator` + `handleValidationErrors` (matching existing route pattern). Rate limited by `authLimiter` from Phase 2.

### 4D. Frontend API + pages ✅

**Edit `frontend/src/services/api.ts`** — Add to `authApi`:

```ts
forgotPassword: async (email: string): Promise<ApiResponse<null>> => { ... },
resetPassword: async (token: string, password: string): Promise<ApiResponse<null>> => { ... },
```

**Create `frontend/src/pages/auth/ForgotPasswordPage.tsx`**:

- `AppScaffold` + `useForm` + Zod schema (`{ email: z.string().email() }`)
- Calls `authApi.forgotPassword()`, shows success message regardless
- "Back to login" link

**Create `frontend/src/pages/auth/ResetPasswordPage.tsx`**:

- Reads `token` from `useSearchParams`
- Password + confirm password form with Zod `.refine()` match validation
- Calls `authApi.resetPassword(token, password)`
- Success → "Go to login" button; Error → link to request new reset

**Edit `frontend/src/pages/auth/LoginPage.tsx`** — Add "Forgot password?" link below password field:

```tsx
<button type="button" onClick={() => navigate('/forgot-password')}
  className="text-sm text-v3-accent hover:text-v3-accent/80 transition-colors">
  Forgot password?
</button>
```

**Edit `frontend/src/App.tsx`** — Add routes:

```tsx
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

### Files created/modified

| Action | File |
|--------|------|
| Create | `backend/migrations/010_password_reset_tokens.sql` |
| Create | `backend/src/models/PasswordResetToken.ts` |
| Create | `frontend/src/pages/auth/ForgotPasswordPage.tsx` |
| Create | `frontend/src/pages/auth/ResetPasswordPage.tsx` |
| Edit | `backend/src/models/User.ts` — updatePassword() |
| Edit | `backend/src/services/UserService.ts` — requestPasswordReset(), resetPassword() |
| Edit | `backend/src/routes/auth.ts` — 2 new routes |
| Edit | `frontend/src/services/api.ts` — forgotPassword(), resetPassword() |
| Edit | `frontend/src/pages/auth/LoginPage.tsx` — forgot password link |
| Edit | `frontend/src/App.tsx` — 2 new routes |

### Verification

- [x] Run migration: `psql -d schedulux_primary -f backend/migrations/010_password_reset_tokens.sql`
- [x] `POST /api/auth/forgot-password` with valid email → sends reset email
- [x] Same endpoint with unknown email → returns 200 (no user enumeration)
- [x] Reset link in email → `FRONTEND_URL/reset-password?token=...`
- [x] `POST /api/auth/reset-password` with valid token → updates password
- [x] Expired / used token → 400 error
- [x] User can log in with new password
- [x] Rate limiter applies to both endpoints
- [x] "Forgot password?" link visible on login page

---

## Phase 5: Frontend Hardening ✅

**Goal:** Error boundary, 404 page, cleanup.

### 5A. Error boundary ✅

**Create `frontend/src/components/ErrorBoundary.tsx`**:

React error boundaries must be class components (React 18 does not support function component error boundaries).

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-v3-background">
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-v3-primary mb-4">Something went wrong</h1>
            <p className="text-v3-secondary mb-6">An unexpected error occurred.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="px-6 py-3 bg-v3-primary text-white rounded-xl font-medium"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 5B. 404 page ✅

**Create `frontend/src/pages/NotFoundPage.tsx`**:

```tsx
import AppScaffold from '../components/layout/AppScaffold';
import UniversalButton from '../components/universal/UniversalButton';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <AppScaffold>
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-8xl font-bold text-v3-primary mb-4">404</h1>
          <p className="text-xl text-v3-secondary mb-8">Page not found</p>
          <UniversalButton variant="primary" size="lg" onClick={() => navigate('/explore')}>
            Browse marketplace
          </UniversalButton>
        </div>
      </div>
    </AppScaffold>
  );
}
```

### 5C. Wire into App.tsx ✅

**Edit `frontend/src/App.tsx`**:

1. Wrap `<AuthProvider>` with `<ErrorBoundary>`
2. Add `<Route path="*" element={<NotFoundPage />} />` as last route
3. Remove `/design-test` route (dev-only, should not ship to production)

### Files created/modified

| Action | File |
|--------|------|
| Create | `frontend/src/components/ErrorBoundary.tsx` |
| Create | `frontend/src/pages/NotFoundPage.tsx` |
| Edit | `frontend/src/App.tsx` — ErrorBoundary wrapper, 404 catch-all, remove /design-test |

### Verification

- [x] `/any-nonexistent-path` → 404 page with working navigation
- [x] Throwing error in component → ErrorBoundary fallback renders
- [x] All existing routes still work
- [x] `/design-test` no longer accessible

---

## Execution Order

```
Phase 1 (Docker/Infra) ─┐
                         ├─ Phase 3 (Email) ─── Phase 4 (Password Reset)
Phase 2 (Rate Limiting) ─┘

Phase 5 (Hardening) ─── (independent, anytime)
```

Phases 1, 2, and 5 are independent and can be done in parallel. Phase 3 needs Phase 1 env vars. Phase 4 needs Phase 3 EmailService.

**If working sequentially:** 1 → 2 → 3 → 4 → 5

---

## Complete File Manifest

### New files (17)

| File | Phase |
|------|-------|
| `backend/.env.example` | 1 |
| `frontend/.env.example` | 1 |
| `backend/Dockerfile` | 1 |
| `backend/.dockerignore` | 1 |
| `frontend/Dockerfile` | 1 |
| `frontend/.dockerignore` | 1 |
| `frontend/nginx.conf` | 1 |
| `docker-compose.yml` | 1 |
| `.github/workflows/deploy.yml` | 1 |
| `backend/src/middleware/rateLimiter.ts` | 2 |
| `backend/src/services/EmailService.ts` | 3 |
| `backend/migrations/010_password_reset_tokens.sql` | 4 |
| `backend/src/models/PasswordResetToken.ts` | 4 |
| `frontend/src/pages/auth/ForgotPasswordPage.tsx` | 4 |
| `frontend/src/pages/auth/ResetPasswordPage.tsx` | 4 |
| `frontend/src/components/ErrorBoundary.tsx` | 5 |
| `frontend/src/pages/NotFoundPage.tsx` | 5 |

### Modified files (10)

| File | Phase(s) |
|------|----------|
| `backend/src/index.ts` | 1, 2 |
| `backend/package.json` | 1, 2, 3 |
| `frontend/src/services/api.ts` | 1, 4 |
| `backend/src/services/UserService.ts` | 3, 4 |
| `backend/src/services/AppointmentService.ts` | 3 |
| `backend/src/models/User.ts` | 4 |
| `backend/src/routes/auth.ts` | 4 |
| `frontend/src/pages/auth/LoginPage.tsx` | 4 |
| `frontend/src/App.tsx` | 4, 5 |

### NPM packages to install

| Package | Where | Phase |
|---------|-------|-------|
| `express-rate-limit` | backend | 2 |
| `@sendgrid/mail` | backend | 3 |
