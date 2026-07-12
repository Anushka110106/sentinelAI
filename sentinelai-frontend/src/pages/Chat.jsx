import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, FileText, Loader2, AlertCircle, BookOpen,
    Sparkles, ChevronDown, ExternalLink, Clock, Percent,
} from '../components/Icons';
import { query, getDocuments, uploadDocuments, deleteDocument } from '../api/client';
import { MOCK_DOCUMENTS } from '../utils/constants';
import { formatTime, formatFileSize } from '../utils/formatters';

// ── Typing indicator ─────────────────────────
function TypingIndicator() {
    return (
        <div className="flex gap-1 px-4 py-3">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                />
            ))}
        </div>
    );
}

// ── Citation Card ────────────────────────────
function CitationCard({ citation, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] rounded-xl p-3 cursor-pointer transition-all duration-200 group"
        >
            <div className="flex items-start gap-2.5">
                <span className="text-[10px] font-bold text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                    {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white/80 truncate">
                        {citation.doc_name}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5 flex items-center gap-2">
                        <span>Page {citation.page}</span>
                        {citation.paragraph != null && <span>¶ {citation.paragraph}</span>}
                        {citation.similarity_score != null && (
                            <span className="text-cyan-400/60 font-medium">
                                {Math.round(citation.similarity_score * 100)}% match
                            </span>
                        )}
                    </p>
                    {citation.snippet && (
                        <p className="text-[11px] text-white/40 mt-2 leading-relaxed line-clamp-2 italic">
                            "{citation.snippet.substring(0, 140)}{citation.snippet.length > 140 ? '…' : ''}"
                        </p>
                    )}
                </div>
                <ExternalLink className="w-3 h-3 text-white/15 group-hover:text-white/30 shrink-0 transition-colors" />
            </div>
        </motion.div>
    );
}

