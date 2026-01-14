# ✅ Your APIs are Ready! Here's How to Access Them

## 🎯 TLDR - Quick Access

**Your APIs are at:** `http://localhost:5000/api/...`

**Already created for you:**
1. ✅ Backend server with all routes
2. ✅ API client file: `client/src/lib/api.ts`
3. ✅ Complete documentation

---

## 📍 Where Your APIs Live

### File Locations:

```
server/
├── routes/
│   ├── auth.js         → /api/auth/*
│   ├── admin.js        → /api/admin/*
│   └── trips.js        → /api/trips/*
├── controllers/        → Business logic
└── index.js           → Server entry (routes mounted here)

client/
└── src/lib/api.ts     → Ready-to-use API functions
```

### URL Endpoints:

**Development:** `http://localhost:5000`
**Production:** Will be `https://your-backend.onrender.com`

---

## 🚀 3 Steps to Start Using APIs

### Step 1: Start Backend Server

```bash
# Open terminal in server folder
cd server

# Already done: npm install ✅

# Start the server
npm run dev
```

**You'll see:**
```
🚀 Server running on port 5000
✅ MongoDB Connected: ...
```

**✅ APIs are now live!**

---

### Step 2: Update Environment Variables

Edit `server/.env` (already created):

```env
# REQUIRED: Add your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# REQUIRED: Generate JWT secret (run this command):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=paste-generated-secret-here

# Already configured
CLIENT_URL=http://localhost:3000
PORT=5000
DB_NAME=tripsang
```

**To get MongoDB URI:**
1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Paste in `.env`

---

### Step 3: Use APIs in Your Frontend

Import the API client:

```typescript
import { authAPI, tripAPI, adminAPI } from '@/lib/api';

// Login example
const handleLogin = async () => {
  const response = await authAPI.login({
    email: 'user@example.com',
    password: 'password123'
  });
  
  console.log('Logged in!', response.user);
  console.log('User role:', response.user.role); // 'user', 'admin', or 'guide'
  // Token is auto-saved to localStorage
};

// Search trips example
const searchTrips = async () => {
  const response = await tripAPI.search({
    startPoint: 'Delhi',
    endPoint: 'Manali',
    tags: ['#Trekking']
  });
  
  console.log('Trips found:', response.trips);
};

// Create trip example (requires mobile verification!)
const createTrip = async () => {
  try {
    const response = await tripAPI.create({
      title: 'Weekend Getaway',
      startPoint: { name: 'Mumbai' },
      endPoint: { name: 'Goa' },
      startDate: '2026-03-15',
      endDate: '2026-03-17',
      tags: ['#Beach', '#Weekend']
    });
    console.log('Trip created!', response.trip);
  } catch (error) {
    // Will show "Mobile verification required" if not verified
    console.error(error.message);
  }
};
```

---

## 📡 All Available APIs

### 🔐 Authentication
```typescript
authAPI.register({ name, email, password })
authAPI.login({ email, password })
authAPI.verifyMobile({ mobileNumber, verificationCode })
authAPI.getCurrentUser()
authAPI.logout()
```

### 🗺️ Trips
```typescript
tripAPI.create({ title, startPoint, endPoint, dates, tags... })
tripAPI.search({ startPoint, endPoint, tags, dates... })
tripAPI.getById(tripId)
tripAPI.update(tripId, updates)
tripAPI.delete(tripId)
tripAPI.join(tripId)
tripAPI.leave(tripId)
tripAPI.like(tripId)
```

### 👑 Admin (requires admin role)
```typescript
adminAPI.getConfig()
adminAPI.updateConfig({ enableGoogleAds: true, signupFee: 149 })
adminAPI.toggleFeature('enableGoogleAds', true)
adminAPI.getUsers({ page: 1, role: 'guide' })
adminAPI.blockUser(userId, true, 'reason')
adminAPI.getStats()
```

---

## 🧪 Test APIs Right Now

### Option 1: Using cURL (PowerShell)

```bash
# Test health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test\",\"email\":\"test@example.com\",\"password\":\"test123\"}'

# Search trips
curl http://localhost:5000/api/trips/search?tags=#Beach
```

### Option 2: In Browser Console

Open http://localhost:3000 and run:

