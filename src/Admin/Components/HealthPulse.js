import { __ } from '@wordpress/i18n';
import { Activity, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { useState } from '@wordpress/element';

const HealthPulse = ({ score = 0, isRunning, isPaused, onAction, darkMode }) => {
    const [showControls, setShowControls] = useState(false);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getStatusColor = () => {
        if (score > 80) return 'text-emerald-500';
        if (score > 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    return (
        <div className={`relative p-8 rounded-3xl border shadow-sm transition-all duration-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-8">
                <h2 className={`text-xl font-black flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Activity className="w-5 h-5 mr-2 text-indigo-500" />
                    {__('Site Health Pulse', 'wp-apexlink')}
                </h2>
                <button 
                    onClick={() => setShowControls(!showControls)}
                    className={`p-2 rounded-xl transition-all ${showControls ? 'bg-indigo-500 text-white' : (darkMode ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')}`}
                    title={__('Engine Controls', 'wp-apexlink')}
                >
                    <Settings className={`w-5 h-5 ${showControls ? 'animate-spin-slow' : ''}`} />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            className={darkMode ? 'text-gray-700' : 'text-gray-100'}
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ease-out ${getStatusColor()}`}
                        />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {Math.round(score)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {__('Pulse Index', 'wp-apexlink')}
                        </span>
                    </div>
                </div>

                <div className="mt-8 text-center px-4">
                    <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {score > 80 
                            ? __('Your link architecture is optimized and resilient.', 'wp-apexlink')
                            : score > 50 
                                ? __('Good progress. Neutralize more orphans to hit peak pulse.', 'wp-apexlink')
                                : __('Critical gaps detected. Trigger indexing to restore health.', 'wp-apexlink')
                        }
                    </p>
                </div>
            </div>

            {/* Hidden Controls Menu */}
            {showControls && (
                <div className={`absolute inset-x-8 bottom-8 top-[88px] rounded-2xl flex flex-col space-y-3 p-6 animate-in slide-in-from-top-4 duration-300 ${darkMode ? 'bg-gray-900/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md border border-gray-100 shadow-2xl'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {__('Engine Controls', 'wp-apexlink')}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isRunning ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>
                            {isRunning ? __('RUNNING', 'wp-apexlink') : __('IDLE', 'wp-apexlink')}
                        </span>
                    </div>

                    <button 
                        onClick={() => { onAction('index'); setShowControls(false); }}
                        disabled={isRunning}
                        className="flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        {__('Trigger Mass Indexing', 'wp-apexlink')}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        {isPaused ? (
                            <button 
                                onClick={() => onAction('resume')}
                                className="flex items-center justify-center bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 border border-emerald-600/20 font-bold py-3 rounded-xl transition-all"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {__('Resume', 'wp-apexlink')}
                            </button>
                        ) : (
                            <button 
                                onClick={() => onAction('pause')}
                                className="flex items-center justify-center bg-amber-600/10 text-amber-600 hover:bg-amber-600/20 border border-amber-600/20 font-bold py-3 rounded-xl transition-all"
                            >
                                <Pause className="w-4 h-4 mr-2" />
                                {__('Pause', 'wp-apexlink')}
                            </button>
                        )}
                        <button 
                            onClick={() => onAction('recalculate')}
                            className={`flex items-center justify-center font-bold py-3 rounded-xl transition-all border ${darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {__('Rebuild', 'wp-apexlink')}
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => setShowControls(false)}
                        className="mt-auto text-xs font-bold text-gray-400 hover:text-indigo-500 transition-colors py-2"
                    >
                        {__('Close Controls', 'wp-apexlink')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HealthPulse;