// ── Processing Stage Indicator ───────────────
function ProcessingStages({ stage }) {
    const stages = [
        'Preprocessing query',
        'Searching documents',
        'Retrieving evidence',
        'Generating answer',
        'Formatting citations',
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 max-w-md"
        >
            <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-[13px] font-medium text-white/60">Processing…</span>
            </div>
            <div className="space-y-2">
                {stages.map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                            i < stage
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : i === stage
                                    ? 'bg-cyan-500/15 text-cyan-400 animate-pulse'
                                    : 'bg-white/[0.03] text-white/20'
                        }`}>
                            {i < stage ? '✓' : i + 1}
                        </div>
                        <span className={`text-[12px] transition-colors duration-300 ${
                            i <= stage ? 'text-white/60' : 'text-white/20'
                        }`}>
                            {s}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// ══════════════════════════════════════════════
// CHAT PAGE
// ══════════════════════════════════════════════
export function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        getDocuments()
            .then(r => setDocuments(r.data.documents || []))
            .catch(() => setDocuments(MOCK_DOCUMENTS));
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const loadDocs = async () => {
        try {
            const r = await getDocuments();
            setDocuments(r.data.documents || []);
        } catch { setDocuments(MOCK_DOCUMENTS); }
    };

    const handleUpload = async () => {
        if (!selectedFiles.length) return;
        setUploading(true);
        try {
            await uploadDocuments(selectedFiles);
            setSelectedFiles([]);
            await loadDocs();
        } catch (e) { console.error(e); }
        finally { setUploading(false); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try { await deleteDocument(id); await loadDocs(); } catch (e) { console.error(e); }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;

        const userMsg = { id: Date.now(), role: 'user', text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setLoadingStage(0);

        if (documents.length === 0) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1, role: 'assistant',
                    text: 'No documents are indexed yet. Upload research PDFs in the panel on the left to begin analysis.',
                    citations: [], timestamp: new Date(),
                }]);
                setLoading(false);
            }, 600);
            return;
        }

        try {
            // Simulate pipeline stages
            for (let s = 1; s <= 3; s++) {
                await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
                setLoadingStage(s);
            }

            const res = await query(text, 5);
            setLoadingStage(4);
            await new Promise(r => setTimeout(r, 200));

            const d = res.data;
            setMessages(prev => [...prev, {
                id: Date.now() + 1, role: 'assistant',
                text: d.found_evidence ? d.answer : 'No supporting evidence found in the uploaded documents for this question.',
                citations: d.citations || [],
                confidence: d.confidence_score ? Math.round(d.confidence_score * 100) : null,
                timestamp: new Date(),
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1, role: 'error',
                text: err.response?.data?.detail || 'Query failed. Please try again.',
                timestamp: new Date(),
            }]);
        } finally { setLoading(false); setLoadingStage(0); }
    };

    return (
        <div className="h-[calc(100vh-64px)] pt-16 flex">
            {/* ── Left: Document Sidebar ── */}
            <div
                className="w-[300px] shrink-0 border-r border-white/[0.04] flex flex-col bg-surface-1/50"
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); setSelectedFiles(Array.from(e.dataTransfer.files)); }}
            >
                <div className="p-4 border-b border-white/[0.04]">
                    <h2 className="text-[13px] font-semibold text-white/60 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Document Index
                    </h2>
                </div>

                {/* Upload zone */}
                <div className={`mx-4 mt-4 border border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
                    isDragging
                        ? 'border-cyan-500/40 bg-cyan-500/[0.04]'
                        : 'border-white/[0.06] hover:border-white/[0.1]'
                }`}>
                    <p className="text-[11px] text-white/30 mb-2">
                        {isDragging ? 'Drop files here' : 'Drag PDFs here'}
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-[11px] font-medium text-white/50 cursor-pointer transition-all">
                        Browse Files
                        <input type="file" multiple accept=".pdf" className="hidden"
                            onChange={e => setSelectedFiles(Array.from(e.target.files))} />
                    </label>
                </div>

                {/* Selected files */}
                <AnimatePresence>
                    {selectedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mx-4 mt-3 bg-cyan-500/[0.05] border border-cyan-500/15 rounded-xl p-3 overflow-hidden"
                        >
                            <p className="text-[11px] font-medium text-cyan-400/80 mb-2">
                                {selectedFiles.length} file(s) selected
                            </p>
                            {selectedFiles.map((f, i) => (
                                <div key={i} className="text-[10px] text-white/40 truncate py-0.5">
                                    {f.name} <span className="text-white/20">({formatFileSize(f.size)})</span>
                                </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleUpload} disabled={uploading}
                                    className="flex-1 bg-cyan-500/15 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-semibold py-1.5 rounded-lg transition disabled:opacity-50">
                                    {uploading ? 'Uploading…' : 'Upload'}
                                </button>
                                <button onClick={() => setSelectedFiles([])}
                                    className="px-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 text-[11px] rounded-lg transition">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Document list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {documents.length === 0 ? (
                        <div className="text-center py-10">
                            <BookOpen className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            <p className="text-[12px] text-white/25">No documents indexed</p>
                            <p className="text-[11px] text-white/15 mt-1">Upload PDFs to begin</p>
                        </div>
                    ) : documents.map(doc => (
                        <motion.div key={doc.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.07] rounded-xl p-3 group transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-medium text-white/70 truncate">{doc.filename}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-white/25">{doc.total_pages ?? '—'} pages</span>
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase ${
                                            doc.status === 'indexed'
                                                ? 'bg-emerald-500/10 text-emerald-400/80'
                                                : 'bg-amber-500/10 text-amber-400/80'
                                        }`}>{doc.status || 'pending'}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(doc.id, doc.filename)}
                                    className="text-white/10 hover:text-rose-400 p-1 rounded transition opacity-0 group-hover:opacity-100 text-[11px]">
                                    ✕
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── Right: Chat ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-[15px] font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            Research Assistant
                        </h1>
                        <p className="text-[12px] text-white/30 mt-0.5">
                            {documents.length > 0
                                ? `${documents.length} document(s) · Evidence-verified responses`
                                : 'Upload documents to enable research queries'}
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center max-w-sm"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-7 h-7 text-cyan-400/60" />
                                </div>
                                <h3 className="text-lg font-semibold text-white/80 mb-2">Start a research query</h3>
                                <p className="text-[13px] text-white/30 leading-relaxed">
                                    Ask questions about your uploaded documents.
                                    Every answer is grounded in real citations.
                                </p>
                            </motion.div>
                        </div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <motion.div key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'error' ? (
                                        <div className="max-w-md bg-rose-500/[0.06] border border-rose-500/15 rounded-xl p-4 flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[12px] font-medium text-rose-300">Error</p>
                                                <p className="text-[12px] text-rose-300/70 mt-0.5">{msg.text}</p>
                                            </div>
                                        </div>
                                    ) : msg.role === 'user' ? (
                                        <div className="max-w-lg">
                                            <div className="bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-tr-md px-4 py-3">
                                                <p className="text-[13px] text-white/80 leading-relaxed">{msg.text}</p>
                                            </div>
                                            <p className="text-[10px] text-white/15 text-right mt-1 pr-1">
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-w-2xl w-full space-y-3">
                                            {/* Answer */}
                                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl rounded-tl-md p-5">
                                                <p className="text-[13px] text-white/75 leading-[1.75]">{msg.text}</p>
                                                {msg.confidence != null && (
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                                                        <Percent className="w-3 h-3 text-cyan-400/60" />
                                                        <span className="text-[11px] text-white/30">
                                                            Confidence: <span className="text-cyan-400/80 font-medium">{msg.confidence}%</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Citations */}
                                            {msg.citations?.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-semibold text-white/25 uppercase tracking-wider px-1">
                                                        {msg.citations.length} Citation{msg.citations.length > 1 ? 's' : ''}
                                                    </p>
                                                    {msg.citations.map((c, i) => (
                                                        <CitationCard key={i} citation={c} index={i} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <ProcessingStages stage={loadingStage} />
                                </div>
                            )}
                            <div ref={endRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="px-6 py-4 border-t border-white/[0.04] shrink-0">
                    <div className="flex items-center gap-3 max-w-3xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                            placeholder="Ask a research question…"
                            disabled={loading}
                            className="flex-1 bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/30 rounded-xl px-4 py-3 text-[13px] text-white/80 placeholder:text-white/20 outline-none transition-all focus:ring-1 focus:ring-cyan-500/15 disabled:opacity-40"
                        />
                        <motion.button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-11 h-11 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-shadow hover:shadow-cyan-500/25"
                        >
                            <Send className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
