'use client';

import { motion } from 'framer-motion';

export default function MeshBackground() {
    return (
        <div className="mesh-bg">
            {/* Animated gradient orbs */}
            <motion.div
                className="orb orb-teal"
                animate={{
                    x: [0, 100, -50, 80, 0],
                    y: [0, -80, 60, -40, 0],
                    scale: [1, 1.2, 0.9, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="orb orb-orange"
                animate={{
                    x: [0, -80, 60, -100, 0],
                    y: [0, 60, -80, 40, 0],
                    scale: [1, 0.9, 1.2, 0.95, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="orb orb-purple"
                animate={{
                    x: [0, 60, -80, 40, 0],
                    y: [0, -40, 80, -60, 0],
                    scale: [1, 1.1, 0.85, 1.05, 1],
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Noise overlay for texture */}
            <div className="noise-overlay" />

            <style jsx>{`
                .mesh-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                    background: linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0d0d12 100%);
                }
                
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.6;
                    will-change: transform;
                }
                
                .orb-teal {
                    width: 600px;
                    height: 600px;
                    top: -10%;
                    left: -10%;
                    background: radial-gradient(circle, #14b8a6 0%, transparent 70%);
                }
                
                .orb-orange {
                    width: 500px;
                    height: 500px;
                    bottom: -10%;
                    right: -5%;
                    background: radial-gradient(circle, #f97316 0%, transparent 70%);
                }
                
                .orb-purple {
                    width: 400px;
                    height: 400px;
                    top: 40%;
                    left: 30%;
                    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
                    opacity: 0.4;
                }
                
                .noise-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    opacity: 0.03;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
