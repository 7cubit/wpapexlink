import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Zap, Key, ArrowRight, CheckCircle, Loader2, Rocket, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const SetupWizard = ({ darkMode, onComplete }) => {
    const [step, setStep] = useState(1);
    const [licenseKey, setLicenseKey] = useState('');
    const [apiKey, setApiKey] = useState('');
    const queryClient = useQueryClient();
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const steps = [
        { id: 1, title: __('Welcome', 'wp-apexlink'), icon: Brain },
        { id: 2, title: __('License', 'wp-apexlink'), icon: Zap },
        { id: 3, title: __('AI Engine', 'wp-apexlink'), icon: Key },
        { id: 4, title: __('Ready', 'wp-apexlink'), icon: Rocket },
    ];

    const activateMutation = useMutation({
        mutationFn: async (key) => {
            const res = await fetch(`${baseUrl}/license/activate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce 
                },
                body: JSON.stringify({ license_key: key })
            });
            const json = await res.json();
            console.log('[ApexLink SetupWizard] Activation response:', json);
            return json;
        },
        onSuccess: (data) => {
            console.log('[ApexLink SetupWizard] onSuccess data:', data);
            if (data.success && data.data?.active) {
                toast.success(__('License activated successfully!', 'wp-apexlink'));
                setStep(3);
                queryClient.invalidateQueries(['license_status']);
            } else {
                toast.error(data.message || data.data?.message || __('Invalid license key', 'wp-apexlink'));
            }
        },
        onError: (error) => {
            console.error('[ApexLink SetupWizard] Activation error:', error);
            toast.error(__('Network error during activation.', 'wp-apexlink'));
        }
    });

    const settingsMutation = useMutation({
        mutationFn: async (settings) => {
            const res = await fetch(`${baseUrl}/settings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce 
                },
                body: JSON.stringify(settings)
            });
            return res.json();
        },
        onSuccess: () => {
            setStep(4);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
        }
    });

    const handleNext = () => {
        if (step === 1) setStep(2);
        if (step === 2) {
            if (!licenseKey) {
                toast.error(__('Please enter your license key', 'wp-apexlink'));
                return;
            }
            activateMutation.mutate(licenseKey);
        }
        if (step === 3) {
            settingsMutation.mutate({
                apexlink_openai_key: apiKey,
                apexlink_setup_complete: 'yes'
            });
        }
        if (step === 4) {
            onComplete();
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300`}>
            <div className={`max-w-xl w-full rounded-[2.5rem] overflow-hidden shadow-2xl border flex flex-col animate-in zoom-in-95 duration-500 delay-150 fill-mode-both ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
                
                {/* Progress Bar */}
                <div className="flex h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                    <div 
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700" 
                        style={{ width: `${(step / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-10 flex-grow">
                    <div className="flex justify-between items-center mb-10">
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center space-y-2 opacity-100">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : (darkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-50 text-gray-300')}`}>
                                    <s.icon className={`w-5 h-5 ${step === s.id ? 'animate-pulse' : ''}`} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step === s.id ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-gray-500'}`}>{s.title}</span>
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[220px]">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Brain className="w-8 h-8" />
                                </div>
                                <h1 className={`text-4xl font-black mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Welcome to ApexLink', 'wp-apexlink')}</h1>
                                <p className={`text-lg transition-colors leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {__("You're minutes away from a perfectly optimized internal linking architecture. Let's get you set up.", "wp-apexlink")}
                                </p>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Activate ApexLink', 'wp-apexlink')}</h2>
                                <p className="text-gray-500 mb-8">{__('Enter your license key to unlock AI features and cloud reranking.', 'wp-apexlink')}</p>
                                
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 text-gray-400">
                                        <Key className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={licenseKey}
                                        onChange={(e) => setLicenseKey(e.target.value)}
                                        className={`block w-full pl-12 pr-4 py-4 rounded-2xl font-mono text-lg transition-all border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                                        placeholder="NEURO-XXXX-XXXX-XXXX"
                                    />
                                </div>
                                <p className="mt-4 text-xs text-gray-400 text-center italic">
                                    {__('No key? Visit apexstream.co to get one.', 'wp-apexlink')}
                                </p>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className={`text-2xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('AI Intelligence (Optional)', 'wp-apexlink')}</h2>
                                <p className="text-gray-500 mb-8">{__('Connect your OpenAI key for unlimited AI reranking and Magic Synonyms.', 'wp-apexlink')}</p>
                                
                                <div className="relative group mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-500 text-gray-400">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className={`block w-full pl-12 pr-4 py-4 rounded-2xl font-mono text-lg transition-all border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'}`}
                                        placeholder="sk-..."
                                    />
                                </div>
                                <div className={`p-4 rounded-xl flex items-start text-xs ${darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                    <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
                                    {__('Agency keys bypass the default credit system for unlimited usage.', 'wp-apexlink')}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                                    <CheckCircle className="w-10 h-10" />
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                </div>
                                <h2 className={`text-3xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__("You're All Set!", "wp-apexlink")}</h2>
                                <p className="text-gray-500 text-lg leading-relaxed">
                                    {__('The indexer is warming up. Your link suggestions will begin appearing in just a few moments.', 'wp-apexlink')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex justify-between items-center">
                        {step > 1 && step < 4 && (
                            <button 
                                onClick={() => setStep(step - 1)}
                                className={`font-bold transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {__('Back', 'wp-apexlink')}
                            </button>
                        )}
                        <div />
                        <button 
                            onClick={handleNext}
                            disabled={activateMutation.isLoading || settingsMutation.isLoading}
                            className={`flex items-center px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 disabled:opacity-50 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}
                        >
                            {activateMutation.isLoading || settingsMutation.isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {step === 4 ? __('Enter Dashboard', 'wp-apexlink') : (step === 3 && !apiKey ? __('Skip for now', 'wp-apexlink') : __('Continue', 'wp-apexlink'))}
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
