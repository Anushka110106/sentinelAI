import { useState } from 'react';
import { motion } from 'framer-motion';

export function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            text: input,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        // Placeholder for backend integration
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                text: 'Ready for Day 3 integration with backend...',
                citations: []
            }]);
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
            <div className="max-w-4xl mx-auto h-screen flex flex-col py-8 px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <h1 className="text-3xl font-black text-white mb-2">
                        💬 Research Assistant
                    </h1>
                    <p className="text-slate-300">
                        Ask questions about your research documents
                    </p>
                </motion.div>

                {/* Chat Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 bg-slate-800 bg-opacity-50 rounded-lg p-6 mb-4 overflow-y-auto border border-indigo-500 border-opacity-30"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center text-slate-400">
                            <div>
                                <div className="text-6xl mb-4">🤖</div>
                                <p className="text-lg">Start a conversation...</p>
                                <p className="text-sm mt-2">Ready for Day 3 integration</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-md p-4 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-700 text-slate-100'
                                    }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-700 p-4 rounded-lg">
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Input Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg border border-indigo-500 border-opacity-50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    />
                    <motion.button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        Send
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}
