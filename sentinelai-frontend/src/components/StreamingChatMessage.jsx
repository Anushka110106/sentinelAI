import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function StreamingChatMessage({ citations, isStreaming, response, confidence }) {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Typewriter effect for streaming feel
    useEffect(() => {
        if (!isStreaming || !response) {
            setDisplayText(response || '');
            return;
        }

        if (currentIndex < response.length) {
            const timer = setTimeout(() => {
                setDisplayText(prev => prev + response[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, 10); // 10ms per character for smooth typing

            return () => clearTimeout(timer);
        }
    }, [currentIndex, isStreaming, response]);

    useEffect(() => {
        if (!isStreaming) {
            setDisplayText(response || '');
        }
    }, [isStreaming, response]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full space-y-3"
        >
            {/* Answer */}
            <div className="bg-slate-800 border-l-4 border-indigo-500 p-4 rounded-r-xl shadow-lg">
                <p className="text-slate-100 leading-relaxed text-sm">
                    {displayText}
                    {isStreaming && currentIndex < response.length && <span className="animate-pulse ml-0.5">▊</span>}
                </p>
            </div>

            {/* Citations */}
            {citations && citations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 mt-2"
                >
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        📎 {citations.length} Citation(s) {confidence != null && `• Confidence: ${confidence}%`}
                    </p>
                    {citations.map((citation, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-slate-900/40 border border-slate-800 border-l-4 border-l-purple-500 p-3 rounded-r-xl hover:bg-slate-900/60 transition cursor-pointer"
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-xs font-bold text-indigo-300 min-w-[20px]">
                                    [{i + 1}]
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">
                                        {citation.doc_name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Page {citation.page} {citation.paragraph != null && `• ¶ ${citation.paragraph}`} • 
                                        <span className="text-indigo-400 ml-1 font-semibold">
                                            {((citation.similarity_score ?? 0) * 100).toFixed(0)}% match
                                        </span>
                                    </p>
                                    {citation.snippet && (
                                        <p className="text-xs text-slate-300 mt-2 italic leading-relaxed border-t border-slate-900 pt-2">
                                            "{citation.snippet.substring(0, 150)}{citation.snippet.length > 150 ? '...' : ''}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}

export default StreamingChatMessage;
