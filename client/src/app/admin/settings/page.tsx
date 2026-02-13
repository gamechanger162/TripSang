'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Loader2, Plus, Pencil, Trash2, X, Check, Crown, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PaymentPlan {
    _id?: string;
    name: string;
    type: 'one_time' | 'subscription';
    price: number; // in paise
    currency: string;
    durationDays: number;
    features: string[];
    isActive: boolean;
    razorpayPlanId: string;
}

const defaultPlan: PaymentPlan = {
    name: '', type: 'one_time', price: 100, currency: 'INR',
    durationDays: 30, features: [], isActive: true, razorpayPlanId: ''
};

export default function AdminSettingsPage() {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const [config, setConfig] = useState({
        enableGoogleAds: false,
        googleAdSenseClient: '',
        enablePaidSignup: false,
        signupFee: 0,
    });
    const [plans, setPlans] = useState<PaymentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Plan form
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [editPlan, setEditPlan] = useState<PaymentPlan | null>(null);
    const [planForm, setPlanForm] = useState<PaymentPlan>({ ...defaultPlan });
    const [featureInput, setFeatureInput] = useState('');
    const [savingPlans, setSavingPlans] = useState(false);

    useEffect(() => {
        if (userRole === 'admin') loadConfig();
    }, [userRole]);

    const loadConfig = async () => {
        try {
            const res = await adminAPI.getConfig();
            if (res.success && res.config) {
                setConfig({
                    enableGoogleAds: res.config.enableGoogleAds || false,
                    googleAdSenseClient: res.config.googleAdSenseClient || '',
                    enablePaidSignup: res.config.enablePaidSignup || false,
                    signupFee: res.config.signupFee || 0,
                });
                setPlans(res.config.paymentPlans || []);
            }
        } catch { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await adminAPI.updateConfig(config);
            if (res.success) toast.success('Settings saved');
            else toast.error('Failed to save');
        } catch { toast.error('Failed to save settings'); }
        finally { setSaving(false); }
    };

    const handleSavePlans = async (updatedPlans: PaymentPlan[]) => {
        setSavingPlans(true);
        try {
            const res = await adminAPI.updateConfig({ paymentPlans: updatedPlans });
            if (res.success) {
                toast.success('Plans updated');
                // Re-load to get server-assigned _ids
                await loadConfig();
            } else toast.error('Failed to save plans');
        } catch { toast.error('Failed to save plans'); }
        finally { setSavingPlans(false); }
    };

    const openAddPlan = () => {
        setPlanForm({ ...defaultPlan });
        setEditPlan(null);
        setFeatureInput('');
        setShowPlanForm(true);
    };

    const openEditPlan = (plan: PaymentPlan) => {
        setPlanForm({ ...plan });
        setEditPlan(plan);
        setFeatureInput('');
        setShowPlanForm(true);
    };

    const handlePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!planForm.name || planForm.price < 100 || planForm.durationDays < 1) {
            toast.error('Please fill all required fields');
            return;
        }
        let updated: PaymentPlan[];
        if (editPlan && editPlan._id) {
            updated = plans.map(p => p._id === editPlan._id ? { ...planForm } : p);
        } else {
            updated = [...plans, { ...planForm }];
        }
        setShowPlanForm(false);
        await handleSavePlans(updated);
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Delete this plan?')) return;
        const updated = plans.filter(p => p._id !== id);
        await handleSavePlans(updated);
    };

    const handleTogglePlan = async (id: string) => {
        const updated = plans.map(p => p._id === id ? { ...p, isActive: !p.isActive } : p);
        await handleSavePlans(updated);
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setPlanForm({ ...planForm, features: [...planForm.features, featureInput.trim()] });
            setFeatureInput('');
        }
    };

    const removeFeature = (idx: number) => {
        setPlanForm({ ...planForm, features: planForm.features.filter((_, i) => i !== idx) });
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-40 bg-white/[0.06] rounded-lg" />
                <div className="h-64 bg-white/[0.06] rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Platform configuration & payment plans</p>
            </div>

            {/* Google Ads */}
            <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                <h2 className="text-sm font-semibold text-white mb-5">Google AdSense</h2>

                <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.06]">
                    <div>
                        <p className="text-sm font-medium text-gray-300">Enable Google Ads</p>
                        <p className="text-xs text-gray-600 mt-0.5">Show ads across the platform</p>
                    </div>
                    <button
                        onClick={() => setConfig({ ...config, enableGoogleAds: !config.enableGoogleAds })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${config.enableGoogleAds ? 'bg-indigo-600' : 'bg-white/[0.1]'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${config.enableGoogleAds ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">AdSense Client ID</label>
                    <input
                        type="text"
                        value={config.googleAdSenseClient}
                        onChange={(e) => setConfig({ ...config, googleAdSenseClient: e.target.value })}
                        placeholder="ca-pub-1234567890123456"
                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Subscription & Pricing */}
            <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                <h2 className="text-sm font-semibold text-white mb-5">Subscription & Pricing</h2>

                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4 mb-5">
                    <p className="text-xs font-semibold text-emerald-400 mb-0.5">Auto Free Trial Enabled</p>
                    <p className="text-xs text-gray-500">All new users receive a <strong className="text-gray-400">30-day free trial</strong> upon registration.</p>
                </div>

                <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/[0.06]">
                    <div>
                        <p className="text-sm font-medium text-gray-300">Paid Signup</p>
                        <p className="text-xs text-gray-600 mt-0.5">Require payment to create an account</p>
                    </div>
                    <button
                        onClick={() => setConfig({ ...config, enablePaidSignup: !config.enablePaidSignup })}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${config.enablePaidSignup ? 'bg-indigo-600' : 'bg-white/[0.1]'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${config.enablePaidSignup ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {config.enablePaidSignup && (
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Signup Fee (₹)</label>
                        <input
                            type="number"
                            value={config.signupFee}
                            onChange={(e) => setConfig({ ...config, signupFee: parseInt(e.target.value) || 0 })}
                            min="0"
                            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Save general settings */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-medium text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Payment Plans */}
            <div className="rounded-xl bg-gray-900/60 border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Payment Plans</h2>
                        <p className="text-xs text-gray-600 mt-0.5">Manage subscription and one-time purchase plans</p>
                    </div>
                    <button
                        onClick={openAddPlan}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-medium text-white hover:from-indigo-500 hover:to-purple-500 transition-all"
                    >
                        <Plus size={14} />
                        Add Plan
                    </button>
                </div>

                {savingPlans && (
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <Loader2 size={14} className="animate-spin text-indigo-400" />
                        <p className="text-xs text-indigo-400">Saving plans...</p>
                    </div>
                )}

                {plans.length === 0 ? (
                    <div className="py-10 text-center rounded-lg border border-dashed border-white/[0.08]">
                        <Crown size={24} className="mx-auto text-gray-700 mb-2" />
                        <p className="text-sm text-gray-600">No payment plans configured</p>
                        <p className="text-xs text-gray-700 mt-1">Add your first plan to enable premium purchases</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {plans.map((plan) => (
                            <div key={plan._id || plan.name} className={`rounded-lg border p-4 transition-all ${plan.isActive
                                ? 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.14]'
                                : 'bg-white/[0.01] border-white/[0.04] opacity-60'
                                }`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-white truncate">{plan.name}</h3>
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border capitalize ${plan.type === 'subscription'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                {plan.type === 'subscription' ? 'Recurring' : 'One-Time'}
                                            </span>
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border ${plan.isActive
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                }`}>
                                                {plan.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-1.5">
                                            <span className="text-lg font-bold text-white">₹{(plan.price / 100).toLocaleString()}</span>
                                            <span className="text-xs text-gray-600">/ {plan.durationDays} days</span>
                                        </div>
                                        {plan.features.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {plan.features.map((f, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-gray-400 bg-white/[0.04] rounded-full">
                                                        <Check size={8} className="text-emerald-400" />
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleTogglePlan(plan._id!)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors" title={plan.isActive ? 'Deactivate' : 'Activate'}>
                                            {plan.isActive ? <Clock size={14} className="text-amber-400" /> : <Check size={14} className="text-emerald-400" />}
                                        </button>
                                        <button onClick={() => openEditPlan(plan)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"><Pencil size={14} /></button>
                                        <button onClick={() => handleDeletePlan(plan._id!)} className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Plan Form Modal */}
            {showPlanForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/[0.08] rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{editPlan ? 'Edit Plan' : 'Add Plan'}</h2>
                            <button onClick={() => setShowPlanForm(false)} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handlePlanSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Plan Name *</label>
                                <input
                                    type="text" value={planForm.name} required
                                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                    placeholder="e.g. Premium Monthly"
                                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
                                    <div className="flex gap-2">
                                        {(['one_time', 'subscription'] as const).map(t => (
                                            <button key={t} type="button" onClick={() => setPlanForm({ ...planForm, type: t })}
                                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${planForm.type === t
                                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                    : 'bg-white/[0.02] text-gray-500 border-white/[0.06]'
                                                    }`}>
                                                {t === 'one_time' ? 'One-Time' : 'Recurring'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Price (₹) *</label>
                                    <input
                                        type="number" value={planForm.price / 100} required min={1}
                                        onChange={(e) => setPlanForm({ ...planForm, price: Math.round(parseFloat(e.target.value) * 100) || 100 })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                    <p className="text-[10px] text-gray-700 mt-0.5">Stored as {planForm.price} paise</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration (days) *</label>
                                    <input
                                        type="number" value={planForm.durationDays} required min={1}
                                        onChange={(e) => setPlanForm({ ...planForm, durationDays: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Razorpay Plan ID</label>
                                    <input
                                        type="text" value={planForm.razorpayPlanId}
                                        onChange={(e) => setPlanForm({ ...planForm, razorpayPlanId: e.target.value })}
                                        placeholder="plan_xxxxx (optional)"
                                        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            {/* Features */}
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">Features</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text" value={featureInput}
                                        onChange={(e) => setFeatureInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                                        placeholder="e.g. Unlimited trips"
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                    <button type="button" onClick={addFeature} className="px-3 py-2 rounded-lg bg-white/[0.06] text-xs text-gray-300 hover:bg-white/[0.1] hover:text-white transition-all">Add</button>
                                </div>
                                {planForm.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {planForm.features.map((f, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-300 bg-white/[0.04] rounded-md">
                                                {f}
                                                <button type="button" onClick={() => removeFeature(i)} className="text-gray-600 hover:text-red-400"><X size={10} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Active toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                <span className="text-sm text-gray-300">Active</span>
                                <button type="button"
                                    onClick={() => setPlanForm({ ...planForm, isActive: !planForm.isActive })}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${planForm.isActive ? 'bg-indigo-600' : 'bg-white/[0.1]'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${planForm.isActive ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowPlanForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all">
                                    {editPlan ? 'Update Plan' : 'Add Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
