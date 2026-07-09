import { motion } from 'framer-motion';
import { DocumentManager3D } from '../components/DocumentManager3D';

export function DocumentsPage() {
    return (
        <div className="min-h-screen bg-earth-beige">
            <div className="py-8 px-4 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black text-earth-dark mb-2">
                        📚 Research Documents
                    </h1>
                    <p className="text-earth-moss text-lg">
                        Upload and manage your PDF research papers. Only real data will be used for analysis.
                    </p>
                </motion.div>

                <DocumentManager3D />
            </div>
        </div>
    );
}
