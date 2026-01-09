import { __ } from '@wordpress/i18n';
import { Zap, AlertTriangle, ArrowUpRight } from 'lucide-react';

const FuelGauge = ({ balance = 0, tier = 'pro', darkMode }) => {
    const maxCredits = tier === 'enterprise' ? 10000 : (tier === 'pro' ? 2500 : 500);
    const percentage = Math.min(100, (balance / maxCredits) * 100);
    
    // Determine color based on health
    const getStatusColor = () => {
        if (percentage > 50) return 'bg-emerald-500';
        if (percentage > 20) return 'bg-amber-500';
        return 'bg-rose-500 animate-pulse';
    };

    const isLow = percentage <= 20;

    return (
        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {__('Neural Fuel', 'wp-apexlink')}
                    </h3>
                    <div className="flex items-baseline mt-1">
                        <span className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{balance.toLocaleString()}</span>
                        <span className="text-gray-400 text-xs ml-2 font-bold uppercase tracking-tight">/ {maxCredits.toLocaleString()} {__('Credits', 'wp-apexlink')}</span>
                    </div>
                </div>
                <div className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50 text-neuro-brain'}`}>
                    <Zap className={`w-5 h-5 ${isLow ? 'text-rose-500' : 'text-neuro-brain'}`} />
                </div>
            </div>

            {/* The Gauge */}
            <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div 
                    className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(79,70,229,0.2)] ${getStatusColor()}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center text-xs font-bold uppercase tracking-wide">
                    {isLow ? (
                        <span className="text-rose-500 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {__('Low Fuel', 'wp-apexlink')}
                        </span>
                    ) : (
                        <span className="text-emerald-500">
                            {__('System Healthy', 'wp-apexlink')}
                        </span>
                    )}
                </div>
                
                <button 
                    className={`text-xs font-bold flex items-center transition-all ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                    {__('Refuel / Upgrade', 'wp-apexlink')}
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                </button>
            </div>

            {isLow && (
                <div className={`mt-4 p-4 rounded-xl border-2 border-dashed ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-800'} text-xs leading-relaxed`}>
                    <p className="font-bold mb-1">{__('Refueling required soon!', 'wp-apexlink')}</p>
                    <p>{__('Your AI suggestions will pause when fuel reaches 0.', 'wp-apexlink')}</p>
                </div>
            )}
        </div>
    );
};

export default FuelGauge;
