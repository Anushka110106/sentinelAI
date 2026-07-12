import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search, AlertCircle, ChevronRight, Lightbulb,
    FileQuestion, Loader2, RefreshCw, CheckCircle2,
} from '../components/Icons';
import { getGaps } from '../api/client';
import { MOCK_GAPS } from '../utils/constants';

function PriorityIndicator({ priority }) {
    const p = (priority || 'low').toLowerCase();
    const config = {
        high: { color: 'bg-rose-500/10 text-rose-400 border-rose-500/15', dot: 'bg-rose-400' },
        medium: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/15', dot: 'bg-amber-400' },
        low: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/15', dot: 'bg-blue-400' },
    };
    const c = config[p] || config.low;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase ${c.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {priority}
        </span>
    );
}

export function GapsPage() {
    const [gaps, setGaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getGaps();
            const data = Array.isArray(res.data) ? res.data
                : Array.isArray(res.data?.gaps) ? res.data.gaps : [];
            setGaps(data.length > 0 ? data : MOCK_GAPS);
        } catch {
            setGaps(MOCK_GAPS);
        } finally { setLoading(false); }
    };

    const filtered = gaps.filter(g => {
        if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (priorityFilter !== 'all' && (g.priority || 'low').toLowerCase() !== priorityFilter) return false;
        return true;
    });

    const highCount = gaps.filter(g => (g.priority || '').toLowerCase() === 'high').length;
    const medCount = gaps.filter(g => (g.priority || '').toLowerCase() === 'medium').length;
    const lowCount = gaps.filter(g => (g.priority || '').toLowerCase() === 'low').length;

    return (
        <div className="min-h-screen pt-20 pb-16 px-6">
            <div className="max-w-[1100px] mx-auto space-y-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                        Research Gaps
                    </h1>
                    <p className="text-[13px] text-white/35">
                        Missing evidence, unverified references, and data holes identified across your document index.
                    </p>
                </motion.div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-4 border-b border-white/[0.04]">
                    <div>
                        <p className="text-2xl font-bold text-white">{gaps.length}</p>
                        <p className="text-[11px] text-white/25">Total gaps</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                        <p className="text-2xl font-bold text-rose-400">{highCount}</p>
                        <p className="text-[11px] text-white/25">High priority</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                        <p className="text-2xl font-bold text-amber-400">{medCount}</p>
                        <p className="text-[11px] text-white/25">Medium</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                        <p className="text-2xl font-bold text-blue-400">{lowCount}</p>
                        <p className="text-[11px] text-white/25">Low</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search gaps…"
                            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[12px] text-white/60 placeholder:text-white/15 outline-none focus:border-cyan-500/25 transition-colors" />
                    </div>
                    <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[12px] text-white/50 outline-none appearance-none cursor-pointer">
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <motion.button onClick={load} disabled={loading}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-[12px] text-white/50 font-medium transition-all flex items-center gap-1.5 disabled:opacity-40">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Re-scan
                    </motion.button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="py-16 text-center">
                        <Loader2 className="w-8 h-8 text-cyan-400/40 animate-spin mx-auto mb-3" />
                        <p className="text-[13px] text-white/25">Scanning for gaps…</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                    <div className="py-16 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400/20 mx-auto mb-4" />
                        <p className="text-[15px] font-medium text-white/60 mb-1">No gaps detected</p>
                        <p className="text-[12px] text-white/25">All referenced data is accounted for.</p>
                    </div>
                )}

                {/* Gap Cards */}
                {!loading && filtered.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((gap, i) => (
                            <motion.div key={gap.id || i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-5 flex flex-col"
                            >
                                {/* Title & Priority */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <FileQuestion className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <h3 className="text-[13px] font-semibold text-white/80 leading-snug line-clamp-2">
                                            {gap.title}
                                        </h3>
                                    </div>
                                    <PriorityIndicator priority={gap.priority} />
                                </div>

                                {/* Details */}
                                <p className="text-[12px] text-white/40 leading-relaxed mb-4 flex-1 line-clamp-3">
                                    {gap.details}
                                </p>

                                {/* Source ref */}
                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 mb-4">
                                    <p className="text-[9px] text-white/20 uppercase tracking-wider font-semibold mb-1">Source</p>
                                    <p className="text-[11px] text-cyan-400/60 font-medium truncate">{gap.source_ref}</p>
                                </div>

                                {/* Suggestion */}
                                <div className="border-t border-white/[0.04] pt-3">
                                    <div className="flex items-start gap-2">
                                        <Lightbulb className="w-3.5 h-3.5 text-emerald-400/60 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-emerald-400/50 leading-relaxed italic">
                                            "{gap.suggestion}"
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
