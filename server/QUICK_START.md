# 🚀 Quick Start Guide - TripSang API

Get your TripSang backend up and running in minutes!

---

## ✅ Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Code editor (VS Code recommended)

---

## 📦 Step 1: Install Dependencies

```bash
cd server
npm install
```

This will install:
- express, mongoose, socket.io
- JWT authentication (jsonwebtoken, bcryptjs)
- Razorpay payments
- Security (helmet, cors)

---

## 🔧 Step 2: Configure Environment

Create `.env` file in `server/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=tripsang

# Client
CLIENT_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# Razorpay (optional for now)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
```

**⚠️ IMPORTANT:** Generate a strong JWT_SECRET:
```bash
# Use this command to generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Step 3: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. **Network Access:** Add `0.0.0.0/0` (allow from anywhere)
4. **Database Access:** Create a user with password
5. **Connect:** Get connection string
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/
```

Paste this into your `.env` file as `MONGODB_URI`

---

## 🚀 Step 4: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
✅ MongoDB Connected: cluster0-abc123.mongodb.net
📦 Database: tripsang
🚀 Server running on port 5000
🌍 Environment: development
🔗 Allowed Origins: [ 'http://localhost:3000', 'http://localhost:3001' ]
```

---

## 🧪 Step 5: Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "TripSang API is running",
  "timestamp": "2026-01-14T12:00:00.000Z",
  "environment": "development"
}
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

You'll receive a JWT token in response!

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

Save the token from the response for authenticated requests.

---

## 🔐 Step 6: Test Protected Routes

Replace `YOUR_TOKEN` with the JWT token from login:

### Get Current User
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a Trip (requires mobile verification first!)
```bash
curl -X POST http://localhost:5000/api/trips/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Weekend Getaway",
    "startPoint": {"name": "Mumbai"},
    "endPoint": {"name": "Goa"},
    "startDate": "2026-03-15",
    "endDate": "2026-03-17",
    "tags": ["#Beach", "#Weekend"]
  }'
```

This will fail with "Mobile verification required" error. First verify mobile:

### Verify Mobile
```bash
curl -X POST http://localhost:5000/api/auth/verify-mobile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mobileNumber": "9876543210",
    "verificationCode": "123456"
  }'
```

Now try creating the trip again!

---

## 📊 Step 7: Create Admin User (Optional)

To test admin features, manually update a user's role in MongoDB:

### Using MongoDB Compass or Atlas UI:

1. Go to your database → `users` collection
2. Find your user document
3. Edit the document and change `"role": "user"` to `"role": "admin"`
4. Save

### Using MongoDB Shell:

```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { role: "admin" } }
)
```

Now you can access admin routes!

### Test Admin Route
```bash
curl http://localhost:5000/api/admin/config \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📁 Project Structure

```
server/
├── controllers/           # Business logic
│   ├── authController.js  # Authentication handlers
│   ├── adminController.js # Admin operations
│   └── tripController.js  # Trip CRUD operations
│
├── middleware/            # Express middleware
│   └── auth.js           # JWT authentication
│
├── models/               # Mongoose schemas
│   ├── User.js          # User model
│   ├── Trip.js          # Trip model
│   ├── GlobalConfig.js  # Master switchboard
│   └── Payment.js       # Payment tracking
│
├── routes/              # API routes
│   ├── auth.js         # /api/auth/*
│   ├── admin.js        # /api/admin/*
│   └── trips.js        # /api/trips/*
│
├── utils/              # Utility functions
│   └── jwt.js         # JWT helpers
│
├── index.js           # Main entry point
├── package.json       # Dependencies
└── .env               # Environment variables
```

---

## 🎯 Available Routes

### Authentication (`/api/auth`)
- ✅ POST `/register` - Register user
- ✅ POST `/login` - Login (returns JWT + role)
- ✅ POST `/verify-mobile` - Verify phone number
- ✅ GET `/me` - Get current user

### Admin (`/api/admin`) - Requires Admin Role
- ✅ GET `/config` - Read GlobalConfig
- ✅ PUT `/config` - Update switches (Ads, payments)
- ✅ GET `/users` - List all users
- ✅ PUT `/users/:id/block` - Ban/unban user
- ✅ GET `/stats` - Platform statistics

### Trips (`/api/trips`)
- ✅ POST `/create` - Create trip (mobile verification required)
- ✅ GET `/search` - Search trips (filter by start, end, date, tags)
- ✅ GET `/:id` - Get trip details
- ✅ PUT `/:id` - Update trip
- ✅ DELETE `/:id` - Delete trip
- ✅ POST `/:id/join` - Join squad
- ✅ POST `/:id/leave` - Leave squad
- ✅ POST `/:id/like` - Like/unlike trip

---

## 🔍 Testing Tools

### Option 1: cURL (Command Line)
Already shown in examples above.

### Option 2: Postman
1. Import the API endpoints
2. Create an environment with `baseUrl=http://localhost:5000`
3. Save token as environment variable after login

### Option 3: Thunder Client (VS Code Extension)
1. Install Thunder Client extension
2. Create requests for each endpoint
3. Use variables for token management

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB Connection Error: ...
```
**Solution:**
- Check `MONGODB_URI` in `.env`
- Verify network access in MongoDB Atlas (0.0.0.0/0)
- Ensure database user credentials are correct

### JWT Error
```
JWT_SECRET is not defined
```
**Solution:**
- Add `JWT_SECRET` to `.env` file
- Must be at least 32 characters for security

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
- Change `PORT` in `.env` to 5001 or another port
- Or kill the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill -9
  ```

### CORS Error
```
Access to fetch blocked by CORS policy
```
**Solution:**
- Update `CLIENT_URL` in `.env` to match your frontend URL
- Restart the server after changing `.env`

---

## 📱 Next Steps

1. **Frontend Integration**
   - Use the JWT token in your Next.js app
   - Store token in localStorage or cookies
   - Include in Authorization header for all API calls

2. **Add More Features**
   - Payment routes (Razorpay integration)
   - User profile routes
   - Chat functionality (Socket.io)
   - File upload (profile pictures, trip photos)

3. **Deploy to Render**
   - Follow `DEPLOYMENT.md` guide
   - Add environment variables in Render dashboard
   - Deploy from GitHub repository

---

## 📚 Documentation

- **API Documentation:** `API_DOCUMENTATION.md`
- **Models Documentation:** `MODELS_DOCUMENTATION.md`
- **Deployment Guide:** `../DEPLOYMENT.md`

---

## 🆘 Need Help?

Check the documentation files or review the code comments. All routes have detailed JSDoc comments explaining their functionality.

---

**Happy Coding! 🚀**
