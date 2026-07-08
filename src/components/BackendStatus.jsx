import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { checkHealth } from '../api/client';

export function BackendStatus() {
    const [isHealthy, setIsHealthy] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkBackendHealth();
        const interval = setInterval(checkBackendHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkBackendHealth = async () => {
        try {
            await checkHealth();
            setIsHealthy(true);
        } catch (error) {
            setIsHealthy(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                isHealthy
                    ? 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-50'
                    : 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500 border-opacity-50'
            }`}
        >
            <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {isHealthy ? '✅' : '❌'}
            </motion.span>
            {isHealthy ? 'Backend Ready' : 'Backend Offline'}
        </motion.div>
    );
}
