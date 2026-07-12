import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    ZoomIn, ZoomOut, Maximize2, Search,
    Info, AlertTriangle,
} from '../components/Icons';
import { getGraphData } from '../api/client';
import { MOCK_GRAPH_DATA } from '../utils/constants';

// Node type → visual config
const NODE_CONFIG = {
    document: { icon: '📄', radius: 26, shape: 'rect', fillClass: 'fill-blue-500/10', strokeClass: 'stroke-blue-500/30', labelColor: 'fill-blue-300' },
    evidence: { icon: '💎', radius: 20, shape: 'circle', fillClass: 'fill-purple-500/10', strokeClass: 'stroke-purple-500/30', labelColor: 'fill-purple-300' },
    entity: { icon: '⬡', radius: 20, shape: 'circle', fillClass: 'fill-cyan-500/10', strokeClass: 'stroke-cyan-500/30', labelColor: 'fill-cyan-300' },
};

const LINK_CONFIG = {
    supports: { color: '#3b82f6', opacity: 0.3, width: 1.5, dash: '0' },
    contradicts: { color: '#f43f5e', opacity: 0.7, width: 2, dash: '6 4' },
};

export function GraphPage() {
    const [graph, setGraph] = useState(MOCK_GRAPH_DATA);
    const [selected, setSelected] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        getGraphData()
            .then(r => { if (r.data?.nodes) setGraph(r.data); })
            .catch(() => { /* Use mock fallback */ });
    }, []);

    useEffect(() => {
        if (graph.nodes.length > 0 && !selected) setSelected(graph.nodes[0]);
    }, [graph]);

    const filteredNodes = graph.nodes.filter(n => {
        if (filterType !== 'all' && n.type !== filterType) return false;
        if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = graph.links.filter(l => filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target));

    const getLinksForNode = (nodeId) =>
        graph.links.filter(l => l.source === nodeId || l.target === nodeId);

    const getConnectedNode = (link, nodeId) => {
        const otherId = link.source === nodeId ? link.target : link.source;
        return graph.nodes.find(n => n.id === otherId);
    };

    return (
        <div className="h-[calc(100vh-64px)] pt-16 flex">
            {/* ── Main Graph Area ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-white/[0.04] flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-[15px] font-semibold text-white">Evidence Network</h1>
                        <p className="text-[11px] text-white/30 mt-0.5">
                            {graph.nodes.length} nodes · {graph.links.length} connections
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search nodes…"
                                className="w-44 pl-8 pr-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] text-white/60 placeholder:text-white/15 outline-none focus:border-cyan-500/25 transition-colors"
                            />
                        </div>

                        {/* Filter */}
                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                            className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] text-white/50 outline-none appearance-none cursor-pointer">
                            <option value="all">All Types</option>
                            <option value="document">Documents</option>
                            <option value="evidence">Evidence</option>
                            <option value="entity">Entities</option>
                        </select>

                        {/* Zoom */}
                        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
                                className="p-1.5 text-white/30 hover:text-white/50 transition-colors">
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-white/25 w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(2, z + 0.15))}
                                className="p-1.5 text-white/30 hover:text-white/50 transition-colors">
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setZoom(1)}
                                className="p-1.5 text-white/30 hover:text-white/50 transition-colors border-l border-white/[0.06]">
                                <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* SVG Graph Canvas */}
                <div className="flex-1 bg-surface-0 relative overflow-hidden dot-grid">
                    <svg className="w-full h-full" viewBox="0 0 700 500"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s ease' }}>

                        <defs>
                            <marker id="arrow-support" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" opacity="0.3" />
                            </marker>
                            <marker id="arrow-contra" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" opacity="0.5" />
                            </marker>
                        </defs>

                        {/* Links */}
                        {filteredLinks.map((link, i) => {
                            const src = filteredNodes.find(n => n.id === link.source);
                            const tgt = filteredNodes.find(n => n.id === link.target);
                            if (!src || !tgt) return null;
                            const isContra = link.type === 'contradicts';
                            const cfg = LINK_CONFIG[link.type] || LINK_CONFIG.supports;

                            return (
                                <g key={i}>
                                    <line
                                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                                        stroke={cfg.color} strokeWidth={cfg.width}
                                        strokeDasharray={cfg.dash} opacity={cfg.opacity}
                                        markerEnd={isContra ? 'url(#arrow-contra)' : 'url(#arrow-support)'}
                                    />
                                    {isContra && (
                                        <g transform={`translate(${(src.x + tgt.x) / 2},${(src.y + tgt.y) / 2})`}>
                                            <circle r="8" fill="#1c1c24" stroke="#f43f5e" strokeWidth="1.5" opacity="0.8" />
                                            <text y="3.5" textAnchor="middle" fill="#f43f5e" fontSize="8" fontWeight="bold">!</text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {filteredNodes.map(node => {
                            const isSelected = selected?.id === node.id;
                            const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.evidence;
                            const isDoc = node.type === 'document';

                            return (
                                <g key={node.id} transform={`translate(${node.x},${node.y})`}
                                    onClick={() => setSelected(node)} className="cursor-pointer">

                                    {/* Selection ring */}
                                    {isSelected && (
                                        <circle r={cfg.radius + 8} fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="2">
                                            <animate attributeName="r" values={`${cfg.radius + 6};${cfg.radius + 12};${cfg.radius + 6}`}
                                                dur="2s" repeatCount="indefinite" />
                                            <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                    )}

                                    {/* Node shape */}
                                    {isDoc ? (
                                        <rect x={-cfg.radius} y={-cfg.radius} width={cfg.radius * 2} height={cfg.radius * 2}
                                            rx="10" fill="#111118" stroke={isSelected ? '#06b6d4' : 'rgba(255,255,255,0.06)'}
                                            strokeWidth={isSelected ? 2 : 1}
                                            className="transition-all duration-200" />
                                    ) : (
                                        <circle r={cfg.radius} fill="#111118"
                                            stroke={isSelected ? '#06b6d4' : 'rgba(255,255,255,0.06)'}
                                            strokeWidth={isSelected ? 2 : 1}
                                            className="transition-all duration-200" />
                                    )}

                                    {/* Icon */}
                                    <text y="4" textAnchor="middle" fontSize={isDoc ? '14' : '11'}
                                        className="select-none pointer-events-none">
                                        {cfg.icon}
                                    </text>

                                    {/* Label */}
                                    <text y={cfg.radius + 14} textAnchor="middle" fontSize="10"
                                        fill={isSelected ? '#fafafa' : '#64748b'} fontWeight={isSelected ? '600' : '400'}
                                        className="select-none pointer-events-none transition-all duration-200">
                                        {node.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-surface-1/90 backdrop-blur-sm border border-white/[0.05] rounded-xl p-3 flex items-center gap-4 text-[10px] text-white/35">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500/40" /> Document</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500/40" /> Evidence</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500/40" /> Entity</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-rose-500/60" /> Contradiction</span>
                    </div>
                </div>
            </div>

            {/* ── Right: Details Panel ── */}
            <div className="w-[320px] shrink-0 border-l border-white/[0.04] bg-surface-1/50 flex flex-col overflow-y-auto">
                <div className="p-5 border-b border-white/[0.04]">
                    <h2 className="text-[12px] font-semibold text-white/40 uppercase tracking-wider">Properties</h2>
                </div>

                {selected ? (
                    <div className="p-5 space-y-5">
                        {/* Node info */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{NODE_CONFIG[selected.type]?.icon || '❓'}</div>
                                <div>
                                    <h3 className="text-[14px] font-semibold text-white">{selected.label}</h3>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                                        selected.type === 'document' ? 'bg-blue-500/10 text-blue-400' :
                                        selected.type === 'evidence' ? 'bg-purple-500/10 text-purple-400' :
                                        'bg-cyan-500/10 text-cyan-400'
                                    }`}>{selected.type}</span>
                                </div>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1">Description</p>
                                <p className="text-[12px] text-white/50 leading-relaxed">{selected.desc}</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                                <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1">Node ID</p>
                                <p className="text-[11px] text-white/40 font-mono">{selected.id}</p>
                            </div>
                        </div>

                        {/* Connections */}
                        <div>
                            <h4 className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-3">
                                Connections ({getLinksForNode(selected.id).length})
                            </h4>
                            <div className="space-y-2">
                                {getLinksForNode(selected.id).map((link, i) => {
                                    const other = getConnectedNode(link, selected.id);
                                    const isContra = link.type === 'contradicts';
                                    return (
                                        <div key={i}
                                            onClick={() => other && setSelected(other)}
                                            className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.07] rounded-xl cursor-pointer transition-all">
                                            <span className="text-[12px] text-white/55 font-medium truncate pr-2">
                                                {other?.label || '—'}
                                            </span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                                isContra
                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                                            }`}>{link.type}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                        <div>
                            <Info className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            <p className="text-[12px] text-white/25">Select a node to view details</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
