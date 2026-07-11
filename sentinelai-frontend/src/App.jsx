import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar3D } from './components/Navbar3D';
import { ChatPage } from './pages/Chat';
import { GraphPage } from './pages/Graph';
import { ContradictionsPage } from './pages/Contradictions';
import { GapsPage } from './pages/Gaps';
import { DocumentsPage } from './pages/Documents';
import { ThreeDContainer } from './components/ThreeDContainer';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-slate-100">
                <Navbar3D />
                <main className="max-w-7xl mx-auto px-4 py-6">
                    <ThreeDContainer>
                        <Routes>
                            <Route path="/" element={<ChatPage />} />
                            <Route path="/graph" element={<GraphPage />} />
                            <Route path="/contradictions" element={<ContradictionsPage />} />
                            <Route path="/gaps" element={<GapsPage />} />
                            <Route path="/documents" element={<DocumentsPage />} />
                        </Routes>
                    </ThreeDContainer>
                </main>
            </div>
        </Router>
    );
}

export default App;
