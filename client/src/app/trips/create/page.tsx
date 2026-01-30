'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { tripAPI, friendAPI, uploadAPI } from '@/lib/api';

// ... (other imports)

// ...

const uploadImage = async (file: File): Promise<string> => {
    try {
        const response = await uploadAPI.uploadFile(file);
        console.log('Upload response:', response);
        return response.url || response.imageUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error('Failed to upload image');
    }
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
        toast.error('Please enter a trip title');
        return;
    }

    if (!formData.startPoint.trim() || !formData.endPoint.trim()) {
        toast.error('Please enter start and end points');
        return;
    }

    if (!formData.startDate || !formData.endDate) {
        toast.error('Please select start and end dates');
        return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast.error('End date must be after start date');
        return;
    }

    if (selectedTags.length === 0) {
        toast.error('Please select at least one vibe tag');
        return;
    }

    setLoading(true);

    try {
        // Upload image if selected
        let coverPhotoUrl = '';
        if (coverPhoto) {
            toast.loading('Uploading image...', { id: 'upload' });
            coverPhotoUrl = await uploadImage(coverPhoto);
            toast.success('Image uploaded!', { id: 'upload' });
        }

        // Geocode Start and End Points
        const startCoords = await geocodeCity(formData.startPoint);
        const endCoords = await geocodeCity(formData.endPoint);

        // Prepare trip data
        const tripData = {
            title: formData.title,
            description: formData.description || undefined,
            startPoint: {
                name: formData.startPoint,
                coordinates: startCoords ? {
                    latitude: startCoords.lat,
                    longitude: startCoords.lng
                } : undefined
            },
            endPoint: {
                name: formData.endPoint,
                coordinates: endCoords ? {
                    latitude: endCoords.lat,
                    longitude: endCoords.lng
                } : undefined
            },
            startDate: formData.startDate,
            endDate: formData.endDate,
            tags: selectedTags,
            coverPhoto: coverPhotoUrl || undefined,
            maxSquadSize: parseInt(formData.maxSquadSize) || 10,
            budget: formData.minBudget && formData.maxBudget ? {
                min: parseFloat(formData.minBudget),
                max: parseFloat(formData.maxBudget),
                currency: 'INR',
            } : undefined,
            difficulty: formData.difficulty as 'easy' | 'moderate' | 'difficult' | 'extreme',
            isPublic: formData.isPublic,
            inviteFriends: selectedFriends.length > 0 ? selectedFriends : undefined,
        };

        // Create trip via API
        const response = await tripAPI.create(tripData);

        if (response.success) {
            const friendCount = selectedFriends.length;
            if (friendCount > 0) {
                toast.success(`Trip created! ${friendCount} friend${friendCount > 1 ? 's' : ''} added to squad.`);
            } else {
                toast.success('Trip created successfully!');
            }
            // Redirect to the new trip page
            router.push(`/trips/${response.trip._id}`);
        }
    } catch (error: any) {
        console.error('Error creating trip:', error);
        toast.error(error.message || 'Failed to create trip');
    } finally {
        setLoading(false);
    }
};

// Show loading while checking auth
if (status === 'loading') {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );
}

// Don't render form if not authenticated
if (status === 'unauthenticated') {
    return null;
}

