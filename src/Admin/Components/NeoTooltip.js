import { __ } from '@wordpress/i18n';
import { Info } from 'lucide-react';
import { useState } from '@wordpress/element';

const NeoTooltip = ({ text, children, darkMode }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-flex items-center group">
            {children || <Info className={`w-4 h-4 cursor-help ${darkMode ? 'text-gray-500 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'}`} />}
            
            <div className={`
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 w-48 rounded-xl text-xs font-medium leading-relaxed shadow-2xl pointer-events-none transition-all duration-300 z-50
                ${darkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-900 text-white border-gray-800'}
                border opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
            `}>
                {text}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent ${darkMode ? 'border-t-gray-800' : 'border-t-gray-900'}`} />
            </div>
        </div>
    );
};

export default NeoTooltip;
