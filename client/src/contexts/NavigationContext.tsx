'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type NavigationState = 'idle' | 'search' | 'scrolled';

interface NavigationContextType {
    navState: NavigationState;
    setNavState: (state: NavigationState) => void;
    isSearchActive: boolean;
    setSearchActive: (active: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    // New Chat App State
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [navState, setNavState] = useState<NavigationState>('idle');
    const [isSearchActive, setSearchActive] = useState(false);
    const [activeTab, setActiveTab] = useState('home');

    // Chat App State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    // Handle scroll to switch between idle and scrolled states
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                if (!isSearchActive) {
                    setNavState(window.scrollY > 50 ? 'scrolled' : 'idle');
                }
                ticking = false;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSearchActive]);

    // When search becomes active, override scroll state
    useEffect(() => {
        if (isSearchActive) {
            setNavState('search');
        } else {
            // Re-evaluate scroll state when closing search
            if (window.scrollY > 50) {
                setNavState('scrolled');
            } else {
                setNavState('idle');
            }
        }
    }, [isSearchActive]);

    return (
        <NavigationContext.Provider value={{
            navState,
            setNavState,
            isSearchActive,
            setSearchActive,
            activeTab,
            setActiveTab,
            isSidebarOpen,
            setSidebarOpen,
            activeChatId,
            setActiveChatId
        }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
