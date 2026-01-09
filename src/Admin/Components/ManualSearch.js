import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Sparkles, Loader2, Link2, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManualSearch = ({ darkMode }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sourceId, setSourceId] = useState('');
    const [generatingId, setGeneratingId] = useState(null);
    const [bridgeResult, setBridgeResult] = useState(null);

    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await response.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Search error:', error);
        }
        setLoading(false);
    };

    const handleGenerateBridge = async (target) => {
        if (!sourceId) {
            toast.error(__('Please specify a Source Post ID first.', 'wp-apexlink'));
            return;
        }

        setGeneratingId(target.id || target.ID);
        try {
            const res = await fetch(`${baseUrl}/suggestions/bridge/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({
                    source_id: parseInt(sourceId),
                    target_id: target.id || target.ID
                })
            });
            const data = await res.json();
            if (data.success) {
                setBridgeResult({
                    targetTitle: target.title,
                    targetId: target.id || target.ID,
                    bridge: data.bridge
                });
                toast.success(__('AI Bridge generated!', 'wp-apexlink'));
            } else {
                toast.error(data.error || __('Failed to generate bridge.', 'wp-apexlink'));
            }
        } catch (e) {
            toast.error(__('An error occurred.', 'wp-apexlink'));
        } finally {
            setGeneratingId(null);
        }
    };

    const handleApplyBridge = async () => {
        if (!bridgeResult) return;
        
        try {
            const res = await fetch(`${baseUrl}/suggestions/bridge/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({
                    source_id: parseInt(sourceId),
                    target_id: bridgeResult.targetId,
                    bridge_text: bridgeResult.bridge
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(__('Bridge applied to post!', 'wp-apexlink'));
                setBridgeResult(null);
            } else {
                toast.error(data.message || __('Failed to apply bridge.', 'wp-apexlink'));
            }
        } catch (e) {
            toast.error(__('An error occurred.', 'wp-apexlink'));
        }
    };

    return (
        <div className={`mt-10 rounded-3xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-50'} flex justify-between items-center`}>
                <div>
                    <h2 className={`text-xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="mr-2">🔍</span> {__('Algorithm Tester', 'wp-apexlink')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {__('Test the semantic search engine and generate AI bridges.', 'wp-apexlink')}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-[10px] uppercase font-black text-gray-400">{__('Source ID:', 'wp-apexlink')}</span>
                    <input 
                        type="number" 
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        placeholder="Ex: 123"
                        className={`w-20 rounded-lg text-xs font-bold px-2 py-1 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                    />
                </div>
            </div>

            <div className="p-6">
                {bridgeResult && (
                    <div className={`mb-8 p-6 rounded-2xl border border-dashed animate-in zoom-in-95 duration-300 ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center text-xs font-black uppercase tracking-widest text-indigo-500">
                                <Sparkles className="w-4 h-4 mr-2" />
                                {__('Drafting Bridge for:', 'wp-apexlink')} {bridgeResult.targetTitle}
                            </div>
                            <button onClick={() => setBridgeResult(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea 
                            value={bridgeResult.bridge}
                            onChange={(e) => setBridgeResult({...bridgeResult, bridge: e.target.value})}
                            rows={3}
                            className={`w-full p-4 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none mb-4 ${darkMode ? 'bg-gray-900/50 text-white border-gray-700' : 'bg-white border-gray-200'}`}
                        />
                        <button 
                            onClick={handleApplyBridge}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                        >
                            {__('Inject into Post Content', 'wp-apexlink')}
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={__('Search for topics to link...', 'wp-apexlink')}
                        className={`flex-grow rounded-xl shadow-sm focus:border-neuro-brain focus:ring-neuro-brain ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300'}`}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-neuro-brain hover:bg-opacity-90 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? __('Searching...', 'wp-apexlink') : __('Search', 'wp-apexlink')}
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    {results.length > 0 ? (
                        results.map((result) => (
                            <div key={result.ID} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${darkMode ? 'bg-gray-900 border-gray-700 hove:bg-gray-700' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{result.title}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                ID: {result.id || result.ID}
                                            </div>
                                            <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center">
                                                <ExternalLink className="w-2.5 h-2.5 mr-1" /> {__('View', 'wp-apexlink')}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm font-black text-indigo-500">
                                            {parseFloat(result.score).toFixed(2)}
                                        </div>
                                        <div className="text-[8px] uppercase text-gray-400 font-black tracking-widest leading-none">
                                            {__('Score', 'wp-apexlink')}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleGenerateBridge(result)}
                                        disabled={generatingId === (result.id || result.ID)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-500/10'}`}
                                    >
                                        {generatingId === (result.id || result.ID) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        {__('Magic Bridge', 'wp-apexlink')}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : !loading && query && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 italic">
                            {__('No semantic matches found for this query.', 'wp-apexlink')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManualSearch;
