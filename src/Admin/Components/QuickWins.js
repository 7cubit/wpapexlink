import { __ } from '@wordpress/i18n';
import { Layers, Zap, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickWinItem = ({ icon: Icon, title, description, to, variant = 'indigo', darkMode }) => {
    const colors = {
        indigo: darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600',
        amber: darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
        rose: darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600',
        emerald: darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
    };

    return (
        <Link 
            to={to} 
            className={`flex items-center p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 group ${darkMode ? 'bg-gray-900 border-gray-700 hover:border-indigo-500/50' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200'}`}
        >
            <div className={`p-3 rounded-xl mr-4 ${colors[variant]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-grow min-w-0">
                <h4 className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
            </div>
            <ArrowRight className={`w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
        </Link>
    );
};

const QuickWins = ({ stats, status, darkMode }) => {
    const isScanning = status?.is_running;
    const scanProgress = status?.progress || 0;
    const orphanCount = stats?.orphan_count || 0;
    const brokenCount = stats?.broken_links || 0;

    return (
        <div className="flex flex-col h-full">
            <div className="space-y-3">
                {isScanning && (
                    <div className={`p-4 rounded-2xl border flex flex-col ${darkMode ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center">
                                <Search className="w-3 h-3 mr-1.5 animate-pulse" />
                                {__('Scanning Site...', 'wp-apexlink')}
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

                {orphanCount > 0 && (
                    <QuickWinItem 
                        icon={Layers}
                        variant="amber"
                        title={__('Neutralize Orphans', 'wp-apexlink')}
                        description={__(`${orphanCount} posts have zero inbound links.`, 'wp-apexlink')}
                        to="/orphans"
                        darkMode={darkMode}
                    />
                )}

                {brokenCount > 0 && (
                    <QuickWinItem 
                        icon={AlertCircle}
                        variant="rose"
                        title={__('Fix Broken Connections', 'wp-apexlink')}
                        description={__(`${brokenCount} internal links are dead ends.`, 'wp-apexlink')}
                        to="/reports"
                        darkMode={darkMode}
                    />
                )}

                {!isScanning && orphanCount === 0 && brokenCount === 0 && (
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
