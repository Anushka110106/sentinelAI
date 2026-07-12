import { useState, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from './Icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, type = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const iconMap = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        error: <AlertCircle className="w-4 h-4 text-rose-400" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        info: <Info className="w-4 h-4 text-cyan-400" />,
    };

    const borderMap = {
        success: 'border-emerald-500/20 bg-emerald-950/20',
        error: 'border-rose-500/20 bg-rose-950/20',
        warning: 'border-amber-500/20 bg-amber-950/20',
        info: 'border-cyan-500/20 bg-cyan-950/20',
    };

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(2px)', transition: { duration: 0.15 } }}
                            layout
                            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl ${borderMap[toast.type] || borderMap.info}`}
                        >
                            <div className="shrink-0 mt-0.5">{iconMap[toast.type]}</div>
                            <p className="text-[12.5px] font-medium text-white/80 leading-relaxed flex-1">
                                {toast.message}
                            </p>
                            <button
                                onClick={() => remove(toast.id)}
                                className="shrink-0 text-white/20 hover:text-white/45 transition-colors p-0.5 rounded-lg"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
