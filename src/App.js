import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import ProgressBar from './Admin/Components/ProgressBar';

const App = () => {
    const [progress, setProgress] = useState(0);

    // Mock progress for now
    useEffect(() => {
        if (progress < 100) {
            const timer = setTimeout(() => setProgress(progress + 10), 1000);
            return () => clearTimeout(timer);
        }
    }, [progress]);

    return (
        <div className="wp-neurolink-admin p-8 bg-white shadow-sm rounded-lg max-w-4xl mx-auto mt-10">
            <h1 className="text-3xl font-bold text-neuro-brain mb-4">
                {__('WP NeuroLink Dashboard', 'wp-neurolink')}
            </h1>
            <p className="text-gray-600 mb-6">
                {__('Welcome to the Neural Architecture Engine.', 'wp-neurolink')}
            </p>
            
            <div className="bg-blue-50 border-l-4 border-neuro-brain p-4">
                <h2 className="text-xl font-semibold text-neuro-brain">
                    {__('System Status', 'wp-neurolink')}
                </h2>
                <ProgressBar progress={progress} />
            </div>
        </div>
    );
};

export default App;
