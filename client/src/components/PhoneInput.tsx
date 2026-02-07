'use client';

import { useState, useRef, useEffect } from 'react';
import { COUNTRY_CODES, getDefaultCountryCode } from '@/data/countryCodes';
import { ChevronDown } from 'lucide-react';

interface PhoneInputProps {
    value: string;
    onChange: (fullNumber: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
}

export default function PhoneInput({
    value,
    onChange,
    placeholder = 'Phone number',
    className = '',
    disabled = false,
    required = false,
    id,
    name
}: PhoneInputProps) {
    // Parse value to extract country code and number
    const parseValue = (val: string) => {
        for (const cc of COUNTRY_CODES) {
            if (val.startsWith(cc.code)) {
                return {
                    countryCode: cc.code,
                    number: val.slice(cc.code.length)
                };
            }
        }
        return {
            countryCode: getDefaultCountryCode(),
            number: val.replace(/^\+\d+/, '')
        };
    };

    const { countryCode: initialCode, number: initialNumber } = parseValue(value);
    const [selectedCountry, setSelectedCountry] = useState(initialCode);
    const [phoneNumber, setPhoneNumber] = useState(initialNumber);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCountryChange = (code: string) => {
        setSelectedCountry(code);
        setShowDropdown(false);
        onChange(`${code}${phoneNumber}`);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        setPhoneNumber(num);
        onChange(`${selectedCountry}${num}`);
    };

    const currentCountry = COUNTRY_CODES.find(c => c.code === selectedCountry) || COUNTRY_CODES[0];

    return (
        <div className={`flex relative ${className}`}>
            {/* Country Code Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => !disabled && setShowDropdown(!showDropdown)}
                    disabled={disabled}
                    className="flex items-center gap-1 px-3 py-3 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="text-lg">{currentCountry.flag}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentCountry.code}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showDropdown && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-56 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        {COUNTRY_CODES.map((country) => (
                            <button
                                key={country.code}
                                type="button"
                                onClick={() => handleCountryChange(country.code)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedCountry === country.code ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                                    }`}
                            >
                                <span className="text-lg">{country.flag}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{country.country}</span>
                                <span className="text-sm text-gray-500 ml-auto">{country.code}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Phone Number Input */}
            <input
                type="tel"
                id={id}
                name={name}
                value={phoneNumber}
                onChange={handleNumberChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={10}
            />
        </div>
    );
}
