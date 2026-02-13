"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { tripAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import CityAutocomplete from '@/components/CityAutocomplete';
import { INDIAN_CITIES } from '@/data/cities';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, DollarSign, Users, Tag, ImageIcon, Mountain, Flame, Zap, Skull, Upload, Eye, EyeOff, Check, Pencil, Save } from 'lucide-react';

interface TripDetails {
    _id: string;
    title: string;
    description?: string;
    startPoint: { name: string; coordinates?: any };
    endPoint: { name: string; coordinates?: any };
    startDate: string;
    endDate: string;
    tags: string[];
    coverPhoto?: string;
    maxSquadSize: number;
    budget?: {
        min: number;
        max: number;
        currency: string;
    };
    isPublic: boolean;
    difficulty?: string;
    [key: string]: any;
}

interface EditTripModalProps {
    trip: TripDetails;
    onClose: () => void;
    onUpdate: (updatedTrip: any) => void;
}

const POPULAR_TAGS = [
    '#Trekking', '#Foodie', '#Adventure', '#Beach', '#Mountains', '#Culture',
    '#Photography', '#Wildlife', '#Backpacking', '#Luxury', '#Solo',
    '#Family', '#Weekend', '#Camping', '#RoadTrip', '#Spiritual',
    '#History', '#Nature', '#Budget', '#Nightlife',
];

