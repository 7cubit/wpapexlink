import { __ } from '@wordpress/i18n';
import { Layers, Zap, Search, AlertCircle, ArrowRight, Rocket, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickWinItem = ({ icon: Icon, title, description, to, variant = 'indigo', darkMode, onClick }) => {
    const colors = {
        indigo: darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600',
        amber: darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
        rose: darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600',
        emerald: darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
    };

    const Wrapper = to ? Link : 'button';
    const wrapperProps = to ? { to } : { onClick, type: 'button' };

    return (
        <Wrapper
            {...wrapperProps}
            className={`flex items-center p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group w-full text-left ${darkMode ? 'bg-gray-900 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200'}`}
        >
            <div className={`p-3 rounded-xl mr-4 ${colors[variant]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-grow min-w-0">
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
            </div>
            <ArrowRight className={`w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
        </Wrapper>
    );
};

const QuickWins = ({ stats, status, darkMode, onTriggerIndex }) => {
    const isScanning = status?.is_running;
    const scanProgress = status?.progress || 0;
    const orphanCount = stats?.orphan_count || 0;
    const brokenCount = stats?.broken_links || 0;
    const indexedPosts = stats?.indexed_posts || 0;
    const totalPosts = stats?.total_posts || 0;
    const hasNoContent = totalPosts === 0;
    const needsIndexing = totalPosts > 0 && indexedPosts === 0;

    return (
        <div className="flex flex-col h-full">
            <div className="space-y-3">
                {/* Active Scanning Progress */}
                {isScanning && (
                    <div className={`p-4 rounded-2xl border flex flex-col ${darkMode ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center">
                                <Search className="w-3 h-3 mr-1.5 animate-pulse" />
                                {__('Indexing in Progress...', 'wp-apexlink')}
                            </span>
                            <span className="text-xs font-black text-indigo-600">{scanProgress}%</span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-indigo-100'}`}>
                            <div
                                className="h-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* No Content State */}
                {!isScanning && hasNoContent && (
                    <div className={`p-6 rounded-2xl border text-center ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <CheckCircle className={`w-10 h-10 mx-auto mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <h4 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {__('Ready for Production', 'wp-apexlink')}
                        </h4>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {__('Deploy to your production site with content to see insights.', 'wp-apexlink')}
                        </p>
                    </div>
                )}

                {/* Needs Indexing State */}
                {!isScanning && needsIndexing && (
                    <QuickWinItem
                        icon={Rocket}
                        variant="indigo"
                        title={__('Start Initial Indexing', 'wp-apexlink')}
                        description={__(`Analyze ${totalPosts} posts to discover opportunities.`, 'wp-apexlink')}
                        onClick={onTriggerIndex}
                        darkMode={darkMode}
                    />
                )}

                {/* Orphan Posts */}
                {!isScanning && orphanCount > 0 && (
                    <QuickWinItem
                        icon={Layers}
                        variant="amber"
                        title={__('Neutralize Orphans', 'wp-apexlink')}
                        description={__(`${orphanCount} posts have zero inbound links.`, 'wp-apexlink')}
                        to="/orphans"
                        darkMode={darkMode}
                    />
                )}

                {/* Broken Links */}
                {!isScanning && brokenCount > 0 && (
                    <QuickWinItem
                        icon={AlertCircle}
                        variant="rose"
                        title={__('Fix Broken Connections', 'wp-apexlink')}
                        description={__(`${brokenCount} internal links are dead ends.`, 'wp-apexlink')}
                        to="/reports"
                        darkMode={darkMode}
                    />
                )}

                {/* All Good State */}
                {!isScanning && !hasNoContent && !needsIndexing && orphanCount === 0 && brokenCount === 0 && (
                    <QuickWinItem
                        icon={Zap}
                        variant="emerald"
                        title={__('Optimize Performance', 'wp-apexlink')}
                        description={__('Run Autopilot to boost silo authority.', 'wp-apexlink')}
                        to="/autopilot"
                        darkMode={darkMode}
                    />
                )}
            </div>
        </div>
    );
};

export default QuickWins;

