'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { userAPI, uploadAPI, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import PhoneInput from '@/components/PhoneInput';

export default function EditProfilePage() {
    const router = useRouter();
    const { data: session, update: updateSession } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [isMobileVerified, setIsMobileVerified] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        gender: 'prefer-not-to-say',
        mobileNumber: '',
        location: { city: '', country: '' },
        profilePicture: '',
        socialLinks: {
            instagram: '',
            facebook: '',
            twitter: ''
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            if (response.success) {
                const user = response.user;
                setFormData({
                    name: user.name || '',
                    bio: user.bio || '',
                    gender: user.gender || 'prefer-not-to-say',
                    mobileNumber: user.mobileNumber || '',
                    location: user.location || { city: '', country: '' },
                    profilePicture: user.profilePicture || '',
                    socialLinks: user.socialLinks || { instagram: '', facebook: '', twitter: '' }
                });
                setIsMobileVerified(user.isMobileVerified || false);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('social_')) {
            const socialKey = name.replace('social_', '');
            setFormData(prev => ({
                ...prev,
                socialLinks: {
                    ...prev.socialLinks,
                    [socialKey]: value
                }
            }));
        } else if (name === 'city' || name === 'country') {
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location,
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image (JPEG, PNG, WEBP)');
            return;
        }

        try {
            const toastId = toast.loading('Uploading image...');
            const response = await uploadAPI.uploadFile(file);
            toast.dismiss(toastId);

            if (response.success) {
                setFormData(prev => ({
                    ...prev,
                    profilePicture: response.url
                }));
                toast.success('Image uploaded successfully');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await userAPI.updateProfile(formData);
            if (response.success) {
                await updateSession(); // Refresh session to update name/image in navbar
                toast.success('Profile updated successfully');
                router.push(`/profile/${response.user._id}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyPhone = async () => {
        if (!formData.mobileNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        try {
            // Clean up existing reCAPTCHA first
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.log('reCAPTCHA clear failed, continuing...');
                }
                window.recaptchaVerifier = null;
            }

            // Clear any existing reCAPTCHA from DOM
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (recaptchaContainer) {
                recaptchaContainer.innerHTML = '';
            }

            // Initialize new recaptcha
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });

            // Send OTP via Firebase
            const confirmationResult = await signInWithPhoneNumber(
                auth,
                formData.mobileNumber,
                window.recaptchaVerifier
            );

            setConfirmationResult(confirmationResult);
            setShowVerifyModal(true);
            toast.success('OTP sent to your phone!');
        } catch (error: any) {
            console.error('Send OTP error:', error);
            if (error.code === 'auth/too-many-requests') {
                toast.error('Too many attempts. Please try again later.');
            } else {
                toast.error(error.message || 'Failed to send OTP');
            }
            // Clear recaptcha on error
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { }
                window.recaptchaVerifier = null;
            }
        }
    };

    const handleVerifyOTP = async () => {
        if (!confirmationResult || !otp) {
            toast.error('Please enter OTP');
            return;
        }

        try {
            // Verify OTP with Firebase
            await confirmationResult.confirm(otp);

            // Link phone to account via backend
            const response = await authAPI.linkPhone(formData.mobileNumber);

            if (response.success) {
                toast.success('Phone verified successfully!');
                setShowVerifyModal(false);
                setOtp('');
                setIsMobileVerified(true); // Update local state immediately

                // Update session to reflect verification
                await updateSession();
                await fetchProfile(); // Refresh profile data
            }
        } catch (error: any) {
            console.error('OTP verification error:', error);
            if (error.code === 'auth/invalid-verification-code') {
                toast.error('Invalid OTP. Please try again.');
            } else {
                toast.error('Verification failed. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
                    <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700">
                        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                        <p className="mt-1 text-primary-100">
                            Customize how others see you on Tripसंग
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        {/* Profile Picture Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 dark:bg-gray-700">
                                    {formData.profilePicture ? (
                                        <Image
                                            src={formData.profilePicture}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700">
                                            {formData.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                                    title="Change photo"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Photo</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Supports JPG, PNG or WEBP. Max 5MB.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Name */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm p-2.5 border"
                                    required
                                />
                            </div>

                            {/* Gender */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm p-2.5 border"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="transgender">Transgender</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>

                            {/* Bio */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Bio
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        name="bio"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm p-3 border"
                                        placeholder="Tell us a bit about yourself..."
                                        maxLength={500}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Brief description for your profile. URLs are hyperlinked.
                                </p>
                            </div>

                            {/* Mobile Number */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mobile Number
                                </label>
                                <div className="mt-1 flex gap-2">
                                    <PhoneInput
                                        value={formData.mobileNumber}
                                        onChange={(value) => setFormData({ ...formData, mobileNumber: value })}
                                        placeholder="Phone number"
                                        disabled={!!(formData.mobileNumber && isMobileVerified)}
                                        name="mobileNumber"
                                    />
                                    {formData.mobileNumber && (
                                        isMobileVerified ? (
                                            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Verified
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyPhone()}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                Verify Phone
                                            </button>
                                        )
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    {isMobileVerified
                                        ? 'Your phone number is verified and can be used for login.'
                                        : 'Verify your phone to enable phone-based login and trip coordination.'}
                                </p>
                            </div>

                            <div className="sm:col-span-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Location</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.location.city}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.location.country}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 border"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Links</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instagram Username</label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-gray-500 dark:text-gray-300 sm:text-sm">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="social_instagram"
                                                value={formData.socialLinks.instagram}
                                                onChange={handleInputChange}
                                                className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm p-2.5 border"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Twitter Username</label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-gray-500 dark:text-gray-300 sm:text-sm">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="social_twitter"
                                                value={formData.socialLinks.twitter}
                                                onChange={handleInputChange}
                                                className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm p-2.5 border"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Facebook Profile URL</label>
                                        <input
                                            type="text"
                                            name="social_facebook"
                                            value={formData.socialLinks.facebook}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm p-2.5 border"
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Verify Phone Number
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Enter the 6-digit OTP sent to {formData.mobileNumber}
                        </p>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                            autoFocus
                        />
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowVerifyModal(false);
                                    setOtp('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otp.length !== 6}
                                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Verify
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recaptcha container */}
            <div id="recaptcha-container"></div>
        </div>
    );
}
