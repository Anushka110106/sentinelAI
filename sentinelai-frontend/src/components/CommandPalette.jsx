import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, MessageSquare, Network, GitCompareArrows, FileStack } from './Icons';
import { NAV_ITEMS } from '../utils/constants';

const ICON_MAP = {
    LayoutDashboard, MessageSquare, Network,
    GitCompareArrows, Search, FileStack,
};

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(o => !o);
                setQuery('');
                setSelectedIndex(0);
            } else if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const filtered = NAV_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleSelect = (path) => {
        navigate(path);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => (i + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                handleSelect(filtered[selectedIndex].path);
            }
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -10 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4"
                    >
                        <div className="glass-heavy rounded-2xl shadow-2xl overflow-hidden border border-white/[0.08] flex flex-col">
                            {/* Input */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                                <Search className="w-4 h-4 text-white/30 shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search navigation, tools, analysis…"
                                    className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/20 outline-none border-none"
                                />
                                <span className="text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] shrink-0 font-mono">
                                    ESC
                                </span>
                            </div>

                            {/* List */}
                            <div className="p-2 max-h-72 overflow-y-auto">
                                {filtered.length === 0 ? (
                                    <div className="py-8 text-center text-[12px] text-white/20">
                                        No results found
                                    </div>
                                ) : (
                                    filtered.map((item, idx) => {
                                        const Icon = ICON_MAP[item.iconName];
                                        const isSelected = idx === selectedIndex;
                                        return (
                                            <div
                                                key={item.path}
                                                onClick={() => handleSelect(item.path)}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-white/[0.05] text-white'
                                                        : 'bg-transparent text-white/50'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                                                <span className="text-[12.5px] font-medium flex-1">{item.label}</span>
                                                {isSelected && (
                                                    <span className="text-[10px] text-white/20 shrink-0 font-mono">
                                                        ENTER
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-2 bg-white/[0.01] border-t border-white/[0.04] flex items-center justify-between text-[10px] text-white/20 font-medium shrink-0">
                                <div className="flex gap-3">
                                    <span>↑↓ Navigate</span>
                                    <span>↵ Select</span>
                                </div>
                                <span>Ctrl+K to toggle</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
