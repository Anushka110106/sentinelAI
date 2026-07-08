import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocuments, getDocuments, deleteDocument } from '../api/client';
import { Upload3DZone } from './Canvas3D/Upload3DZone';

export function DocumentManager3D() {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const response = await getDocuments();
            setDocuments(response.data.documents || []);
            setUploadError(null);
        } catch (error) {
            console.error('Error loading documents:', error);
            setDocuments([]);
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
            if (response.data.errors && response.data.errors.length > 0) {
                setUploadError(
                    `Some files failed: ${response.data.errors
                        .map(e => e.error)
                        .join(', ')}`
                );
            }
            setSelectedFiles([]);
            await loadDocuments();
        } catch (error) {
            setUploadError(
                error.response?.data?.detail || 'Upload failed. Please try again.'
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId, docName) => {
        if (!window.confirm(`Delete "${docName}"?`)) {
            return;
        }

        try {
            await deleteDocument(docId);
            await loadDocuments();
        } catch (error) {
            setUploadError(`Failed to delete: ${error.message}`);
        }
    };

    return (
        <div className="space-y-8">
            {/* 3D Upload Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-xl overflow-hidden shadow-2xl"
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
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white shadow-lg"
                    >
                        <h3 className="text-lg font-bold mb-3">
                            📦 {selectedFiles.length} file(s) ready to upload
                        </h3>
                        <div className="space-y-2 mb-4">
                            {selectedFiles.map((file, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center justify-between bg-white bg-opacity-10 p-2 rounded"
                                >
                                    <span>{file.name}</span>
                                    <span className="text-sm opacity-75">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full bg-white text-indigo-600 font-bold py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                            {uploading ? '⏳ Uploading...' : '🚀 Upload Files'}
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
                        className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700"
                    >
                        ⚠️ {uploadError}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Documents Grid */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📚 Your Documents</h2>
                    <motion.button
                        onClick={loadDocuments}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
                    </motion.button>
                </div>

                {loading && !documents.length ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 text-gray-500"
                    >
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                        <p className="mt-4 text-lg">Loading documents...</p>
                    </motion.div>
                ) : documents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 text-gray-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg"
                    >
                        <div className="text-5xl mb-4">📚</div>
                        <p className="text-xl font-semibold">No documents yet</p>
                        <p className="text-sm mt-2">Start by uploading some research papers</p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {documents.map((doc) => (
                            <motion.div
                                key={doc.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.3)' }}
                                className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="text-3xl">📄</div>
                                    <motion.button
                                        onClick={() => handleDelete(doc.id, doc.filename)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="text-red-500 hover:text-red-700 text-xl"
                                    >
                                        ✕
                                    </motion.button>
                                </div>
                                <h3 className="font-bold text-gray-800 truncate mb-2">
                                    {doc.filename}
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>📄 {doc.total_pages || '?'} pages</p>
                                    <p>📅 {new Date(doc.upload_timestamp).toLocaleDateString()}</p>
                                    <div className="pt-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            doc.status === 'indexed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {doc.status || 'uploaded'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
