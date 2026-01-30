import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: string;
            accessToken: string;
            isMobileVerified: boolean;
            mobileNumber?: string;
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        role?: string;
        token?: string;
        isMobileVerified?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        accessToken: string;
        isMobileVerified: boolean;
    }
}
