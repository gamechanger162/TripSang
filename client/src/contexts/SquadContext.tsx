'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { tripAPI } from '@/lib/api';
import { useEnv } from '@/hooks/useEnv';
import { socketManager } from '@/lib/socketManager';

interface Squad {
    _id: string;
    title: string;
    destination?: string;
    startPoint: { name: string };
    endPoint: { name: string };
    startDate: string;
    endDate: string;
    coverPhoto?: string;
    coverImage?: string;
    photos?: string[];
    squadMembers: any[];
    squad?: any[];
    creator: {
        _id: string;
        name: string;
        profilePicture?: string;
        isVerified?: boolean;
    };
    unreadCount?: number;
    updatedAt?: string;
}

interface SquadContextType {
    squads: Squad[];
    loading: boolean;
    refreshSquads: () => Promise<void>;
    unreadCount: number;
    markAsRead: (squadId: string) => void;
    setActiveSquadId: (squadId: string | null) => void;
}

const SquadContext = createContext<SquadContextType | undefined>(undefined);

export function useSquads() {
    const context = useContext(SquadContext);
    if (!context) {
        throw new Error('useSquads must be used within a SquadProvider');
    }
    return context;
}

export function SquadProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const { socketUrl } = useEnv();
    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeSquadId, setActiveSquadId] = useState<string | null>(null);

    const token = session?.user?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    // ... (fetchSquads remains same)
    const fetchSquads = useCallback(async () => {
        try {
            const response = await tripAPI.getMyTrips();
            if (response.success || response.trips) {
                setSquads(response.trips || []);
            }
        } catch (error) {
            console.error('Failed to fetch squads:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch squads on mount
    useEffect(() => {
        if (status === 'authenticated') {
            fetchSquads();
        }
    }, [status, fetchSquads]);

    // Socket integration for real-time updates
    useEffect(() => {
        if (!socketUrl || !token || !session?.user?.id) return;

        const socket = socketManager.connect(socketUrl, token);

        const handleSquadUpdate = (message: any) => {
            if (!message.tripId) return;

            setSquads(prev => {
                const existingIndex = prev.findIndex(s => s._id === message.tripId);
                if (existingIndex === -1) return prev;

                const updatedSquads = [...prev];
                const squad = updatedSquads[existingIndex];

                // Remove from current position and add to top
                updatedSquads.splice(existingIndex, 1);

                // Only increment unread count if NOT currently viewing this squad
                const shouldIncrement = message.tripId !== activeSquadId;

                updatedSquads.unshift({
                    ...squad,
                    unreadCount: shouldIncrement ? (squad.unreadCount || 0) + 1 : 0,
                    updatedAt: message.timestamp
                });

                return updatedSquads;
            });
        };

        socketManager.on('squad_list_update', handleSquadUpdate);

        return () => {
            socketManager.off('squad_list_update', handleSquadUpdate);
        };
    }, [socketUrl, token, session?.user?.id, activeSquadId]);

    // Calculate total unread count
    const unreadCount = squads.reduce((acc, squad) => acc + (squad.unreadCount || 0), 0);

    const markAsRead = useCallback((squadId: string) => {
        setSquads(prev => prev.map(s =>
            s._id === squadId ? { ...s, unreadCount: 0 } : s
        ));
    }, []);

    return (
        <SquadContext.Provider value={{ squads, loading, refreshSquads: fetchSquads, unreadCount, markAsRead, setActiveSquadId }}>
            {children}
        </SquadContext.Provider>
    );
}
