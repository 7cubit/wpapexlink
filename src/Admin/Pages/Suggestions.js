import { __ } from '@wordpress/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from '@wordpress/element';
import { Inbox, Sparkles, Filter, CheckCircle2, Trash2, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import SuggestionCard from '../Components/SuggestionCard';
import Skeleton from '../Components/Skeleton';
import EmptyState from '../Components/EmptyState';

const Suggestions = ({ darkMode }) => {
    const queryClient = useQueryClient();
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';
    const [filter, setFilter] = useState('pending');
    const [source, setSource] = useState('ai');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { data: suggestions, isLoading } = useQuery({
        queryKey: ['suggestions', filter, source],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/suggestions-inbox?status=${filter}&type=${source}`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    const actionMutation = useMutation({
        mutationFn: async ({ ids, action }) => {
            const res = await fetch(`${baseUrl}/suggestions/action`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce 
                },
                body: JSON.stringify({ ids, action })
            });
            return res.json();
        },
        onMutate: async ({ ids, action }) => {
            await queryClient.cancelQueries({ queryKey: ['suggestions', filter] });
            const previous = queryClient.getQueryData(['suggestions', filter]);
            
            // Optimistic update: remove the processed IDs
            queryClient.setQueryData(['suggestions', filter], (old) => 
                old?.filter(s => !ids.includes(s.id))
            );

            return { previous };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(['suggestions', filter], context.previous);
            toast.error(__('Action failed. Please try again.', 'wp-apexlink'));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const applyMutation = useMutation({
        mutationFn: async ({ suggestion_id, anchor }) => {
            const res = await fetch(`${baseUrl}/suggestions/apply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce 
                },
                body: JSON.stringify({ suggestion_id, anchor })
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(__('Link inserted successfully!', 'wp-apexlink'));
                queryClient.invalidateQueries({ queryKey: ['suggestions', filter] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            } else {
                toast.error(data.message || __('Failed to insert link.', 'wp-apexlink'));
            }
        },
        onError: () => {
            toast.error(__('Failed to insert link.', 'wp-apexlink'));
        }
    });

    const bridgeApplyMutation = useMutation({
        mutationFn: async ({ source_id, target_id, bridge_text }) => {
            const res = await fetch(`${baseUrl}/suggestions/bridge/apply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce 
                },
                body: JSON.stringify({ source_id, target_id, bridge_text })
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success(__('Bridge inserted successfully!', 'wp-apexlink'));
                queryClient.invalidateQueries({ queryKey: ['suggestions', filter] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            } else {
                toast.error(data.message || __('Failed to insert bridge.', 'wp-apexlink'));
            }
        },
        onError: () => {
            toast.error(__('Failed to insert bridge.', 'wp-apexlink'));
        }
    });

    const handleAction = (ids, action, extraData = null) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const suggestion = ids && !Array.isArray(ids) ? suggestions.find(s => s.id === ids) : null;
        
        if (action === 'accepted' && idArray.length > 5) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
        }

        const undo = () => {
            actionMutation.mutate({ ids: idArray, action: 'pending' });
            toast.success(__('Action reverted.', 'wp-apexlink'));
        };

        if (action === 'accepted' && idArray.length === 1) {
            applyMutation.mutate({ suggestion_id: idArray[0], anchor: extraData });
            actionMutation.mutate({ ids: idArray, action });
            
            toast((t) => (
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm tracking-tight">{__('Link Added!', 'wp-apexlink')}</span>
                    <button 
                        onClick={() => { undo(); toast.dismiss(t.id); }}
                        className="bg-neuro-brain/10 text-neuro-brain hover:bg-neuro-brain hover:text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                        {__('Undo', 'wp-apexlink')}
                    </button>
                </div>
            ), { duration: 5000 });
        } else if (action === 'bridge_apply' && suggestion) {
            bridgeApplyMutation.mutate({ 
                source_id: suggestion.source_id, 
                target_id: suggestion.target_id, 
                bridge_text: extraData 
            });
            actionMutation.mutate({ ids: [suggestion.id], action: 'accepted' });
            toast.success(__('Bridge inserted!', 'wp-apexlink'));
        } else {
            actionMutation.mutate({ ids: idArray, action });
            if (action === 'rejected') {
                toast((t) => (
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm tracking-tight">{__('Suggestion ignored.', 'wp-apexlink')}</span>
                        <button 
                            onClick={() => { undo(); toast.dismiss(t.id); }}
                            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
                        >
                            {__('Undo', 'wp-apexlink')}
                        </button>
                    </div>
                ), { duration: 5000 });
            }
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!suggestions || suggestions.length === 0) return;
            if (e.target.tagName === 'INPUT') return;

            switch(e.key.toLowerCase()) {
                case 'j':
                    // Next / Skip
                    setSelectedIndex(prev => (prev + 1) % suggestions.length);
                    break;
                case 'k':
                    // Approve
                    handleAction(suggestions[selectedIndex].id, 'accepted');
                    break;
                case 'r':
                    // Reject
                    handleAction(suggestions[selectedIndex].id, 'rejected');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, selectedIndex]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)}
            </div>
        );
    }

    const isEmpty = !suggestions || suggestions.length === 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Toolbar */}
            <div id="suggestions-inbox-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-black flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Inbox className="w-8 h-8 mr-3 text-indigo-500" />
                        {__('Suggestions Inbox', 'wp-apexlink')}
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">
                        {__('AI-powered internal linking recommendations.', 'wp-apexlink')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className={`p-1 rounded-2xl flex border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        {[{id: 'ai', label: __('AI Discovery', 'wp-apexlink')}, {id: 'autopilot', label: __('Autopilot Staging', 'wp-apexlink')}].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSource(t.id)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    source === t.id 
                                    ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600')
                                    : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className={`p-1 rounded-2xl flex border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                        {['pending', 'accepted', 'rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                    filter === s 
                                    ? (darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600')
                                    : (darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bulk Actions Indicator */}
            {!isEmpty && filter === 'pending' && (
                <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold uppercase tracking-widest ${darkMode ? 'bg-indigo-900/20 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                    <div className="flex items-center">
                        <Command className="w-4 h-4 mr-2" />
                        {__('High-Velocity Mode: J (Skip), K (Approve), R (Reject).', 'wp-apexlink')}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => handleAction(suggestions.map(s => s.id), 'accepted')} className="hover:underline flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> {__('Approve All', 'wp-apexlink')}
                        </button>
                        <button onClick={() => handleAction(suggestions.map(s => s.id), 'rejected')} className="hover:underline flex items-center text-rose-500">
                            <Trash2 className="w-4 h-4 mr-1" /> {__('Ignore All', 'wp-apexlink')}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {isEmpty ? (
                <EmptyState 
                    type="suggestions"
                    title={__('Inbox Zero!', 'wp-apexlink')}
                    description={__('No suggestions found here. Your internal link profile is currently optimized and caught up.', 'wp-apexlink')}
                    darkMode={darkMode}
                />
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {suggestions.map((s, index) => (
                        <div 
                            key={s.id} 
                            className={`transition-all duration-300 ${selectedIndex === index ? 'scale-[1.02]' : 'opacity-90 grayscale-[0.5]'}`}
                            onClick={() => setSelectedIndex(index)}
                        >
                            <SuggestionCard 
                                suggestion={s} 
                                onAction={(id, action, anchor) => handleAction(id, action)}
                                darkMode={darkMode}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Suggestions;
