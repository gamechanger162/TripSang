'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { notificationAPI } from '@/lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const subscribeToPush = async () => {
        if (!isSupported) return;
        setIsLoading(true);

        try {
            // 1. Register Service Worker
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            });

            // 2. Wait for it to be ready
            await navigator.serviceWorker.ready;

            // 3. Request Permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                throw new Error('Permission denied');
            }

            // 4. Subscribe
            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID Public Key missing');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // 5. Send to Server
            await notificationAPI.subscribe(subscription);

            toast.success('Notifications enabled!');
        } catch (error: any) {
            console.error('Push error:', error);
            if (error.message === 'Permission denied') {
                toast.error('You denied notifications. Please enable them in browser settings.');
            } else {
                toast.error('Failed to enable notifications.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupported) return null; // Don't show if not supported
    if (permission === 'granted') return null; // Don't show if already granted (or maybe show "Active" state?)

    if (permission === 'denied') {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
                        <BellOff size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications Blocked</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enable in browser settings to stay updated.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-full text-indigo-600 dark:text-indigo-200">
                    <Bell size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Enable Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get instant updates about your trips and messages.</p>
                </div>
            </div>
            <button
                onClick={subscribeToPush}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Enabling...
                    </>
                ) : (
                    'Enable Notifications'
                )}
            </button>
        </div>
    );
}
