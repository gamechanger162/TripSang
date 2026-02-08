'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home,
    MessageCircle,
    Users,
    Globe,
    Settings,
    ChevronLeft
} from 'lucide-react';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
}

interface NavRailProps {
    unreadDMs?: number;
    unreadSquads?: number;
}

export default function NavRail({ unreadDMs = 0, unreadSquads = 0 }: NavRailProps) {
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { icon: <MessageCircle size={22} />, label: 'DMs', href: '/app', badge: unreadDMs },
        { icon: <Users size={22} />, label: 'Squads', href: '/app/squads', badge: unreadSquads },
        { icon: <Globe size={22} />, label: 'Communities', href: '/app/communities' },
        { icon: <Settings size={22} />, label: 'Settings', href: '/app/settings' },
    ];

    const isActive = (href: string) => {
        if (href === '/app') return pathname === '/app';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className="nav-rail-desktop">
                {/* Home/Exit Button */}
                <Link href="/" className="nav-exit-btn">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="nav-exit-icon"
                    >
                        <ChevronLeft size={20} />
                    </motion.div>
                    <span className="nav-exit-text">Home</span>
                </Link>

                {/* Nav Items */}
                <div className="nav-items">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="nav-icon-wrapper">
                                    {item.icon}
                                    {item.badge && item.badge > 0 && (
                                        <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                                    )}
                                </div>
                                <span className="nav-label">{item.label}</span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <nav className="nav-rail-mobile">
                {/* Home exit at start */}
                <Link href="/" className="nav-mobile-item">
                    <Home size={22} />
                    <span>Home</span>
                </Link>

                {navItems.slice(0, 3).map((item) => (
                    <Link key={item.href} href={item.href} className={`nav-mobile-item ${isActive(item.href) ? 'active' : ''}`}>
                        <div className="relative">
                            {item.icon}
                            {item.badge && item.badge > 0 && (
                                <span className="nav-badge-mobile">{item.badge > 9 ? '9+' : item.badge}</span>
                            )}
                        </div>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <style jsx>{`
                /* Desktop Sidebar */
                .nav-rail-desktop {
                    display: none;
                    flex-direction: column;
                    width: 72px;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(20px);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px 8px;
                    gap: 8px;
                }
                
                @media (min-width: 768px) {
                    .nav-rail-desktop {
                        display: flex;
                    }
                }
                
                .nav-exit-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 8px;
                    margin-bottom: 16px;
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    transition: all 0.2s;
                    text-decoration: none;
                }
                
                .nav-exit-btn:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .nav-exit-icon {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                
                .nav-exit-text {
                    font-size: 11px;
                    font-weight: 500;
                }
                
                .nav-items {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex: 1;
                }
                
                .nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 12px 8px;
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    transition: all 0.2s;
                    cursor: pointer;
                }
                
                .nav-item:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .nav-item.active {
                    color: #14b8a6;
                    background: rgba(20, 184, 166, 0.15);
                }
                
                .nav-icon-wrapper {
                    position: relative;
                }
                
                .nav-badge {
                    position: absolute;
                    top: -6px;
                    right: -10px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 5px;
                    background: #ef4444;
                    border-radius: 9px;
                    font-size: 10px;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .nav-label {
                    font-size: 11px;
                    font-weight: 500;
                }
                
                /* Mobile Bottom Nav */
                .nav-rail-mobile {
                    display: flex;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 64px;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 0 8px;
                    padding-bottom: env(safe-area-inset-bottom, 0);
                    z-index: 100;
                }
                
                @media (min-width: 768px) {
                    .nav-rail-mobile {
                        display: none;
                    }
                }
                
                .nav-mobile-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    font-size: 10px;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                
                .nav-mobile-item.active {
                    color: #14b8a6;
                }
                
                .nav-badge-mobile {
                    position: absolute;
                    top: -4px;
                    right: -8px;
                    min-width: 16px;
                    height: 16px;
                    padding: 0 4px;
                    background: #ef4444;
                    border-radius: 8px;
                    font-size: 9px;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </>
    );
}
