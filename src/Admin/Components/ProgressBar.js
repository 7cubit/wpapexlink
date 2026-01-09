import { __ } from '@wordpress/i18n';

const ProgressBar = ({ progress, darkMode }) => {
    return (
        <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4`}>
            <div 
                className="bg-neuro-brain h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                style={{ width: `${progress}%` }}
            ></div>
            <p className={`text-sm mt-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {__('Indexing Progress:', 'wp-apexlink')} <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>{progress}%</span>
            </p>
        </div>
    );
};

export default ProgressBar;
