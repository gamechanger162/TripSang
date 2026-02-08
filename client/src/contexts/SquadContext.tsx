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

    const token = session?.user?.accessToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

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
                updatedSquads.unshift({
                    ...squad,
                    unreadCount: (squad.unreadCount || 0) + 1,
                    updatedAt: message.timestamp
                });

                return updatedSquads;
            });
        };

        socketManager.on('squad_list_update', handleSquadUpdate);

        return () => {
            socketManager.off('squad_list_update', handleSquadUpdate);
        };
    }, [socketUrl, token, session?.user?.id]);

    return (
        <SquadContext.Provider value={{ squads, loading, refreshSquads: fetchSquads }}>
            {children}
        </SquadContext.Provider>
    );
}
