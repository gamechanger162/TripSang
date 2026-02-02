"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        setIsStandalone(
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        );

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        // Handle install prompt for Android/Desktop
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if not already installed and check local storage to see if user dismissed it recently
            const hasDismissed = localStorage.getItem("installPromptDismissed");
            if (!hasDismissed) {
                setIsVisible(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Show iOS instructions if on iOS and not standalone
        if (/iphone|ipad|ipod/.test(userAgent) && !window.matchMedia("(display-mode: standalone)").matches) {
            const hasDismissed = localStorage.getItem("installPromptDismissed");
            if (!hasDismissed) setIsVisible(true);
        }

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
                setIsVisible(false);
            }
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Remember dismissal for 7 days
        localStorage.setItem("installPromptDismissed", "true");
        setTimeout(() => {
            localStorage.removeItem("installPromptDismissed");
        }, 7 * 24 * 60 * 60 * 1000);
    };

    if (isStandalone || !isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96 animate-slide-up">
            <div className="bg-slate-800/95 backdrop-blur-sm border border-indigo-500/30 p-4 rounded-xl shadow-2xl flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <img src="/icon-192.png" alt="App Icon" className="w-10 h-10 rounded-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                Install <img src="/logo-new.png" alt="TripSang" className="h-6 w-auto object-contain bg-white/10 rounded px-1" />
                            </h3>
                            <p className="text-slate-300 text-sm leading-tight">
                                {isIOS
                                    ? "Install for the best experience"
                                    : "Add to Home Screen for quick access and better performance"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isIOS ? (
                    <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200">
                        <p className="flex items-center gap-2 mb-2">
                            <span className="bg-slate-600 p-1 rounded">1</span>
                            Tap the <Share size={16} className="text-blue-400 inline" /> Share button
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="bg-slate-600 p-1 rounded">2</span>
                            Select <span className="font-semibold text-white">Add to Home Screen</span>
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                    >
                        <Download size={18} />
                        Install App
                    </button>
                )}
            </div>
        </div>
    );
}
