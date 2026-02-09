import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getApiUrl } from '@/hooks/useEnv';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                },
            },
        }),

        // Email/Password Credentials Provider
        CredentialsProvider({
            id: 'credentials',
            name: 'Email & Password',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                    placeholder: 'your@email.com',
                },
                password: {
                    label: 'Password',
                    type: 'password',
                },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                try {
                    const apiUrl = getApiUrl();
                    const response = await fetch(`${apiUrl}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Login failed');
                    }

                    // Return user object with token
                    return {
                        id: data.user._id,
                        email: data.user.email,
                        name: data.user.name,
                        role: data.user.role,
                        token: data.token,
                        isMobileVerified: data.user.isMobileVerified,
                        profilePicture: data.user.profilePicture,
                        verificationStatus: data.user.verificationStatus,
                    };
                } catch (error: any) {
                    throw new Error(error.message || 'Authentication failed');
                }
            },
        }),

        // Phone Number Credentials Provider
        CredentialsProvider({
            id: 'phone-credentials',
            name: 'Phone Number',
            credentials: {
                phoneNumber: {
                    label: 'Phone Number',
                    type: 'text',
                    placeholder: '+91...',
                },
                email: {
                    label: 'Email',
                    type: 'email',
                },
                name: {
                    label: 'Name',
                    type: 'text',
                },
            },
            async authorize(credentials) {
                if (!credentials?.phoneNumber) {
                    throw new Error('Phone number required');
                }

                try {
                    const apiUrl = getApiUrl();
                    const response = await fetch(`${apiUrl}/api/auth/phone/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phoneNumber: credentials.phoneNumber,
                            email: credentials.email || undefined,
                            name: credentials.name || undefined,
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Phone login failed');
                    }

                    // Return user object with token
                    return {
                        id: data.user._id,
                        email: data.user.email,
                        name: data.user.name,
                        role: data.user.role,
                        token: data.token,
                        isMobileVerified: data.user.isMobileVerified,
                        profilePicture: data.user.profilePicture,
                        verificationStatus: data.user.verificationStatus,
                    };
                } catch (error: any) {
                    throw new Error(error.message || 'Phone authentication failed');
                }
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle Google OAuth sign-in
            if (account?.provider === 'google') {
                try {
                    const apiUrl = getApiUrl();

                    // Check if user exists in our database
                    const checkResponse = await fetch(`${apiUrl}/api/auth/check-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email }),
                    });

                    const checkData = await checkResponse.json();

                    if (!checkData.exists) {
                        // Register new user via Google
                        const registerResponse = await fetch(`${apiUrl}/api/auth/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: user.name,
                                email: user.email,
                                password: `google-oauth-${Date.now()}`, // Random password for OAuth users
                                profilePicture: user.image,
                                authProvider: 'google',
                            }),
                        });

                        const registerData = await registerResponse.json();

                        if (!registerResponse.ok || !registerData.success) {
                            console.error('Failed to register Google user:', registerData.message);
                            return false;
                        }

                        // Store token and user data for later use
                        user.id = registerData.user._id;
                        user.token = registerData.token;
                        user.role = registerData.user.role;
                        user.isMobileVerified = registerData.user.isMobileVerified;
                    } else {
                        // User exists, perform login
                        const loginResponse = await fetch(`${apiUrl}/api/auth/google-login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: user.email,
                                googleId: account.providerAccountId,
                            }),
                        });

                        const loginData = await loginResponse.json();

                        if (loginResponse.ok && loginData.success) {
                            user.id = loginData.user._id;
                            user.token = loginData.token;
                            user.role = loginData.user.role;
                            user.isMobileVerified = loginData.user.isMobileVerified;
                            user.verificationStatus = loginData.user.verificationStatus;
                        }
                    }

                    return true;
                } catch (error) {
                    console.error('Google sign-in error:', error);
                    return false;
                }
            }

            return true;
        },

        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = user.role || 'user';
                token.accessToken = user.token;
                token.isMobileVerified = user.isMobileVerified || false;
                token.accessToken = user.token;
                token.isMobileVerified = user.isMobileVerified || false;
                token.verificationStatus = user.verificationStatus || 'unverified';
                // Map backend profilePicture to NextAuth picture
                if (user.profilePicture) {
                    token.picture = user.profilePicture;
                }
            }

            // If user updates profile, we might need to update token.picture
            // validation logic here if needed

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.accessToken = token.accessToken as string;
                session.user.isMobileVerified = token.isMobileVerified as boolean;
                session.user.isMobileVerified = token.isMobileVerified as boolean;
                session.user.verificationStatus = token.verificationStatus as string;
                if (token.picture) {
                    session.user.image = token.picture;
                }
            }

            return session;
        },
    },

    pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.AUTH_SECRET,
});
