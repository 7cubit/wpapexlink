import { __ } from '@wordpress/i18n';
import { Moon, Sun, Save, ShieldCheck, Zap, Info, Loader2 } from 'lucide-react';
import NeoTooltip from '../Components/NeoTooltip';
import { useState, useEffect } from '@wordpress/element';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const Settings = ({ darkMode, setDarkMode, readOnly }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('general');
    const [isTesting, setIsTesting] = useState(false);
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const { data: license } = useQuery({
        queryKey: ['license_status'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/license/status`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    const isAgency = license?.tier === 'enterprise' || license?.tier === 'agency';

    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/settings`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    const [localSettings, setLocalSettings] = useState({
        apexlink_enable_ai_reranking: false,
        apexlink_batch_size: 25,
        apexlink_silo_boost: 25,
        apexlink_anchor_diversity_mode: 'exact',
        apexlink_use_custom_key: false,
        apexlink_openai_key: '',
        apexlink_gsc_client_id: '',
        apexlink_gsc_client_secret: '',
        apexlink_gsc_connected: false,
        apexlink_ignore_classes: '',
        apexlink_white_label: false,
        apexlink_read_only: false,
        apexlink_min_capability: 'manage_options'
    });

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const saveMutation = useMutation({
        mutationFn: async (newSettings) => {
            const res = await fetch(`${baseUrl}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify(newSettings)
            });
            return res.json();
        },
        onSuccess: () => {
            toast.success(__('Settings saved!', 'wp-apexlink'));
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
        onError: () => {
            toast.error(__('Failed to save settings.', 'wp-apexlink'));
        }
    });

    const handleSave = () => {
        saveMutation.mutate(localSettings);
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const res = await fetch(`${baseUrl}/settings/ai/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ key: localSettings.apexlink_openai_key })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(__('Connection successful! Unlimited mode active.', 'wp-apexlink'));
            } else {
                toast.error(data.error || __('Connection failed.', 'wp-apexlink'));
            }
        } catch (e) {
            toast.error(__('An error occurred during testing.', 'wp-apexlink'));
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">{__('Loading settings...', 'wp-apexlink')}</div>;

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Plugin Settings', 'wp-apexlink')}</h2>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-neuro-brain text-white shadow-lg shadow-indigo-500/20' : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'}`}`}
                >
                    {__('General', 'wp-apexlink')}
                </button>
                {isAgency && (
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'}`}`}
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        {__('AI Reranking (Agency)', 'wp-apexlink')}
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('integrations')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center ${activeTab === 'integrations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'}`}`}
                >
                    <Zap className="w-4 h-4 mr-2" />
                    {__('Integrations', 'wp-apexlink')}
                </button>
                <button 
                    onClick={() => setActiveTab('agency')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center ${activeTab === 'agency' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'}`}`}
                >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {__('Agency', 'wp-apexlink')}
                </button>
                <button 
                    onClick={() => setActiveTab('maintenance')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center ${activeTab === 'maintenance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900'}`}`}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {__('Maintenance', 'wp-apexlink')}
                </button>
            </div>

            <div className="space-y-6">
                {activeTab === 'general' ? (
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-4 sm:p-8`}>
                        <h3 className={`text-lg font-bold mb-6 flex items-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            <ShieldCheck className="w-5 h-5 mr-2 text-green-500" />
                            {__('General Configuration', 'wp-apexlink')}
                        </h3>

                        <div className="space-y-6 max-w-2xl">
                            {/* Dark Mode Toggle */}
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                <div>
                                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Dark Appearance', 'wp-apexlink')}</div>
                                    <div className="text-sm text-gray-500">{__('Toggle engine dashboard appearance.', 'wp-apexlink')}</div>
                                </div>
                                <button 
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95 ${darkMode ? 'bg-indigo-600 text-white shadow-indigo-900/20' : 'bg-white text-gray-400 border border-gray-200 shadow-sm'}`}
                                >
                                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* AI Reranking Toggle */}
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                <div>
                                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Hybrid AI Reranking', 'wp-apexlink')}</div>
                                    <div className="text-sm text-gray-500">{__('Uses OpenAI to refine link suggestions.', 'wp-apexlink')}</div>
                                </div>
                                <button 
                                    onClick={() => setLocalSettings(prev => ({ ...prev, apexlink_enable_ai_reranking: !prev.apexlink_enable_ai_reranking }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${localSettings.apexlink_enable_ai_reranking ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.apexlink_enable_ai_reranking ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div>
                                <label className={`flex items-center text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {__('Batch Size', 'wp-apexlink')}
                                    <NeoTooltip darkMode={darkMode} text={__('Determines how many posts the background indexer processes in one cycle. Higher values are faster but consume more server resources.', 'wp-apexlink')} />
                                </label>
                                <input 
                                    type="number" 
                                    value={localSettings.apexlink_batch_size}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_batch_size: parseInt(e.target.value) }))}
                                    className={`w-full rounded-xl shadow-sm focus:ring-neuro-brain focus:border-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                />
                                <p className="mt-2 text-xs text-gray-400">{__('Number of posts to process in a single background job.', 'wp-apexlink')}</p>
                            </div>

                            <div>
                                <label className={`flex items-center text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {__('Silo Boost (%)', 'wp-apexlink')}
                                    <NeoTooltip darkMode={darkMode} text={__('Prioritizes linking between posts within the same category/silo to strengthen topical authority.', 'wp-apexlink')} />
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={localSettings.apexlink_silo_boost}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_silo_boost: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neuro-brain"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1 uppercase">
                                    <span>{__('Off', 'wp-apexlink')}</span>
                                    <span className="text-indigo-500">{localSettings.apexlink_silo_boost}%</span>
                                    <span>{__('Strong', 'wp-apexlink')}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                <label className={`flex items-center text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {__('Ignore CSS Classes', 'wp-apexlink')}
                                    <NeoTooltip darkMode={darkMode} text={__('Enter classes (e.g., .no-links) or tags (e.g., nav) to skip during indexing.', 'wp-apexlink')} />
                                </label>
                                <input 
                                    type="text" 
                                    value={localSettings.apexlink_ignore_classes}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_ignore_classes: e.target.value }))}
                                    placeholder="header, footer, sidebar, .ignore-me"
                                    className={`w-full rounded-xl shadow-sm focus:ring-neuro-brain focus:border-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                />
                                <p className="mt-2 text-xs text-gray-400">{__('Comma-separated list of CSS classes or tags to ignore during indexing. Useful for headers, footers, or navigation menus.', 'wp-apexlink')}</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'integrations' ? (
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-4 sm:p-8`}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className={`text-lg font-bold flex items-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                <Zap className="w-5 h-5 mr-2 text-indigo-500" />
                                {__('Google Search Console', 'wp-apexlink')}
                            </h3>
                            {localSettings.apexlink_gsc_connected && (
                                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    {__('Connected', 'wp-apexlink')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 max-w-2xl">
                            <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'} border`}>
                                <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                    {__('Provide your Google Cloud Client ID and Secret to enable "Striking Distance" keyword intelligence.', 'wp-apexlink')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{__('Google Client ID', 'wp-apexlink')}</label>
                                    <input 
                                        type="text" 
                                        value={localSettings.apexlink_gsc_client_id}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_gsc_client_id: e.target.value }))}
                                        placeholder="123456789-abc.apps.googleusercontent.com"
                                        className={`w-full rounded-xl shadow-sm focus:ring-neuro-brain focus:border-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{__('Google Client Secret', 'wp-apexlink')}</label>
                                    <input 
                                        type="password" 
                                        value={localSettings.apexlink_gsc_client_secret}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_gsc_client_secret: e.target.value }))}
                                        placeholder="GOCSPX-..."
                                        className={`w-full rounded-xl shadow-sm focus:ring-neuro-brain focus:border-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 italic">
                                    {__('Note: You must add your WordPress Admin URL as an authorized redirect URI in the Google Cloud Console.', 'wp-apexlink')}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'agency' ? (
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-4 sm:p-8`}>
                        <h3 className={`text-lg font-bold mb-6 flex items-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            <ShieldCheck className="w-5 h-5 mr-2 text-indigo-500" />
                            {__('Agency & White-Label', 'wp-apexlink')}
                        </h3>
                        <div className="space-y-6 max-w-2xl">
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                <div>
                                    <div className={`flex items-center font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {__('White-Label Mode', 'wp-apexlink')}
                                        <NeoTooltip darkMode={darkMode} text={__('Removes WP ApexLink branding for a native client experience.', 'wp-apexlink')} />
                                    </div>
                                    <div className="text-sm text-gray-500">{__('Hides ApexLink branding and logos.', 'wp-apexlink')}</div>
                                </div>
                                <button 
                                    onClick={() => setLocalSettings(prev => ({ ...prev, apexlink_white_label: !prev.apexlink_white_label }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${localSettings.apexlink_white_label ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.apexlink_white_label ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                <div>
                                    <div className={`flex items-center font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {__('Client Read-Only Mode', 'wp-apexlink')}
                                        <NeoTooltip darkMode={darkMode} text={__('Locks all settings and link approvals, preventing unintended changes by clients.', 'wp-apexlink')} />
                                    </div>
                                    <div className="text-sm text-gray-500">{__('Prevents changing links or settings.', 'wp-apexlink')}</div>
                                </div>
                                <button 
                                    onClick={() => setLocalSettings(prev => ({ ...prev, apexlink_read_only: !prev.apexlink_read_only }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${localSettings.apexlink_read_only ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.apexlink_read_only ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{__('Minimum Access Capability', 'wp-apexlink')}</label>
                                <select 
                                    value={localSettings.apexlink_min_capability}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_min_capability: e.target.value }))}
                                    className={`w-full rounded-xl shadow-sm focus:ring-neuro-brain focus:border-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="manage_options">{__('Administrator (manage_options)', 'wp-apexlink')}</option>
                                    <option value="edit_posts">{__('Editor (edit_posts)', 'wp-apexlink')}</option>
                                </select>
                                <p className="mt-2 text-xs text-gray-400">{__('Determine which users can access the ApexLink dashboard.', 'wp-apexlink')}</p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'maintenance' ? (
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-4 sm:p-8`}>
                        <h3 className={`text-lg font-bold mb-6 flex items-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                            <Save className="w-5 h-5 mr-2 text-indigo-500" />
                            {__('Data & Portability', 'wp-apexlink')}
                        </h3>
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex gap-4">
                                <button 
                                    onClick={async () => {
                                        const res = await fetch(`${baseUrl}/settings/export`, {
                                            headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
                                        });
                                        const data = await res.json();
                                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `apexlink-settings-${new Date().toISOString().split('T')[0]}.json`;
                                        a.click();
                                        toast.success(__('Settings exported!', 'wp-apexlink'));
                                    }}
                                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {__('Export Settings (JSON)', 'wp-apexlink')}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (readOnly) {
                                            toast.error(__('Import disabled in Read-Only mode.', 'wp-apexlink'));
                                            return;
                                        }
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.json';
                                        input.onchange = async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = async (event) => {
                                                try {
                                                    const json = JSON.parse(event.target.result);
                                                    const res = await fetch(`${baseUrl}/settings/import`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'X-WP-Nonce': window.wpApexLinkData?.nonce
                                                        },
                                                        body: JSON.stringify(json)
                                                    });
                                                    const result = await res.json();
                                                    if (result.success) {
                                                        toast.success(__('Settings imported! Reloading...', 'wp-apexlink'));
                                                        setTimeout(() => window.location.reload(), 1500);
                                                    }
                                                } catch (err) {
                                                    toast.error(__('Invalid JSON file.', 'wp-apexlink'));
                                                }
                                            };
                                            reader.readAsText(file);
                                        };
                                        input.click();
                                    }}
                                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {__('Import Settings', 'wp-apexlink')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'ai' ? (
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-4 sm:p-8`}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className={`text-lg font-bold flex items-center ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                <Zap className="w-5 h-5 mr-2 text-indigo-500" />
                                {__('Agency BYOK (Bring Your Own Key)', 'wp-apexlink')}
                            </h3>
                            {localSettings.apexlink_use_custom_key && (
                                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    {__('Unlimited Mode Active', 'wp-apexlink')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 max-w-2xl">
                            <div className={`p-4 rounded-xl mb-6 ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'} border`}>
                                <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                    {__('As an Agency user, you can use your own OpenAI API key. This bypasses the plugin credit system and allows for unlimited AI reranking for high-volume sites.', 'wp-apexlink')}
                                </p>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                <div>
                                    <div className={`flex items-center font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {__('Use Custom OpenAI Key', 'wp-apexlink')}
                                        <NeoTooltip darkMode={darkMode} text={__('Bypass the standard ApexLink credit system by connecting your own billing. Ideal for high-traffic agency sites.', 'wp-apexlink')} />
                                    </div>
                                    <div className="text-sm text-gray-500">{__('Enable to use your own billing for AI Rerank.', 'wp-apexlink')}</div>
                                </div>
                                <button 
                                    onClick={() => setLocalSettings(prev => ({ ...prev, apexlink_use_custom_key: !prev.apexlink_use_custom_key }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${localSettings.apexlink_use_custom_key ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.apexlink_use_custom_key ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{__('OpenAI API Key', 'wp-apexlink')}</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={localSettings.apexlink_openai_key}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, apexlink_openai_key: e.target.value }))}
                                        placeholder={__('sk-...', 'wp-apexlink')}
                                        className={`flex-grow rounded-xl shadow-sm focus:ring-neuro-brain focus:border-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    />
                                    <button 
                                        onClick={handleTestConnection}
                                        disabled={isTesting}
                                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : __('Test Connection', 'wp-apexlink')}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">{__('Your key is encrypted before being stored on your server.', 'wp-apexlink')}</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Save Button */}
                <div className="flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={saveMutation.isLoading || readOnly}
                        className={`flex items-center px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isLoading ? __('Saving...', 'wp-apexlink') : (readOnly ? __('Read-Only Mode', 'wp-apexlink') : __('Save Settings', 'wp-apexlink'))}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
