'use client';

import { SessionProvider } from 'next-auth/react';

import { SquadProvider } from '@/contexts/SquadContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SquadProvider>
                {children}
            </SquadProvider>
        </SessionProvider>
    );
}
