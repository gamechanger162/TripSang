'use client';

import { useState, useRef, useEffect } from 'react';

interface CityAutocompleteProps {
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    cities: string[];
}

export default function CityAutocomplete({
    id,
    name,
    value,
    onChange,
    placeholder = 'Enter city name',
    className = '',
    required = false,
    cities,
}: CityAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter cities when value changes
    useEffect(() => {
        if (value.trim().length > 0) {
            const filtered = cities.filter(city =>
                city.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10);
            setSuggestions(filtered);
            setShowDropdown(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }
    }, [value, cities]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setHighlightedIndex(-1);
    };

    const handleSelectCity = (city: string) => {
        onChange(city);
        setShowDropdown(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                    handleSelectCity(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                id={id}
                name={name}
                type="text"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => value.trim().length > 0 && suggestions.length > 0 && setShowDropdown(true)}
                placeholder={placeholder}
                className={className}
                required={required}
                autoComplete="off"
            />

            {/* Dropdown Suggestions */}
            {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((city, index) => (
                        <button
                            key={city}
                            type="button"
                            onClick={() => handleSelectCity(city)}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${index === highlightedIndex
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                    : 'text-gray-900 dark:text-gray-100'
                                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''
                                }`}
                        >
                            <div className="flex items-center">
                                <svg
                                    className="w-4 h-4 mr-2 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                {city}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
