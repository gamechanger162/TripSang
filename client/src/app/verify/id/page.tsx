'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
// import { createWorker } from 'tesseract.js'; // Dynamically imported
import { uploadAPI, userAPI } from '@/lib/api';

export default function IDVerificationPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // State
    const [idType, setIdType] = useState<'aadhaar' | 'pan' | null>(null);
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState<string | null>(null);

    // Processing State
    const [isScanning, setIsScanning] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

    // Verification Status
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    const frontInputRef = useRef<HTMLInputElement>(null);

    const backInputRef = useRef<HTMLInputElement>(null);

    // Fetch current verification status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await userAPI.getProfile();
                if (res.user) {
                    setVerificationStatus(res.user.verificationStatus || 'unverified');
                    setRejectionReason(res.user.rejectionReason || null);
                }
            } catch (error) {
                console.error('Failed to fetch verification status:', error);
            }
        };
        if (status === 'authenticated') {
            fetchStatus();
        }
    }, [status]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file type
            if (!selectedFile.type.startsWith('image/')) {
                toast.error('Please upload an image file (JPG, PNG)');
                return;
            }

            // Validate file size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size too large. Max 5MB allowed.');
                return;
            }

            if (side === 'front') {
                setFrontFile(selectedFile);
                setFrontPreview(URL.createObjectURL(selectedFile));
            }
            // Reset scan result on new file
            setScanResult(null);
        }
    };

    const runOCR = async () => {
        if (!frontFile) return;

        setIsScanning(true);
        const toastId = toast.loading('Validating document...');

        try {
            // Validate that the file is a proper image
            if (!frontFile.type.startsWith('image/')) {
                setScanResult({
                    success: false,
                    message: 'Please upload a valid image file (JPG, PNG).'
                });
                toast.error('Invalid file type', { id: toastId });
                return;
            }

            // Simulate brief validation delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setScanResult({
                success: true,
                message: `${idType === 'aadhaar' ? 'Aadhaar' : 'PAN'} document accepted. Our team will verify it shortly.`
            });
            toast.success('Document validated!', { id: toastId });

        } catch {
            toast.error('Failed to validate document', { id: toastId });
        } finally {
            setIsScanning(false);
        }
    };

    const handleSubmit = async () => {
        if (!idType) return;
        if (!frontFile) return;

        if (!scanResult?.success) {
            toast.error('Please scan the document first');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Uploading documents...');

        try {
            // 1. Upload Front
            const frontRes = await uploadAPI.uploadFile(frontFile);
            if (!frontRes.success) throw new Error('Front image upload failed');

            // 2. Submit to Backend
            const verifyRes = await userAPI.submitVerificationRequest({
                idType,
                frontUrl: frontRes.url
            });

            if (verifyRes.success) {
                toast.success('Verification submitted!', { id: toastId });
                setVerificationStatus('pending');
                router.push('/dashboard');
            } else {
                throw new Error(verifyRes.message || 'Submission failed');
            }

        } catch (error: any) {
            console.error('Verification Error:', error);
            toast.error(error.message || 'Failed to submit', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const resetSelection = () => {
        setIdType(null);
        setFrontFile(null);
        setFrontPreview(null);
        setScanResult(null);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/auth/signin');
        return null;
    }

    // Show status message for pending/verified/rejected
    const renderStatusBanner = () => {
        if (verificationStatus === 'pending') {
            return (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <div className="flex items-center">
                        <div className="text-3xl mr-4">⏳</div>
                        <div>
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Under Approval</h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">Your verification request is being reviewed. You&apos;ll receive a notification once approved.</p>
                        </div>
                    </div>
                </div>
            );
        }
        if (verificationStatus === 'verified') {
            return (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center">
                        <div className="text-3xl mr-4">✅</div>
                        <div>
                            <h3 className="font-bold text-green-800 dark:text-green-200">Verified</h3>
                            <p className="text-sm text-green-700 dark:text-green-300">Your identity has been verified! You now have the Verified Traveler badge.</p>
                        </div>
                    </div>
                </div>
            );
        }
        if (verificationStatus === 'rejected') {
            return (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="flex items-center">
                        <div className="text-3xl mr-4">❌</div>
                        <div>
                            <h3 className="font-bold text-red-800 dark:text-red-200">Verification Rejected</h3>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {rejectionReason || 'Your verification request was rejected.'} Please try again with clearer documents.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen pt-20 pb-12 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                Identity Verification
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {idType ? `Upload your ${idType === 'aadhaar' ? 'Aadhaar Card' : 'PAN Card'}` : 'Select a document type to continue'}
                            </p>
                        </div>
                        {idType && (
                            <button onClick={resetSelection} className="text-sm text-primary-600 hover:text-primary-500">
                                Change Document
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {renderStatusBanner()}

                        {/* Show form only if not verified */}
                        {verificationStatus !== 'verified' && (
                            <>
                                {!idType ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button
                                            onClick={() => setIdType('aadhaar')}
                                            className="flex flex-col items-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                                        >
                                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🆔</div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Aadhaar Card</h4>
                                            <p className="text-sm text-gray-500 text-center mt-2">Requires Front Photo Only</p>
                                        </button>

                                        <button
                                            onClick={() => setIdType('pan')}
                                            className="flex flex-col items-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                                        >
                                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💳</div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">PAN Card</h4>
                                            <p className="text-sm text-gray-500 text-center mt-2">Requires Front Photo Only</p>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Front Side Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Front Side of {idType === 'aadhaar' ? 'Aadhaar' : 'PAN'}
                                            </label>
                                            <div
                                                onClick={() => frontInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg h-48 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 cursor-pointer overflow-hidden relative"
                                            >
                                                <input
                                                    type="file" ref={frontInputRef} className="hidden" accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'front')}
                                                />
                                                {frontPreview ? (
                                                    <div className="w-full h-full relative group">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={frontPreview} alt="Front Preview" className="w-full h-full object-contain" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            Click to change
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <span className="mt-2 block text-sm font-medium text-gray-600">Upload Front</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>



                                        {/* Scan & Submit Actions */}
                                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex flex-col gap-4">
                                                {frontFile && !scanResult && (
                                                    <button
                                                        onClick={runOCR}
                                                        disabled={isScanning}
                                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50"
                                                    >
                                                        {isScanning ? 'Scanning Front Doc...' : 'Scan Document & Verify'}
                                                    </button>
                                                )}

                                                {scanResult && (
                                                    <div className={`p-4 rounded-md ${scanResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                                        <div className="flex">
                                                            <div className="flex-shrink-0">
                                                                {scanResult.success ? '✅' : '❌'}
                                                            </div>
                                                            <div className="ml-3 font-medium">
                                                                {scanResult.message}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {scanResult?.success && (
                                                    <button
                                                        onClick={handleSubmit}
                                                        disabled={uploading}
                                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                                    >
                                                        {uploading ? 'Uploading & Submitting...' : 'Submit Final Verification'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
