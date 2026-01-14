import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';
import {
    Link2, CheckCircle2, XCircle, Clock, Sparkles,
    TrendingUp, ArrowRight, Zap, Target, Brain
} from 'lucide-react';

/**
 * Activity Feed component showing recent linking activity
 */
const ActivityFeed = ({ darkMode }) => {
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const { data: activities = [], isLoading } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/activity/recent`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    const getActivityIcon = (type) => {
        switch (type) {
            case 'link_added': return { icon: Link2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
            case 'link_approved': return { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' };
            case 'link_rejected': return { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' };
            case 'suggestion': return { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' };
            default: return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10' };
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return __('Just now', 'wp-apexlink');
        if (diff < 3600) return `${Math.floor(diff / 60)}m ${__('ago', 'wp-apexlink')}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ${__('ago', 'wp-apexlink')}`;
        return date.toLocaleDateString();
    };

    // Generate sample activities if none exist
    const displayActivities = activities.length > 0 ? activities : [
        { id: 1, type: 'suggestion', message: __('5 new link suggestions generated', 'wp-apexlink'), timestamp: new Date().toISOString() },
        { id: 2, type: 'link_added', message: __('Link added to "Getting Started Guide"', 'wp-apexlink'), timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: 3, type: 'link_approved', message: __('Approved link in "Best Practices"', 'wp-apexlink'), timestamp: new Date(Date.now() - 900000).toISOString() },
    ];

    return (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                    {__('Recent Activity', 'wp-apexlink')}
                </h3>
                <span className="text-xs text-gray-400">{__('Live', 'wp-apexlink')}</span>
            </div>

            <div className="space-y-3">
                {displayActivities.slice(0, 5).map((activity, idx) => {
                    const { icon: Icon, color, bg } = getActivityIcon(activity.type);
                    return (
                        <div
                            key={activity.id || idx}
                            className={`flex items-start space-x-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className={`p-2 rounded-lg ${bg}`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {activity.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatTime(activity.timestamp)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * AI Insights card with smart recommendations
 */
const AIInsights = ({ stats, darkMode }) => {
    const insights = [];

    // Generate dynamic insights based on stats
    if (stats?.orphan_count > 5) {
        insights.push({
            type: 'warning',
            icon: Target,
            title: __('Orphan Alert', 'wp-apexlink'),
            message: `${stats.orphan_count} ${__('posts have no inbound links. Consider using the Magnet tool.', 'wp-apexlink')}`,
            action: '#/orphans',
            actionLabel: __('View Orphans', 'wp-apexlink')
        });
    }

    if (stats?.pending_suggestions > 0) {
        insights.push({
            type: 'opportunity',
            icon: Sparkles,
            title: __('Pending Opportunities', 'wp-apexlink'),
            message: `${stats.pending_suggestions} ${__('AI suggestions waiting for review.', 'wp-apexlink')}`,
            action: '#/suggestions',
            actionLabel: __('Review Now', 'wp-apexlink')
        });
    }

    if (stats?.health_score < 70) {
        insights.push({
            type: 'improvement',
            icon: TrendingUp,
            title: __('Health Improvement', 'wp-apexlink'),
            message: __('Your link health could be improved. Run a full index to update.', 'wp-apexlink'),
            action: null,
            actionLabel: null
        });
    }

    // Default insight if none generated
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            icon: Brain,
            title: __('All Optimized', 'wp-apexlink'),
            message: __('Your internal linking structure looks healthy. Keep it up!', 'wp-apexlink'),
            action: '#/visual-graph',
            actionLabel: __('View Graph', 'wp-apexlink')
        });
    }

    const getTypeStyles = (type) => {
        switch (type) {
            case 'warning': return 'border-amber-500/20 bg-amber-500/5';
            case 'opportunity': return 'border-purple-500/20 bg-purple-500/5';
            case 'improvement': return 'border-blue-500/20 bg-blue-500/5';
            case 'success': return 'border-emerald-500/20 bg-emerald-500/5';
            default: return 'border-gray-500/20 bg-gray-500/5';
        }
    };

    const getIconStyles = (type) => {
        switch (type) {
            case 'warning': return 'bg-amber-500 text-white';
            case 'opportunity': return 'bg-purple-500 text-white';
            case 'improvement': return 'bg-blue-500 text-white';
            case 'success': return 'bg-emerald-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mr-3">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {__('AI Insights', 'wp-apexlink')}
                    </h3>
                    <p className="text-xs text-gray-400">{__('Powered by ApexLink AI', 'wp-apexlink')}</p>
                </div>
            </div>

            <div className="space-y-3">
                {insights.map((insight, idx) => {
                    const Icon = insight.icon;
                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border ${getTypeStyles(insight.type)} transition-all hover:scale-[1.01]`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${getIconStyles(insight.type)} shadow-lg`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {insight.title}
                                    </h4>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {insight.message}
                                    </p>
                                    {insight.action && (
                                        <a
                                            href={insight.action}
                                            className="inline-flex items-center mt-2 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors"
                                        >
                                            {insight.actionLabel}
                                            <ArrowRight className="w-3 h-3 ml-1" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Quick Stats Banner with animated counters
 */
const QuickStatsBanner = ({ stats, darkMode }) => {
    const items = [
        {
            label: __('Links This Week', 'wp-apexlink'),
            value: stats?.links_this_week || 0,
            icon: Zap,
            color: 'text-emerald-500'
        },
        {
            label: __('Suggestions Accepted', 'wp-apexlink'),
            value: stats?.suggestions_accepted || 0,
            icon: CheckCircle2,
            color: 'text-blue-500'
        },
        {
            label: __('Authority Boost', 'wp-apexlink'),
            value: `+${stats?.authority_boost || 0}%`,
            icon: TrendingUp,
            color: 'text-purple-500'
        }
    ];

    return (
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-800/50 border-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'}`}>
            <div className="flex items-center justify-between">
                {items.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div key={idx} className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                                <Icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <div>
                                <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {item.value}
                                </p>
                                <p className="text-xs text-gray-400">{item.label}</p>
                            </div>
                            {idx < items.length - 1 && (
                                <div className={`h-10 w-px mx-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export { ActivityFeed, AIInsights, QuickStatsBanner };
