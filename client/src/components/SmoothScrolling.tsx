'use client';

import { ReactLenis } from '@studio-freight/react-lenis';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SmoothScrolling({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    // Disable Lenis on routes/devices where it adds overhead without benefit
    const skipSmooth =
        pathname?.startsWith('/app') ||         // Chat — fixed layout
        pathname?.startsWith('/auth') ||         // Auth — simple forms
        pathname?.startsWith('/payment') ||      // Payment — short pages
        pathname?.startsWith('/my-plan') ||      // Plans — short page
        pathname?.startsWith('/dashboard') ||    // Dashboard — mixed layout
        pathname?.startsWith('/settings') ||     // Settings — forms
        isMobile;                                // Mobile — use native scroll momentum

    if (skipSmooth) {
        return <>{children}</>;
    }

    return (
        <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
            {children}
        </ReactLenis>
    );
}

