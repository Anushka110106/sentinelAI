import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BackendStatus } from './BackendStatus';

export function Navbar3D() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Chat', icon: '💬' },
        { path: '/graph', label: 'Graph', icon: '🕸️' },
        { path: '/contradictions', label: 'Contradictions', icon: '⚖️' },
        { path: '/gaps', label: 'Gaps', icon: '🎯' },
        { path: '/documents', label: 'Documents', icon: '📚' },
    ];

    return (
        <nav className="bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/30 sticky top-0 z-50 text-white shadow-2xl">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20">
                            🔍
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                            SentinelAI
                        </h1>
                    </motion.div>

                    <div className="w-72">
                        <BackendStatus />
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {navItems.map((item, i) => (
                        <motion.div
                            key={item.path}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link to={item.path}>
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(79, 70, 229, 0.4)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm ${
                                        location.pathname === item.path
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 border border-indigo-400'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60 hover:border-indigo-500/30'
                                    }`}
                                >
                                    <span>{item.icon}</span>
                                    {item.label}
                                </motion.button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </nav>
    );
}
