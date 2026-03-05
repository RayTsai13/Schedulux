# 🧪 Schedulux Testing Guide - Frontend ↔️ Backend Connection

This guide will help you connect your frontend to the backend and create an admin user.

---

## 📋 Prerequisites

1. **PostgreSQL** is running with the `schedulux_primary` database
2. **Database migrations** have been run
3. **Environment variables** are configured in `backend/.env`

---

## 🚀 Step 1: Start Both Servers

### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

**Expected output:**
```
============================================
🚀 Schedulux Server Started
============================================
📍 Server running on: http://localhost:3000
🌍 Environment: development
📊 Health check: http://localhost:3000/health
🔌 API base URL: http://localhost:3000/api
============================================
✅ Server ready to accept connections
```

### Terminal 2 - Frontend Server

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Checkpoint:** Both servers should be running without errors.

---

## 🔧 Step 2: Create Admin User

In **Terminal 3**, run:

```bash
cd backend
npx ts-node scripts/create-admin.ts
```

**Expected output:**
```
🔧 Creating admin user...

📧 Checking if admin@schedulux.com already exists...
🔐 Hashing password...
💾 Inserting admin user into database...

✅ Admin user created successfully!

=====================================
Admin Login Credentials:
=====================================
Email:    admin@schedulux.com
Password: Admin123!
=====================================

User Details:
ID:         1
Name:       Admin User
Role:       vendor
Created:    2025-01-XX...
=====================================

🎯 You can now login at: http://localhost:5173/login
```

**✅ Checkpoint:** Admin user is created in the database.

---

## 🧪 Step 3: Test Backend Health Check

Open your browser and visit:
```
http://localhost:3000/health
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-XX...",
    "uptime": 123.456
  },
  "message": "Server and database are running correctly"
}
```

**✅ Checkpoint:** Backend is connected to database.

---

## 🔐 Step 4: Test Frontend Login

1. **Open:** http://localhost:5173/login

2. **Login with admin credentials:**
   - Email: `admin@schedulux.com`
   - Password: `Admin123!`

3. **Click "Sign in"**

### Expected Flow:

1. **Loading spinner** appears on button
2. **Redirected to:** http://localhost:5173/dashboard
3. **Header shows:** "Hello, Admin"
4. **Toast notification:** "Login successful!"

### If You See an Error:

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Network error" | Backend not running | Start backend server |
| "Invalid credentials" | Wrong email/password | Use exact credentials from admin script |
| "CORS policy" | CORS not configured | Already fixed - restart backend |
| Blank screen | Frontend error | Check browser console (F12) |

**✅ Checkpoint:** Successfully logged in as admin.

---

## 📂 Step 5: Test Storefront Management

### Option A: Via Dashboard Link

1. From dashboard, you'll need to add a navigation link (we'll add this)

### Option B: Direct URL

1. Navigate to: **http://localhost:5173/vendor/storefronts**

2. **Expected:** "No storefronts yet" empty state page

3. Open **React Query DevTools** (bottom-right floating button)

4. Expand the **`['storefronts']`** query

5. **You should see:**
   - Status: `success` (not error!)
   - Data: `[]` (empty array)
   - This proves frontend ↔ backend connection is working!

### Expected Backend Console Log:

```
[2025-01-XX...] 📥 GET /api/storefronts - ::1
[2025-01-XX...] 🟢 GET /api/storefronts - 200 - 15ms
```

**✅ Checkpoint:** Frontend successfully fetches data from backend.

---

## 🎨 Step 6: Create Your First Storefront

1. Click **"Create Your First Storefront"** button

2. **Expected:** Nothing happens (modal not built yet)

3. **This is normal** - we'll build the modal form next

---

## 🐛 Troubleshooting

### Backend Issues

**"Error: connect ECONNREFUSED ::1:5432"**
```bash
# PostgreSQL is not running
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
Start PostgreSQL service from Services
```

**"relation 'users' does not exist"**
```bash
# Database migrations not run
cd backend
psql -d schedulux_primary -f migrations/004_clean_schema.sql
```

**"JWT_SECRET is not defined"**
```bash
# Missing environment variable
# Add to backend/.env:
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Frontend Issues

**"Failed to resolve import"**
```bash
# Missing dependencies
cd frontend
npm install @tanstack/react-query-devtools zustand
```

**"Network Error" in browser**
```bash
# Backend not running or wrong port
# Verify backend is on http://localhost:3000
# Check frontend/src/services/api.ts line 9
```

**CORS errors in console**
```bash
# Backend CORS misconfigured (should already be fixed)
# Verify backend/src/index.ts lines 94-101 include:
# 'http://localhost:5173'
```

---

## ✅ Success Checklist

- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 5173
- [ ] Admin user created in database
- [ ] Health check returns "healthy"
- [ ] Can login with admin credentials
- [ ] Redirected to dashboard after login
- [ ] Can navigate to /vendor/storefronts
- [ ] React Query DevTools shows successful API call
- [ ] Backend logs show incoming requests

---

## 📊 Verify API Connection with Browser Console

Open browser console (F12) and run:

```javascript
// Test direct API call
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)

// Should output:
// { success: true, data: { status: "healthy", ... }, ... }
```

---

## 🎯 What's Working Now

✅ **Backend:**
- Express server with CORS, rate limiting
- PostgreSQL connection with pooling
- Authentication endpoints (register, login, me, forgot-password, reset-password)
- Storefront, service, appointment, drop management APIs
- Marketplace search with geolocation
- Availability engine with timezone support
- Email notifications via SendGrid (fire-and-forget, logs to console in dev)
- Admin dashboard API

✅ **Frontend:**
- TanStack Query configured with devtools
- Zustand stores for UI state
- Full vendor dashboard (storefronts, services, hours, calendar, drops)
- Client appointment management
- Marketplace explore page with search/filters
- 4-step booking modal with drop pre-selection
- Reschedule modal (atomic cancel+rebook)
- Password reset flow (forgot + reset pages)
- Error boundary + 404 catch-all page
- Admin dashboard with storefront verification

✅ **Integration:**
- Frontend can call backend APIs
- Login flow works end-to-end
- Protected routes work with role checks
- Token storage and management
- Booking flow with advisory locking

---

## 🚧 What's Next

The core app is feature-complete. Remaining work:

1. **Docker** - Multi-stage Dockerfiles for backend + frontend
2. **Docker Compose** - Local containerized stack
3. **CI/CD** - GitHub Actions → AWS ECR → ECS

See `plan.md` for full details.

---

## 📞 Need Help?

If something doesn't work:

1. **Check both terminal windows** for error messages
2. **Check browser console (F12)** for frontend errors
3. **Check Network tab** to see API requests/responses
4. **Check React Query DevTools** to see query states
5. **Verify PostgreSQL** is running: `psql -d schedulux_primary -c "\dt"`

---

**Ready to test?** 🚀

Run the commands and let me know what you see!
