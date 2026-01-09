import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { AlertTriangle, RefreshCw, LifeBuoy } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ApexLink Frontend Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const isDark = this.props.darkMode;
            return (
                <div className={`min-h-[400px] flex items-center justify-center p-8 rounded-3xl border animate-in zoom-in duration-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-xl'}`}>
                    <div className="max-w-md text-center">
                        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className={`text-2xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{__('Something Went Wrong', 'wp-apexlink')}</h2>
                        <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {__('ApexLink encountered an unexpected interface error. Your data is safe, but the view needs to be reset.', 'wp-apexlink')}
                        </p>
                        
                        <div className="flex flex-col space-y-3">
                            <button 
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center px-6 py-3 bg-neuro-brain text-white rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-neuro-brain/20"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {__('Reload Dashboard', 'wp-apexlink')}
                            </button>
                            
                            <a 
                                href="https://wpapexlink.com/support"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all border ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <LifeBuoy className="w-4 h-4 mr-2" />
                                {__('Connect with Support', 'wp-apexlink')}
                            </a>
                        </div>

                        {/* Temporarily show error details for debugging */}
                        <div className="mt-8 text-left p-4 bg-black/10 rounded-lg overflow-auto max-h-40">
                            <code className="text-xs text-rose-400 font-mono">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
