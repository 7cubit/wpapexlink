import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TourProvider = ({ darkMode }) => {
    
    const startTour = (tourType) => {
        const d = driver({
            showProgress: true,
            animate: true,
            padding: 10,
            allowClose: true,
            overlayColor: darkMode ? '#000' : '#333',
            overlayOpacity: 0.75,
            stagePadding: 5,
            popoverClass: darkMode ? 'driverjs-dark' : '',
            nextBtnText: __('Next', 'wp-apexlink'),
            prevBtnText: __('Previous', 'wp-apexlink'),
            doneBtnText: __('Done', 'wp-apexlink'),
        });

        const steps = getSteps(tourType);
        if (steps.length > 0) {
            d.setSteps(steps);
            d.drive();
        }
    };

    const getSteps = (type) => {
        switch(type) {
            case 'inbox':
                return [
                    { 
                        element: '#suggestions-inbox-header', 
                        popover: { title: __('Suggestions Inbox', 'wp-apexlink'), description: __('This is where AI-generated link opportunities appear. Review, edit, and approve them here.', 'wp-apexlink') } 
                    },
                    { 
                        element: '.suggestion-card:first-child', 
                        popover: { title: __('Suggestion Card', 'wp-apexlink'), description: __('Compare the source sentence with the target post. You can edit the anchor text before accepting.', 'wp-apexlink') } 
                    },
                ];
            default:
                return [];
        }
    };

    // Expose to window for global access from other components
    useEffect(() => {
        window.neuroStartTour = startTour;
        return () => delete window.neuroStartTour;
    }, [darkMode]);

    return null;
};

export default TourProvider;
