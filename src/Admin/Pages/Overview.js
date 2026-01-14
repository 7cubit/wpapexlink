import { __ } from '@wordpress/i18n';
import ProgressBar from '../Components/ProgressBar';
import ManualSearch from '../Components/ManualSearch';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Link2, AlertTriangle, FileText, Brain, Sparkles, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import FuelGauge from '../Components/FuelGauge';
import Skeleton from '../Components/Skeleton';
import HealthPulse from '../Components/HealthPulse';
import QuickWins from '../Components/QuickWins';
import { ActivityFeed, AIInsights, QuickStatsBanner } from '../Components/DashboardWidgets';

const StatCard = ({ title, value, icon: Icon, loading, darkMode, trend, trendUp }) => (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border flex items-center group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
        <div className={`p-3 rounded-xl mr-4 transition-all group-hover:scale-110 ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-neuro-brain'}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            {loading ? (
                <Skeleton className="h-8 w-20 mt-1" />
            ) : (
                <div className="flex items-center space-x-2">
                    <h3 className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                    {trend && (
                        <span className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <TrendingUp className={`w-3 h-3 mr-0.5 ${!trendUp && 'rotate-180'}`} />
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
    </div>
);

const Overview = ({ darkMode }) => {
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/dashboard/stats`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ['batch-status'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/batch/status`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        },
        refetchInterval: 5000
    });

    const handleAction = async (action) => {
        try {
            let url = `${baseUrl}/batch/${action}`;
            if (action === 'recalculate') {
                url = `${baseUrl}/graph/recalculate`;
            }

            const promise = fetch(url, {
                method: 'POST',
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });

            toast.promise(promise, {
                loading: action === 'recalculate' ? __('Recalculating authority...', 'wp-apexlink') : __('Starting job...', 'wp-apexlink'),
                success: action === 'recalculate' ? __('Recalculation queued!', 'wp-apexlink') : __('Job triggered successfully!', 'wp-apexlink'),
                error: (err) => `${__('Action failed', 'wp-apexlink')}: ${err.message}`
            });

            await promise;
            refetchStatus();
        } catch (error) {
            // Silent error handling for production
        }
    };

    const hasAuthorityData = stats?.top_authority && stats.top_authority.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden ${darkMode ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-500/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
                <div className="absolute top-0 right-0 opacity-10">
                    <Brain className="w-48 h-48 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {__('Welcome to ApexLink', 'wp-apexlink')} 👋
                        </h1>
                        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {__('Your AI-powered internal linking engine is ready.', 'wp-apexlink')}
                        </p>
                    </div>
                    <a
                        href="#/suggestions"
                        className="hidden md:flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {__('View Suggestions', 'wp-apexlink')}
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                    </a>
                </div>
            </div>

            {/* Quick Stats Banner */}
            {!statsLoading && <QuickStatsBanner stats={stats} darkMode={darkMode} />}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={__('Semantic Links', 'wp-apexlink')}
                    value={stats?.total_links || 0}
                    icon={Link2}
                    loading={statsLoading}
                    darkMode={darkMode}
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    title={__('Orphan Posts', 'wp-apexlink')}
                    value={stats?.orphan_count || 0}
                    icon={LayoutGrid}
                    loading={statsLoading}
                    darkMode={darkMode}
                    trend={stats?.orphan_count > 0 ? "-" + stats?.orphan_count : null}
                    trendUp={false}
                />
                <StatCard
                    title={__('Broken Links', 'wp-apexlink')}
                    value={stats?.broken_links || 0}
                    icon={AlertTriangle}
                    loading={statsLoading}
                    darkMode={darkMode}
                />
                <StatCard
                    title={__('Indexed Content', 'wp-apexlink')}
                    value={`${stats?.indexed_posts || 0}/${stats?.total_posts || 0}`}
                    icon={FileText}
                    loading={statsLoading}
                    darkMode={darkMode}
                />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Health Pulse */}
                <div className="lg:col-span-1">
                    {statsLoading ? (
                        <div className={`p-8 rounded-3xl border min-h-[400px] flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <Skeleton className="h-64 w-full rounded-2xl" />
                        </div>
                    ) : (
                        <HealthPulse
                            score={stats?.health_score || 0}
                            isRunning={status?.is_running}
                            isPaused={status?.is_paused}
                            onAction={handleAction}
                            darkMode={darkMode}
                        />
                    )}
                </div>

                {/* Fuel Gauge */}
                <div className="lg:col-span-1 space-y-8">
                    {statsLoading ? (
                        <div className={`p-8 rounded-2xl border min-h-[300px] flex items-center justify-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <Skeleton className="h-40 w-full rounded-2xl" />
                        </div>
                    ) : (
                        <FuelGauge
                            balance={stats?.system_credits}
                            tier={stats?.tier}
                            darkMode={darkMode}
                            className="h-full"
                        />
                    )}
                </div>

                {/* Top Authority or Quick Wins */}
                <div className={`lg:col-span-1 p-8 rounded-3xl shadow-sm border min-h-[400px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-xl font-bold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {hasAuthorityData ? <FileText className="w-5 h-5 mr-2 text-indigo-500" /> : <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />}
                            {hasAuthorityData ? __('Top Authority Pages', 'wp-apexlink') : __('Quick Wins', 'wp-apexlink')}
                        </h2>
                    </div>

                    <div className="flex-grow">
                        {hasAuthorityData ? (
                            <div className="space-y-4">
                                {stats.top_authority.map((page, i) => (
                                    <div key={page.ID} className="flex items-center justify-between group">
                                        <div className="flex items-center min-w-0 mr-4">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mr-3 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                {i + 1}
                                            </span>
                                            <span className={`truncate text-sm font-medium ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-neuro-brain'} transition-colors`}>
                                                {page.post_title}
                                            </span>
                                        </div>
                                        <div className={`flex items-center font-mono text-sm font-bold ${page.pagerank_score > 70 ? 'text-green-500' : page.pagerank_score > 40 ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {Math.round(page.pagerank_score)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <QuickWins stats={stats} status={status} darkMode={darkMode} onTriggerIndex={() => handleAction('index')} />
                        )}
                    </div>

                    {hasAuthorityData && (
                        <div className="mt-8 pt-6 border-t border-gray-100/10 flex items-center justify-between">
                            <span className="text-xs text-gray-400 italic">
                                {__('Recalculate to update authority rankings.', 'wp-apexlink')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary Features Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Insights */}
                <AIInsights stats={stats} darkMode={darkMode} />

                {/* Activity Feed */}
                <ActivityFeed darkMode={darkMode} />
            </div>

            {/* Manual Search */}
            <ManualSearch darkMode={darkMode} />
        </div>
    );
};

export default Overview;

