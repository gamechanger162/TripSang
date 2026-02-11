'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSquads } from '@/contexts/SquadContext';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, ChevronRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SquadsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { squads, loading } = useSquads();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=/app/squads');
        }
    }, [status, router]);

    if (status === 'unauthenticated' || !session) return null;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0B0E11] to-[#0f1216] p-4 md:p-8 pb-32">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Users className="text-violet-400" size={32} />
                        Squad Chats
                    </h1>
                    <p className="text-zinc-400">Your trip groups and squad conversations.</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-[4/3] rounded-3xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : squads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-3xl border border-white/5">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <Users size={32} className="text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No squad chats yet</h3>
                        <p className="text-zinc-400 mb-6 max-w-sm">Join a trip or create your own to start chatting with your squad.</p>
                        <Link href="/trips" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-colors">
                            Explore Trips
                        </Link>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {squads.map((squad) => (
                            <motion.div
                                key={squad._id}
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="group relative bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-black/50"
                            >
                                <Link href={`/app/squads/${squad._id}`} className="block h-full">
                                    {/* Cover Image */}
                                    <div className="h-40 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10" />
                                        {(squad.coverPhoto || squad.coverImage || (squad.photos && squad.photos[0])) ? (
                                            <Image
                                                src={squad.coverPhoto || squad.coverImage || squad.photos?.[0] || ''}
                                                alt={squad.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                                <MapPin className="text-zinc-600" size={32} />
                                            </div>
                                        )}
                                        {squad.unreadCount && squad.unreadCount > 0 && (
                                            <div className="absolute top-3 right-3 z-20 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                {squad.unreadCount} new
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-1">
                                            {squad.title}
                                        </h3>

                                        <div className="flex flex-col gap-2 mb-4">
                                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                <MapPin size={14} className="text-zinc-500" />
                                                <span className="truncate">{squad.destination}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                <Calendar size={14} className="text-zinc-500" />
                                                <span>{formatDate(squad.startDate)}</span>
                                            </div>
                                        </div>

                                        {/* Members */}
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex -space-x-2">
                                                {(squad.squad || []).slice(0, 4).map((member: any, i: number) => (
                                                    <div
                                                        key={member._id}
                                                        className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800"
                                                        style={{ zIndex: 4 - i }}
                                                    >
                                                        {member.profilePicture ? (
                                                            <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 font-bold">
                                                                {member.name?.[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {(squad.squad || []).length > 4 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold z-0">
                                                        {`+${(squad.squad || []).length - 4}`}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                                <MessageCircle size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
