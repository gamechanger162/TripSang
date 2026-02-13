'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { tripAPI, friendAPI, uploadAPI } from '@/lib/api';
import { geocodeCity } from '@/lib/geocoding';
import toast from 'react-hot-toast';
import Image from 'next/image';
import CityAutocomplete from '@/components/CityAutocomplete';
import { INDIAN_CITIES } from '@/data/cities';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, MapPin, DollarSign, Users, Tag, Image as ImageIcon, Sparkles, CheckCircle, Search, X, Mountain, Flame, Zap, Skull, Upload, UserPlus } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Friend {
    _id: string;
    name: string;
    profilePicture?: string;
}

const POPULAR_TAGS = [
    '#Trekking', '#Foodie', '#Adventure', '#Beach', '#Mountains',
    '#Culture', '#Photography', '#Wildlife', '#Backpacking', '#Luxury',
    '#Solo', '#Family', '#Weekend', '#Camping', '#RoadTrip',
    '#Spiritual', '#History', '#Nature', '#Budget', '#Nightlife'
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', label: 'Easy', description: 'Chill vibes, no sweat', color: 'from-emerald-500 to-green-600', icon: Zap, bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    { value: 'moderate', label: 'Moderate', description: 'Active but manageable', color: 'from-amber-500 to-yellow-600', icon: Mountain, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    { value: 'difficult', label: 'Difficult', description: 'For the experienced', color: 'from-orange-500 to-red-600', icon: Flame, bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    { value: 'extreme', label: 'Extreme', description: 'Adrenaline junkies only', color: 'from-red-500 to-rose-600', icon: Skull, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
];

