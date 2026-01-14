import { Toaster } from 'react-hot-toast';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import { LayoutGrid, Link2Off, Inbox, Settings as SettingsIcon, Brain, Loader2, Moon, Sun, Share2, Zap, TrendingUp, Cloud, Magnet, BarChart3, Puzzle, ShieldCheck } from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from '@wordpress/element';
import { useQuery } from '@tanstack/react-query';
import ActivateLicense from './Pages/ActivateLicense';

// Lazy Load Pages
const Overview = lazy(() => import('./Pages/Overview'));
const Orphans = lazy(() => import('./Pages/Orphans'));
const Suggestions = lazy(() => import('./Pages/Suggestions'));
const Settings = lazy(() => import('./Pages/Settings'));
const VisualGraph = lazy(() => import('./Pages/VisualGraph'));
const Autopilot = lazy(() => import('./Pages/Autopilot'));
const RevenueReport = lazy(() => import('./Pages/RevenueReport'));
const AnchorCloud = lazy(() => import('./Pages/AnchorCloud'));
const MagnetTool = lazy(() => import('./Pages/MagnetTool'));
const Reports = lazy(() => import('./Pages/Reports'));
const Integrations = lazy(() => import('./Pages/Integrations'));
const AgencyDashboard = lazy(() => import('./Pages/AgencyDashboard'));

import ErrorBoundary from './Components/ErrorBoundary';
import SetupWizard from './Components/SetupWizard';
import HelpBeacon from './Components/HelpBeacon';
import ReviewPrompt from './Components/ReviewPrompt';
import TourProvider from './Components/TourProvider';

