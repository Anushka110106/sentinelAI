import { motion } from 'framer-motion';

export function LoadingProgress({ stage, details }) {
    const stages = [
        { name: 'Preprocessing Query', icon: '🔍' },
        { name: 'Searching Documents', icon: '📚' },
        { name: 'Retrieving Chunks', icon: '🔗' },
        { name: 'Generating Answer', icon: '🤖' },
        { name: 'Formatting Response', icon: '✨' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-2xl mx-auto bg-slate-800 rounded-lg p-6 border border-indigo-500/30"
        >
            <p className="text-slate-300 font-semibold mb-4">Processing your query...</p>
            
            {/* Progress stages */}
            <div className="space-y-3">
                {stages.map((s, i) => (
                    <motion.div
                        key={s.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg transition ${
                            i <= stage
                                ? 'bg-indigo-900/50 border border-indigo-500/50'
                                : 'bg-slate-700/50'
                        }`}
                    >
                        <span className="text-xl">{s.icon}</span>
                        <span className={`text-sm font-medium ${
                            i <= stage ? 'text-indigo-300' : 'text-slate-400'
                        }`}>
                            {s.name}
                        </span>
                        {i === stage && (
                            <div className="ml-auto">
                                <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                        {i < stage && (
                            <div className="ml-auto text-indigo-400">✓</div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Detailed info */}
            {details && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-400 mt-4 text-center"
                >
                    {details}
                </motion.p>
            )}
        </motion.div>
    );
}
export default LoadingProgress;
