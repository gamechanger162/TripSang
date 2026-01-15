import { useState, useEffect } from 'react';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setIsLoaded(false);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return isLoaded;
};
