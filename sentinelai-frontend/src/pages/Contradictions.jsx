import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getContradictions } from '../api/client';

export function ContradictionsPage() {
    const [contradictions, setContradictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadContradictions();
    }, []);

    const loadContradictions = async () => {
        setLoading(true);
        try {
            const response = await getContradictions();
            // Handle if response is array or contains contradictions object
            if (Array.isArray(response.data)) {
                setContradictions(response.data);
            } else if (response.data && Array.isArray(response.data.contradictions)) {
                setContradictions(response.data.contradictions);
            } else {
                setContradictions([]);
            }
            setError(null);
        } catch (err) {
            console.error('Failed to load contradictions:', err);
            setError(err.response?.data?.detail || 'Failed to load contradictions');
            setContradictions([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] p-6 text-slate-100">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        ⚖️ Cross-Document Contradictions
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Conflicting claims, logical clashes, and data discrepancies discovered across your documents database.
                    </p>
                </motion.div>

                {/* Loading */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                        <p className="mt-4 text-slate-400 text-sm">Analyzing document claims...</p>
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-sm"
                    >
                        ⚠️ {error}. Running in mock/fallback mode.
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && contradictions.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800"
                    >
                        <p className="text-4xl mb-4">✨</p>
                        <p className="text-lg font-bold text-white">No contradictions found</p>
                        <p className="text-slate-400 mt-2 text-xs">Your documents are consistent. Upload documents to scan for differences.</p>
                    </motion.div>
                )}

                {/* Contradictions Grid */}
                {!loading && contradictions.length > 0 && (
                    <motion.div
                        layout
                        className="space-y-6"
                    >
                        {contradictions.map((contra, i) => (
                            <motion.div
                                key={contra.id || i}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 shadow-xl hover:border-slate-700 transition"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                                    <span className="text-sm font-bold text-indigo-300">
                                        ⚖️ {contra.topic || `Contradiction #${i + 1}`}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        (contra.confidence ?? 0) > 0.8
                                            ? 'bg-rose-950/40 text-rose-300 border-rose-500/20'
                                            : 'bg-amber-950/40 text-amber-300 border-amber-500/20'
                                    }`}>
                                        {Math.round((contra.confidence ?? 0.8) * 100)}% confidence
                                    </span>
                                </div>

                                {/* Claims comparison */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Claim A */}
                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 border-l-4 border-l-blue-500">
                                        <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase tracking-wider">
                                            {contra.doc_a}
                                        </p>
                                        <p className="text-slate-200 text-sm italic">
                                            "{contra.claim_a}"
                                        </p>
                                    </div>

                                    {/* Claim B */}
                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 border-l-4 border-l-purple-500">
                                        <p className="text-[10px] font-bold text-purple-400 mb-2 uppercase tracking-wider">
                                            {contra.doc_b}
                                        </p>
                                        <p className="text-slate-200 text-sm italic">
                                            "{contra.claim_b}"
                                        </p>
                                    </div>
                                </div>

                                {/* Explanation */}
                                <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/10 mb-4">
                                    <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase tracking-wider">Why they contradict:</p>
                                    <p className="text-slate-300 text-xs leading-relaxed">{contra.explanation || contra.description}</p>
                                </div>

                                {/* Differences */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {Object.entries(contra.differences || {}).map(([key, diff]) => (
                                        <div
                                            key={key}
                                            className={`p-2 rounded-lg text-center text-[10px] font-bold border transition ${
                                                diff
                                                    ? 'bg-rose-950/40 text-rose-300 border-rose-500/20'
                                                    : 'bg-slate-800/50 text-slate-500 border-slate-900'
                                            }`}
                                        >
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                            {diff && ' ✗'}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Refresh button */}
                <div className="mt-8 text-center">
                    <motion.button
                        onClick={loadContradictions}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm"
                    >
                        {loading ? 'Analyzing...' : '🔄 Re-analyze Database'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default ContradictionsPage;
