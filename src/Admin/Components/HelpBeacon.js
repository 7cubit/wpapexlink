import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { HelpCircle, MessageSquare, BookOpen, X, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const HelpBeacon = ({ darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback) return;

        setIsSubmitting(true);
        // Simulate API call to feedback endpoint
        setTimeout(() => {
            toast.success(__('Thank you for your feedback!', 'wp-apexlink'));
            setFeedback('');
            setIsSubmitting(false);
            setIsOpen(false);
        }, 1500);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className={`mb-4 w-80 rounded-3xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className={`font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('ApexLink Help', 'wp-apexlink')}</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-2">
                        <a 
                            href="https://docs.apexstream.co" 
                            target="_blank" 
                            className={`flex items-center p-3 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <BookOpen className="w-5 h-5 mr-3 text-indigo-500" />
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{__('Documentation', 'wp-apexlink')}</span>
                                <span className="text-[10px] text-gray-400">{__('Learn how to master internal linking', 'wp-apexlink')}</span>
                            </div>
                        </a>

                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                window.neuroStartTour('inbox');
                            }}
                            className={`flex items-center w-full p-3 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Zap className="w-5 h-5 mr-3 text-amber-500" />
                            <div className="flex flex-col text-left">
                                <span className="font-bold text-sm">{__('Guided Tour', 'wp-apexlink')}</span>
                                <span className="text-[10px] text-gray-400">{__('Interactive walkthrough of the Inbox', 'wp-apexlink')}</span>
                            </div>
                        </button>

                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <p className={`text-xs font-bold mb-3 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('Send Feedback', 'wp-apexlink')}</p>
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={__('Found a bug? Suggestion?', 'wp-apexlink')}
                                    className={`w-full p-3 rounded-xl text-sm border outline-none transition-all h-24 resize-none ${darkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-indigo-500'}`}
                                />
                                <button
                                    disabled={!feedback || isSubmitting}
                                    className="w-full flex items-center justify-center py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> {__('Submit', 'wp-apexlink')}</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : null}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 hover:scale-110 ${darkMode ? 'bg-indigo-600 text-white shadow-indigo-600/40' : 'bg-gray-900 text-white shadow-gray-900/40'}`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
};

export default HelpBeacon;
