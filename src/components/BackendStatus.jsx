import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { checkHealth } from '../api/client';

export function BackendStatus() {
    const [isHealthy, setIsHealthy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        checkBackendHealth();
        const interval = setInterval(checkBackendHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkBackendHealth = async () => {
        try {
            const response = await checkHealth();
            setIsHealthy(true);
            setInfo(response.data);
        } catch (error) {
            setIsHealthy(false);
            setInfo(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-3 rounded-lg text-sm flex items-center gap-2 bg-earth-beige text-earth-moss animate-pulse">
                <span>⏳</span> Checking backend...
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                isHealthy
                    ? 'bg-green-50 text-earth-dark border border-earth-moss'
                    : 'bg-red-50 text-earth-dark border border-earth-brown'
            }`}
        >
            <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {isHealthy ? '✅' : '❌'}
            </motion.span>
            <div className="flex-1 min-w-0">
                {isHealthy ? (
                    <>
                        <div className="font-bold">Backend Ready</div>
                        {info && (
                            <div className="text-xs opacity-70 truncate">
                                {info.documents_indexed ?? 0} docs • {info.total_chunks ?? 0} chunks
                            </div>
                        )}
                    </>
                ) : (
                    <div className="font-bold">Backend Offline</div>
                )}
            </div>
        </motion.div>
    );
}