```javascript
// Test search (no auth needed)
fetch('http://localhost:5000/api/trips/search?tags=#Beach')
  .then(r => r.json())
  .then(data => console.log(data));
```

### Option 3: In Your React Component

Already have the API client ready at `client/src/lib/api.ts`!

Just import and use:
```typescript
import { tripAPI } from '@/lib/api';

const trips = await tripAPI.search({ tags: ['#Beach'] });
```

---

## 📊 Complete API Endpoint List

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Auth** | `/api/auth/register` | POST | Register user |
| | `/api/auth/login` | POST | Login (get token + role) |
| | `/api/auth/verify-mobile` | POST | Verify phone |
| | `/api/auth/me` | GET | Get current user |
| **Trips** | `/api/trips/create` | POST | Create trip (needs mobile verify) |
| | `/api/trips/search` | GET | Search with filters |
| | `/api/trips/:id` | GET | Get trip details |
| | `/api/trips/:id/join` | POST | Join squad |
| | `/api/trips/:id/like` | POST | Like trip |
| **Admin** | `/api/admin/config` | GET | Get config |
| | `/api/admin/config` | PUT | Update config (Ads ON/OFF) |
| | `/api/admin/users` | GET | List users |
| | `/api/admin/users/:id/block` | PUT | Block user |
| | `/api/admin/stats` | GET | Platform stats |

---

## 🔑 Authentication Flow

1. **Register/Login** → Get JWT token
2. Token is **auto-saved** to localStorage
3. All API calls **automatically include** the token
4. Token includes user role (user/admin/guide)

**Example:**
```typescript
// 1. Login
const { token, user } = await authAPI.login({ email, password });
// Token is auto-saved!

// 2. Now all API calls work
const trips = await tripAPI.search({});  // Works!
const profile = await authAPI.getCurrentUser();  // Works!

// 3. Logout
authAPI.logout();  // Removes token
```

---

## 📱 Frontend Environment Setup

Update `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Now your API client automatically uses the right URL!

---

## ⚡ Quick Examples

### Example 1: Login Page
```typescript
'use client';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const handleLogin = async (email: string, password: string) => {
    const { user } = await authAPI.login({ email, password });
    console.log(`Welcome ${user.name}! Role: ${user.role}`);
  };
  
  return <form>...</form>;
}
```

### Example 2: Search Trips
```typescript
'use client';
import { tripAPI } from '@/lib/api';
import { useState } from 'react';

export default function SearchPage() {
  const [trips, setTrips] = useState([]);
  
  const search = async () => {
    const { trips } = await tripAPI.search({
      startPoint: 'Delhi',
      tags: ['#Trekking']
    });
    setTrips(trips);
  };
  
  return <div>...</div>;
}
```

### Example 3: Admin Dashboard
```typescript
'use client';
import { adminAPI } from '@/lib/api';

export default function AdminPage() {
  const toggleAds = async () => {
    await adminAPI.updateConfig({
      enableGoogleAds: true
    });
    alert('Ads enabled!');
  };
  
  return <button onClick={toggleAds}>Enable Ads</button>;
}
```

---

## 🐛 Troubleshooting

### "Server not running"
```bash
cd server
npm run dev
```

### "MongoDB connection failed"
- Add MongoDB URI to `server/.env`
- Get free cluster at mongodb.com/atlas

### "JWT error"
- Generate secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to `server/.env` as `JWT_SECRET`

### CORS error
- Make sure `CLIENT_URL=http://localhost:3000` in server `.env`
- Restart server after changing `.env`

---

## 📚 Documentation Files

- **HOW_TO_USE_APIS.md** ← You are here
- **server/API_DOCUMENTATION.md** - Complete API reference
- **server/QUICK_START.md** - Detailed setup guide
- **server/MODELS_DOCUMENTATION.md** - Database schemas

---

## ✅ Checklist

- [x] Backend code created
- [x] Dependencies installed (`npm install` ✅)
- [x] API client created (`client/src/lib/api.ts`)
- [ ] Add MongoDB URI to `.env`
- [ ] Generate JWT secret
- [ ] Start server (`npm run dev`)
- [ ] Test in frontend!

---

**Your APIs are ready to use! Just configure MongoDB and start coding! 🚀**
