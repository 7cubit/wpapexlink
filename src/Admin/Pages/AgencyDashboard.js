import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';
import { Globe, Zap, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// Mock trend generator
const generateTrend = () => Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 100) }));

const AgencyDashboard = ({ darkMode }) => {
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';
    const licenseKey = 'APEXLINK-DEBUG-2024'; // In production, this would be fetched from settings

    const { data: aggregation, isLoading } = useQuery({
        queryKey: ['agency_aggregation'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/agency/billing/aggregation?agency_license=${licenseKey}`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">{__('Loading agency data...', 'wp-apexlink')}</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Agency Master View', 'wp-apexlink')}</h2>
                    <p className="text-gray-500 text-sm">{__('Manage and monitor all client sites from a single dashboard.', 'wp-apexlink')}</p>
                </div>
                <div className="flex space-x-3">
                    <div className={`px-4 py-2 rounded-xl flex items-center shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-100 text-gray-600'}`}>
                        <Globe className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="text-sm font-bold">{aggregation?.total_sites || 0} {__('Sites Active', 'wp-apexlink')}</span>
                    </div>
                </div>
            </div>

            {/* Credit Pool Card */}
            <div className={`p-6 rounded-3xl border overflow-hidden relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap className="w-32 h-32 text-indigo-500" />
                </div>
                <div className="relative z-10">
                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('Master Credit Pool', 'wp-apexlink')}</h3>
                    <div className="flex items-baseline space-x-2">
                        <span className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{aggregation?.credit_pool_remaining || 0}</span>
                        <span className="text-gray-500 font-bold">{__('Credits Available', 'wp-apexlink')}</span>
                    </div>
                    <div className="mt-6 flex space-x-4">
                        <div className="h-2 flex-grow bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                                style={{ width: '65%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sites Table */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl shadow-sm border overflow-x-auto overflow-y-hidden`}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`${darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{__('Client Site', 'wp-apexlink')}</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{__('Usage (30d)', 'wp-apexlink')}</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-center">{__('Traffic Trend', 'wp-apexlink')}</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{__('Credit Limit', 'wp-apexlink')}</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">{__('Status', 'wp-apexlink')}</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 text-right">{__('Actions', 'wp-apexlink')}</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        {aggregation?.sub_accounts?.map((site, idx) => (
                            <tr key={idx} className={`group transition-colors ${darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100 text-indigo-500'}`}>
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{site.url}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm">{site.usage_30d} {__('reqs', 'wp-apexlink')}</td>
                                <td className="px-6 py-4 text-center min-w-[100px]">
                                    <div className="h-6 w-full max-w-[80px] mx-auto opacity-50">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={generateTrend()}>
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="value" 
                                                    stroke="#6366f1" 
                                                    strokeWidth={2} 
                                                    dot={false} 
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold">{site.limit}</span>
                                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${site.usage_30d > site.limit * 0.9 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(100, (site.usage_30d / site.limit) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        {__('Active', 'wp-apexlink')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end space-x-2">
                                    <button 
                                        onClick={async () => {
                                            const res = await fetch(`${baseUrl}/agency/tunnel-login`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                                                },
                                                body: JSON.stringify({ site_url: site.url })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                window.open(data.redirect_url, '_blank');
                                                toast.success(__('Tunnel login established!', 'wp-apexlink'));
                                            }
                                        }}
                                        className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'hover:bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:bg-indigo-50 text-indigo-600'}`}
                                        title={__('Tunnel Login', 'wp-apexlink')}
                                    >
                                        <Zap className="w-4 h-4" />
                                    </button>
                                    <button className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                        <ShieldCheck className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Info Box */}
            <div className={`p-4 rounded-2xl flex items-center border ${darkMode ? 'bg-amber-900/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm">
                    {__('Sub-account credit limits are managed in your Agency Portal. Sites exceeding their limit will fall back to local indexing without AI reranking.', 'wp-apexlink')}
                </p>
                <button className="ml-auto text-sm font-bold flex items-center hover:underline">
                    {__('Open Agency Portal', 'wp-apexlink')}
                    <ExternalLink className="w-3 h-3 ml-1" />
                </button>
            </div>
        </div>
    );
};

export default AgencyDashboard;
