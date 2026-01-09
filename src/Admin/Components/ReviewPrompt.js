import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Star, X } from 'lucide-react';

const ReviewPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('apexlink_review_dismissed');
        const linkCount = parseInt(localStorage.getItem('apexlink_total_links') || '0', 10);

        if (!dismissed && linkCount > 50) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('apexlink_review_dismissed', 'true');
        setIsVisible(false);
    };

    const handleReview = () => {
        window.open('https://wordpress.org/support/plugin/wp-apexlink/reviews/#new-post', '_blank');
        handleDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border-l-4 border-yellow-400 max-w-sm z-50 animate-slide-in">
            <button 
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
                <X size={16} />
            </button>
            
            <div className="flex items-start gap-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                    <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {__('Enjoying ApexLink?', 'wp-apexlink')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {__('You have created over 50 links! Would you mind leaving us a 5-star review on WordPress.org? It helps us a lot!', 'wp-apexlink')}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleReview}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                        >
                            {__('Leave a Review', 'wp-apexlink')}
                        </button>
                        <button 
                            onClick={handleDismiss}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs py-1.5 px-2"
                        >
                            {__('Maybe Later', 'wp-apexlink')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewPrompt;
