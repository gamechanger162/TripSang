# 🌍 TripSang - Travel Social Network

A modern travel social network built with Next.js 14 and Node.js, designed for travelers to connect, share experiences, and discover amazing destinations.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Framer Motion** (animations)
- **NextAuth v5** (authentication)
- **Firebase** (phone auth)
- **Socket.io Client** (real-time features)

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **Socket.io** (real-time chat)
- **JWT** (authentication)
- **Bcrypt** (password hashing)
- **Razorpay** (payments)
- **Helmet** (security)

## 📁 Project Structure

```
TripSang/
├── client/              # Next.js 14 frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   └── lib/         # API client & utilities
│   └── package.json
│
├── server/              # Express.js backend
│   ├── controllers/     # Route controllers
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & other middleware
│   ├── scripts/         # Utility scripts
│   └── index.js         # Server entry point
│
└── docs/                # Documentation
```

## 🎯 Features

- ✅ **User Authentication** (JWT + Phone verification)
- ✅ **Trip Creation & Management** 
- ✅ **Advanced Search & Filtering** (by location, dates, tags)
- ✅ **Squad System** (join trips with other travelers)
- ✅ **Social Features** (likes, comments, sharing)
- ✅ **Admin Dashboard** (user management, global config)
- ✅ **Payment Integration** (Razorpay)
- ✅ **Real-time Chat** (Socket.io)
- ✅ **Mobile Verification** (Firebase)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Firebase project (for phone auth)

### 1. Clone Repository
```bash
git clone https://github.com/gamechanger162/TripSang.git
cd TripSang
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start server
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd client
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your API URLs and Firebase config

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT + role)
- `POST /api/auth/verify-mobile` - Verify phone number

### Trips
- `POST /api/trips/create` - Create trip (requires mobile verification)
- `GET /api/trips/search` - Search trips with filters
- `GET /api/trips/:id` - Get trip details
- `POST /api/trips/:id/join` - Join trip squad
- `POST /api/trips/:id/like` - Like trip

### Admin (Admin only)
- `GET /api/admin/config` - Get global configuration
- `PUT /api/admin/config` - Update config (Ads, fees, etc.)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/block` - Block/unblock user

**Full API documentation:** `server/API_DOCUMENTATION.md`

## 🌐 Deployment

### Backend (Render)
1. Create MongoDB Atlas cluster
2. Deploy to Render.com
3. Configure environment variables
4. Get backend URL

### Frontend (Netlify)
1. Update API URL in `.env.local`
2. Deploy to Netlify
3. Configure environment variables

**Detailed deployment guide:** `DEPLOYMENT_EXECUTION_PLAN.md`

## 📚 Documentation

- **`DEPLOYMENT_EXECUTION_PLAN.md`** - Complete deployment workflow
- **`DEPLOYMENT_CHEAT_SHEET.md`** - Quick reference
- **`HOW_TO_USE_APIS.md`** - API usage guide
- **`server/API_DOCUMENTATION.md`** - Complete API reference
- **`server/MODELS_DOCUMENTATION.md`** - Database schemas
- **`server/QUICK_START.md`** - Server setup guide

## 🔧 Environment Variables

### Server (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
DB_NAME=tripsang
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
AUTH_SECRET=your-nextauth-secret
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# ... other Firebase vars
```

## 🛡️ Security Features

- ✅ Bcrypt password hashing
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Mobile verification gates
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check documentation in the repo
- Review API documentation
- Check troubleshooting sections

## 🌟 Acknowledgments

Built with ❤️ for travelers worldwide

---

**Ready to explore? Start your TripSang journey today! 🚀**
