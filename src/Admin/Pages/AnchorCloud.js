import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useQuery } from '@tanstack/react-query';
import { Cloud, BarChart3, AlertTriangle, ShieldCheck, Info, Loader2 } from 'lucide-react';

const AnchorCloud = ({ darkMode }) => {
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const { data: anchors, isLoading } = useQuery({
        queryKey: ['anchor-stats'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/stats/anchors`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    if (isLoading) return (
        <div className="p-20 text-center text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="font-bold">{__('Analyzing anchor text profile...', 'wp-apexlink')}</p>
        </div>
    );

    const totalLinks = anchors?.reduce((acc, curr) => acc + parseInt(curr.count), 0) || 0;
    const uniqueAnchors = anchors?.length || 0;
    const diversityScore = totalLinks > 0 ? Math.round((uniqueAnchors / totalLinks) * 100) : 100;

    const getScoreColor = (score) => {
        if (score > 70) return 'text-emerald-500';
        if (score > 40) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score) => {
        if (score > 70) return __('Healthy', 'wp-apexlink');
        if (score > 40) return __('Moderate', 'wp-apexlink');
        return __('Over-Optimized', 'wp-apexlink');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Anchor Cloud', 'wp-apexlink')}</h2>
                    <p className="text-gray-500">{__('Visual distribution of internal link anchor texts.', 'wp-apexlink')}</p>
                </div>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'} space-y-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{__('Diversity Score', 'wp-apexlink')}</span>
                        <BarChart3 className={`w-5 h-5 ${getScoreColor(diversityScore)}`} />
                    </div>
                    <div className="flex items-end space-x-3">
                        <span className={`text-5xl font-black ${getScoreColor(diversityScore)}`}>{diversityScore}%</span>
                        <span className={`text-sm font-bold mb-2 ${getScoreColor(diversityScore)} opacity-80`}>{getScoreLabel(diversityScore)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${diversityScore > 70 ? 'bg-emerald-500' : diversityScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${diversityScore}%` }}
                        />
                    </div>
                </div>

                <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'} space-y-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{__('Total Links', 'wp-apexlink')}</span>
                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-5xl font-black text-indigo-500">{totalLinks}</div>
                    <p className="text-xs text-gray-500">{__('Internal links analyzed across your site.', 'wp-apexlink')}</p>
                </div>

                <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'} space-y-4`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{__('Unique Anchors', 'wp-apexlink')}</span>
                        <Cloud className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-5xl font-black text-purple-500">{uniqueAnchors}</div>
                    <p className="text-xs text-gray-500">{__('Different keywords and phrases used as text.', 'wp-apexlink')}</p>
                </div>
            </div>

            {/* The Cloud */}
            <div className={`p-10 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex flex-wrap items-center justify-center gap-6">
                    {anchors?.map((a, i) => {
                        const fontSize = Math.max(0.8, Math.min(2.5, (a.count / totalLinks) * 10)) + 'rem';
                        const opacity = Math.max(0.4, Math.min(1, (a.count / totalLinks) * 5));
                        const isOverOptimized = a.count > 5;

                        return (
                            <div 
                                key={i} 
                                className={`flex items-center space-x-2 transition-all hover:scale-110 cursor-default group`}
                                style={{ fontSize, opacity }}
                            >
                                <span className={`font-black ${isOverOptimized ? 'text-indigo-500' : darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    {a.anchor}
                                </span>
                                <span className="bg-gray-100 dark:bg-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full text-gray-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    {a.count}
                                </span>
                                {isOverOptimized && (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" title={__('Highly repetitive anchor', 'wp-apexlink')} />
                                )}
                            </div>
                        );
                    })}
                </div>
                {(!anchors || anchors.length === 0) && (
                    <div className="text-center text-gray-500 py-10">
                        {__('No anchor text data found yet. Start adding links to see your cloud!', 'wp-apexlink')}
                    </div>
                )}
            </div>

            <div className={`p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex items-start space-x-4`}>
                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <Info className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('SEO Tip: Natural Profiles', 'wp-apexlink')}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {__('Google looks for natural variations in anchor text. If 100% of your links to a page use the exact same keyword, it may trigger an over-optimization penalty. Aim for a mix of exact match, partial match, and descriptive phrases.', 'wp-apexlink')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnchorCloud;
