import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import * as d3 from 'd3';
import { useQuery } from '@tanstack/react-query';
import { Maximize, Download, Info, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const VisualGraph = ({ darkMode }) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const baseUrl = window.wpApexLinkData?.apiUrl || '/wp-json/apexlink/v1';

    const { data: graphData, isLoading } = useQuery({
        queryKey: ['visual-graph'],
        queryFn: async () => {
            const res = await fetch(`${baseUrl}/graph/visual`, {
                headers: { 'X-WP-Nonce': window.wpApexLinkData?.nonce }
            });
            return res.json();
        }
    });

    useEffect(() => {
        if (!graphData || !graphData.nodes || !svgRef.current || !containerRef.current) {
            console.log('[ApexLink VisualGraph] Skipping effect: missing data or refs', { graphData, svg: !!svgRef.current, container: !!containerRef.current });
            return;
        }

        console.log('[ApexLink VisualGraph] Starting simulation with', graphData.nodes.length, 'nodes');

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);

        const g = svg.append('g');

        // Zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Simulation
        const nodes = graphData.nodes.map(d => ({ ...d }));
        const links = graphData.links.map(d => ({ ...d }));

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.score || 1) * 3 + 15));

        // Links
        const link = g.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', darkMode ? '#4b5563' : '#cbd5e1')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', 1.5)
            .attr('class', 'graph-edge transition-all duration-300');

        // Nodes
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'cursor-pointer group')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Circles
        node.append('circle')
            .attr('r', d => Math.sqrt(d.score || 1) * 2 + 8)
            .attr('fill', d => colorScale(d.category))
            .attr('stroke', darkMode ? '#1f2937' : '#fff')
            .attr('stroke-width', 3)
            .attr('class', 'transition-all duration-300 drop-shadow-sm neural-glow')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('stroke', '#6366f1').attr('stroke-width', 5);
                // Highlight connected edges
                link.filter(l => l.source.id === d.id || l.target.id === d.id)
                    .attr('stroke', '#6366f1')
                    .attr('stroke-opacity', 1)
                    .attr('stroke-width', 3);
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke', darkMode ? '#1f2937' : '#fff').attr('stroke-width', 3);
                link.attr('stroke', darkMode ? '#4b5563' : '#cbd5e1')
                    .attr('stroke-opacity', 0.4)
                    .attr('stroke-width', 1.5);
            })
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedNode(d);
            });

        // Labels (High quality labels)
        node.append('text')
            .attr('dy', '.35em')
            .attr('x', d => Math.sqrt(d.score || 1) * 2 + 12)
            .text(d => d.title)
            .attr('class', `text-[10px] font-bold ${darkMode ? 'fill-gray-400' : 'fill-gray-600'}`)
            .style('display', d => d.score > 40 ? 'block' : 'none')
            .style('pointer-events', 'none')
            .style('text-shadow', darkMode ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)');

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return () => simulation.stop();
    }, [graphData, darkMode]);

    const categories = ['all', ...new Set(graphData?.nodes?.map(n => n.category) || [])];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className={`flex flex-wrap items-center justify-between p-4 mb-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={__('Search posts...', 'wp-apexlink')}
                            className={`pl-10 pr-4 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-neuro-brain outline-none w-64 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select 
                            className={`py-2 px-3 rounded-lg text-sm border focus:ring-2 focus:ring-neuro-brain outline-none ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'all' ? __('All Categories', 'wp-apexlink') : cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button className={`p-2 rounded-lg border hover:bg-opacity-80 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <Download className="w-4 h-4" />
                    </button>
                    <button className={`p-2 rounded-lg border hover:bg-opacity-80 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-grow flex space-x-4 min-h-0">
                {/* Graph Area */}
                <div 
                    ref={containerRef}
                    className={`flex-grow rounded-2xl border overflow-hidden relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                >
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 font-medium">{__('Generating neural map...', 'wp-apexlink')}</p>
                        </div>
                    ) : (
                        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 p-4 rounded-xl bg-opacity-80 backdrop-blur-md border border-opacity-20 flex flex-col space-y-2 pointer-events-none">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{__('Authority Link', 'wp-apexlink')}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 italic max-w-xs">
                            {__('Node size represents PageRank authority. Link density shows your content silos.', 'wp-apexlink')}
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                {selectedNode && (
                    <div className={`w-80 rounded-2xl border p-6 overflow-y-auto animate-in slide-in-from-right duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 shadow-xl' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{__('Page Details', 'wp-apexlink')}</h3>
                            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">{__('Title', 'wp-apexlink')}</label>
                                <p className={`font-semibold leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{selectedNode.title}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">{__('Authority', 'wp-apexlink')}</label>
                                    <div className={`text-2xl font-black ${selectedNode.score > 70 ? 'text-green-500' : selectedNode.score > 40 ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {Math.round(selectedNode.score)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">{__('Category', 'wp-apexlink')}</label>
                                    <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {selectedNode.category}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-opacity-10">
                                <a 
                                    href={selectedNode.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all mb-3 text-sm"
                                >
                                    {__('View Post', 'wp-apexlink')}
                                </a>
                                <button className="w-full bg-neuro-brain hover:bg-opacity-90 text-white font-bold py-3 rounded-xl transition-all text-sm">
                                    {__('Analyze Connections', 'wp-apexlink')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualGraph;