export default function CreateTripPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startPoint: '',
        endPoint: '',
        startDate: '',
        endDate: '',
        minBudget: '',
        maxBudget: '',
        maxSquadSize: '10',
        difficulty: 'moderate',
        isPublic: true,
    });

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [friendSearchQuery, setFriendSearchQuery] = useState('');
    const [loadingFriends, setLoadingFriends] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            toast.error('Please login to create a trip');
            router.push('/auth/signin?callbackUrl=/trips/create');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchFriends = async () => {
            if (status !== 'authenticated') return;
            setLoadingFriends(true);
            try {
                const response = await friendAPI.getFriends();
                if (response.success && response.friends) setFriends(response.friends);
            } catch (error) {
                console.error('Failed to fetch friends:', error);
            } finally { setLoadingFriends(false); }
        };
        fetchFriends();
    }, [status]);

    const toggleFriendSelection = (friendId: string) => {
        setSelectedFriends((prev) => prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]);
    };

    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData((prev) => ({ ...prev, [name]: target.checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    };

    const addCustomTag = () => {
        if (!customTagInput.trim()) return;
        let tag = customTagInput.trim().replace(/\s+/g, '');
        if (!tag.startsWith('#')) tag = '#' + tag;
        tag = '#' + tag.slice(1).charAt(0).toUpperCase() + tag.slice(2);
        if (selectedTags.includes(tag)) { toast.error('This tag is already added'); return; }
        if (!/^#[a-zA-Z0-9_]+$/.test(tag)) { toast.error('Tags can only contain letters, numbers, and underscores'); return; }
        setSelectedTags((prev) => [...prev, tag]);
        setCustomTagInput('');
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
            if (file.size > 5 * 1024 * 1024) { toast.error('Image size should be less than 5MB'); return; }
            setCoverPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        try {
            const response = await uploadAPI.uploadFile(file);
            return response.url || response.imageUrl;
        } catch (error) { console.error('Upload failed:', error); throw new Error('Failed to upload image'); }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let coverPhotoUrl = '';
            if (coverPhoto) {
                toast.loading('Uploading image...', { id: 'upload' });
                coverPhotoUrl = await uploadImage(coverPhoto);
                toast.success('Image uploaded!', { id: 'upload' });
            }

            const startCoords = await geocodeCity(formData.startPoint);
            const endCoords = await geocodeCity(formData.endPoint);

            const tripData = {
                title: formData.title,
                description: formData.description || undefined,
                startPoint: {
                    name: formData.startPoint,
                    coordinates: startCoords ? { latitude: startCoords.lat, longitude: startCoords.lng } : undefined
                },
                endPoint: {
                    name: formData.endPoint,
                    coordinates: endCoords ? { latitude: endCoords.lat, longitude: endCoords.lng } : undefined
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

            const response = await tripAPI.create(tripData);
            if (response.success) {
                const friendCount = selectedFriends.length;
                toast.success(friendCount > 0 ? `Trip created! ${friendCount} friends invited.` : 'Trip created successfully!');
                router.push(`/trips/${response.trip._id}`);
            }
        } catch (error: any) {
            console.error('Error creating trip:', error);
            const errorMessage = error.message?.toLowerCase() || '';
            if (errorMessage.includes('premium')) {
                toast.error('Premium membership required');
                router.push('/payment/signup');
            } else {
                toast.error(error.message || 'Failed to create trip');
            }
        } finally { setLoading(false); }
    };

    const nextStep = () => {
        if (step === 1 && (!formData.title || !formData.startPoint || !formData.endPoint)) { toast.error('Please fill in all required fields'); return; }
        if (step === 2 && (!formData.startDate || !formData.endDate)) { toast.error('Please select dates'); return; }
        if (step === 3 && selectedTags.length === 0) { toast.error('Select at least one vibe tag'); return; }
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    if (status === 'loading') return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-500 rounded-full animate-spin border-t-transparent" /></div>;
    if (status === 'unauthenticated') return null;

    const steps = [
        { id: 1, title: 'Basics', icon: Sparkles },
        { id: 2, title: 'Logistics', icon: Calendar },
        { id: 3, title: 'Vibes', icon: Tag },
        { id: 4, title: 'Finish', icon: ImageIcon },
    ];

    const progress = ((step - 1) / (steps.length - 1)) * 100;

    const inputClass = "w-full bg-zinc-900/60 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all duration-200";

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-teal-500/30 overflow-x-hidden relative">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-teal-500/[0.03] rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <div className="mb-8 pt-4">
                    <button onClick={() => router.back()} className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 text-sm mb-8">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            {steps.map((s) => {
                                const isActive = step >= s.id;
                                const isCurrent = step === s.id;
                                return (
                                    <div key={s.id} className="flex flex-col items-center gap-1.5">
                                        <motion.div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-black shadow-lg shadow-teal-500/25' :
                                                    isActive ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' :
                                                        'bg-zinc-900/50 text-zinc-600 border border-white/[0.06]'
                                                }`}
                                            animate={{ scale: isCurrent ? 1.1 : 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        >
                                            <s.icon className="w-4.5 h-4.5" />
                                        </motion.div>
                                        <span className={`text-[10px] font-semibold tracking-wide ${isCurrent ? 'text-teal-400' : isActive ? 'text-zinc-500' : 'text-zinc-700'}`}>
                                            {s.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Progress track */}
                        <div className="relative h-1 bg-zinc-800/50 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                                initial={false}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {/* ═══ STEP 1: BASICS ═══ */}
                        {step === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                                        Where are we <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">heading?</span>
                                    </h1>
                                    <p className="text-zinc-500 text-sm">Let's start with the essentials</p>
                                </div>

                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-5">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Trip Title</label>
                                        <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Weekend in Rishikesh" className={`${inputClass} text-lg`} autoFocus />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 "><MapPin className="w-3 h-3 text-emerald-400" /> Starting From</label>
                                            <CityAutocomplete id="startPoint" name="startPoint" value={formData.startPoint} onChange={(val) => setFormData({ ...formData, startPoint: val })} placeholder="Delhi" cities={INDIAN_CITIES} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-red-400" /> Destination</label>
                                            <CityAutocomplete id="endPoint" name="endPoint" value={formData.endPoint} onChange={(val) => setFormData({ ...formData, endPoint: val })} placeholder="Manali" cities={INDIAN_CITIES} className={inputClass} />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Description <span className="text-zinc-600 normal-case font-normal">(Optional)</span></label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="What's the plan? Hype it up..." className={`${inputClass} resize-none`} />
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 2: LOGISTICS ═══ */}
                        {step === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                                        Plan the <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">details.</span>
                                    </h1>
                                    <p className="text-zinc-500 text-sm">Dates, budget, and squad settings</p>
                                </div>

                                {/* Dates */}
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-5">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3 text-teal-400" /> When?</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Start Date</span>
                                            <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className={`${inputClass} mt-1 [color-scheme:dark]`} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">End Date</span>
                                            <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} min={formData.startDate || new Date().toISOString().split('T')[0]} className={`${inputClass} mt-1 [color-scheme:dark]`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Budget + Squad */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-3">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-amber-400" /> Budget per person (₹)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" name="minBudget" value={formData.minBudget} onChange={handleInputChange} placeholder="Min" className={inputClass} />
                                            <span className="text-zinc-600 font-bold">–</span>
                                            <input type="number" name="maxBudget" value={formData.maxBudget} onChange={handleInputChange} placeholder="Max" className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-3">
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3 h-3 text-blue-400" /> Max Squad Size</label>
                                        <input type="number" name="maxSquadSize" value={formData.maxSquadSize} onChange={handleInputChange} min="2" max="50" className={inputClass} />
                                    </div>
                                </div>

                                {/* Difficulty */}
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-4">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Difficulty Level</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {DIFFICULTY_LEVELS.map((level) => {
                                            const selected = formData.difficulty === level.value;
                                            const Icon = level.icon;
                                            return (
                                                <button
                                                    key={level.value}
                                                    onClick={() => setFormData({ ...formData, difficulty: level.value })}
                                                    className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${selected
                                                            ? `${level.bg} ${level.border} border`
                                                            : 'border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 mb-1">
                                                        <Icon className={`w-4 h-4 ${selected ? level.text : 'text-zinc-600'}`} />
                                                        <span className={`font-semibold text-sm ${selected ? 'text-white' : 'text-zinc-400'}`}>{level.label}</span>
                                                    </div>
                                                    <p className={`text-[11px] ${selected ? 'text-zinc-300' : 'text-zinc-600'}`}>{level.description}</p>
                                                    {selected && <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br ${level.color}`} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 3: VIBES ═══ */}
                        {step === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                                        Set the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">vibe.</span>
                                    </h1>
                                    <p className="text-zinc-500 text-sm">Pick tags that describe your trip energy</p>
                                </div>

                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-5">
                                    {/* Custom tag input */}
                                    <div className="flex gap-2">
                                        <input value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomTag()} placeholder="Add custom tag..." className={`${inputClass} flex-1`} />
                                        <button onClick={addCustomTag} className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-teal-500/20 transition-all">Add</button>
                                    </div>

                                    {/* Tag cloud */}
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_TAGS.map((tag) => {
                                            const selected = selectedTags.includes(tag);
                                            return (
                                                <motion.button
                                                    key={tag}
                                                    onClick={() => toggleTag(tag)}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${selected
                                                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-black border-transparent shadow-lg shadow-teal-500/20'
                                                            : 'bg-zinc-900/50 border-white/[0.08] text-zinc-400 hover:border-white/15 hover:text-zinc-300'
                                                        }`}
                                                >
                                                    {tag}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Selected tags */}
                                    <AnimatePresence>
                                        {selectedTags.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="pt-5 border-t border-white/[0.06]"
                                            >
                                                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-semibold mb-3">Selected ({selectedTags.length})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedTags.map((tag) => (
                                                        <motion.span
                                                            key={tag}
                                                            layout
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 text-teal-400 rounded-full text-sm border border-teal-500/20"
                                                        >
                                                            {tag}
                                                            <button onClick={() => toggleTag(tag)} className="hover:text-white transition-colors"><X size={14} /></button>
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ STEP 4: FINAL TOUCHES ═══ */}
                        {step === 4 && (
                            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="space-y-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                                        Almost <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">there.</span>
                                    </h1>
                                    <p className="text-zinc-500 text-sm">Add a cover photo and invite your squad</p>
                                </div>

                                {/* Cover photo */}
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><ImageIcon className="w-3 h-3 text-purple-400" /> Cover Photo</label>
                                    <div className="relative group cursor-pointer">
                                        <div className={`aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300 ${imagePreview ? 'border-teal-500/30 bg-zinc-900/30' : 'border-zinc-700/50 hover:border-zinc-600 bg-zinc-900/20'
                                            }`}>
                                            {imagePreview ? (
                                                <div className="relative h-full">
                                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                                            <Upload className="w-4 h-4" /> Change Photo
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 py-12">
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-1">
                                                        <Upload className="w-5 h-5 text-zinc-500" />
                                                    </div>
                                                    <span className="font-medium text-sm">Click to upload cover photo</span>
                                                    <span className="text-xs text-zinc-700">Max 5MB • JPG, PNG, WebP</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>

                                {/* Invite Friends */}
                                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-4">
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><UserPlus className="w-3 h-3 text-blue-400" /> Invite Squad</label>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input value={friendSearchQuery} onChange={(e) => setFriendSearchQuery(e.target.value)} placeholder="Search friends..." className={`${inputClass} pl-10`} />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                                        {loadingFriends ? (
                                            <div className="text-center text-zinc-600 py-6 text-sm">Loading friends...</div>
                                        ) : filteredFriends.length === 0 ? (
                                            <div className="text-center text-zinc-600 py-6 text-sm">No friends found</div>
                                        ) : (
                                            filteredFriends.map((friend) => {
                                                const selected = selectedFriends.includes(friend._id);
                                                return (
                                                    <div
                                                        key={friend._id}
                                                        onClick={() => toggleFriendSelection(friend._id)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${selected
                                                                ? 'bg-teal-500/8 border-teal-500/25'
                                                                : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                                                            }`}
                                                    >
                                                        <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/[0.06]">
                                                            {friend.profilePicture ? (
                                                                <Image src={friend.profilePicture} alt={friend.name} width={36} height={36} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">{friend.name[0]}</div>
                                                            )}
                                                        </div>
                                                        <span className={`flex-1 font-medium text-sm ${selected ? 'text-teal-400' : 'text-zinc-400'}`}>{friend.name}</span>
                                                        {selected && <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="py-6 mt-8 flex justify-between items-center border-t border-white/[0.05]">
                    {step > 1 ? (
                        <button onClick={prevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all text-sm font-medium">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    ) : <div />}

                    {step < 4 ? (
                        <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all">
                            Next Step <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50">
                            {loading ? 'Creating...' : 'Launch Trip'} {!loading && <Sparkles className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