const DIFFICULTY_LEVELS = [
    { value: 'easy', label: 'Easy', description: 'Chill vibes', icon: Zap, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    { value: 'moderate', label: 'Moderate', description: 'Active but manageable', icon: Mountain, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    { value: 'difficult', label: 'Difficult', description: 'For the experienced', icon: Flame, color: 'from-orange-500 to-red-600', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
    { value: 'extreme', label: 'Extreme', description: 'Adrenaline only', icon: Skull, color: 'from-red-500 to-rose-600', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
];

export default function EditTripModal({ trip, onClose, onUpdate }: EditTripModalProps) {
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(trip.coverPhoto || null);

    const [formData, setFormData] = useState({
        title: trip.title,
        description: trip.description || '',
        startPoint: trip.startPoint.name,
        endPoint: trip.endPoint.name,
        startDate: trip.startDate.split('T')[0],
        endDate: trip.endDate.split('T')[0],
        minBudget: trip.budget?.min?.toString() || '',
        maxBudget: trip.budget?.max?.toString() || '',
        maxSquadSize: trip.maxSquadSize.toString(),
        difficulty: trip.difficulty || 'moderate',
        isPublic: trip.isPublic,
    });

    const [selectedTags, setSelectedTags] = useState<string[]>(trip.tags || []);
    const [customTagInput, setCustomTagInput] = useState('');
    const [coverPhoto, setCoverPhoto] = useState<File | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: target.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const addCustomTag = () => {
        if (!customTagInput.trim()) return;
        let tag = customTagInput.trim().replace(/\s+/g, '');
        if (!tag.startsWith('#')) tag = '#' + tag;
        tag = '#' + tag.slice(1).charAt(0).toUpperCase() + tag.slice(2);
        if (selectedTags.includes(tag)) { toast.error('Tag already added'); return; }
        if (!/^#[a-zA-Z0-9_]+$/.test(tag)) { toast.error('Invalid tag format'); return; }
        setSelectedTags(prev => [...prev, tag]);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { toast.error('Please enter a trip title'); return; }
        if (!formData.startPoint.trim() || !formData.endPoint.trim()) { toast.error('Please enter start and end points'); return; }
        if (!formData.startDate || !formData.endDate) { toast.error('Please select start and end dates'); return; }
        if (new Date(formData.startDate) >= new Date(formData.endDate)) { toast.error('End date must be after start date'); return; }
        if (selectedTags.length === 0) { toast.error('Please select at least one vibe tag'); return; }

        setLoading(true);
        try {
            let coverPhotoUrl = trip.coverPhoto;
            if (coverPhoto) {
                toast.loading('Uploading image...', { id: 'upload' });
                try {
                    const response = await uploadAPI.uploadFile(coverPhoto);
                    coverPhotoUrl = response.url;
                } catch (err) {
                    coverPhotoUrl = `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80`;
                }
                toast.success('Image uploaded!', { id: 'upload' });
            }

            const updates = {
                title: formData.title,
                description: formData.description,
                startPoint: { name: formData.startPoint },
                endPoint: { name: formData.endPoint },
                startDate: formData.startDate,
                endDate: formData.endDate,
                tags: selectedTags,
                coverPhoto: coverPhotoUrl,
                maxSquadSize: parseInt(formData.maxSquadSize) || 10,
                budget: (formData.minBudget && formData.maxBudget) ? {
                    min: parseFloat(formData.minBudget),
                    max: parseFloat(formData.maxBudget),
                    currency: 'INR'
                } : undefined,
                difficulty: formData.difficulty,
                isPublic: formData.isPublic,
            };

            const response = await tripAPI.update(trip._id, updates);
            if (response.success) {
                toast.success('Trip updated successfully!');
                onUpdate(response.trip);
                onClose();
            }
        } catch (error: any) {
            console.error('Error updating trip:', error);
            toast.error(error.message || 'Failed to update trip');
        } finally { setLoading(false); }
    };

    const inputClass = "w-full bg-zinc-900/60 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all duration-200 text-sm";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
            >
                <motion.div
                    ref={modalRef}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="bg-zinc-950 border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 w-full max-w-3xl my-8 flex flex-col max-h-[90vh] overflow-hidden"
                >
                    {/* ─── Header ─── */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                                <Pencil className="w-4 h-4 text-black" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Edit Trip</h2>
                                <p className="text-[11px] text-zinc-500">Update your trip details</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-all">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>

                    {/* ─── Form Content ─── */}
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* ── Basic Info ── */}
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-teal-400" /> Basic Information
                                </h3>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Trip Title *</label>
                                    <input name="title" type="text" value={formData.title} onChange={handleInputChange} className={`${inputClass} text-base font-medium`} required />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} placeholder="What's the plan?" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-emerald-400" /> Starting Point *
                                        </label>
                                        <CityAutocomplete id="startPoint" name="startPoint" value={formData.startPoint} onChange={(value) => setFormData(prev => ({ ...prev, startPoint: value }))} className={inputClass} required cities={INDIAN_CITIES} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-red-400" /> Destination *
                                        </label>
                                        <CityAutocomplete id="endPoint" name="endPoint" value={formData.endPoint} onChange={(value) => setFormData(prev => ({ ...prev, endPoint: value }))} className={inputClass} required cities={INDIAN_CITIES} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-teal-400" /> Start Date *
                                        </label>
                                        <input name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} className={`${inputClass} [color-scheme:dark]`} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-teal-400" /> End Date *
                                        </label>
                                        <input name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} className={`${inputClass} [color-scheme:dark]`} required />
                                    </div>
                                </div>
                            </div>

                            {/* ── Budget & Details ── */}
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Budget & Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">Budget Range (₹)</label>
                                        <div className="flex items-center gap-2">
                                            <input name="minBudget" type="number" value={formData.minBudget} onChange={handleInputChange} placeholder="Min" className={inputClass} />
                                            <span className="text-zinc-600 font-bold text-sm">–</span>
                                            <input name="maxBudget" type="number" value={formData.maxBudget} onChange={handleInputChange} placeholder="Max" className={inputClass} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Users className="w-3 h-3 text-blue-400" /> Max Squad Size
                                        </label>
                                        <input name="maxSquadSize" type="number" value={formData.maxSquadSize} onChange={handleInputChange} min="2" max="50" className={inputClass} />
                                    </div>
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 block">Difficulty</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {DIFFICULTY_LEVELS.map((level) => {
                                            const selected = formData.difficulty === level.value;
                                            const Icon = level.icon;
                                            return (
                                                <button
                                                    key={level.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, difficulty: level.value })}
                                                    className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${selected
                                                            ? `${level.bg} ${level.border}`
                                                            : 'border-white/[0.06] bg-zinc-900/30 hover:bg-zinc-900/50'
                                                        }`}
                                                >
                                                    <Icon className={`w-4 h-4 mb-1 ${selected ? level.text : 'text-zinc-600'}`} />
                                                    <div className={`font-semibold text-xs ${selected ? 'text-white' : 'text-zinc-500'}`}>{level.label}</div>
                                                    <div className={`text-[10px] ${selected ? 'text-zinc-300' : 'text-zinc-700'}`}>{level.description}</div>
                                                    {selected && <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${level.color}`} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* ── Vibe Tags ── */}
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5 text-purple-400" /> Vibe Tags *
                                </h3>

                                <div className="flex gap-2">
                                    <input
                                        type="text" value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                                        placeholder="Add custom tag..." className={`${inputClass} flex-1`} maxLength={30}
                                    />
                                    <button type="button" onClick={addCustomTag} className="px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold text-xs hover:shadow-lg hover:shadow-teal-500/20 transition-all">Add</button>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {POPULAR_TAGS.map((tag) => {
                                        const selected = selectedTags.includes(tag);
                                        return (
                                            <button
                                                key={tag} type="button" onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${selected
                                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-black border-transparent shadow-md shadow-teal-500/15'
                                                        : 'bg-zinc-900/50 border-white/[0.08] text-zinc-500 hover:border-white/15 hover:text-zinc-300'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedTags.length > 0 && (
                                    <div className="pt-4 border-t border-white/[0.06]">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Selected ({selectedTags.length})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedTags.map((tag) => (
                                                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-xs border border-teal-500/20">
                                                    {tag}
                                                    <button type="button" onClick={() => toggleTag(tag)} className="hover:text-white transition-colors ml-0.5"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Cover Photo ── */}
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Cover Photo
                                </h3>

                                {imagePreview && (
                                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-white/[0.06] group">
                                        <Image src={imagePreview} alt="Cover preview" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => { setCoverPhoto(null); setImagePreview(null); }}
                                                className="px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                                            >
                                                <X className="w-3 h-3" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-white/[0.08] rounded-xl cursor-pointer hover:bg-white/[0.02] hover:border-white/[0.12] transition-all duration-200 group">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center mb-2 group-hover:bg-zinc-800 transition-colors">
                                        <Upload className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                                    </div>
                                    <span className="text-xs text-zinc-500 font-medium">{imagePreview ? 'Replace cover photo' : 'Upload cover photo'}</span>
                                    <span className="text-[10px] text-zinc-700 mt-0.5">Max 5MB • JPG, PNG, WebP</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>

                            {/* ── Visibility Toggle ── */}
                            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {formData.isPublic ? (
                                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                                            <Eye className="w-4 h-4 text-teal-400" />
                                        </div>
                                    ) : (
                                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/[0.06] flex items-center justify-center">
                                            <EyeOff className="w-4 h-4 text-zinc-500" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-sm text-white">{formData.isPublic ? 'Public Trip' : 'Private Trip'}</h4>
                                        <p className="text-[11px] text-zinc-500">{formData.isPublic ? 'Visible to everyone on explore' : 'Only visible to squad members'}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                    className={`relative w-12 h-7 rounded-full transition-all duration-300 ${formData.isPublic ? 'bg-teal-500' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all duration-300 ${formData.isPublic ? 'left-[25px]' : 'left-[3px]'}`} />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ─── Footer ─── */}
                    <div className="px-6 py-4 border-t border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl flex justify-end gap-3 sticky bottom-0 z-10">
                        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all text-sm font-medium">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold text-sm hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
