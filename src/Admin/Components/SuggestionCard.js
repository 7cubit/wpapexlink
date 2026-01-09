import { __ } from '@wordpress/i18n';
import { Check, X, Edit2, Link2, ExternalLink, Sparkles, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { useState } from '@wordpress/element';
import toast from 'react-hot-toast';

const SuggestionCard = ({ suggestion, onAction, darkMode }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [anchor, setAnchor] = useState(suggestion.anchor);
    const [isGenerating, setIsGenerating] = useState(false);
    const [bridgeText, setBridgeText] = useState(suggestion.generated_bridge || '');
    const [isSynonymLoading, setIsSynonymLoading] = useState(false);
    const [synonyms, setSynonyms] = useState([]);
    const [showDiff, setShowDiff] = useState(false);
    const [localContext, setLocalContext] = useState(suggestion.context);
    
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const score = parseFloat(suggestion.score);
    const getScoreColor = (s) => {
        if (s >= 80) return 'text-emerald-500 bg-emerald-500/10';
        if (s >= 50) return 'text-amber-500 bg-amber-500/10';
        return 'text-rose-500 bg-rose-500/10';
    };

    const handleAccept = () => {
        if (suggestion.is_bridge) {
            if (!bridgeText) {
                toast.error(__('Please generate a bridge first.', 'wp-apexlink'));
                return;
            }
            onAction(suggestion.id, 'bridge_apply', bridgeText);
        } else {
            onAction(suggestion.id, 'accepted', anchor);
        }
    };

    const handleReject = () => {
        onAction(suggestion.id, 'rejected');
    };

    const handleUpdateContext = async () => {
        try {
            const res = await fetch(`${baseUrl}/suggestions/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ id: suggestion.id, context: localContext })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(__('Context updated!', 'wp-apexlink'));
                setIsEditing(false);
            }
        } catch (e) {
            toast.error(__('Failed to update context.', 'wp-apexlink'));
        }
    };

    const handleGenerateBridge = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`${baseUrl}/suggestions/bridge/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({
                    source_id: suggestion.source_id,
                    target_id: suggestion.target_id
                })
            });
            const data = await res.json();
            if (data.success) {
                setBridgeText(data.bridge);
                toast.success(__('AI Bridge generated!', 'wp-apexlink'));
            } else {
                toast.error(data.error || __('Failed to generate bridge.', 'wp-apexlink'));
            }
        } catch (e) {
            toast.error(__('An error occurred.', 'wp-apexlink'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleMagicSynonym = async () => {
        setIsSynonymLoading(true);
        try {
            const res = await fetch(`${baseUrl}/ai/synonyms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ anchor: suggestion.anchor })
            });
            const data = await res.json();
            if (data.success && data.synonyms) {
                setSynonyms(data.synonyms);
                toast.success(__('Synonyms found!', 'wp-apexlink'));
            } else {
                toast.error(__('Failed to fetch synonyms.', 'wp-apexlink'));
            }
        } catch (e) {
            toast.error(__('AI error.', 'wp-apexlink'));
        } finally {
            setIsSynonymLoading(false);
        }
    };

    const isBridgeCandidate = suggestion.is_bridge && !bridgeText;

    return (
        <div className={`suggestion-card p-6 rounded-3xl border transition-all hover:shadow-xl group ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getScoreColor(score)}`}>
                        {score}% {__('Match', 'wp-apexlink')}
                    </div>
                    {suggestion.ai_score && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30 text-indigo-400 bg-indigo-500/5`}>
                            {__('AI Score:', 'wp-apexlink')} {suggestion.ai_score}/10
                        </div>
                    )}
                    {suggestion.is_bridge && (
                        <div className="flex items-center text-amber-500 text-xs font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {__('Bridge Needed', 'wp-apexlink')}
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {!suggestion.is_bridge && (
                        <button 
                            onClick={() => setShowDiff(!showDiff)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${showDiff ? 'bg-indigo-600 text-white' : 'bg-gray-500/10 text-gray-400 hover:text-indigo-400'}`}
                        >
                            {showDiff ? __('Hide Diff', 'wp-apexlink') : __('Show Diff', 'wp-apexlink')}
                        </button>
                    )}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={handleReject}
                            className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-rose-500/20 text-gray-500 hover:text-rose-400' : 'hover:bg-rose-50 text-gray-400 hover:text-rose-600'}`}
                            title={__('Reject', 'wp-apexlink')}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleAccept}
                            className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400' : 'hover:bg-emerald-50 text-gray-500 hover:text-emerald-600'}`}
                            title={__('Accept', 'wp-apexlink')}
                        >
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Context / Diff View */}
            <div className={`mb-6 p-6 rounded-2xl leading-relaxed text-sm ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'} border shadow-inner`}>
                {isEditing ? (
                    <div className="space-y-4">
                        <textarea 
                            value={localContext}
                            onChange={(e) => setLocalContext(e.target.value)}
                            className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                            rows={4}
                        />
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold text-gray-500">{__('Cancel', 'wp-apexlink')}</button>
                            <button onClick={handleUpdateContext} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all">{__('Save Context', 'wp-apexlink')}</button>
                        </div>
                    </div>
                ) : showDiff ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-rose-500 opacity-70 tracking-widest">{__('Before', 'wp-apexlink')}</div>
                            <div className="p-3 bg-rose-500/5 rounded-lg text-gray-500 line-through opacity-60">
                                {localContext}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{__('After (Proposed)', 'wp-apexlink')}</div>
                            <div className={`p-3 bg-emerald-500/5 rounded-lg ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                {localContext.split(anchor)[0]}
                                <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold underline decoration-2 underline-offset-4 decoration-emerald-500/50">
                                    {anchor}
                                </span>
                                {localContext.split(anchor)[1]}
                            </div>
                        </div>
                    </div>
                ) : suggestion.is_bridge && bridgeText ? (
                    <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {__('AI Generated Bridge', 'wp-apexlink')}
                        </div>
                        <textarea 
                            value={bridgeText}
                            onChange={(e) => setBridgeText(e.target.value)}
                            rows={3}
                            className={`w-full p-4 rounded-2xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-900/50 text-gray-100 border-gray-700' : 'bg-indigo-50/30 text-gray-700 border-indigo-100'}`}
                        />
                    </div>
                ) : suggestion.is_bridge && !bridgeText ? (
                    <div className="flex flex-col items-center justify-center text-center py-4">
                        <Sparkles className="w-8 h-8 text-amber-500 mb-4 animate-pulse" />
                        <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('No Contextual Match Found', 'wp-apexlink')}</h4>
                        <p className="text-xs text-gray-500 max-w-xs mb-6">
                            {__('We couldn\'t find the perfect anchor text, but this connection is highly relevant. Generate an AI transition.', 'wp-apexlink')}
                        </p>
                        <button 
                            onClick={handleGenerateBridge}
                            disabled={isGenerating}
                            className="flex items-center px-6 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {__('Generate AI Bridge', 'wp-apexlink')}
                        </button>
                    </div>
                ) : (
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        "...{localContext.split(anchor)[0]}
                        <span className={`px-1 rounded font-bold underline decoration-2 underline-offset-4 ${darkMode ? 'text-indigo-400 decoration-indigo-500/50' : 'text-indigo-600 decoration-indigo-500/30'}`}>
                            {anchor}
                        </span>
                        {localContext.split(anchor)[1]}..."
                    </div>
                )}
            </div>

            {/* Connection Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-8">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{__('Source Post', 'wp-apexlink')}</div>
                    <div className={`font-bold truncate text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{suggestion.source_title}</div>
                    <a href={`/wp-admin/post.php?post=${suggestion.source_id}&action=edit`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center mt-1">
                        {__('View Source', 'wp-apexlink')} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                </div>

                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{__('Target Post', 'wp-apexlink')}</div>
                    <div className={`font-bold truncate text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{suggestion.target_title}</div>
                    <a href={`/wp-admin/post.php?post=${suggestion.target_id}&action=edit`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center mt-1">
                        {__('View Target', 'wp-apexlink')} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100/10">
                <div className="flex items-center gap-4">
                    {!suggestion.is_bridge && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-gray-500 hover:text-indigo-500 flex items-center font-bold transition-colors"
                        >
                            <Edit2 className="w-3 h-3 mr-1" /> {__('Edit Context', 'wp-apexlink')}
                        </button>
                    )}
                    {isEditing && (
                        <button 
                            onClick={handleMagicSynonym}
                            disabled={isSynonymLoading}
                            className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 disabled:opacity-50"
                        >
                            {isSynonymLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            {__('Magic Synonym', 'wp-apexlink')}
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleReject}
                        className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {__('Ignore', 'wp-apexlink')}
                    </button>
                    <button 
                        onClick={handleAccept}
                        disabled={isBridgeCandidate}
                        className="text-xs font-black uppercase tracking-widest px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {suggestion.is_bridge ? __('Approve Bridge', 'wp-apexlink') : __('Approve Link', 'wp-apexlink')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuggestionCard;
