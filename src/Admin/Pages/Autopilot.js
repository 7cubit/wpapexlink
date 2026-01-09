import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Trash2, Play, Settings as SettingsIcon, CheckCircle, AlertCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { sprintf } from '@wordpress/i18n';

const Autopilot = ({ darkMode }) => {
    const queryClient = useQueryClient();
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [newRule, setNewRule] = useState({ keyword: '', target_id: '', match_type: 'exact' });
    const [simResults, setSimResults] = useState(null);

    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    // Fetch Rules
    const { data: rules, isLoading: rulesLoading } = useQuery({
        queryKey: ['autopilot-rules'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/autopilot/rules`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    // Create Rule Mutation
    const createRuleMutation = useMutation({
        mutationFn: async (rule) => {
            const res = await fetch(`${baseUrl}/autopilot/rules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify(rule)
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['autopilot-rules']);
            setIsRuleModalOpen(false);
            setNewRule({ keyword: '', target_id: '', match_type: 'exact' });
            toast.success(__('Rule created successfully!', 'wp-apexlink'));
        }
    });

    // Delete Rule Mutation
    const deleteRuleMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`${baseUrl}/autopilot/rules/${id}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['autopilot-rules']);
            toast.success(__('Rule removed.', 'wp-apexlink'));
        }
    });

    // run Autopilot Mutation
    const runAutopilotMutation = useMutation({
        mutationFn: async (isSimulation = false) => {
            const res = await fetch(`${baseUrl}/autopilot/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({
                    simulation: isSimulation
                })
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.is_simulation) {
                setSimResults(data.results || []);
                toast.success(sprintf(__('%d simulated links found!', 'wp-apexlink'), data.found_count));
            } else {
                toast.success(__('Autopilot job dispatched to background!', 'wp-apexlink'), {
                    icon: '🚀'
                });
            }
        }
    });

    const commitMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${baseUrl}/autopilot/commit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({ links: simResults })
            });
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setSimResults(null);
            queryClient.invalidateQueries(['suggestions']);
        }
    });

    // Revert Mutation
    const revertMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${baseUrl}/autopilot/revert`, {
                method: 'POST',
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(__('Batch reverted!', 'wp-apexlink') + ` (${data.reverted_count} links)`, {
                    icon: '⏪'
                });
                queryClient.invalidateQueries(['suggestions']);
            } else {
                toast.error(data.message || __('Failed to revert.', 'wp-apexlink'));
            }
        }
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Hero */}
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Autopilot', 'wp-apexlink')}</h2>
                        </div>
                        <p className={`text-lg ${darkMode ? 'text-indigo-200/70' : 'text-indigo-600'}`}>
                            {__('Automate your internal linking strategy with keyword-based rules.', 'wp-apexlink')}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        {simResults ? (
                             <button 
                                onClick={() => setSimResults(null)}
                                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}
                            >
                                {__('Cancel Simulation', 'wp-apexlink')}
                            </button>
                        ) : (
                            <button 
                                onClick={() => runAutopilotMutation.mutate(true)}
                                disabled={runAutopilotMutation.isPending}
                                className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                            >
                                {runAutopilotMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                                {__('Run Simulation', 'wp-apexlink')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {simResults && (
                <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
                    <div className={`p-8 rounded-3xl border-2 border-dashed relative overflow-hidden ${darkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-indigo-900'}`}>{__('Simulation Report', 'wp-apexlink')}</h3>
                                    <p className="text-sm text-indigo-500 font-bold">{sprintf(__('%d potential links discovered.', 'wp-apexlink'), simResults.length)}</p>
                                </div>
                                <button 
                                    onClick={() => commitMutation.mutate()}
                                    disabled={commitMutation.isPending}
                                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center"
                                >
                                    {commitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {__('Commit to Inbox', 'wp-apexlink')}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                {simResults.map((link, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-300' : 'bg-white border-indigo-50 text-gray-700'}`}>
                                        <div className="flex-1 truncate pr-4 text-xs">
                                            <span className="font-bold italic">"{link.anchor}"</span>
                                            <span className="mx-2 text-gray-500">→</span>
                                            <span className="font-bold opacity-80">{link.target_title}</span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {__('Ready', 'wp-apexlink')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rules List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className={`font-bold text-xl px-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{__('Active Rules', 'wp-apexlink')}</h3>
                        <button 
                            onClick={() => setIsRuleModalOpen(true)}
                            className="flex items-center text-sm font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 px-4 py-2 rounded-xl transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {__('New Rule', 'wp-apexlink')}
                        </button>
                    </div>

                    <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        {rulesLoading ? (
                            <div className="p-12 text-center text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                {__('Loading rules...', 'wp-apexlink')}
                            </div>
                        ) : rules?.length === 0 ? (
                            <div className="p-12 text-center space-y-4">
                                <div className="p-4 bg-gray-500/10 w-fit mx-auto rounded-full">
                                    <SettingsIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{__('No active rules found', 'wp-apexlink')}</p>
                                    <p className="text-sm text-gray-500">{__('Create your first rule to start automating internal links.', 'wp-apexlink')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {rules?.map((rule) => (
                                    <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold">
                                                {rule.keyword.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{rule.keyword}</p>
                                                <p className="text-xs text-gray-500">
                                                    {__('Links to Post ID:', 'wp-apexlink')} <span className="font-mono">{rule.target_id}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${rule.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                {rule.status}
                                            </span>
                                            <button 
                                                onClick={() => deleteRuleMutation.mutate(rule.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Automation Constraints */}
                <div className="space-y-6">
                    <h3 className={`font-bold text-xl px-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{__('Run Constraints', 'wp-apexlink')}</h3>
                    
                    <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{__('Max Links Per Post', 'wp-apexlink')}</label>
                                <span className="text-indigo-500 font-bold text-sm">3</span>
                            </div>
                            <input type="range" min="1" max="10" defaultValue="3" className="w-full accent-indigo-500" />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{__('Min Confidence', 'wp-apexlink')}</label>
                                <span className="text-indigo-500 font-bold text-sm">85%</span>
                            </div>
                            <input type="range" min="50" max="100" defaultValue="85" className="w-full accent-indigo-500" />
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-start space-x-3 text-xs text-gray-500 leading-relaxed italic">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{__('Autopilot runs in the background. Matches will appear in your Suggestions Inbox for final review.', 'wp-apexlink')}</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex items-center space-x-3 mb-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <h4 className="font-bold text-red-500">{__('Emergency Revert', 'wp-apexlink')}</h4>
                        </div>
                        <p className="text-xs text-red-600/70 mb-4 leading-relaxed">
                            {__('Immediately batch-remove all links injected by the last autopilot session.', 'wp-apexlink')}
                        </p>
                        <button 
                            onClick={() => {
                                if (window.confirm(__('Are you sure you want to revert the last autopilot batch?', 'wp-apexlink'))) {
                                    revertMutation.mutate();
                                }
                            }}
                            disabled={revertMutation.isPending}
                            className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 text-sm flex items-center justify-center"
                        >
                            {revertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {__('Revert Last Batch', 'wp-apexlink')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Rule Modal */}
            {isRuleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRuleModalOpen(false)}></div>
                    <div className={`relative w-full max-w-md p-8 rounded-3xl border animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-2xl'}`}>
                        <h4 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Add Linking Rule', 'wp-apexlink')}</h4>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{__('Keyword / Anchor Text', 'wp-apexlink')}</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 'internal linking'"
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                                    value={newRule.keyword}
                                    onChange={(e) => setNewRule({...newRule, keyword: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{__('Target Post ID', 'wp-apexlink')}</label>
                                <input 
                                    type="number" 
                                    placeholder="123"
                                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                                    value={newRule.target_id}
                                    onChange={(e) => setNewRule({...newRule, target_id: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button 
                                    onClick={() => setIsRuleModalOpen(false)}
                                    className={`flex-1 py-3 font-bold rounded-2xl transition-all ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {__('Cancel', 'wp-apexlink')}
                                </button>
                                <button 
                                    onClick={() => createRuleMutation.mutate(newRule)}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                                >
                                    {__('Create Rule', 'wp-apexlink')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Autopilot;
