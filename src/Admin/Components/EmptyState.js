import { __ } from '@wordpress/i18n';
import { Coffee, Search, Sparkles, Inbox, Magnet, BarChart3 } from 'lucide-react';

const EmptyState = ({ 
    type = 'default', 
    title, 
    description, 
    action, 
    darkMode 
}) => {
    const icons = {
        suggestions: Inbox,
        search: Search,
        ai: Sparkles,
        magnet: Magnet,
        reports: BarChart3,
        default: Coffee
    };

    const Icon = icons[type] || icons.default;

    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="relative mb-8">
                {/* Decorative background circles */}
                <div className={`absolute inset-0 scale-150 blur-3xl opacity-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 ${darkMode ? 'opacity-10' : 'opacity-20'}`} />
                
                <div className={`relative w-24 h-24 rounded-3xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-500 shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-indigo-400' : 'bg-white border-gray-100 text-indigo-600'}`}>
                    <Icon className="w-12 h-12" />
                </div>
                
                {/* Small floating elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full animate-bounce delay-75 shadow-lg shadow-amber-400/50" />
                <div className="absolute -bottom-1 -left-4 w-4 h-4 bg-emerald-400 rounded-lg animate-pulse shadow-lg shadow-emerald-400/50 rotate-12" />
            </div>

            <h3 className={`text-2xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title || __('All Clear!', 'wp-apexlink')}
            </h3>
            
            <p className="max-w-md text-lg mb-8 leading-relaxed">
                {description || __('There is currently nothing to show here. Sit back and relax while ApexLink prepares your link graph.', 'wp-apexlink')}
            </p>

            {action && (
                <div className="animate-in fade-in zoom-in delay-300 fill-mode-both">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
