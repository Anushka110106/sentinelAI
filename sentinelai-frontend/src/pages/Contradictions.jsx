import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, ChevronDown, Search,
    RefreshCw, Loader2, Shield,
} from '../components/Icons';
import { getContradictions } from '../api/client';
import { MOCK_CONTRADICTIONS } from '../utils/constants';

function SeverityBadge({ confidence }) {
    const pct = Math.round((confidence ?? 0.8) * 100);
    const isHigh = pct > 80;
    const isMed = pct > 60 && pct <= 80;
    return (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
            isHigh
                ? 'bg-rose-500/[0.08] text-rose-400 border-rose-500/15'
                : isMed
                    ? 'bg-amber-500/[0.08] text-amber-400 border-amber-500/15'
                    : 'bg-blue-500/[0.08] text-blue-400 border-blue-500/15'
        }`}>
            {pct}% confidence
        </span>
    );
}

function ClaimCard({ label, docName, claim, side }) {
    return (
        <div className={`bg-white/[0.015] border rounded-xl p-4 ${
            side === 'a'
                ? 'border-l-2 border-l-blue-500/40 border-white/[0.04]'
                : 'border-l-2 border-l-violet-500/40 border-white/[0.04]'
        }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                side === 'a' ? 'text-blue-400/70' : 'text-violet-400/70'
            }`}>
                {docName}
            </p>
            <p className="text-[12px] text-white/55 leading-relaxed italic">"{claim}"</p>
        </div>
    );
}

export function ContradictionsPage() {
    const [contradictions, setContradictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getContradictions();
            const data = Array.isArray(res.data) ? res.data
                : Array.isArray(res.data?.contradictions) ? res.data.contradictions
                : [];
            setContradictions(data.length > 0 ? data : MOCK_CONTRADICTIONS);
        } catch {
            setContradictions(MOCK_CONTRADICTIONS);
        } finally { setLoading(false); }
    };

    const filtered = contradictions.filter(c => {
        if (searchQuery && !(c.topic || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (severityFilter === 'high' && (c.confidence ?? 0.8) <= 0.8) return false;
        if (severityFilter === 'medium' && ((c.confidence ?? 0.8) > 0.8 || (c.confidence ?? 0.8) <= 0.6)) return false;
        if (severityFilter === 'low' && (c.confidence ?? 0.8) > 0.6) return false;
        return true;
    });

    return (
        <div className="min-h-screen pt-20 pb-16 px-6">
            <div className="max-w-[1000px] mx-auto space-y-6">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                        Cross-Document Contradictions
                    </h1>
                    <p className="text-[13px] text-white/35">
                        Conflicting claims and data discrepancies across your research documents.
                    </p>
                </motion.div>

                {/* Stats bar */}
                <div className="flex items-center gap-6 py-4 border-b border-white/[0.04]">
                    <div>
                        <p className="text-2xl font-bold text-white">{contradictions.length}</p>
                        <p className="text-[11px] text-white/25">Total conflicts</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                        <p className="text-2xl font-bold text-rose-400">
                            {contradictions.filter(c => (c.confidence ?? 0.8) > 0.8).length}
                        </p>
                        <p className="text-[11px] text-white/25">High severity</p>
                    </div>
                    <div className="w-px h-8 bg-white/[0.06]" />
                    <div>
                        <p className="text-2xl font-bold text-amber-400">
                            {contradictions.filter(c => (c.confidence ?? 0.8) <= 0.8 && (c.confidence ?? 0.8) > 0.6).length}
                        </p>
                        <p className="text-[11px] text-white/25">Medium</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search contradictions…"
                            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[12px] text-white/60 placeholder:text-white/15 outline-none focus:border-cyan-500/25 transition-colors" />
                    </div>
                    <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                        className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[12px] text-white/50 outline-none appearance-none cursor-pointer">
                        <option value="all">All Severity</option>
                        <option value="high">High (&gt;80%)</option>
                        <option value="medium">Medium (60-80%)</option>
                        <option value="low">Low (&lt;60%)</option>
                    </select>
                    <motion.button onClick={load} disabled={loading}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-[12px] text-white/50 font-medium transition-all flex items-center gap-1.5 disabled:opacity-40">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Refresh
                    </motion.button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="py-16 text-center">
                        <Loader2 className="w-8 h-8 text-cyan-400/40 animate-spin mx-auto mb-3" />
                        <p className="text-[13px] text-white/25">Analyzing claims…</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="py-16 text-center">
                        <Shield className="w-12 h-12 text-emerald-400/20 mx-auto mb-4" />
                        <p className="text-[15px] font-medium text-white/60 mb-1">No contradictions found</p>
                        <p className="text-[12px] text-white/25">Documents are consistent, or upload more to cross-reference.</p>
                    </motion.div>
                )}

                {/* Contradiction Cards */}
                {!loading && filtered.length > 0 && (
                    <div className="space-y-4">
                        {filtered.map((c, i) => (
                            <motion.div key={c.id || i}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="glass-card p-0 overflow-hidden"
                            >
                                {/* Header */}
                                <button
                                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.01] transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                                        </div>
                                        <span className="text-[13px] font-semibold text-white/80 truncate">
                                            {c.topic || `Contradiction #${i + 1}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <SeverityBadge confidence={c.confidence} />
                                        <ChevronDown className={`w-4 h-4 text-white/20 transition-transform duration-200 ${
                                            expandedId === c.id ? 'rotate-180' : ''
                                        }`} />
                                    </div>
                                </button>

                                {/* Expandable detail */}
                                <AnimatePresence>
                                    {expandedId === c.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04] pt-4">
                                                {/* Claims comparison */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <ClaimCard side="a" docName={c.doc_a} claim={c.claim_a} />
                                                    <ClaimCard side="b" docName={c.doc_b} claim={c.claim_b} />
                                                </div>

                                                {/* Explanation */}
                                                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                                                    <p className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-wider mb-2">
                                                        Analysis
                                                    </p>
                                                    <p className="text-[12px] text-white/45 leading-relaxed">
                                                        {c.explanation || c.description}
                                                    </p>
                                                </div>

                                                {/* Difference tags */}
                                                {c.differences && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(c.differences).map(([key, diff]) => (
                                                            <span key={key} className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${
                                                                diff
                                                                    ? 'bg-rose-500/[0.06] text-rose-400/80 border-rose-500/10'
                                                                    : 'bg-white/[0.02] text-white/20 border-white/[0.04]'
                                                            }`}>
                                                                {key}{diff && ' ✗'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContradictionsPage;
