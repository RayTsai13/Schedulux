# 🐛 Login Debugging Guide

## Quick Checks

### 1. Open Browser Console (F12)

Look for errors in the **Console** tab when you click "Sign in"

### 2. Check Network Tab (F12 → Network)

Filter for "Fetch/XHR" and watch for:
- Request to `http://localhost:3000/api/auth/login`
- Status code (should be 200 for success, 401 for wrong credentials)

### 3. Check What's Being Sent

In Network tab, click the `/login` request and check:

**Request Headers:**
```
Content-Type: application/json
```

**Request Payload:**
```json
{
  "email": "admin@schedulux.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbG..."
  },
  "message": "Login successful"
}
```

---

## Common Issues & Fixes

### ❌ **Network Error / ERR_CONNECTION_REFUSED**

**Cause:** Backend is not running

**Fix:**
```bash
cd backend
npm run dev
```

---

### ❌ **401 Unauthorized - "Invalid email or password"**

**Cause:** Wrong credentials or user doesn't exist

**Fix:**
```bash
cd backend
npx ts-node scripts/create-admin.ts
```

Make sure you use EXACT credentials:
- Email: `admin@schedulux.com` (no extra spaces!)
- Password: `Admin123!` (case-sensitive!)

---

### ❌ **CORS Error**

**Cause:** Backend not allowing frontend origin

**Fix:** Already fixed in your code, but restart backend:
```bash
cd backend
npm run dev
```

---

### ❌ **Login Succeeds but Doesn't Redirect**

**Cause:** Fixed in the code I just updated

**Current Fix:** Save the file and refresh browser (Ctrl+Shift+R)

---

## Test Manually

### Option 1: Test Backend Directly

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@schedulux.com","password":"Admin123!"}'
```

**Expected output:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@schedulux.com",
      "first_name": "Admin",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

If this works, the backend is fine - it's a frontend issue.

---

### Option 2: Test in Browser Console

Open browser console (F12) and paste:

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@schedulux.com',
    password: 'Admin123!'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  if (data.success) {
    console.log('✅ LOGIN WORKS!');
    console.log('Token:', data.data.token);
  } else {
    console.log('❌ LOGIN FAILED:', data.message);
  }
})
.catch(err => console.log('❌ ERROR:', err));
```

---

## Check localStorage

After attempting login, check if token was saved:

```javascript
// In browser console (F12)
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', localStorage.getItem('user_data'));
```

**If both are null:** Login failed silently
**If both have values:** Login worked but redirect failed

---

## Full Debug Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Admin user created in database
- [ ] Using exact credentials: `admin@schedulux.com` / `Admin123!`
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 status on `/login` request
- [ ] Response contains `success: true`
- [ ] localStorage has `auth_token` after login
- [ ] Page redirects to `/dashboard`

---

## Still Not Working?

**Share these with me:**

1. **Browser Console output** (any errors?)
2. **Network tab screenshot** of the `/login` request
3. **Response from curl test** (Option 1 above)
4. **localStorage values** (after login attempt)

This will help me pinpoint exactly what's wrong!
