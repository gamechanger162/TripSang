# 🛣️ TripSang API Documentation

Complete API reference for the TripSang backend.

**Base URL:** `http://localhost:5000` (Development)  
**Production:** `https://your-backend.onrender.com`

---

## 📋 Table of Contents
1. [Authentication Routes](#authentication-routes)
2. [Admin Routes](#admin-routes)
3. [Trip Routes](#trip-routes)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)

---

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 1️⃣ Authentication Routes

**Base Path:** `/api/auth`

### POST `/api/auth/register`
Register a new user.

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "mobileNumber": "9876543210" // Optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "mobileNumber": "9876543210",
    "isMobileVerified": false,
    "isEmailVerified": false,
    "badges": [],
    "createdAt": "2026-01-14T12:00:00.000Z"
  },
  "requiresPayment": false,
  "paymentDetails": null
}
```

---

### POST `/api/auth/login`
Login and receive JWT token with user role.

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "mobileNumber": "9876543210",
    "isMobileVerified": true,
    "badges": ["Explorer", "Verified"]
  }
}
```

---

### POST `/api/auth/verify-mobile`
Verify user's mobile number.

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "mobileNumber": "9876543210",
  "verificationCode": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mobile number verified successfully.",
  "user": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "mobileNumber": "9876543210",
    "isMobileVerified": true,
    "badges": ["Verified"]
  }
}
```

---

### GET `/api/auth/me`
Get current logged-in user profile.

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "badges": ["Explorer", "Verified"]
  }
}
```

---

## 2️⃣ Admin Routes

**Base Path:** `/api/admin`

**Access:** All routes require Admin authentication

**Headers:**
```
Authorization: Bearer <admin_token>
```

### GET `/api/admin/config`
Get global configuration (Master Switchboard).

**Response (200):**
```json
{
  "success": true,
  "config": {
    "enableGoogleAds": false,
    "googleAdSenseClient": "",
    "enablePaidSignup": true,
    "signupFee": 99,
    "signupFeeCurrency": "INR",
    "features": {
      "enableChat": true,
      "enableNotifications": true
    }
  }
}
```

---

### PUT `/api/admin/config`
Update global configuration (turn Ads ON, change signup fee, etc.).

**Request Body:**
```json
{
  "enableGoogleAds": true,
  "googleAdSenseClient": "ca-pub-1234567890123456",
  "enablePaidSignup": true,
  "signupFee": 149
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Configuration updated successfully.",
  "config": {
    "enableGoogleAds": true,
    "signupFee": 149
  }
}
```

---

### PATCH `/api/admin/config/toggle/:feature`
Toggle a specific feature.

**Example:** Toggle Google Ads

**URL:** `/api/admin/config/toggle/enableGoogleAds`

**Request Body:**
```json
{
  "value": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Feature 'enableGoogleAds' toggled successfully.",
  "config": { ... }
}
```

---

### GET `/api/admin/users`
Get all users with pagination and filters.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Users per page (default: 20)
- `role` (string) - Filter by role: 'user', 'admin', 'guide'
- `isActive` (boolean) - Filter by active status
- `isMobileVerified` (boolean) - Filter by mobile verification
- `search` (string) - Search by name or email

**Example:** `/api/admin/users?page=1&limit=20&role=guide&search=john`

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "_id": "65abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "guide",
      "isMobileVerified": true,
      "isActive": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 98,
    "usersPerPage": 20
  }
}
```

---

### PUT `/api/admin/users/:id/block`
Block or unblock a user.

**Request Body:**
```json
{
  "block": true,
  "reason": "Violation of community guidelines"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User blocked successfully.",
  "user": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "isActive": false
  }
}
```

---

### GET `/api/admin/stats`
Get platform statistics.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 1250,
      "byRole": [
        { "_id": "user", "count": 1200 },
        { "_id": "guide", "count": 45 },
        { "_id": "admin", "count": 5 }
      ]
    },
    "trips": {
      "total": 350,
      "active": 120
    },
    "payments": {
      "total": 890,
      "revenue": 88110,
      "byType": {
        "signup_fee": { "total": 118800, "count": 1200 }
      }
    }
  }
}
```

---

## 3️⃣ Trip Routes

**Base Path:** `/api/trips`

### POST `/api/trips/create`
Create a new trip.

