import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { 
    CheckCircle2, XCircle, AlertCircle, Puzzle, Loader2, ExternalLink, Zap, Info, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Integrations = ({ darkMode }) => {
    const [loading, setLoading] = useState(true);
    const [integrations, setIntegrations] = useState([]);
    
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/integrations/status`, {
                headers: {
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                }
            });
            const data = await response.json();
            setIntegrations(data || []);
        } catch (error) {
            toast.error(__('Error loading integration status.', 'wp-apexlink'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">{__('Scanning for compatible builders...', 'wp-apexlink')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Page Builder Compatibility', 'wp-apexlink')}</h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {__('ApexLink automatically detects and parses content from your favorite design tools.', 'wp-apexlink')}
                </p>
            </div>

            {/* Integration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((item) => (
                    <div 
                        key={item.id}
                        className={`p-6 rounded-[2rem] border transition-all hover:scale-[1.02] ${
                            darkMode 
                                ? (item.detected ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-gray-800 border-gray-700') 
                                : (item.detected ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-500/5' : 'bg-white border-gray-100 shadow-sm opacity-60')
                        }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${item.detected ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Puzzle className="w-5 h-5" />
                            </div>
                            {item.detected ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
                                    <ShieldCheck className="w-3 h-3" />
                                    {__('Active', 'wp-apexlink')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                                    <XCircle className="w-3 h-3" />
                                    {__('Not Found', 'wp-apexlink')}
                                </div>
                            )}
                        </div>

                        <h3 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.name}
                        </h3>
                        <p className={`text-xs leading-relaxed mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Zap className={`w-3 h-3 ${item.detected ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {item.supported ? __('Full Support', 'wp-apexlink') : __('Limited', 'wp-apexlink')}
                                </span>
                            </div>
                            <button className={`text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>
                                {__('Docs', 'wp-apexlink')}
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Support Notice */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center gap-8 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <div className="p-4 bg-indigo-100 rounded-3xl">
                    <AlertCircle className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className={`text-lg font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {__('Don\'t see your builder?', 'wp-apexlink')}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {__('ApexLink is built to be extensible. We constantly add support for new frameworks. If you use a custom setup, our engine will still attempt to index the rendered frontend output.', 'wp-apexlink')}
                    </p>
                </div>
                <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 whitespace-nowrap">
                    {__('Request Integration', 'wp-apexlink')}
                </button>
            </div>
        </div>
    );
};

export default Integrations;
