import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { query, getDocuments } from '../api/client';

export function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const loadDocuments = async () => {
        try {
            const response = await getDocuments();
            setDocuments(response.data.documents || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        // Require documents before querying
        if (documents.length === 0) {
            setError('Upload documents first before asking questions.');
            return;
        }

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

        try {
            const response = await query(trimmed, 5);
            const data = response.data;

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                // REAL DATA ONLY - override if no evidence found
                text: data.found_evidence
                    ? data.answer
                    : 'I could not find any supporting evidence for this question in the uploaded documents. Please upload more relevant research papers or rephrase your question.',
                citations: data.citations || [],
                found_evidence: data.found_evidence,
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
        <div className="flex flex-col bg-earth-beige" style={{ height: 'calc(100vh - 113px)' }}>
            {/* Sub-header */}
            <div className="bg-white border-b-2 border-earth-moss px-6 py-4 shadow-sm shrink-0">
                <h1 className="text-2xl font-black text-earth-dark">💬 Research Assistant</h1>
                <p className="text-earth-moss text-sm mt-0.5">
                    {hasDocuments
                        ? `${documents.length} document(s) loaded · Answers backed by real citations`
                        : 'Upload documents to start asking questions'}
                </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex items-center justify-center text-center"
                    >
                        <div>
                            <div className="text-7xl mb-4">{hasDocuments ? '🤔' : '📂'}</div>
                            <p className="text-2xl font-bold text-earth-dark">
                                {hasDocuments ? 'Start Asking Questions' : 'No Documents Loaded'}
                            </p>
                            <p className="text-earth-moss mt-2 max-w-sm">
                                {hasDocuments
                                    ? 'Ask anything about your uploaded research papers'
                                    : 'Go to the Documents tab and upload PDF research papers first'}
                            </p>
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
                                    /* Error message */
                                    <div className="max-w-xl bg-red-50 border-l-4 border-earth-brown p-4 rounded-lg shadow-sm">
                                        <p className="font-bold text-earth-dark text-sm">⚠️ Error</p>
                                        <p className="text-earth-dark text-sm mt-1">{msg.text}</p>
                                    </div>
                                ) : msg.role === 'user' ? (
                                    /* User message */
                                    <div className="max-w-xl bg-earth-dark text-white p-4 rounded-2xl rounded-tr-sm shadow-md">
                                        <p className="text-base leading-relaxed">{msg.text}</p>
                                        <p className="text-xs opacity-60 mt-1 text-right">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ) : (
                                    /* Assistant message with citations */
                                    <div className="max-w-2xl w-full space-y-2">
                                        <div className="bg-white border-l-4 border-earth-moss p-5 rounded-2xl rounded-tl-sm shadow-md">
                                            <p className="text-earth-dark leading-relaxed text-base">{msg.text}</p>

                                            {/* No evidence badge */}
                                            {!msg.found_evidence && (
                                                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700 flex items-center gap-2">
                                                    <span>⚠️</span>
                                                    <span>No supporting evidence found in documents</span>
                                                </div>
                                            )}

                                            {/* Timing info */}
                                            {(msg.retrieval_time != null || msg.generation_time != null) && (
                                                <p className="text-xs text-earth-moss mt-3 opacity-70">
                                                    {msg.retrieval_time != null && `${msg.retrieval_time}ms retrieval`}
                                                    {msg.retrieval_time != null && msg.generation_time != null && ' · '}
                                                    {msg.generation_time != null && `${msg.generation_time}ms generation`}
                                                </p>
                                            )}
                                        </div>

                                        {/* Citations - REAL DATA ONLY */}
                                        {msg.citations && msg.citations.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="space-y-2"
                                            >
                                                <p className="text-xs font-bold text-earth-moss px-1">
                                                    📎 {msg.citations.length} Citation{msg.citations.length > 1 ? 's' : ''}
                                                </p>
                                                {msg.citations.map((citation, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.08 }}
                                                        className="bg-earth-beige p-4 rounded-xl border-l-4 border-earth-teal hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-sm font-black text-earth-teal min-w-8">
                                                                [{i + 1}]
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-earth-dark truncate">
                                                                    {citation.doc_name}
                                                                </p>
                                                                <p className="text-xs text-earth-moss mt-0.5">
                                                                    Page {citation.page}
                                                                    {citation.paragraph != null && `, ¶ ${citation.paragraph}`}
                                                                </p>
                                                                <p className="text-sm text-earth-dark mt-2 italic leading-relaxed">
                                                                    &ldquo;{citation.snippet?.substring(0, 150)}{citation.snippet?.length > 150 ? '…' : ''}&rdquo;
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {/* Loading dots */}
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="bg-white border-l-4 border-earth-moss p-4 rounded-2xl rounded-tl-sm shadow-md">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-2 h-2 bg-earth-moss rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-earth-moss rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-earth-moss rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Alert */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mx-4 mb-2 bg-red-50 border-l-4 border-earth-brown p-3 rounded text-sm text-earth-dark flex items-center gap-2"
                    >
                        <span>⚠️</span> {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="bg-white border-t-2 border-earth-moss p-4 shadow-lg shrink-0">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <input
                        id="chat-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={!hasDocuments ? 'Upload documents first…' : 'Ask a research question…'}
                        disabled={!hasDocuments || loading}
                        className="flex-1 bg-earth-beige text-earth-dark px-4 py-3 rounded-xl border-2 border-earth-moss focus:outline-none focus:border-earth-dark focus:ring-2 focus:ring-earth-dark focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors placeholder-earth-moss placeholder-opacity-60"
                    />
                    <motion.button
                        id="chat-send-btn"
                        onClick={handleSend}
                        disabled={loading || !input.trim() || !hasDocuments}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-earth-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-earth-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
