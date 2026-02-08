'use client';

import { ReactNode } from 'react';
import MeshBackground from '@/components/app/ui/MeshBackground';
import NavRail from '@/components/app/NavRail';
import { SquadProvider } from '@/contexts/SquadContext';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <SquadProvider>
            <div className="app-shell">
                {/* Animated Mesh Background */}
                <MeshBackground />

                {/* Main App Content */}
                <div className="app-content">
                    <NavRail />
                    {children}
                </div>

                <style jsx global>{`
                    /* App Shell Styles */
                    .app-shell {
                        position: fixed;
                        inset: 0;
                        width: 100vw;
                        height: 100dvh;
                        overflow: hidden;
                        background: #0a0a0f;
                    }
                    
                    .app-content {
                        position: relative;
                        z-index: 1;
                        width: 100%;
                        height: 100%;
                        display: flex;
                    }
                    
                    /* Hide scrollbars but allow scrolling */
                    .app-scrollable::-webkit-scrollbar {
                        width: 6px;
                    }
                    .app-scrollable::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .app-scrollable::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.2);
                        border-radius: 3px;
                    }
                    .app-scrollable::-webkit-scrollbar-thumb:hover {
                        background: rgba(255,255,255,0.3);
                    }
                `}</style>
            </div>
        </SquadProvider>
    );
}
