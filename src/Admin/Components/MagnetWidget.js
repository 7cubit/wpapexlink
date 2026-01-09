import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { PanelBody, Button, Spinner, Placeholder } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { Magnet, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const MagnetSidebar = () => {
    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [applyingId, setApplyingId] = useState(null);
    const postId = window.wpApexLinkData?.postId;
    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const fetchCandidates = async () => {
        if (!postId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${baseUrl}/magnet/candidates?post_id=${postId}`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            const data = await response.json();
            setCandidates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Magnet error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, [postId]);

    const applyLink = async (candidate) => {
        setApplyingId(candidate.post_id);
        try {
            const response = await fetch(`${baseUrl}/magnet/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApexLinkData?.nonce
                },
                body: JSON.stringify({
                    source_id: candidate.post_id,
                    target_id: postId,
                    anchor: document.querySelector('.editor-post-title__input')?.innerText || wp.data.select('core/editor').getEditedPostAttribute('title')
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(__('Inbound link created!', 'wp-apexlink'));
                setCandidates(prev => prev.filter(c => c.post_id !== candidate.post_id));
            } else {
                toast.error(data.message || __('Failed to create link.', 'wp-apexlink'));
            }
        } catch (error) {
            toast.error(__('An error occurred.', 'wp-apexlink'));
        } finally {
            setApplyingId(null);
        }
    };

    return (
        <PluginSidebar
            name="apexlink-magnet-sidebar"
            title={__('ApexLink Magnet', 'wp-apexlink')}
            icon={<Magnet className="w-4 h-4" />}
        >
            <PanelBody>
                <div className="mb-6">
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                        <Magnet className="w-4 h-4 text-indigo-500" />
                        {__('Pull Inbound Links', 'wp-apexlink')}
                    </h3>
                    <p className="text-xs text-gray-500 italic">
                        {__('These high-authority posts mention your title and should link TO this page.', 'wp-apexlink')}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Spinner />
                    </div>
                ) : candidates.length > 0 ? (
                    <div className="space-y-4">
                        {candidates.map((candidate) => (
                            <div key={candidate.post_id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="text-[10px] font-black uppercase text-indigo-500 mb-1">
                                    Score: {Math.round(candidate.score * 100)}%
                                </div>
                                <h4 className="text-xs font-bold mb-3 leading-snug">{candidate.title}</h4>
                                <div className="flex justify-between items-center mt-auto">
                                    <a href={candidate.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <Button
                                        variant="secondary"
                                        isSmall
                                        onClick={() => applyLink(candidate)}
                                        disabled={applyingId === candidate.post_id}
                                    >
                                        {applyingId === candidate.post_id ? <Spinner /> : __('Pull Link', 'wp-apexlink')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Placeholder
                        icon={<Sparkles className="w-8 h-8 opacity-20" />}
                        label={__('No candidates found', 'wp-apexlink')}
                        instructions={__('Try updating your post title to something more descriptive.', 'wp-apexlink')}
                    />
                )}

                <div className="mt-8">
                    <Button 
                        variant="link" 
                        onClick={fetchCandidates}
                        icon="update"
                        isSmall
                    >
                        {__('Refresh Candidates', 'wp-apexlink')}
                    </Button>
                </div>
            </PanelBody>
        </PluginSidebar>
    );
};

export default MagnetSidebar;
