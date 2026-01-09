import { __ } from '@wordpress/i18n';

const ProgressBar = ({ progress }) => {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
            <div 
                className="bg-neuro-brain h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
            ></div>
            <p className="text-sm mt-2">{__('Indexing Progress:', 'wp-neurolink')} {progress}%</p>
        </div>
    );
};

export default ProgressBar;
