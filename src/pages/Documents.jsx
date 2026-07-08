import { motion } from 'framer-motion';
import { DocumentManager3D } from '../components/DocumentManager3D';

export function DocumentsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
            <div className="py-8 px-4 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        📚 Research Documents
                    </h1>
                    <p className="text-slate-300 text-lg">
                        Upload and manage your research papers with advanced 3D interface
                    </p>
                </motion.div>

                <DocumentManager3D />
            </div>
        </div>
    );
}
