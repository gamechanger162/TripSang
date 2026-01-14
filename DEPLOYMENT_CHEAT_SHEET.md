# 🚀 Quick Deployment Cheat Sheet

## Phase 1: Backend Development ✅ COMPLETE
```
✅ Mongoose models created
✅ Express routes implemented
✅ Authentication & middleware
✅ Dependencies installed
```

---

## Phase 2: Deploy Backend to Render 🔄 NEXT STEP

### MongoDB Atlas Setup (5 min)
```bash
1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Network Access → Add IP → 0.0.0.0/0
4. Database Access → Create user: tripsang
5. Get connection string
   mongodb+srv://tripsang:PASSWORD@cluster.mongodb.net/
```

### Render Deployment (5 min)
```bash
1. Go to https://render.com
2. New Web Service → Connect GitHub
3. Settings:
   Name: tripsang-api
   Root Directory: server
   Build: npm install
   Start: node index.js
   
4. Environment Variables:
   NODE_ENV=production
   MONGODB_URI=<from Atlas>
   DB_NAME=tripsang
   JWT_SECRET=<generate with crypto>
   CLIENT_URL=<Netlify URL later>
   
5. Deploy!
6. Get URL: https://tripsang-api.onrender.com
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Deployment
```bash
curl https://tripsang-api.onrender.com/health
```

---

## Phase 3: Frontend Development (Prompts 4-10)

### Update Environment
```env
# client/.env.local
NEXT_PUBLIC_API_URL=https://tripsang-api.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://tripsang-api.onrender.com
```

### Run Prompts
```
Prompt 4: Landing Page & Design System
Prompt 5: Auth UI (Login/Register)
Prompt 6: Trip Creation & Search
Prompt 7: Trip Details & Join Squad
Prompt 8: User Profile & Dashboard
Prompt 9: Admin Dashboard
Prompt 10: Final Polish
```

---

## Phase 4: Deploy Frontend to Netlify

### Netlify Deployment (5 min)
```bash
1. Go to https://netlify.com
2. Import project from GitHub
3. Settings:
   Base directory: client
   Build: npm run build
   Publish: client/.next
   
4. Environment Variables (copy all from .env.local):
   NEXT_PUBLIC_API_URL=https://tripsang-api.onrender.com
   AUTH_SECRET=<generate>
   AUTH_URL=<your Netlify URL>
   # + all Firebase vars
   
5. Deploy!
6. Get URL: https://your-site.netlify.app
```

### Update Backend CORS
```bash
Render → Environment → Edit CLIENT_URL
CLIENT_URL=https://your-site.netlify.app
```

---

## Phase 5: Make Yourself Admin & Go Live

### Option 1: MongoDB Atlas UI
```
Atlas → Database → Browse Collections
→ tripsang → users → Find your user
→ Edit → Change role: "admin" → Update
```

### Option 2: Script
```bash
cd server
node scripts/makeAdmin.js your-email@example.com
```

### Verify Admin Access
```bash
# Login and check role
curl -X POST https://tripsang-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'

# Should return user.role = "admin"
```

---

## 🎉 GO LIVE CHECKLIST

- [ ] Backend deployed: `curl <render-url>/health` works
- [ ] Frontend deployed: Site loads
- [ ] Can register new user
- [ ] Can login (returns token + role)
- [ ] Can create trip (after mobile verify)
- [ ] Can search trips
- [ ] Admin dashboard accessible
- [ ] CORS configured (frontend can call backend)

---

## 🔗 Final URLs

```
Backend:  https://tripsang-api.onrender.com
Frontend: https://your-site.netlify.app
Database: MongoDB Atlas (cloud)
```

---

## 📞 Quick Commands Reference

### Test Backend Health
```bash
curl https://tripsang-api.onrender.com/health
```

### Register User
```bash
curl -X POST https://tripsang-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'
```

### Search Trips
```bash
curl https://tripsang-api.onrender.com/api/trips/search?tags=#Beach
```

### Make Admin
```bash
node server/scripts/makeAdmin.js your-email@example.com
```

---

## 🆘 Common Issues

**Issue:** Build failed on Render
**Fix:** Check Root Directory = `server`

**Issue:** Build failed on Netlify  
**Fix:** Check Base directory = `client`

**Issue:** CORS error
**Fix:** Update CLIENT_URL in Render to exact Netlify URL

**Issue:** MongoDB connection failed
**Fix:** Atlas → Network Access → Add 0.0.0.0/0

---

**Current Status: ✅ Phase 1 Complete → Ready for Phase 2!**