**Access:** Private (Requires mobile verification)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Himalayan Trek 2026",
  "description": "An amazing journey through the Himalayas",
  "startPoint": {
    "name": "Delhi",
    "coordinates": {
      "latitude": 28.7041,
      "longitude": 77.1025
    }
  },
  "endPoint": {
    "name": "Manali",
    "coordinates": {
      "latitude": 32.2432,
      "longitude": 77.1892
    }
  },
  "startDate": "2026-06-15T00:00:00.000Z",
  "endDate": "2026-06-22T00:00:00.000Z",
  "tags": ["#Trekking", "#Adventure", "#Himalayas"],
  "coverPhoto": "https://example.com/cover.jpg",
  "maxSquadSize": 15,
  "budget": {
    "min": 20000,
    "max": 30000,
    "currency": "INR"
  },
  "difficulty": "moderate",
  "isPublic": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Trip created successfully.",
  "trip": {
    "_id": "65abc456...",
    "title": "Himalayan Trek 2026",
    "creator": {
      "_id": "65abc123...",
      "name": "John Doe",
      "profilePicture": "..."
    },
    "startPoint": { "name": "Delhi" },
    "endPoint": { "name": "Manali" },
    "tags": ["#Trekking", "#Adventure", "#Himalayas"],
    "status": "active",
    "squadMembers": ["65abc123..."],
    "stats": {
      "views": 0,
      "likes": 0
    }
  }
}
```

**Error (403) - Mobile Not Verified:**
```json
{
  "success": false,
  "message": "Mobile verification required. Please verify your mobile number before creating a trip.",
  "requiresVerification": true
}
```

---

### GET `/api/trips/search`
Search trips with filters.

**Access:** Public (optional auth)

**Query Parameters:**
- `startPoint` (string) - Filter by starting location
- `endPoint` (string) - Filter by destination
- `startDate` (date) - Filter by start date (ISO format)
- `endDate` (date) - Filter by end date
- `tags` (string or array) - Filter by tags (e.g., #Trekking)
- `difficulty` (string) - Filter by difficulty: 'easy', 'moderate', 'difficult', 'extreme'
- `minBudget` (number) - Filter by minimum budget
- `maxBudget` (number) - Filter by maximum budget
- `search` (string) - Full-text search on title and locations
- `page` (number) - Page number (default: 1)
- `limit` (number) - Trips per page (default: 20)
- `sortBy` (string) - Sort by: 'startDate', 'recent', 'popular'

**Example:** `/api/trips/search?startPoint=Delhi&endPoint=Manali&tags=#Trekking&difficulty=moderate&page=1`

**Response (200):**
```json
{
  "success": true,
  "trips": [
    {
      "_id": "65abc456...",
      "title": "Himalayan Trek 2026",
      "creator": {
        "name": "John Doe",
        "profilePicture": "...",
        "badges": ["Explorer"]
      },
      "startPoint": { "name": "Delhi" },
      "endPoint": { "name": "Manali" },
      "startDate": "2026-06-15T00:00:00.000Z",
      "tags": ["#Trekking", "#Adventure"],
      "coverPhoto": "...",
      "squadMembers": [...],
      "currentSquadSize": 5,
      "maxSquadSize": 15,
      "stats": {
        "views": 120,
        "likes": 45
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalTrips": 52,
    "tripsPerPage": 20
  }
}
```

---

### GET `/api/trips/:id`
Get trip by ID.

**Access:** Public (optional auth for view tracking)

**Response (200):**
```json
{
  "success": true,
  "trip": {
    "_id": "65abc456...",
    "title": "Himalayan Trek 2026",
    "description": "An amazing journey...",
    "creator": {
      "name": "John Doe",
      "email": "john@example.com",
      "badges": ["Explorer", "Verified"]
    },
    "squadMembers": [...]
  }
}
```

---

### PUT `/api/trips/:id`
Update trip (creator only).

**Access:** Private

**Request Body:** (include only fields to update)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "completed"
}
```

---

### DELETE `/api/trips/:id`
Delete trip (creator or admin only).

**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "message": "Trip deleted successfully."
}
```

---

### POST `/api/trips/:id/join`
Join a trip squad.

**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully joined the trip.",
  "trip": { ... }
}
```

---

### POST `/api/trips/:id/leave`
Leave a trip squad.

**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully left the trip."
}
```

---

### POST `/api/trips/:id/like`
Like or unlike a trip.

**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "message": "Trip liked.",
  "isLiked": true,
  "likesCount": 46
}
```

---

## 📤 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## ❌ Error Handling

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Authentication Errors

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

**Token Expired:**
```json
{
  "success": false,
  "message": "Token expired. Please login again."
}
```

**403 Forbidden (Admin required):**
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

**403 Forbidden (Mobile verification required):**
```json
{
  "success": false,
  "message": "Mobile verification required. Please verify your mobile number first.",
  "requiresVerification": true
}
```

---

## 🧪 Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"test123"}'
```

### Create Trip (with token)
```bash
curl -X POST http://localhost:5000/api/trips/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test Trip","startPoint":{"name":"Delhi"},"endPoint":{"name":"Manali"},"startDate":"2026-06-15","endDate":"2026-06-22"}'
```

### Search Trips
```bash
curl "http://localhost:5000/api/trips/search?tags=#Trekking&page=1"
```

---

**API is production-ready! 🚀**
