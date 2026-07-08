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
        <nav className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-4 shadow-2xl border-b-2 border-indigo-500">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-3xl">🔍</span>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            SentinelAI
                        </h1>
                    </motion.div>

                    <div className="w-96">
                        <BackendStatus />
                    </div>
                </div>

                {/* Navigation Items */}
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
                                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                                        location.pathname === item.path
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
