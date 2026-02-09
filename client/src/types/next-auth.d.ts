import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: string;
            accessToken: string;
            isMobileVerified: boolean;
            mobileNumber?: string;
            verificationStatus?: string;
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        role?: string;
        token?: string;
        isMobileVerified?: boolean;
        verificationStatus?: string;
        profilePicture?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        accessToken: string;
        isMobileVerified: boolean;
        verificationStatus?: string;
    }
}
