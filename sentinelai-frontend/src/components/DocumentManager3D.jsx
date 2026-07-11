import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocuments, getDocuments, deleteDocument } from '../api/client';
import { Upload3DZone } from './Canvas3D/Upload3DZone';

export function DocumentManager3D() {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const response = await getDocuments();
            // REAL DATA ONLY - use exact response from backend
            setDocuments(response.data.documents || []);
            setUploadError(null);
        } catch (error) {
            console.error('Error loading documents:', error);
            setDocuments([]);
            setUploadError('Could not load documents. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilesSelected = (files) => {
        setSelectedFiles(Array.from(files));
        setUploadError(null);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setUploadError('Please select at least one file');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const response = await uploadDocuments(selectedFiles);

            // Propagate backend errors
            if (response.data.errors && response.data.errors.length > 0) {
                const errorMessages = response.data.errors
                    .map(e => `${e.filename}: ${e.error}`)
                    .join(', ');
                setUploadError(`Upload issues: ${errorMessages}`);
            }

            // REAL DATA - reload from database
            setSelectedFiles([]);
            await loadDocuments();
        } catch (error) {
            const message = error.response?.data?.detail || error.message;
            setUploadError(`Upload failed: ${message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId, docName) => {
        if (!window.confirm(`Delete "${docName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteDocument(docId);
            // REAL DATA - reload from database
            await loadDocuments();
        } catch (error) {
            setUploadError(`Delete failed: ${error.message}`);
        }
    };

    return (
        <div className="space-y-8">
            {/* 3D Upload Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-xl overflow-hidden shadow-md"
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilesSelected(e.dataTransfer.files);
                }}
            >
                <Upload3DZone onDrop={handleFilesSelected} isActive={isDragging} />
            </motion.div>

            {/* File Selection Info */}
            <AnimatePresence>
                {selectedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-indigo-950/60 rounded-xl p-6 border border-indigo-500/30 shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-indigo-300 mb-3">
                            📦 {selectedFiles.length} file(s) ready
                        </h3>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                            {selectedFiles.map((file, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border-l-4 border-indigo-500 border border-y-slate-800 border-r-slate-800"
                                >
                                    <span className="text-slate-200 font-medium truncate">
                                        📄 {file.name}
                                    </span>
                                    <span className="text-sm text-indigo-400 font-semibold ml-2 shrink-0">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
                        >
                            {uploading ? '⏳ Processing & Indexing...' : '🚀 Upload & Index'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {uploadError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-950/40 border border-red-500/30 p-4 rounded-lg text-red-300"
                    >
                        <div className="font-bold">⚠️ Error</div>
                        <div className="text-sm mt-1">{uploadError}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Documents Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-black text-slate-100">📚 Documents</h2>
                    <motion.button
                        onClick={loadDocuments}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-semibold"
                    >
                        {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
                    </motion.button>
                </div>

                {/* Loading State */}
                {loading && documents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="inline-block">
                            <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-4 text-slate-400 font-semibold">Loading documents...</p>
                    </motion.div>
                ) : documents.length === 0 ? (
                    /* Empty State - REAL DATA - no fake documents */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-slate-900/60 rounded-xl border border-slate-800 border-dashed shadow-sm"
                    >
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-xl font-bold text-slate-200">No documents yet</p>
                        <p className="text-slate-400 mt-2">Upload research papers to get started</p>
                    </motion.div>
                ) : (
                    /* Document Grid - REAL DATA ONLY */
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {documents.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ y: -6 }}
                                    className="bg-slate-900/90 rounded-xl shadow-xl p-6 border-l-4 border-indigo-500 border-y-slate-800/80 border-r-slate-800/80 hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-4xl">📄</div>
                                        <motion.button
                                            onClick={() => handleDelete(doc.id, doc.filename)}
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="text-slate-500 hover:text-red-400 text-xl transition-colors"
                                            title="Delete document"
                                        >
                                            ✕
                                        </motion.button>
                                    </div>

                                    <h3 className="font-bold text-slate-200 truncate mb-3 text-base" title={doc.filename}>
                                        {doc.filename}
                                    </h3>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-slate-400">
                                            <span>📖 Pages</span>
                                            <span className="font-semibold text-slate-200">{doc.total_pages ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>🔗 Chunks</span>
                                            <span className="font-semibold text-slate-200">{doc.chunk_count ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>📅 Uploaded</span>
                                            <span className="font-semibold text-slate-200">
                                                {new Date(doc.upload_timestamp).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="pt-3 border-t border-slate-800">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                                                doc.status === 'indexed'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : doc.status === 'processing'
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {doc.status === 'indexed' ? '✅ Ready' : `⏳ ${doc.status}`}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
