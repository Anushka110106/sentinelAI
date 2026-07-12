import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard, MessageSquare, Network,
    GitCompareArrows, Search, FileStack, Activity, Wifi, WifiOff,
} from './Icons';
import { checkHealth } from '../api/client';
import { NAV_ITEMS } from '../utils/constants';

const ICON_MAP = {
    LayoutDashboard, MessageSquare, Network,
    GitCompareArrows, Search, FileStack,
};

export function Navbar() {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [healthy, setHealthy] = useState(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        let mounted = true;
        const check = async () => {
            try {
                await checkHealth();
                if (mounted) setHealthy(true);
            } catch {
                if (mounted) setHealthy(false);
            }
        };
        check();
        const id = setInterval(check, 15000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'glass-heavy shadow-lg'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-shadow">
                            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-bold tracking-tight text-white">
                            Sentinel<span className="text-cyan-400">AI</span>
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = ICON_MAP[item.iconName];
                            const isActive = location.pathname === item.path;
                            return (
                                <Link key={item.path} to={item.path}>
                                    <motion.div
                                        className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-white/45 hover:text-white/75'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-active"
                                                className="absolute inset-0 bg-white/[0.07] border border-white/[0.08] rounded-xl"
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <Icon className="w-4 h-4 relative z-10" strokeWidth={1.8} />
                                        <span className="relative z-10 hidden lg:inline">{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                                healthy === null
                                    ? 'bg-white/[0.03] border-white/[0.06] text-white/30'
                                    : healthy
                                        ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/[0.08] border-rose-500/20 text-rose-400'
                            }`}
                        >
                            {healthy === null ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                            ) : healthy ? (
                                <>
                                    <div className="relative">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                                    </div>
                                    <Wifi className="w-3 h-3" />
                                    <span className="hidden sm:inline">Online</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <WifiOff className="w-3 h-3" />
                                    <span className="hidden sm:inline">Offline</span>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
