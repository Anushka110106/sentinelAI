import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardPage } from './pages/Dashboard';
import { ChatPage } from './pages/Chat';
import { GraphPage } from './pages/Graph';
import { ContradictionsPage } from './pages/Contradictions';
import { GapsPage } from './pages/Gaps';
import { DocumentsPage } from './pages/Documents';
import { PageTransition } from './components/PageTransition';

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
                <Routes location={location}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/graph" element={<GraphPage />} />
                    <Route path="/contradictions" element={<ContradictionsPage />} />
                    <Route path="/gaps" element={<GapsPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                </Routes>
            </PageTransition>
        </AnimatePresence>
    );
}

import { ToastProvider } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';

function App() {
    return (
        <Router>
            <ErrorBoundary>
                <ToastProvider>
                    <div className="min-h-screen bg-surface-0 text-white">
                        <Navbar />
                        <main>
                            <AnimatedRoutes />
                        </main>
                        <CommandPalette />
                    </div>
                </ToastProvider>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
