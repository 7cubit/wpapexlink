import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, ExternalLink, Globe, Info, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// Mock trend generator
const generateTrend = () => Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 100) }));

const RevenueReport = ({ darkMode }) => {
    const queryClient = useQueryClient();
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';
    
    // Check for OAuth code in URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            exchangeCodeMutation.mutate(code);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search.split('&code=')[0]);
        }
    }, []);

    // Fetch Settings (to check connection status)
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/settings`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    // Fetch Opportunities
    const { data: opportunities, isLoading, isError } = useQuery({
        queryKey: ['revenue-report'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/gsc/revenue-report`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
            return res.json();
        },
        enabled: !!settings?.apexlink_gsc_connected
    });

    // Exchange Code Mutation
    const exchangeCodeMutation = useMutation({
        mutationFn: async (code) => {
            const res = await fetch(`${baseUrl}/gsc/exchange-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ code })
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(__('Google Search Console connected!', 'wp-apexlink'));
                queryClient.invalidateQueries(['settings']);
                queryClient.invalidateQueries(['revenue-report']);
            } else {
                toast.error(__('Failed to connect GSC.', 'wp-apexlink'));
            }
        }
    });

    // Connect Handler
    const handleConnect = async () => {
        try {
            const res = await fetch(`${baseUrl}/gsc/auth-url`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(__('Client ID missing in settings.', 'wp-apexlink'));
            }
        } catch (e) {
            toast.error(__('Failed to get auth URL.', 'wp-apexlink'));
        }
    };

    if (!settings?.apexlink_gsc_connected) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 bg-indigo-500/10 w-fit mx-auto rounded-full">
                    <TrendingUp className="w-12 h-12 text-indigo-500" />
                </div>
                <div className="space-y-3">
                    <h2 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Revenue Flow Intelligence', 'wp-apexlink')}</h2>
                    <p className={`text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {__('Connect Google Search Console to identify keywords in "Striking Distance" (Page 2). Link to these pages to boost them to the first page and unlock organic revenue.', 'wp-apexlink')}
                    </p>
                </div>
                
                <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-xl'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div className="space-y-2">
                            <div className="text-2xl font-black text-indigo-500">11-20</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{__('Avg Position', 'wp-apexlink')}</div>
                            <p className="text-xs text-gray-400">{__('Pages sitting on page 2 of Google.', 'wp-apexlink')}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-2xl font-black text-emerald-500">50%</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{__('Score Boost', 'wp-apexlink')}</div>
                            <p className="text-xs text-gray-400">{__('Internal links to these pages are prioritized.', 'wp-apexlink')}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-2xl font-black text-amber-500">24h</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{__('Data Sync', 'wp-apexlink')}</div>
                            <p className="text-xs text-gray-400">{__('Smart caching via WordPress transients.', 'wp-apexlink')}</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleConnect}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center mx-auto"
                    >
                        <TrendingUp className="w-5 h-5 mr-3" />
                        {__('Connect Google Search Console', 'wp-apexlink')}
                    </button>
                    
                    <p className="mt-6 text-xs text-gray-500">
                        {__('Ensure your Client ID and Secret are configured in Settings > Integrations first.', 'wp-apexlink')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Revenue Report', 'wp-apexlink')}</h2>
                    <p className="text-gray-500">{__('Striking Distance SEO Opportunities (Page 2 Rankings)', 'wp-apexlink')}</p>
                </div>
                <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {__('GSC Connected & Syncing', 'wp-apexlink')}
                </div>
            </div>

            {isLoading ? (
                <div className="p-20 text-center text-gray-400">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                    <p className="font-bold">{__('Analyzing performance data...', 'wp-apexlink')}</p>
                </div>
            ) : isError ? (
                <div className={`p-12 rounded-3xl border border-red-500/20 bg-red-500/5 text-center space-y-4`}>
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-red-500">{__('Sync Error', 'wp-apexlink')}</h3>
                    <p className="text-gray-400">{__('Failed to fetch data from GSC. Your token may have expired or the API is unreachable.', 'wp-apexlink')}</p>
                    <button onClick={handleConnect} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold">{__('Reconnect', 'wp-apexlink')}</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <div className={`rounded-3xl border overflow-x-auto overflow-y-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <table className="w-full text-left">
                            <thead>
                                <tr className={`border-bottom ${darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'} border-b`}>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{__('Target Keyword', 'wp-apexlink')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{__('Page URL', 'wp-apexlink')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-center">{__('Position', 'wp-apexlink')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-center">{__('Trending', 'wp-apexlink')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-center">{__('Impressions', 'wp-apexlink')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">{__('Action', 'wp-apexlink')}</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {opportunities?.map((op, i) => (
                                    <tr key={i} className="hover:bg-indigo-500/5 transition-colors">
                                        <td className="px-6 py-4 transition-all">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{op.query}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="text-xs text-gray-500 truncate">{op.page}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black ${darkMode ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {op.position}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center min-w-[100px]">
                                            <div className="h-8 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={generateTrend()}>
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="value" 
                                                            stroke={op.position < 15 ? '#10b981' : '#6366f1'} 
                                                            strokeWidth={2} 
                                                            dot={false} 
                                                            isAnimationActive={false}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono text-xs text-gray-500">{op.impressions.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a 
                                                href={op.page} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`p-2 inline-block rounded-xl hover:bg-indigo-500/10 transition-all ${darkMode ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-600'}`}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {opportunities?.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                {__('No keywords found in position 11-20. Keep checking!', 'wp-apexlink')}
                            </div>
                        )}
                    </div>

                    <div className={`p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 flex items-start space-x-4`}>
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Info className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('How to use this report', 'wp-apexlink')}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {__('The keywords listed above are ranking on the second page of Google. By creating internal links with these keywords as anchor text, you signal to Google that these pages are highly relevant. ApexLink has already boosted the internal score for these keywords in your Suggestions Inbox.', 'wp-apexlink')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueReport;
