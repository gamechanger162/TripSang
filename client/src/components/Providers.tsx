'use client';

import { SessionProvider } from 'next-auth/react';

import { SquadProvider } from '@/contexts/SquadContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <NavigationProvider>
                <SquadProvider>
                    {children}
                </SquadProvider>
            </NavigationProvider>
        </SessionProvider>
    );
}
