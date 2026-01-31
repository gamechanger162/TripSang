import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

interface ImageLightboxProps {
    images: { url: string; caption?: string }[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onIndexChange?: (index: number) => void;
}

export default function ImageLightbox({
    images,
    initialIndex,
    isOpen,
    onClose,
    onIndexChange
}: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null;

    const handlePrev = () => {
        const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
        onIndexChange?.(newIndex);
    };

    const handleNext = () => {
        const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
        onIndexChange?.(newIndex);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50 p-2"
            >
                <X size={32} />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-50 p-2 bg-black/20 rounded-full hover:bg-black/40"
                    >
                        <ChevronLeft size={40} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-50 p-2 bg-black/20 rounded-full hover:bg-black/40"
                    >
                        <ChevronRight size={40} />
                    </button>
                </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                        src={images[currentIndex].url}
                        alt={images[currentIndex].caption || `Photo ${currentIndex + 1}`}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Caption / Counter */}
                <div className="absolute bottom-[-40px] left-0 right-0 text-center text-white pb-4">
                    {images[currentIndex].caption && (
                        <p className="text-lg mb-1">{images[currentIndex].caption}</p>
                    )}
                    <p className="text-sm opacity-70">
                        {currentIndex + 1} / {images.length}
                    </p>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