return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="text-primary-600 hover:text-primary-700 flex items-center mb-4"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create New Trip</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Share your adventure with fellow travelers
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>

                    {/* Title */}
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Trip Title *
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Weekend Trek to Manali"
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Tell others about your trip plan..."
                            className="input-field"
                        />
                    </div>

                    {/* Route */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="startPoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Starting Point *
                            </label>
                            <CityAutocomplete
                                id="startPoint"
                                name="startPoint"
                                value={formData.startPoint}
                                onChange={(value) => setFormData({ ...formData, startPoint: value })}
                                placeholder="e.g., Delhi"
                                className="input-field"
                                required
                                cities={INDIAN_CITIES}
                            />
                        </div>
                        <div>
                            <label htmlFor="endPoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Destination *
                            </label>
                            <CityAutocomplete
                                id="endPoint"
                                name="endPoint"
                                value={formData.endPoint}
                                onChange={(value) => setFormData({ ...formData, endPoint: value })}
                                placeholder="e.g., Manali"
                                className="input-field"
                                required
                                cities={INDIAN_CITIES}
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date *
                            </label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date *
                            </label>
                            <input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Budget & Details Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Budget & Details</h2>

                    {/* Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="minBudget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Min Budget (₹)
                            </label>
                            <input
                                id="minBudget"
                                name="minBudget"
                                type="number"
                                value={formData.minBudget}
                                onChange={handleInputChange}
                                placeholder="5000"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label htmlFor="maxBudget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Max Budget (₹)
                            </label>
                            <input
                                id="maxBudget"
                                name="maxBudget"
                                type="number"
                                value={formData.maxBudget}
                                onChange={handleInputChange}
                                placeholder="15000"
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Squad Size & Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="maxSquadSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Max Squad Size
                            </label>
                            <input
                                id="maxSquadSize"
                                name="maxSquadSize"
                                type="number"
                                value={formData.maxSquadSize}
                                onChange={handleInputChange}
                                min="2"
                                max="50"
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Difficulty Level
                            </label>
                            <select
                                id="difficulty"
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleInputChange}
                                className="input-field"
                            >
                                {DIFFICULTY_LEVELS.map((level) => (
                                    <option key={level.value} value={level.value}>
                                        {level.label} - {level.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Vibe Tags Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Vibe Tags *</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Select tags or add your own custom tags (Select at least 1)
                    </p>

                    {/* Custom Tag Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add Custom Tag
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyDown={handleCustomTagKeyDown}
                                placeholder="e.g., Hiking or #Hiking"
                                className="input-field flex-1"
                                maxLength={30}
                            />
                            <button
                                type="button"
                                onClick={addCustomTag}
                                className="btn-primary px-4"
                            >
                                Add
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Press Enter or click Add. Spaces will be removed automatically.</p>
                    </div>

                    {/* Popular Tags */}
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular Tags:</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR_TAGS.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag)
                                    ? 'bg-primary-600 text-white shadow-md scale-105'
                                    : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {selectedTags.length > 0 && (
                        <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                            <p className="text-sm text-primary-700 dark:text-primary-300 mb-2">
                                Selected Tags ({selectedTags.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className="ml-1 text-primary-500 hover:text-primary-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cover Photo Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Cover Photo</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Upload a beautiful image for your trip (Max 5MB)
                    </p>

                    <div className="space-y-4">
                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="relative w-full h-64 rounded-lg overflow-hidden">
                                <Image
                                    src={imagePreview}
                                    alt="Cover preview"
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCoverPhoto(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Upload Input */}
                        <div className="flex items-center justify-center w-full">
                            <label
                                htmlFor="coverPhoto"
                                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${imagePreview
                                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/10'
                                    : 'border-gray-300 bg-gray-50 dark:bg-dark-700 dark:border-dark-600 hover:bg-gray-100 dark:hover:bg-dark-600'
                                    } transition-colors`}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg
                                        className="w-10 h-10 mb-3 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        PNG, JPG or JPEG (MAX. 5MB)
                                    </p>
                                </div>
                                <input
                                    id="coverPhoto"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Invite Friends Card */}
                {friends.length > 0 && (
                    <div className="card">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Invite Friends to Squad</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Add friends directly to your trip squad (optional)
                        </p>

                        {/* Search Friends */}
                        <div className="mb-4">
                            <input
                                type="text"
                                value={friendSearchQuery}
                                onChange={(e) => setFriendSearchQuery(e.target.value)}
                                placeholder="Search friends..."
                                className="input-field"
                            />
                        </div>

                        {/* Friends List */}
                        {loadingFriends ? (
                            <div className="text-center py-4 text-gray-500">Loading friends...</div>
                        ) : filteredFriends.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                {friendSearchQuery ? 'No friends match your search' : 'No friends to invite'}
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredFriends.map((friend) => (
                                    <label
                                        key={friend._id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedFriends.includes(friend._id)
                                            ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700'
                                            : 'bg-gray-50 dark:bg-dark-700 hover:bg-gray-100 dark:hover:bg-dark-600 border border-transparent'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedFriends.includes(friend._id)}
                                            onChange={() => toggleFriendSelection(friend._id)}
                                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                        />
                                        {friend.profilePicture ? (
                                            <Image
                                                src={friend.profilePicture}
                                                alt={friend.name}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {friend.name[0]}
                                            </div>
                                        )}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {friend.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Selected Friends Summary */}
                        {selectedFriends.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        <span className="font-medium">{selectedFriends.length}</span> friend{selectedFriends.length > 1 ? 's' : ''} will be added to your squad
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedFriends([])}
                                        className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Visibility Toggle */}
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Make Trip Public</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Allow everyone to see and join your trip
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isPublic"
                                checked={formData.isPublic}
                                onChange={handleInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-outline"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Creating Trip...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                Create Trip
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
);
}
