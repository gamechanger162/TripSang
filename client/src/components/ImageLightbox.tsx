import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

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

    // Zoom & Pan State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDist, setStartDist] = useState(0);
    const [startScale, setStartScale] = useState(1);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 }); // Midpoint for zoom origin
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

    // Reset zoom on slide change
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, [currentIndex]);

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

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch start
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setStartDist(dist);
            setStartScale(scale);
        } else if (e.touches.length === 1 && scale > 1) {
            // Pan start (only if zoomed in)
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinching
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (startDist > 0) {
                const newScale = Math.min(Math.max(1, startScale * (dist / startDist)), 4);
                setScale(newScale);
            }
        } else if (e.touches.length === 1 && isDragging && scale > 1) {
            // Panning
            e.preventDefault(); // Prevent scrolling while panning
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (scale < 1.1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    };


    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Top Bar */}
            <div className="absolute top-20 left-0 right-0 p-4 flex items-center justify-between z-[60] pointer-events-none">
                <div className="max-w-7xl mx-auto w-full flex justify-between pointer-events-auto px-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/40 border border-white/10 px-4 py-2 rounded-full hover:bg-black/60 backdrop-blur-md shadow-lg"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium text-sm">Back to Moments</span>
                    </button>
                </div>
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors z-50 p-2 md:p-3 bg-black/20 md:bg-white/10 backdrop-blur-md rounded-full hover:bg-black/40 md:hover:bg-white/20 flex items-center justify-center"
                    >
                        <ChevronLeft size={24} className="md:w-8 md:h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors z-50 p-2 md:p-3 bg-black/20 md:bg-white/10 backdrop-blur-md rounded-full hover:bg-black/40 md:hover:bg-white/20 flex items-center justify-center"
                    >
                        <ChevronRight size={24} className="md:w-8 md:h-8" />
                    </button>
                </>
            )}

            {/* Main Image Container */}
            <div
                className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col items-center justify-center overflow-hidden touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                >
                    <Image
                        src={images[currentIndex].url}
                        alt={images[currentIndex].caption || `Photo ${currentIndex + 1}`}
                        fill
                        priority
                        sizes="100vw"
                        className="object-contain pointer-events-none"
                    />
                </div>

                {/* Caption / Counter (Hide when zoomed) */}
                {scale === 1 && (
                    <div className="absolute bottom-4 md:bottom-8 left-0 right-0 text-center text-white z-40 px-4">
                        {images[currentIndex].caption && (
                            <p className="text-lg md:text-xl font-medium mb-2 drop-shadow-md">{images[currentIndex].caption}</p>
                        )}
                        <p className="text-xs md:text-sm text-white/60 bg-black/30 px-3 py-1 rounded-full inline-block backdrop-blur-sm">
                            {currentIndex + 1} / {images.length}
                        </p>
                    </div>
                )}
            </div>

            {/* Hint for mobile users */}
            {scale === 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/40 text-[10px] pointer-events-none md:hidden animate-pulse">
                    Pinch to zoom
                </div>
            )}
        </div>
    );
}

