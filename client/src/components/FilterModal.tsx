'use client';

import { useState } from 'react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterOptions) => void;
    initialFilters?: FilterOptions;
}

export interface FilterOptions {
    tags: string[];
    difficulty?: string;
    minBudget?: number;
    maxBudget?: number;
    sortBy?: 'startDate' | 'recent' | 'popular';
}

const POPULAR_TAGS = [
    '#Trekking',
    '#Foodie',
    '#Adventure',
    '#Beach',
    '#Mountains',
    '#Culture',
    '#Photography',
    '#Wildlife',
    '#Backpacking',
    '#Luxury',
    '#Solo',
    '#Family',
    '#Weekend',
    '#Camping',
    '#Road Trip',
];

const DIFFICULTY_LEVELS = ['easy', 'moderate', 'difficult', 'extreme'];

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters?.tags || []);
    const [difficulty, setDifficulty] = useState<string>(initialFilters?.difficulty || '');
    const [minBudget, setMinBudget] = useState<number | undefined>(initialFilters?.minBudget);
    const [maxBudget, setMaxBudget] = useState<number | undefined>(initialFilters?.maxBudget);
    const [sortBy, setSortBy] = useState<string>(initialFilters?.sortBy || 'recent');

    if (!isOpen) return null;

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleApply = () => {
        onApply({
            tags: selectedTags,
            difficulty: difficulty || undefined,
            minBudget,
            maxBudget,
            sortBy: sortBy as 'startDate' | 'recent' | 'popular',
        });
        onClose();
    };

    const handleReset = () => {
        setSelectedTags([]);
        setDifficulty('');
        setMinBudget(undefined);
        setMaxBudget(undefined);
        setSortBy('recent');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Filters</h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center justify-center transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-6">
                        {/* Vibe Tags */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vibe Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag)
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Difficulty</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {DIFFICULTY_LEVELS.map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(difficulty === level ? '' : level)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${difficulty === level
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Budget */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Budget (₹)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Min Budget
                                    </label>
                                    <input
                                        type="number"
                                        value={minBudget || ''}
                                        onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="0"
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Max Budget
                                    </label>
                                    <input
                                        type="number"
                                        value={maxBudget || ''}
                                        onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="Any"
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sort By</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'recent', label: 'Most Recent' },
                                    { value: 'startDate', label: 'Start Date' },
                                    { value: 'popular', label: 'Most Popular' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === option.value
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            className="btn-outline"
                        >
                            Reset All
                        </button>
                        <button
                            onClick={handleApply}
                            className="btn-primary"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
