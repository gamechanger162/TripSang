'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { userAPI, uploadAPI, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import PhoneInput from '@/components/PhoneInput';
import GlassCard from '@/components/app/ui/GlassCard';
import { Camera, Save, X, Phone, CheckCircle2 } from 'lucide-react';

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
                await updateSession();
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
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { }
                window.recaptchaVerifier = null;
            }

            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (recaptchaContainer) {
                recaptchaContainer.innerHTML = '';
            }

            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });

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
            await confirmationResult.confirm(otp);
            const response = await authAPI.linkPhone(formData.mobileNumber);

            if (response.success) {
                toast.success('Phone verified successfully!');
                setShowVerifyModal(false);
                setOtp('');
                setIsMobileVerified(true);
                await updateSession();
                await fetchProfile();
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
            <div className="flex items-center justify-center min-h-screen bg-[#0B0E11]">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0B0E11] to-[#0f1216] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <GlassCard className="overflow-hidden">
                    <div className="px-6 py-8 border-b border-white/5 bg-white/[0.02]">
                        <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                        <p className="mt-1 text-zinc-400 text-sm">
                            Customize how others see you on TripSang
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        {/* Profile Picture Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg border-4 border-zinc-800 bg-zinc-800 ring-2 ring-white/10">
                                    {formData.profilePicture ? (
                                        <Image
                                            src={formData.profilePicture}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-500 bg-zinc-900">
                                            {formData.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg transition-all bg-cyan-600 text-white hover:bg-cyan-500 border border-white/20"
                                    title="Change photo"
                                >
                                    <Camera size={18} />
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
                                <h3 className="text-lg font-medium text-white">Profile Photo</h3>
                                <p className="text-sm mt-1 text-zinc-500">
                                    Supports JPG, PNG or WEBP. Max 5MB.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Name */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    required
                                />
                            </div>

                            {/* Gender */}
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                                    Gender
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all appearance-none"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="transgender">Transgender</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>

                            {/* Bio */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                                    Bio
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        name="bio"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        placeholder="Tell us a bit about yourself..."
                                        maxLength={500}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-zinc-500">
                                    Brief description for your profile. URLs are hyperlinked.
                                </p>
                            </div>

                            {/* Mobile Number */}
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                                    Mobile Number
                                </label>
                                <div className="mt-1 flex gap-3">
                                    <div className="flex-1">
                                        <PhoneInput
                                            value={formData.mobileNumber}
                                            onChange={(value) => setFormData({ ...formData, mobileNumber: value })}
                                            placeholder="Phone number"
                                            disabled={!!(formData.mobileNumber && isMobileVerified)}
                                            name="mobileNumber"
                                        />
                                    </div>
                                    {formData.mobileNumber && (
                                        isMobileVerified ? (
                                            <span className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap">
                                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                Verified
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleVerifyPhone()}
                                                className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors whitespace-nowrap"
                                            >
                                                Verify Phone
                                            </button>
                                        )
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-zinc-500">
                                    {isMobileVerified
                                        ? 'Your phone number is verified and can be used for login.'
                                        : 'Verify your phone to enable phone-based login and trip coordination.'}
                                </p>
                            </div>

                            <div className="sm:col-span-6 pt-6 border-t border-white/5">
                                <h3 className="text-lg font-medium text-white mb-4">Location</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.location.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Country</label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.location.country}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-6 pt-6 border-t border-white/5">
                                <h3 className="text-lg font-medium text-white mb-4">Social Links</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Instagram Username</label>
                                        <div className="flex rounded-xl bg-zinc-900/50 border border-white/10 overflow-hidden focus-within:ring-1 focus-within:ring-cyan-500/50">
                                            <span className="inline-flex items-center px-4 text-zinc-500 bg-white/5 border-r border-white/5">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="social_instagram"
                                                value={formData.socialLinks.instagram}
                                                onChange={handleInputChange}
                                                className="block w-full min-w-0 flex-1 bg-transparent px-4 py-2.5 text-white focus:outline-none sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Twitter Username</label>
                                        <div className="flex rounded-xl bg-zinc-900/50 border border-white/10 overflow-hidden focus-within:ring-1 focus-within:ring-cyan-500/50">
                                            <span className="inline-flex items-center px-4 text-zinc-500 bg-white/5 border-r border-white/5">
                                                @
                                            </span>
                                            <input
                                                type="text"
                                                name="social_twitter"
                                                value={formData.socialLinks.twitter}
                                                onChange={handleInputChange}
                                                className="block w-full min-w-0 flex-1 bg-transparent px-4 py-2.5 text-white focus:outline-none sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Facebook Profile URL</label>
                                        <input
                                            type="text"
                                            name="social_facebook"
                                            value={formData.socialLinks.facebook}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </GlassCard>
            </div>

            {/* OTP Verification Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Phone size={20} className="text-cyan-400" />
                                Verify Phone Number
                            </h3>
                            <button onClick={() => setShowVerifyModal(false)} className="text-zinc-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-zinc-400 mb-6">
                            Enter the 6-digit OTP sent to <span className="text-white font-medium">{formData.mobileNumber}</span>
                        </p>

                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full px-4 py-4 rounded-xl text-white text-center text-3xl font-mono tracking-[0.5em] bg-zinc-900/50 border border-white/10 focus:outline-none focus:border-cyan-500/50 mb-8"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowVerifyModal(false);
                                    setOtp('');
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otp.length !== 6}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Verify OTP
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Recaptcha container */}
            <div id="recaptcha-container"></div>
        </div>
    );
}
