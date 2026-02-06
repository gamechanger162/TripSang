'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Users, MessageSquare, Shield } from 'lucide-react';
import Link from 'next/link';

interface PremiumGateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PremiumGateModal({ isOpen, onClose }: PremiumGateModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Decorative gradient blob */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="relative p-8">
                            {/* Crown icon */}
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                                <Crown className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-white text-center mb-2">
                                Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">Communities</span>
                            </h2>

                            <p className="text-gray-400 text-center mb-8">
                                Go Premium to discover exclusive travel clubs and connect with like-minded travelers!
                            </p>

                            {/* Benefits */}
                            <div className="space-y-3 mb-8">
                                {[
                                    { icon: Users, text: 'Join exclusive travel communities' },
                                    { icon: MessageSquare, text: 'Real-time group chat with travelers' },
                                    { icon: Shield, text: 'Create and manage your own communities' },
                                    { icon: Sparkles, text: 'Premium badge & priority support' }
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-300">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                            <benefit.icon className="w-4 h-4 text-primary-400" />
                                        </div>
                                        <span className="text-sm">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <Link
                                href="/payment/signup"
                                className="block w-full py-4 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 hover:from-primary-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-center transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
                            >
                                Upgrade to Premium
                            </Link>

                            <p className="text-center text-gray-500 text-xs mt-4">
                                Starting at just ₹199/month
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
