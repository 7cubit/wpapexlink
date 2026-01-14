import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, AlertCircle, Unlink, Globe, Download, FileText, Loader2, CheckCircle2, ChevronRight, BarChart3, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import EmptyState from '../Components/EmptyState';

const Reports = ({ darkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [velocityData, setVelocityData] = useState([]);
    const [depthData, setDepthData] = useState([]);
    const [brokenLinks, setBrokenLinks] = useState([]);
    const [domainStats, setDomainStats] = useState([]);
    const [rescueProgress, setRescueProgress] = useState({ percentage: 0, count: 0 });
    const [topAssets, setTopAssets] = useState([]);

    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    useEffect(() => {
        fetchAllReports();
    }, []);

    const fetchAllReports = async () => {
        setLoading(true);
        const headers = { 'X-WP-Nonce': window.wpApexLinkData?.nonce };
        try {
            const [velocity, depth, broken, domains, rescue, assets] = await Promise.all([
                fetch(`${baseUrl}/reports/link-velocity`, { headers }).then(r => r.json()).catch(() => []),
                fetch(`${baseUrl}/reports/click-depth`, { headers }).then(r => r.json()).catch(() => []),
                fetch(`${baseUrl}/reports/broken-links`, { headers }).then(r => r.json()).catch(() => []),
                fetch(`${baseUrl}/reports/domain-stats`, { headers }).then(r => r.json()).catch(() => []),
                fetch(`${baseUrl}/reports/rescue-progress`, { headers }).then(r => r.json()).catch(() => ({ percentage: 0, count: 0 })),
                fetch(`${baseUrl}/reports/top-assets`, { headers }).then(r => r.json()).catch(() => [])
            ]);

            setVelocityData(Array.isArray(velocity) ? velocity : []);
            setDepthData(Array.isArray(depth) ? depth : []);
            setBrokenLinks(Array.isArray(broken) ? broken : []);
            setDomainStats(Array.isArray(domains) ? domains : []);
            setRescueProgress(rescue || { percentage: 0, count: 0 });
            setTopAssets(Array.isArray(assets) ? assets : []);
        } catch {
            toast.error(__('Error loading reports.', 'wp-apexlink'));
        } finally {
            setLoading(false);
        }
    };

    const handleCSVExport = () => {
        window.location.href = `${baseUrl}/reports/export/csv?_wpnonce=${window.wpApexLinkData?.nonce}`;
    };

    const handlePDFExport = () => {
        const doc = jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text('ApexLink SEO Report', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);

        // Section: Overview
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Linking Overview', 20, 45);

        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Value']],
            body: [
                ['Total Internal Links', velocityData.reduce((sum, d) => sum + d.count, 0)],
                ['Broken Internal Links', brokenLinks.length],
                ['Orphan Pages', 'Check Dashboard'],
                ['Top External Domain', domainStats[0]?.domain || 'N/A']
            ],
            theme: 'striped',
            headStyles: { fillStyle: [79, 70, 229] }
        });

        // Section: Broken Links
        if (brokenLinks.length > 0) {
            doc.addPage();
            doc.text('Broken Internal Links Report', 20, 20);
            doc.autoTable({
                startY: 25,
                head: [['Source Post', 'Anchor Text', 'Target URL']],
                body: brokenLinks.map(l => [l.source_title, l.anchor, l.url]),
                styles: { fontSize: 8 }
            });
        }

        doc.save(`apexlink-report-${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success(__('PDF Report Generated!', 'wp-apexlink'));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">{__('Aggregating linking data...', 'wp-apexlink')}</p>
            </div>
        );
    }

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Reporting Suite', 'wp-apexlink')}</h1>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {__('Comprehensive analytics for your site\'s neural architecture and SEO health.', 'wp-apexlink')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCSVExport}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Download className="w-4 h-4" />
                        {__('Export CSV', 'wp-apexlink')}
                    </button>
                    <button
                        onClick={handlePDFExport}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <FileText className="w-4 h-4" />
                        {__('Agency PDF Report', 'wp-apexlink')}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit dark:bg-gray-800/50">
                {[
                    { id: 'overview', label: __('Overview', 'wp-apexlink'), icon: BarChart3 },
                    { id: 'velocity', label: __('Link Velocity', 'wp-apexlink'), icon: TrendingUp },
                    { id: 'health', label: __('Site Health', 'wp-apexlink'), icon: AlertCircle },
                    { id: 'domains', label: __('External Domains', 'wp-apexlink'), icon: Globe }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                            ? (darkMode ? 'bg-gray-700 text-white shadow-lg' : 'bg-white text-indigo-600 shadow-sm')
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Report Area */}
                <div className="lg:col-span-2 space-y-8">

                    {activeTab === 'velocity' && (
                        <div className={`p-8 rounded-[2rem] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center gap-2 mb-8">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                <h3 className={`font-black uppercase tracking-widest text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Linking Growth (30 Days)', 'wp-apexlink')}</h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={velocityData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div className={`rounded-[2rem] border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center">
                                <h3 className={`font-black uppercase tracking-widest text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Broken Internal Links (404 Prevention)', 'wp-apexlink')}</h3>
                                <div className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full uppercase">
                                    {brokenLinks.length} {__('Broken', 'wp-apexlink')}
                                </div>
                            </div>
                            <div className="divide-y dark:divide-gray-700">
                                {brokenLinks.length > 0 ? brokenLinks.map((link, idx) => (
                                    <div key={idx} className={`p-6 flex items-center justify-between transition-all ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{link.source_title}</span>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Unlink className="w-3 h-3 text-red-500" />
                                                <span>{__('Anchor:', 'wp-apexlink')} <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">{link.anchor}</code></span>
                                                <ChevronRight className="w-3 h-3" />
                                                <span className="text-red-400 truncate max-w-[200px]">{link.url}</span>
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
                                            {__('Edit Post', 'wp-apexlink')}
                                        </button>
                                    </div>
                                )) : (
                                    <EmptyState
                                        type="reports"
                                        title={__('Perfect Health!', 'wp-apexlink')}
                                        description={__('No broken internal links found. Your internal neural architecture is solid.', 'wp-apexlink')}
                                        darkMode={darkMode}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Click Depth Histogram */}
                            <div className={`p-8 rounded-[2rem] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <h3 className={`font-black uppercase tracking-widest text-xs mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('Click Depth Distribution', 'wp-apexlink')}</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={depthData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                                            <XAxis dataKey="depth" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                                {depthData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-4 italic">{__('Majority of your pages are reachable within 3 clicks.', 'wp-apexlink')}</p>
                            </div>

                            {/* Domain Share Pie */}
                            {domainStats.length > 0 ? (
                                <div className={`p-8 rounded-[2rem] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <h3 className={`font-black uppercase tracking-widest text-xs mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('Top Outgoing Domains', 'wp-apexlink')}</h3>
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={domainStats}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="domain"
                                                >
                                                    {domainStats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip cursor={{ fill: 'transparent' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {domainStats.slice(0, 3).map((d, i) => (
                                            <div key={i} className="flex justify-between items-center text-[10px]">
                                                <span className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{d.domain}</span>
                                                </span>
                                                <span className="font-bold">{d.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    type="reports"
                                    title={__('No Outgoing Links', 'wp-apexlink')}
                                    description={__('We haven\'t detected any external links yet. Start linking to authoritative sources to build trust.', 'wp-apexlink')}
                                    darkMode={darkMode}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'domains' && (
                        <div className={`p-8 rounded-[2rem] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <h3 className={`font-black uppercase tracking-widest text-sm mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Extended Domain Report', 'wp-apexlink')}</h3>
                            <div className="space-y-4">
                                {domainStats.map((d, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl dark:bg-gray-900 bg-gray-50 border border-transparent hover:border-indigo-500/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{d.domain}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500"
                                                    style={{ width: `${(d.count / (domainStats[0]?.count || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-black text-indigo-500">{d.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <div className={`p-8 rounded-[2rem] border overflow-hidden relative ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-600 border-indigo-600 shadow-xl'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-32 h-32 text-white" />
                        </div>
                        <h4 className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-4">{__('Orphan Rescue Progress', 'wp-apexlink')}</h4>
                        <div className="text-4xl font-black text-white mb-2">{rescueProgress.percentage}%</div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full mb-6">
                            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${rescueProgress.percentage}%` }} />
                        </div>
                        <p className="text-white/80 text-xs leading-relaxed">
                            {rescueProgress.count > 0
                                ? sprintf(__('You have successfully linked to %d previously orphaned posts. Keep it up!', 'wp-apexlink'), rescueProgress.count)
                                : __('Start linking orphan posts to improve your site structure.', 'wp-apexlink')
                            }
                        </p>
                    </div>

                    <div className={`p-8 rounded-[2rem] border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <h4 className={`text-[10px] uppercase font-black tracking-widest mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{__('Top Linked Assets', 'wp-apexlink')}</h4>
                        <div className="space-y-4">
                            {topAssets.length > 0 ? topAssets.slice(0, 3).map((asset, i) => (
                                <div key={asset.id || i} className="flex gap-4 items-start pb-4 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0">
                                    <div className="text-sm font-black text-indigo-500">#{String(i + 1).padStart(2, '0')}</div>
                                    <div>
                                        <div className={`text-xs font-bold leading-tight mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{asset.title}</div>
                                        <div className="text-[10px] text-gray-500">{asset.inbound_count} {__('Inbound Links', 'wp-apexlink')}</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-500 italic">{__('No linked assets yet. Start adding internal links to see your top performers.', 'wp-apexlink')}</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;