const AppRouter = () => {
    const [darkMode, setDarkMode] = useState(localStorage.getItem('apexlink_dark_mode') === 'true');
    const [showSetup, setShowSetup] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const { data: settings, isLoading: settingsLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/settings`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    const { data: license, isLoading: licenseLoading, refetch: refetchLicense } = useQuery({
        queryKey: ['license_status'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/license/status`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    useEffect(() => {
        // TEMPORARY: Disabled for debugging - uncomment to re-enable Setup Wizard
        // if (settings && settings.apexlink_setup_complete !== 'yes') {
        //     setShowSetup(true);
        // }
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('apexlink_dark_mode', darkMode);
    }, [darkMode]);

    // Handle GSC callback globally
    useEffect(() => {
        const handleGSCCallback = async () => {
            const hash = window.location.hash;
            if (hash.includes('gsc_callback=1')) {
                const params = new URLSearchParams(hash.split('?')[1]);
                const tokenData = params.get('token_data');

                if (tokenData) {
                    const loadingToast = toast.loading(__('Completing Google connection...', 'wp-apexlink'));
                    try {
                        const res = await fetch(`${baseUrl}/gsc/callback`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-WP-Nonce': window.wpApexLinkData?.nonce
                            },
                            body: JSON.stringify({ token_data: tokenData })
                        });
                        const data = await res.json();
                        if (data.success) {
                            toast.success(__('Successfully connected to Google Search Console!', 'wp-apexlink'), { id: loadingToast });
                            // Force refresh settings to update UI across all components
                            window.location.hash = '#/settings';
                            setTimeout(() => window.location.reload(), 500);
                        } else {
                            toast.error(data.message || __('Failed to connect GSC.', 'wp-apexlink'), { id: loadingToast });
                        }
                    } catch (e) {
                        toast.error(__('An error occurred during GSC callback.', 'wp-apexlink'), { id: loadingToast });
                    }
                }
            }
        };

        handleGSCCallback();
    }, [baseUrl]);

    if (licenseLoading || settingsLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-neuro-brain" />
            </div>
        );
    }

    const isActive = license?.active;

    const navGroups = {
        primary: [
            { name: __('Overview', 'wp-apexlink'), path: '/', icon: LayoutGrid },
        ],
        tools: {
            label: __('Tools', 'wp-apexlink'),
            icon: Zap,
            items: [
                { name: __('Suggestions', 'wp-apexlink'), path: '/suggestions', icon: Inbox },
                { name: __('Autopilot', 'wp-apexlink'), path: '/autopilot', icon: Zap },
                { name: __('Magnet', 'wp-apexlink'), path: '/magnet', icon: Magnet },
                { name: __('Orphans', 'wp-apexlink'), path: '/orphans', icon: Link2Off },
                { name: __('Integrations', 'wp-apexlink'), path: '/integrations', icon: Puzzle },
            ]
        },
        analytics: {
            label: __('Analytics', 'wp-apexlink'),
            icon: BarChart3,
            items: [
                { name: __('Reports', 'wp-apexlink'), path: '/reports', icon: BarChart3 },
                { name: __('Revenue', 'wp-apexlink'), path: '/revenue-report', icon: TrendingUp },
                { name: __('Visual Graph', 'wp-apexlink'), path: '/visual-graph', icon: Share2 },
                { name: __('Anchor Cloud', 'wp-apexlink'), path: '/anchor-cloud', icon: Cloud },
                ...(license?.tier === 'agency' || license?.tier === 'enterprise'
                    ? [{ name: __('Agency', 'wp-apexlink'), path: '/agency', icon: ShieldCheck }]
                    : []
                ),
            ]
        },
        settings: { name: __('Settings', 'wp-apexlink'), path: '/settings', icon: SettingsIcon }
    };

    const isWhiteLabel = settings?.apexlink_white_label;
    const isReadOnly = settings?.apexlink_read_only;

    const renderNavDropdown = (group, groupKey) => {
        const GroupIcon = group.icon;
        const isOpen = openDropdown === groupKey;
        let closeTimeout = null;

        const handleMouseEnter = () => {
            if (closeTimeout) {
                clearTimeout(closeTimeout);
                closeTimeout = null;
            }
            setOpenDropdown(groupKey);
        };

        const handleMouseLeave = () => {
            closeTimeout = setTimeout(() => {
                setOpenDropdown(null);
            }, 150); // Small delay to allow click events to process
        };

        return (
            <div
                key={groupKey}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={() => setOpenDropdown(isOpen ? null : groupKey)}
                    className={`flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isOpen
                            ? 'text-neuro-brain bg-neuro-brain/10'
                            : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <GroupIcon className="w-4 h-4 mr-2" />
                    {group.label}
                    <svg className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className={`absolute top-full left-0 mt-1 w-48 rounded-xl shadow-xl border z-50 animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                        <div className="py-2">
                            {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => {
                                            if (closeTimeout) clearTimeout(closeTimeout);
                                            setOpenDropdown(null);
                                        }}
                                        className={({ isActive }) =>
                                            `flex items-center px-4 py-2 text-sm transition-colors ${isActive
                                                ? 'text-neuro-brain bg-neuro-brain/10 font-bold'
                                                : darkMode
                                                    ? 'text-gray-300 hover:bg-gray-700'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`
                                        }
                                    >
                                        <ItemIcon className="w-4 h-4 mr-3" />
                                        {item.name}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    return (
        <HashRouter>
            <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                {showSetup && <SetupWizard darkMode={darkMode} onComplete={() => setShowSetup(false)} />}
                {/* Header */}
                <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-30`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            <div className="flex items-center">
                                {!isWhiteLabel && <Brain className="h-8 w-8 text-neuro-brain mr-3" />}
                                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isWhiteLabel ? __('Dashboard', 'wp-apexlink') : __('WP ApexLink', 'wp-apexlink')}</h1>
                            </div>
                            {isActive && (
                                <nav className="flex items-center space-x-2">
                                    {navGroups.primary.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                className={({ isActive }) =>
                                                    `flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isActive
                                                        ? 'text-neuro-brain bg-neuro-brain/10'
                                                        : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                                    }`
                                                }
                                            >
                                                <ItemIcon className="w-4 h-4 mr-2" />
                                                {item.name}
                                            </NavLink>
                                        );
                                    })}

                                    {renderNavDropdown(navGroups.tools, 'tools')}
                                    {renderNavDropdown(navGroups.analytics, 'analytics')}

                                    {(() => {
                                        const item = navGroups.settings;
                                        const ItemIcon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.path}
                                                to={item.path}
                                                className={({ isActive }) =>
                                                    `flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isActive
                                                        ? 'text-neuro-brain bg-neuro-brain/10'
                                                        : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                                                    }`
                                                }
                                            >
                                                <ItemIcon className="w-4 h-4 mr-2" />
                                                {item.name}
                                            </NavLink>
                                        );
                                    })()}
                                </nav>
                            )}

                            {/* Header Actions */}
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    title={darkMode ? __('Switch to Light Mode', 'wp-apexlink') : __('Switch to Dark Mode', 'wp-apexlink')}
                                >
                                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>




                {/* Content */}
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {!isActive ? (
                        <ActivateLicense onActivate={() => refetchLicense()} darkMode={darkMode} />
                    ) : (
                        <ErrorBoundary darkMode={darkMode}>
                            <Suspense fallback={
                                <div className="flex items-center justify-center h-96">
                                    <Loader2 className="w-8 h-8 animate-spin text-neuro-brain" />
                                </div>
                            }>
                                <Routes>
                                    <Route path="/" element={<Overview darkMode={darkMode} />} />
                                    <Route path="/orphans" element={<Orphans darkMode={darkMode} />} />
                                    <Route path="/suggestions" element={<Suggestions darkMode={darkMode} />} />
                                    <Route path="/autopilot" element={<Autopilot darkMode={darkMode} />} />
                                    <Route path="/revenue-report" element={<RevenueReport darkMode={darkMode} />} />
                                    <Route path="/anchor-cloud" element={<AnchorCloud darkMode={darkMode} />} />
                                    <Route path="/magnet" element={<MagnetTool darkMode={darkMode} />} />
                                    <Route path="/integrations" element={<Integrations darkMode={darkMode} />} />
                                    <Route path="/reports" element={<Reports darkMode={darkMode} />} />
                                    <Route path="/visual-graph" element={<VisualGraph darkMode={darkMode} />} />
                                    <Route path="/agency" element={<AgencyDashboard darkMode={darkMode} />} />
                                    <Route path="/settings" element={<Settings darkMode={darkMode} setDarkMode={setDarkMode} readOnly={isReadOnly} />} />
                                </Routes>
                            </Suspense>
                            <ReviewPrompt />
                        </ErrorBoundary>
                    )}
                </main>

                <Toaster position="bottom-right" />
                <HelpBeacon darkMode={darkMode} />
                <TourProvider darkMode={darkMode} />
            </div>
        </HashRouter>
    );
};

export default AppRouter;
