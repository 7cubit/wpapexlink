import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Magnet, Sparkles, Loader2, Link2, ExternalLink, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../Components/EmptyState';

const MagnetTool = ({ darkMode }) => {
    const [targetPost, setTargetPost] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [applyingId, setApplyingId] = useState(null);
    const [smartSuggestions, setSmartSuggestions] = useState([]);
    const [isSmartLoading, setIsSmartLoading] = useState(false);
    const [showSmart, setShowSmart] = useState(false);

    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const handlePostSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await response.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(__('Error searching for posts.', 'wp-apexlink'));
        } finally {
            setIsSearching(false);
        }
    };

    const selectTarget = (post) => {
        setTargetPost(post);
        setSearchResults([]);
        setSearchQuery('');
        fetchCandidates(post.id || post.ID);
    };

    const fetchCandidates = async (postId) => {
        setIsLoadingCandidates(true);
        try {
            const response = await fetch(`${baseUrl}/magnet/candidates?post_id=${postId}`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await response.json();
            setCandidates(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(__('Error fetching inbound candidates.', 'wp-apexlink'));
        } finally {
            setIsLoadingCandidates(false);
        }
    };

    const fetchSmartSuggestions = async () => {
        setIsSmartLoading(true);
        try {
            const response = await fetch(`${baseUrl}/magnet/suggestions`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await response.json();
            setSmartSuggestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch smart suggestions', error);
        } finally {
            setIsSmartLoading(false);
        }
    };

    useEffect(() => {
        if (!targetPost) {
            fetchSmartSuggestions();
        }
    }, [targetPost]);

    const applyLink = async (candidate) => {
        setApplyingId(candidate.post_id);
        try {
            const response = await fetch(`${baseUrl}/magnet/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({
                    source_id: candidate.post_id,
                    target_id: targetPost.id || targetPost.ID,
                    anchor: targetPost.title
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(__('Inbound link created!', 'wp-apexlink'));
                setCandidates(prev => prev.filter(c => c.post_id !== candidate.post_id));
            } else {
                toast.error(data.message || __('Failed to create link.', 'wp-apexlink'));
            }
        } catch (error) {
            toast.error(__('An error occurred.', 'wp-apexlink'));
        } finally {
            setApplyingId(null);
        }
    };

    const handleBatchApply = async () => {
        const toApply = candidates.slice(0, 5); // Apply top 5
        if (toApply.length === 0) return;

        toast.loading(__('Applying batch links...', 'wp-apexlink'), { id: 'batch-magnet' });
        
        let successCount = 0;
        for (const c of toApply) {
            try {
                const response = await fetch(`${baseUrl}/magnet/apply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': window.wpApexLinkData?.nonce
                    },
                    body: JSON.stringify({
                        source_id: c.post_id,
                        target_id: targetPost.id || targetPost.ID,
                        anchor: targetPost.title
                    })
                });
                const data = await response.json();
                if (data.success) successCount++;
            } catch (e) {}
        }

        toast.success(`${successCount} ${__('links created successfully!', 'wp-apexlink')}`, { id: 'batch-magnet' });
        fetchCandidates(targetPost.id || targetPost.ID);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Intro */}
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'} relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                                <Magnet className="w-6 h-6" />
                            </div>
                            <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('The Magnet', 'wp-apexlink')}</h1>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-xl`}>
                            {__('Reverse your internal linking. Select a high-value post and "pull" authoritative inbound links from relevant pages across your entire site automatically.', 'wp-apexlink')}
                        </p>
                    </div>

                    {!targetPost ? (
                        <div className="flex gap-2 max-w-md w-full">
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handlePostSearch()}
                                onFocus={() => setShowSmart(true)}
                                onBlur={() => setTimeout(() => setShowSmart(false), 200)}
                                placeholder={__('Search target post...', 'wp-apexlink')}
                                className={`flex-grow rounded-xl border-none ring-1 focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-700 ring-gray-600 text-white' : 'bg-gray-50 ring-gray-200 text-gray-900'}`}
                            />
                            
                            {/* Smart Suggestions Dropdown */}
                            {showSmart && !searchQuery && smartSuggestions.length > 0 && (
                                <div className={`absolute top-full left-0 right-0 mt-2 z-50 p-4 border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('Suggested Targets', 'wp-apexlink')}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {smartSuggestions.map((post) => (
                                            <button 
                                                key={post.id}
                                                onClick={() => selectTarget(post)}
                                                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{post.title}</span>
                                                    <span className="text-[10px] text-emerald-500 font-bold uppercase">{__('High Authority / Needs Links', 'wp-apexlink')}</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button 
                                onClick={handlePostSearch}
                                disabled={isSearching}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : __('Find Target', 'wp-apexlink')}
                            </button>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-4 p-4 rounded-2xl border ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 leading-none mb-1">{__('Current Magnet', 'wp-apexlink')}</span>
                                <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-indigo-900'}`}>{targetPost.title}</h3>
                            </div>
                            <button 
                                onClick={() => setTargetPost(null)}
                                className={`p-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-white text-gray-500 shadow-sm'}`}
                            >
                                {__('Change', 'wp-apexlink')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Search Results dropdown-style */}
                {searchResults.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-2 z-50 p-4 border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        <div className="space-y-2">
                            {searchResults.map((post) => (
                                <button 
                                    key={post.ID}
                                    onClick={() => selectTarget(post)}
                                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                >
                                    <span className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{post.title}</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Candidates Section */}
            {targetPost && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex justify-between items-center">
                        <h2 className={`text-lg font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {__('Inbound Opportunities', 'wp-apexlink')}
                        </h2>
                        {candidates.length > 0 && (
                            <button 
                                onClick={handleBatchApply}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {__('One-Click Add (Top 5)', 'wp-apexlink')}
                            </button>
                        )}
                    </div>

                    {isLoadingCandidates ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-32 rounded-3xl animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                            ))}
                        </div>
                    ) : candidates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {candidates.map((candidate) => (
                                <div key={candidate.post_id} className={`p-6 rounded-3xl border group transition-all hover:shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black rounded-full border border-indigo-500/20">
                                                {__('High Authority', 'wp-apexlink')}
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                Score: {Math.round(candidate.score * 100)}%
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={candidate.url} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}>
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>

                                    <h4 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{candidate.title}</h4>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center text-xs text-gray-500 italic">
                                            <ArrowRight className="w-3 h-3 mr-1 text-indigo-500" />
                                            {__('Will use anchor:', 'wp-apexlink')} "{targetPost.title}"
                                        </div>
                                        <button 
                                            onClick={() => applyLink(candidate)}
                                            disabled={applyingId === candidate.post_id}
                                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                                        >
                                            {applyingId === candidate.post_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Magnet className="w-3 h-3" />}
                                            {__('Pull Link', 'wp-apexlink')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            type="magnet"
                            title={__('No Pull Opportunities', 'wp-apexlink')}
                            description={__('We couldn\'t find any relevant posts to pull links from for this target. Try adjusting your target keywords.', 'wp-apexlink')}
                            darkMode={darkMode}
                        />
                    )}
                </div>
            )}

            {!targetPost && (
                <div className={`p-16 rounded-[3rem] border-2 border-dashed flex flex-col items-center text-center justify-center ${darkMode ? 'bg-gray-900/20 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                    <Magnet className="w-16 h-16 text-indigo-500 mb-6 opacity-30 animate-bounce" />
                    <h2 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Start Pulling Authority', 'wp-apexlink')}</h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        {__('Search for an important page above to see where else on your site you should be linking to it from.', 'wp-apexlink')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MagnetTool;
