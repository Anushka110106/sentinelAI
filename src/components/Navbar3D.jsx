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
        <nav className="bg-white shadow-sm border-b-2 border-earth-moss sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center mb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-earth-dark rounded-lg flex items-center justify-center text-white text-xl shadow-md">
                            🔍
                        </div>
                        <h1 className="text-2xl font-black text-earth-dark tracking-tight">
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
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm ${
                                        location.pathname === item.path
                                            ? 'bg-earth-dark text-white shadow-md'
                                            : 'bg-earth-beige text-earth-dark hover:bg-earth-moss hover:text-white'
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
