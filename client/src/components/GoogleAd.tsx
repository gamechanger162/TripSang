'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/hooks/useEnv';

interface GoogleAdProps {
    slot?: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
    responsive?: boolean;
    className?: string;
}

interface GlobalConfig {
    enableGoogleAds: boolean;
    googleAdSenseClient: string;
}

/**
 * Google AdSense Component
 * Fetches GlobalConfig from API and conditionally renders ads
 */
export default function GoogleAd({
    slot = '0000000000',
    format = 'auto',
    responsive = true,
    className = '',
}: GoogleAdProps) {
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Fetch GlobalConfig from API
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const apiUrl = getApiUrl();
                const response = await fetch(`${apiUrl}/api/admin/config`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.config) {
                        setConfig(data.config);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch Google Ads config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    // Load AdSense script if enabled
    useEffect(() => {
        if (!config?.enableGoogleAds || !config?.googleAdSenseClient) {
            return;
        }

        // Check if script already loaded
        const existingScript = document.querySelector(
            `script[src*="adsbygoogle.js"]`
        );

        if (existingScript) {
            setScriptLoaded(true);
            return;
        }

        // Load AdSense script
        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.googleAdSenseClient}`;
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            setScriptLoaded(true);
        };

        script.onerror = () => {
            console.error('Failed to load Google AdSense script');
        };

        document.head.appendChild(script);

        return () => {
            // Cleanup script if component unmounts
            const scriptElement = document.querySelector(
                `script[src*="adsbygoogle.js"]`
            );
            if (scriptElement && scriptElement.parentNode) {
                scriptElement.parentNode.removeChild(scriptElement);
            }
        };
    }, [config]);

    // Initialize ad after script loads
    useEffect(() => {
        if (scriptLoaded && config?.enableGoogleAds) {
            try {
                // @ts-ignore - AdSense global
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (error) {
                console.error('AdSense initialization error:', error);
            }
        }
    }, [scriptLoaded, config]);

    // Don't render anything if:
    // - Still loading
    // - Ads are disabled
    // - No client ID configured
    if (loading) {
        return (
            <div className={`animate-pulse bg-gray-200 dark:bg-dark-700 rounded-lg ${className}`}>
                <div className="h-48 w-full" />
            </div>
        );
    }

    if (!config?.enableGoogleAds || !config?.googleAdSenseClient) {
        return null;
    }

    // Render AdSense ad unit
    return (
        <div className={`google-ad-container ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={config.googleAdSenseClient}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? 'true' : 'false'}
            />
        </div>
    );
}

/**
 * Responsive Display Ad
 */
export function GoogleAdDisplay({ className }: { className?: string }) {
    return (
        <GoogleAd
            format="auto"
            responsive={true}
            className={className}
        />
    );
}

/**
 * In-Feed Ad (for article/blog layouts)
 */
export function GoogleAdInFeed({ className }: { className?: string }) {
    return (
        <GoogleAd
            format="fluid"
            responsive={true}
            className={className}
        />
    );
}

/**
 * In-Article Ad
 */
export function GoogleAdInArticle({ className }: { className?: string }) {
    return (
        <GoogleAd
            format="fluid"
            responsive={true}
            className={className}
        />
    );
}
