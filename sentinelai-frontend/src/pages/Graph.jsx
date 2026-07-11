import { useState, useEffect } from 'react';
import { getGraphData } from '../api/client';

export function GraphPage() {
    const [selectedNode, setSelectedNode] = useState(null);
    const [graphData, setGraphData] = useState({
        nodes: [
            { id: 'doc-1', label: 'Intel Report V1', type: 'document', desc: 'Overview of troop movement logs in North Sector.', color: '#3b82f6', x: 200, y: 150 },
            { id: 'doc-2', label: 'Field Notes East', type: 'document', desc: 'Local patrol feedback from East border sector.', color: '#3b82f6', x: 500, y: 150 },
            { id: 'ev-1', label: 'Base Camp Alpha', type: 'evidence', desc: 'Identified Base Camp Alpha coordinate at grid 45-89.', color: '#a78bfa', x: 200, y: 350 },
            { id: 'ev-2', label: 'Supply Convoy Log', type: 'evidence', desc: 'Confirms convoy departed at 0400 hours.', color: '#a78bfa', x: 350, y: 250 },
            { id: 'ev-3', label: 'Visual Recon Photo', type: 'evidence', desc: 'Photo showing no base camp at coordinates 45-89.', color: '#f43f5e', x: 500, y: 350 }
        ],
        links: [
            { source: 'doc-1', target: 'ev-1', type: 'support', color: '#60a5fa' },
            { source: 'doc-1', target: 'ev-2', type: 'support', color: '#60a5fa' },
            { source: 'doc-2', target: 'ev-2', type: 'support', color: '#60a5fa' },
            { source: 'doc-2', target: 'ev-3', type: 'support', color: '#60a5fa' },
            { source: 'ev-1', target: 'ev-3', type: 'contradiction', color: '#f43f5e' }
        ]
    });

    useEffect(() => {
        getGraphData()
            .then(res => {
                if (res.data && res.data.nodes) {
                    setGraphData(res.data);
                }
            })
            .catch(err => {
                console.log('Graph API offline, using premium mock fallback', err);
            });
    }, []);

    // Set default selected node
    useEffect(() => {
        if (graphData.nodes.length > 0) {
            setSelectedNode(graphData.nodes[0]);
        }
    }, [graphData]);

    const getNodeDetails = (node) => {
        if (!node) return null;
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: node.color }}
                    ></div>
                    <h3 className="text-lg font-bold text-slate-100">{node.label}</h3>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                            Node ID & Type
                        </span>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-slate-300 font-mono">{node.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                node.type === 'document' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                                {node.type}
                            </span>
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                            Description
                        </span>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                            {node.desc}
                        </p>
                    </div>
                </div>

                {/* Related Connections details */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Connected Relationships
                    </h4>
                    <div className="space-y-2">
                        {graphData.links
                            .filter(l => l.source === node.id || l.target === node.id)
                            .map((link, idx) => {
                                const otherId = link.source === node.id ? link.target : link.source;
                                const otherNode = graphData.nodes.find(n => n.id === otherId);
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => setSelectedNode(otherNode)}
                                        className="flex items-center justify-between p-2.5 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all duration-200"
                                    >
                                        <span className="text-xs text-slate-300 font-medium">
                                            {otherNode ? otherNode.label : otherId}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            link.type === 'contradiction' 
                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                            {link.type}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 min-h-[calc(100vh-80px)]">
            {/* Graph Visualization Container */}
            <div className="lg:col-span-3 glass rounded-2xl border border-slate-800 p-6 flex flex-col shadow-2xl relative min-h-[500px]">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Evidence Navigation Graph
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Graph representation of verified documents, evidence claims, and identified contradictions.
                        </p>
                    </div>

                    {/* Graph Legends */}
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400 bg-slate-950/40 border border-slate-850 px-4 py-2 rounded-xl">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>Document</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                            <span>Evidence Claim</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>
                            <span>Contradiction</span>
                        </div>
                    </div>
                </div>

                {/* SVG Visualizer */}
                <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-900 relative overflow-hidden flex items-center justify-center min-h-[400px]">
                    <svg className="w-full h-full min-h-[400px]" viewBox="0 0 700 500">
                        {/* Define arrow markers for line directions */}
                        <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                            </marker>
                        </defs>

                        {/* Connection Links */}
                        {graphData.links.map((link, idx) => {
                            const sourceNode = graphData.nodes.find(n => n.id === link.source);
                            const targetNode = graphData.nodes.find(n => n.id === link.target);
                            if (!sourceNode || !targetNode) return null;

                            const isContradiction = link.type === 'contradiction';

                            return (
                                <g key={idx}>
                                    <line
                                        x1={sourceNode.x}
                                        y1={sourceNode.y}
                                        x2={targetNode.x}
                                        y2={targetNode.y}
                                        stroke={link.color}
                                        strokeWidth={isContradiction ? 2.5 : 1.5}
                                        strokeDasharray={isContradiction ? '4 4' : '0'}
                                        opacity="0.8"
                                        markerEnd="url(#arrow)"
                                    />
                                    {isContradiction && (
                                        <g transform={`translate(${(sourceNode.x + targetNode.x)/2}, ${(sourceNode.y + targetNode.y)/2})`}>
                                            <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#f43f5e" className="animate-pulse" />
                                            <text x="0" y="3.5" textAnchor="middle" fill="#fff" fontSize="10px" fontWeight="bold">⚠️</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {graphData.nodes.map((node) => {
                            const isSelected = selectedNode?.id === node.id;
                            const isDoc = node.type === 'document';

                            return (
                                <g 
                                    key={node.id} 
                                    transform={`translate(${node.x}, ${node.y})`}
                                    onClick={() => setSelectedNode(node)}
                                    className="cursor-pointer group"
                                >
                                    {/* Selection Glow */}
                                    {isSelected && (
                                        <circle 
                                            r={isDoc ? 32 : 24} 
                                            fill="none" 
                                            stroke={node.color} 
                                            strokeWidth="2" 
                                            className="animate-ping" 
                                            opacity="0.4"
                                        />
                                    )}

                                    {/* Node Shape */}
                                    {isDoc ? (
                                        <rect
                                            x="-26"
                                            y="-26"
                                            width="52"
                                            height="52"
                                            rx="12"
                                            fill="#1e293b"
                                            stroke={isSelected ? '#60a5fa' : 'rgba(255,255,255,0.08)'}
                                            strokeWidth={isSelected ? 3 : 1.5}
                                            className="transition-all duration-300 shadow-lg"
                                        />
                                    ) : (
                                        <circle
                                            r="20"
                                            fill="#1e293b"
                                            stroke={isSelected ? '#a78bfa' : 'rgba(255,255,255,0.08)'}
                                            strokeWidth={isSelected ? 3 : 1.5}
                                            className="transition-all duration-300 shadow-lg"
                                        />
                                    )}

                                    {/* Node Icon/Text overlay */}
                                    <text 
                                        y="4" 
                                        textAnchor="middle" 
                                        fontSize={isDoc ? '14px' : '12px'}
                                        className="select-none pointer-events-none"
                                    >
                                        {isDoc ? '📄' : '💎'}
                                    </text>

                                    {/* Label Text below node */}
                                    <text
                                        y={isDoc ? 40 : 34}
                                        textAnchor="middle"
                                        fill={isSelected ? '#fff' : '#94a3b8'}
                                        fontSize="11px"
                                        fontWeight={isSelected ? 'bold' : 'normal'}
                                        className="select-none pointer-events-none transition-colors duration-300"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                    
                    {/* Floating Info Helper */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 font-medium">
                        💡 Click nodes to view relationship links & properties
                    </div>
                </div>
            </div>

            {/* Details Side Panel */}
            <div className="lg:col-span-1 glass rounded-2xl border border-slate-800 p-6 flex flex-col shadow-2xl">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Entity Properties
                </h2>
                {selectedNode ? (
                    getNodeDetails(selectedNode)
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <span className="text-3xl mb-2 opacity-55">🕸️</span>
                        <p className="text-sm text-slate-400">Select any node on the graph workspace to view detailed evidence linkages.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
