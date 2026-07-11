import { Link, useLocation } from 'react-router-dom';

export function Navbar() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Chat', icon: '💬' },
        { path: '/graph', label: 'Graph', icon: '🕸️' },
        { path: '/contradictions', label: 'Contradictions', icon: '⚖️' },
        { path: '/gaps', label: 'Gaps', icon: '🔍' },
        { path: '/documents', label: 'Documents', icon: '📁' },
    ];

    return (
        <nav className="sticky top-0 z-50 glass border-b border-slate-800 text-white shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
                        S
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all duration-300">
                        SentinelAI
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="flex gap-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/5'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                                }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
