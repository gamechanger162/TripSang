'use client';

import FuturisticChat from '@/components/chat/FuturisticChat';
import { useState } from 'react';

// Demo messages for showcase
const demoMessages = [
    {
        _id: '1',
        senderId: 'user1',
        senderName: 'Priya',
        message: 'Hey everyone! Ready for the Manali trip? 🏔️',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text' as const,
    },
    {
        _id: '2',
        senderId: 'user2',
        senderName: 'Rahul',
        message: 'Absolutely! I just packed my hiking gear. The weather looks perfect!',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        type: 'text' as const,
        reactions: [{ emoji: '🔥', userId: 'user1' }, { emoji: '❤️', userId: 'user3' }],
    },
    {
        _id: '3',
        senderId: 'current',
        senderName: 'You',
        message: 'Can\'t wait! Should we meet at the bus station around 6 AM?',
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        type: 'text' as const,
    },
    {
        _id: '4',
        senderId: 'user3',
        senderName: 'Maya',
        message: 'Sounds great to me! I\'ll bring the snacks 🍪',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text' as const,
        replyTo: {
            senderName: 'You',
            message: 'Should we meet at the bus station around 6 AM?',
            type: 'text',
        },
    },
    {
        _id: '5',
        senderId: 'user1',
        senderName: 'Priya',
        senderProfilePicture: '/demo/avatar1.jpg',
        message: '',
        imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        type: 'image' as const,
    },
    {
        _id: '6',
        senderId: 'user2',
        senderName: 'Rahul',
        message: 'That view is incredible! 😍',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: 'text' as const,
        reactions: [{ emoji: '😍', userId: 'user1' }, { emoji: '❤️', userId: 'user3' }, { emoji: '🔥', userId: 'current' }],
    },
];

export default function ChatDemoPage() {
    const [chatType, setChatType] = useState<'squad' | 'dm'>('squad');

    return (
        <div className="min-h-screen bg-black pt-20 pb-10">
            <div className="max-w-md mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent mb-2">
                        Futuristic Chat UI
                    </h1>
                    <p className="text-white/60 text-sm">
                        2026 Design • Liquid Glass • Zero-UI Gestures
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-full p-1 bg-white/5 backdrop-blur-lg border border-white/10">
                        {['squad', 'dm'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setChatType(type as any)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${chatType === type
                                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                                        : 'text-white/50 hover:text-white/80'
                                    }`}
                            >
                                {type === 'squad' ? 'Squad Chat' : 'Direct Message'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Component */}
                <FuturisticChat
                    tripId="demo-trip-id"
                    isSquadChat={chatType === 'squad'}
                    isSquadMember={true}
                    receiverName={chatType === 'dm' ? 'Priya Sharma' : undefined}
                />

                {/* Feature Highlights */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                    {[
                        { icon: '🫧', title: 'Liquid Glass', desc: '15px backdrop blur' },
                        { icon: '✨', title: 'Physics Bounce', desc: 'Spring animations' },
                        { icon: '👆', title: 'Swipe Gestures', desc: 'Reply & React' },
                        { icon: '📳', title: 'Haptic Feedback', desc: 'Tactile responses' },
                        { icon: '🌊', title: 'Mesh Gradient', desc: 'Animated backdrop' },
                        { icon: '👻', title: 'Ghost Text', desc: 'AI predictions' },
                    ].map((feature) => (
                        <div
                            key={feature.title}
                            className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
                        >
                            <span className="text-2xl mb-2 block">{feature.icon}</span>
                            <h3 className="text-white font-medium text-sm">{feature.title}</h3>
                            <p className="text-white/40 text-xs">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
