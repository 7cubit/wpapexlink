import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ExternalLink, Search, RefreshCw, Magnet, Zap, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../Components/Skeleton';
import EmptyState from '../Components/EmptyState';

const Orphans = ({ darkMode }) => {
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const [selectedIds, setSelectedIds] = useState([]);

    const { data: orphans = [], isLoading, refetch } = useQuery({
        queryKey: ['orphans'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/orphans`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const bulkScanMutation = useMutation({
        mutationFn: async (ids) => {
            const res = await fetch(`${baseUrl}/orphans/bulk-scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ ids })
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setSelectedIds([]);
        }
    });

    const toggleSelectAll = () => {
        if (!Array.isArray(orphans) || orphans.length === 0) return;
        if (selectedIds.length === orphans.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orphans.map(o => o.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="animate-in fade-in duration-500 relative pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Orphan Posts', 'wp-apexlink')}</h2>
                    <p className="text-gray-500 mt-1">{__('Posts with zero inbound internal links. These are hard for search engines to find.', 'wp-apexlink')}</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 text-gray-400 hover:text-neuro-brain transition-colors"
                    title={__('Refresh List', 'wp-apexlink')}
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {orphans?.length === 0 && !isLoading ? (
                <EmptyState
                    type="reports"
                    title={__('Perfect Score!', 'wp-apexlink')}
                    description={__('No orphan posts found. Every post on your site is reachable via internal links.', 'wp-apexlink')}
                    darkMode={darkMode}
                />
            ) : (
                <div className={`rounded-2xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className={darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}>
                            <tr>
                                <th className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={Array.isArray(orphans) && orphans.length > 0 && selectedIds.length === orphans.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{__('Post Title', 'wp-apexlink')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{__('Traffic Potential', 'wp-apexlink')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{__('Published Date', 'wp-apexlink')}</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{__('Actions', 'wp-apexlink')}</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-64" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></td>
                                    </tr>
                                ))
                            ) : (
                                Array.isArray(orphans) && orphans.map((post) => (
                                    <tr key={post.id} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(post.id)}
                                                onChange={() => toggleSelect(post.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{post.title}</div>
                                            <div className="text-xs text-gray-400">ID: {post.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${post.traffic_potential > 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {post.traffic_potential} {__('visits/mo', 'wp-apexlink')}
                                                </div>
                                                {post.traffic_potential > 100 && <Zap className="w-3 h-3 text-amber-500 animate-pulse" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(post.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                                            <a href={post.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-400 inline-block">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button className={`px-3 py-1 rounded-md text-xs font-bold ${darkMode ? 'bg-indigo-900/40 text-indigo-400 hover:bg-indigo-900/60' : 'bg-indigo-50 text-indigo-600 hover:text-indigo-900'}`}>
                                                {__('Scan', 'wp-apexlink')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
                    <div className={`flex items-center space-x-6 px-8 py-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-gray-900/90 border-indigo-500/30' : 'bg-white/90 border-indigo-100'}`}>
                        <div className="flex items-center space-x-4 pr-6 border-r border-gray-700/20">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">
                                {selectedIds.length}
                            </div>
                            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Posts Selected', 'wp-apexlink')}</span>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => bulkScanMutation.mutate(selectedIds)}
                                disabled={bulkScanMutation.isPending}
                                className="flex items-center px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {bulkScanMutation.isPending ? <RefreshCw className="w-3 h-3 mr-2 animate-spin" /> : <Search className="w-3 h-3 mr-2" />}
                                {__('Bulk Scan for Links', 'wp-apexlink')}
                            </button>
                            <button className={`flex items-center px-6 py-2 border text-xs font-black rounded-xl transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                <Sparkles className="w-3 h-3 mr-2 text-indigo-500" />
                                {__('Auto-Fix via Magnet', 'wp-apexlink')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orphans;
