import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { query, getDocuments, uploadDocuments, deleteDocument } from '../api/client';
import { Upload3DZone } from './Canvas3D/Upload3DZone';
import { StreamingChatMessage } from './StreamingChatMessage';
import { LoadingProgress } from './LoadingProgress';

export function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [loadingStage, setLoadingStage] = useState(0);
    const [loadingDetails, setLoadingDetails] = useState('');
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const loadDocuments = async () => {
        setLoadingDocs(true);
        try {
            const response = await getDocuments();
            setDocuments(response.data.documents || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleFilesSelected = (files) => {
        setSelectedFiles(Array.from(files));
        setUploadError(null);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
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
        } catch (err) {
            setUploadError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId, docName) => {
        if (!window.confirm(`Are you sure you want to delete "${docName}"?`)) {
            return;
        }
        try {
            await deleteDocument(docId);
            await loadDocuments();
        } catch (err) {
            console.error('Failed to delete document:', err);
        }
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            role: 'user',
            text: trimmed,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError(null);
        setLoadingStage(0);
        setLoadingDetails('Cleaning query terms and removing stop words...');

        // If no documents are loaded, respond with a help/warning message
        if (documents.length === 0) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'assistant',
                    text: '⚠️ I do not have any intelligence files or documents indexed. Please drag & drop or select research PDFs in the Document Repository panel on the left to start analyzing them.',
                    citations: [],
                    found_evidence: false,
                    timestamp: new Date(),
                }]);
                setLoading(false);
            }, 800);
            return;
        }

        try {
            // Stage 1: Search
            await new Promise(resolve => setTimeout(resolve, 350));
            setLoadingStage(1);
            setLoadingDetails('Running FAISS approximate nearest neighbors search...');

            // Stage 2: Retrieve
            await new Promise(resolve => setTimeout(resolve, 450));
            setLoadingStage(2);
            setLoadingDetails('Fetching document text snippets and ranking...');

            // Stage 3: Generate
            setLoadingStage(3);
            setLoadingDetails('Invoking LLM to formulate answer from excerpts...');
            
            const response = await query(trimmed, 5);
            
            // Stage 4: Format
            setLoadingStage(4);
            setLoadingDetails('Calculating confidence score and building citations...');
            await new Promise(resolve => setTimeout(resolve, 250));
            
            const data = response.data;

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                text: data.found_evidence
                    ? data.answer
                    : 'I could not find any supporting evidence for this question in the uploaded documents. Please upload more relevant research papers or rephrase your question.',
                citations: data.citations || [],
                found_evidence: data.found_evidence,
                confidence: data.confidence_score ? Math.round(data.confidence_score * 100) : null,
                retrieval_time: data.retrieval_time_ms,
                generation_time: data.generation_time_ms,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage = {
                id: Date.now() + 1,
                role: 'error',
                text: err.response?.data?.detail || 'Failed to process query. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            setLoadingStage(0);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasDocuments = documents.length > 0;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)] min-h-[550px] max-h-[850px] w-full text-slate-100">
            {/* Left Panel - Document Repository */}
            <div 
                className="w-full lg:w-96 flex flex-col bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-5 h-full overflow-hidden shadow-2xl"
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilesSelected(e.dataTransfer.files);
                }}
            >
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-300">
                        📁 Document Panel
                    </h2>
                    <button 
                        onClick={loadDocuments} 
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 transition"
                        title="Reload documents"
                    >
                        🔄
                    </button>
                </div>

                {/* 3D Upload Zone */}
                <div className="shrink-0 mb-4 rounded-xl overflow-hidden shadow-md">
                    <Upload3DZone isActive={isDragging} />
                </div>

                {/* Local file picker fallback triggers */}
                <div className="shrink-0 mb-4 flex justify-center">
                    <label className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer transition shadow-md shadow-indigo-600/10">
                        Browse PDFs
                        <input
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Selected Files Preview */}
                <AnimatePresence>
                    {selectedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="shrink-0 bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-3 mb-4 overflow-hidden"
                        >
                            <h3 className="text-xs font-bold text-indigo-300 mb-2">
                                📦 {selectedFiles.length} file(s) selected
                            </h3>
                            <div className="max-h-24 overflow-y-auto space-y-1 mb-3 text-xs text-slate-300 scrollbar-thin">
                                {selectedFiles.map((file, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded">
                                        <span className="truncate pr-2">{file.name}</span>
                                        <span className="text-[10px] opacity-75 shrink-0">
                                            {(file.size / 1024 / 1024).toFixed(1)}MB
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 rounded text-xs transition disabled:opacity-50"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Files'}
                                </button>
                                <button
                                    onClick={() => setSelectedFiles([])}
                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upload Error message */}
                {uploadError && (
                    <div className="shrink-0 bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg text-xs text-red-300 mb-4">
                        ⚠️ {uploadError}
                    </div>
                )}

                {/* Documents List */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1 scrollbar-thin">
                    {loadingDocs && documents.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs animate-pulse">
                            ⏳ Loading document list...
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                            📂 No documents indexed.<br/>Upload files above to start.
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div 
                                key={doc.id} 
                                className="bg-slate-950/40 hover:bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex justify-between items-start gap-2 transition"
                            >
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-slate-200 truncate" title={doc.filename}>
                                        📄 {doc.filename}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                        <span>📖 {doc.total_pages ?? '—'} pgs</span>
                                        <span>·</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                                            doc.status === 'indexed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                            {doc.status || 'uploaded'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.id, doc.filename)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors text-xs"
                                    title="Delete document"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel - Chat Interface */}
            <div className="flex-1 flex flex-col bg-slate-900/90 backdrop-blur-md border border-indigo-500/20 rounded-2xl h-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-950/50 border-b border-indigo-500/10 px-6 py-4 shrink-0 flex justify-between items-center">
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2 text-indigo-300">
                            💬 Research Assistant
                        </h1>
                        <p className="text-slate-400 text-xs mt-0.5">
                            {hasDocuments
                                ? `${documents.length} document(s) loaded · Answers verified with real citations`
                                : 'Upload PDF documents on the left to start researching'}
                        </p>
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex items-center justify-center text-center"
                        >
                            <div className="max-w-md px-6">
                                <div className="text-5xl mb-4 float">🤖</div>
                                <h3 className="text-xl font-bold text-slate-100">
                                    SentinelAI Intel Engine
                                </h3>
                                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                    Ask natural language questions about your research library. Our AI indexes your files and verifies answers against real citations, completely avoiding hallucinations.
                                </p>
                                {!hasDocuments && (
                                    <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                                        👉 Get started by dragging a PDF into the uploader panel on the left!
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'error' ? (
                                        <div className="max-w-xl bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-xs text-red-300 flex items-center gap-2">
                                            <span>⚠️</span>
                                            <div>
                                                <p className="font-bold">Query Error</p>
                                                <p className="mt-0.5">{msg.text}</p>
                                            </div>
                                        </div>
                                    ) : msg.role === 'user' ? (
                                        <div className="max-w-xl bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md shadow-indigo-600/5">
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <p className="text-[10px] opacity-50 mt-1 text-right">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-w-2xl w-full">
                                            <StreamingChatMessage
                                                response={msg.text}
                                                citations={msg.citations}
                                                confidence={msg.confidence}
                                                isStreaming={false}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Loading Indicator */}
                            {loading && (
                                <div className="flex justify-start w-full">
                                    <LoadingProgress 
                                        stage={loadingStage}
                                        details={loadingDetails}
                                    />
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mx-6 mb-2 bg-red-950/40 border border-red-500/35 p-3 rounded-xl text-xs text-red-300 flex items-center gap-2 shrink-0"
                        >
                            <span>⚠️</span> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Message Input Box */}
                <div className="bg-slate-950/50 border-t border-indigo-500/10 p-4 shrink-0">
                    <div className="flex gap-3 max-w-4xl mx-auto">
                        <input
                            id="chat-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about the loaded research reports..."
                            disabled={loading}
                            className="flex-1 bg-slate-950/80 text-white px-4 py-3 rounded-xl border border-indigo-500/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition placeholder-slate-500 text-sm"
                        />
                        <motion.button
                            id="chat-send-btn"
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 10px rgba(79, 70, 229, 0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Send
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
