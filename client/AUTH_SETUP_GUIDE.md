# 🔐 Hybrid Authentication Setup Guide

Complete guide for setting up Google OAuth + Email/Password + Phone verification.

---

## 📋 What Was Implemented

### 1. **NextAuth v5 Configuration** (`auth.ts`)

✅ **Google OAuth Provider**
- Login with Google account
- Auto-register new users
- Sync with backend database

✅ **Credentials Provider**
- Email/Password login
- Calls backend `/api/auth/login`
- Returns JWT token

✅ **Session Management**
- JWT-based sessions
- Stores: `id`, `role`, `accessToken`, `isMobileVerified`
- 30-day session duration

---

### 2. **Firebase Phone Auth** (`lib/firebase.ts`)

✅ **Client SDK Setup**
- Phone authentication with OTP
- reCAPTCHA verification
- Support for international numbers

---

### 3. **Phone Verification Page** (`app/verify/page.tsx`)

✅ **Two-Step Process:**

**Step 1: Phone Input**
- User enters phone number
- Invisible reCAPTCHA verification
- Sends OTP via Firebase

**Step 2: OTP Verification**
- User enters 6-digit OTP
- Firebase confirms code
- Backend API call to save status in MongoDB

✅ **Features:**
- Auto-format phone numbers (+91 prefix)
- Resend OTP option
- Error handling with toast notifications
- Skip option for later

---

## 🔧 Environment Variables Setup

### Required Variables

Add to `client/.env.local`:

```env
# NextAuth
AUTH_SECRET=your-super-secret-key-min-32-chars
AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase (Phone Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Backend API
NEXT_PUBLIC_API_URL=https://tripsang.onrender.com
```

---

## 🚀 Setup Instructions

### Step 1: Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

Or in Node:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.local`:
```env
AUTH_SECRET=<generated-secret>
```

---

### Step 2: Set Up Google OAuth

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Create Project** (or use existing)
   - Click "Select Project" → "New Project"
   - Name: "TripSang"

3. **Enable Google+ API**
   - APIs & Services → Library
   - Search "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth Client ID"
   - Application type: "Web application"
   - Name: "TripSang Web Client"

5. **Configure Redirect URLs**
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://your-domain.com/api/auth/callback/google
     ```

6. **Get Credentials**
   - Copy **Client ID** and **Client Secret**
   - Add to `.env.local`:
     ```env
     GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
     ```

---

### Step 3: Set Up Firebase (Phone Auth)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add Project"
   - Name: "TripSang"
   - Disable Google Analytics (optional)

2. **Register Web App**
   - Project Overview → Add App → Web (</> icon)
   - App nickname: "TripSang Web"
   - Copy the config object

3. **Enable Phone Authentication**
   - Build → Authentication → Get Started
   - Sign-in method tab
   - Enable "Phone"
   - Save

4. **Add Authorized Domains**
   - Authentication → Settings → Authorized domains
   - Add: `localhost`, `your-domain.com`

5. **Get Firebase Config**
   - Project Settings → General → Your apps
   - Copy all values to `.env.local`:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXX
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tripsang.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=tripsang
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tripsang.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
     NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
     ```

---

## 🧪 Testing

### Test Email/Password Login

```typescript
import { signIn } from 'next-auth/react';

const handleLogin = async () => {
  const result = await signIn('credentials', {
    email: 'user@example.com',
    password: 'password123',
    redirect: false,
  });

  if (result?.ok) {
    console.log('Login successful!');
  }
};
```

### Test Google OAuth

```typescript
import { signIn } from 'next-auth/react';

const handleGoogleLogin = async () => {
  await signIn('google', {
    callbackUrl: '/dashboard',
  });
};
```

### Test Phone Verification

1. Navigate to `/verify`
2. Enter phone number (e.g., `9876543210`)
3. Click "Send OTP"
4. Check phone for OTP
5. Enter 6-digit code
6. Click "Verify OTP"

**Test Phone Numbers (Firebase):**
- Test mode allows any phone with any OTP
- Production requires real phone numbers

---

## 📱 Phone Verification Flow

```
┌─────────────────┐
│ User Dashboard  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Click "Verify Phone"    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ /verify Page            │
│ Enter Phone Number      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Firebase sends OTP      │
│ (via SMS)               │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User enters OTP         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Firebase verifies       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Call Backend API        │
│ POST /verify-mobile     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ MongoDB Updated:        │
│ isMobileVerified = true │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Redirect to Dashboard   │
│ User can create trips! ✅│
└─────────────────────────┘
```

---

## 🔐 Security Features

✅ **JWT Sessions**
- Server-side validation
- 30-day expiration
- Automatic refresh

✅ **Phone Verification**
- Firebase reCAPTCHA
- OTP expires after 60 seconds
- Rate limiting built-in

✅ **OAuth Security**
- HTTPS required in production
- CSRF protection
- Secure callback URLs

---

## 🎯 Usage in Components

### Get Current Session

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please login</div>;
  }

  return (
    <div>
      <h1>Welcome {session?.user?.name}!</h1>
      <p>Role: {session?.user?.role}</p>
      <p>Mobile Verified: {session?.user?.isMobileVerified ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Protect Routes

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Protected Dashboard</div>;
}
```

### Check Mobile Verification

```typescript
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CreateTripPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user?.isMobileVerified) {
    return (
      <div>
        <p>Please verify your phone number to create trips.</p>
        <button onClick={() => router.push('/verify')}>
          Verify Now
        </button>
      </div>
    );
  }

  return <div>Create Trip Form...</div>;
}
```

---

## 🐛 Troubleshooting

### Issue: "Invalid callback URL"
**Fix:** Add callback URL to Google Cloud Console authorized URIs

### Issue: "Firebase not initialized"
**Fix:** Check all `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local`

### Issue: "reCAPTCHA not working"
**Fix:** 
- Add domain to Firebase authorized domains
- Check browser console for errors
- Ensure reCAPTCHA container exists

### Issue: "OTP not sending"
**Fix:**
- Verify Firebase phone auth is enabled
- Check phone number format (+91 for India)
- Ensure billing is enabled for Firebase project

---

## 📚 File Structure

```
client/
├── src/
│   ├── auth.ts                      ✅ NextAuth config
│   ├── app/
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts             ✅ NextAuth API handler
│   │   └── verify/
│   │       └── page.tsx             ✅ Phone verification page
│   ├── lib/
│   │   └── firebase.ts              ✅ Firebase config
│   ├── components/
│   │   └── ToasterProvider.tsx      ✅ Toast notifications
│   └── types/
│       └── next-auth.d.ts           ✅ TypeScript types
└── .env.local                       ✅ Environment variables
```

---

## 🎉 Authentication Complete!

Your hybrid authentication system is ready with:
- ✅ Google OAuth login
- ✅ Email/Password login
- ✅ Phone OTP verification
- ✅ JWT sessions with role management
- ✅ MongoDB backend integration

**Next steps:** Build your UI components and protect your routes!

---

**Questions?** Check NextAuth docs: https://next-auth.js.org
**Firebase Phone Auth:** https://firebase.google.com/docs/auth/web/phone-auth
