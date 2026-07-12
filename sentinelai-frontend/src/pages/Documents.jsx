import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, Trash2, RefreshCw, Loader2,
    HardDrive, Check, AlertCircle, Cloud,
} from '../components/Icons';
import { uploadDocuments, getDocuments, deleteDocument } from '../api/client';
import { MOCK_DOCUMENTS } from '../utils/constants';
import { formatDate, formatFileSize } from '../utils/formatters';

export function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getDocuments();
            setDocuments(res.data.documents || []);
        } catch {
            setDocuments(MOCK_DOCUMENTS);
        } finally { setLoading(false); }
    };

    const handleUpload = async () => {
        if (!selectedFiles.length) return;
        setUploading(true);
        setError(null);
        try {
            const res = await uploadDocuments(selectedFiles);
            if (res.data.errors?.length) {
                setError(`Some files failed: ${res.data.errors.map(e => e.error).join(', ')}`);
            }
            setSelectedFiles([]);
            await load();
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally { setUploading(false); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try { await deleteDocument(id); await load(); }
        catch (err) { setError(`Delete failed: ${err.message}`); }
    };

    return (
        <div className="min-h-screen pt-20 pb-16 px-6">
            <div className="max-w-[1000px] mx-auto space-y-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Document Index</h1>
                    <p className="text-[13px] text-white/35">
                        Upload and manage your research PDF library for AI-powered analysis.
                    </p>
                </motion.div>

                {/* Upload Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        setSelectedFiles(Array.from(e.dataTransfer.files));
                    }}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                        isDragging
                            ? 'border-cyan-500/30 bg-cyan-500/[0.03]'
                            : 'border-white/[0.06] hover:border-white/[0.1] bg-white/[0.01]'
                    }`}
                >
                    <div className="max-w-xs mx-auto">
                        <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-colors ${
                            isDragging ? 'bg-cyan-500/15' : 'bg-white/[0.04]'
                        }`}>
                            <Cloud className={`w-6 h-6 transition-colors ${isDragging ? 'text-cyan-400' : 'text-white/25'}`} />
                        </div>
                        <p className="text-[14px] font-medium text-white/60 mb-1">
                            {isDragging ? 'Drop files here' : 'Drag & drop PDFs'}
                        </p>
                        <p className="text-[12px] text-white/25 mb-5">PDF files up to 50MB each</p>
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-[13px] font-medium text-white/60 cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            Browse Files
                            <input type="file" multiple accept=".pdf" className="hidden"
                                onChange={e => setSelectedFiles(Array.from(e.target.files))} />
                        </label>
                    </div>
                </motion.div>

                {/* Selected Files Preview */}
                <AnimatePresence>
                    {selectedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="glass-card p-5 overflow-hidden"
                        >
                            <h3 className="text-[13px] font-semibold text-white/60 mb-3 flex items-center gap-2">
                                <HardDrive className="w-4 h-4" />
                                {selectedFiles.length} file(s) ready
                            </h3>
                            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-lg p-2.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-white/20 shrink-0" />
                                            <span className="text-[12px] text-white/60 truncate">{file.name}</span>
                                        </div>
                                        <span className="text-[11px] text-white/20 shrink-0">{formatFileSize(file.size)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <motion.button onClick={handleUpload} disabled={uploading}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[13px] font-semibold py-2.5 rounded-xl shadow-lg shadow-cyan-500/15 disabled:opacity-50 transition-shadow hover:shadow-cyan-500/25 flex items-center justify-center gap-2">
                                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Files</>}
                                </motion.button>
                                <button onClick={() => setSelectedFiles([])}
                                    className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-[13px] text-white/50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-rose-500/[0.06] border border-rose-500/15 rounded-xl p-4 flex items-start gap-2.5"
                        >
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-rose-300/80">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Documents Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-white/70 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-white/30" />
                        Indexed Documents
                        <span className="text-[11px] text-white/20 font-normal">({documents.length})</span>
                    </h2>
                    <motion.button onClick={load} disabled={loading}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-[11px] text-white/40 font-medium transition-all flex items-center gap-1.5 disabled:opacity-40">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Refresh
                    </motion.button>
                </div>

                {/* Loading */}
                {loading && documents.length === 0 && (
                    <div className="py-16 text-center">
                        <Loader2 className="w-8 h-8 text-cyan-400/40 animate-spin mx-auto mb-3" />
                        <p className="text-[13px] text-white/25">Loading documents…</p>
                    </div>
                )}

                {/* Empty */}
                {!loading && documents.length === 0 && (
                    <div className="py-16 text-center">
                        <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-[15px] font-medium text-white/50 mb-1">No documents yet</p>
                        <p className="text-[12px] text-white/20">Upload research PDFs to begin analysis</p>
                    </div>
                )}

                {/* Document Grid */}
                {documents.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc, i) => (
                            <motion.div key={doc.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="glass-card p-5 group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-cyan-400/70" />
                                    </div>
                                    <button onClick={() => handleDelete(doc.id, doc.filename)}
                                        className="p-1.5 rounded-lg text-white/10 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <h3 className="text-[13px] font-semibold text-white/75 truncate mb-3" title={doc.filename}>
                                    {doc.filename}
                                </h3>
                                <div className="flex items-center gap-3 text-[11px] text-white/30">
                                    <span>{doc.total_pages ?? '—'} pages</span>
                                    <span>·</span>
                                    <span>{formatDate(doc.upload_timestamp)}</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                                        doc.status === 'indexed'
                                            ? 'bg-emerald-500/10 text-emerald-400/80'
                                            : 'bg-amber-500/10 text-amber-400/80'
                                    }`}>
                                        {doc.status === 'indexed' ? <Check className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                                        {doc.status || 'pending'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
