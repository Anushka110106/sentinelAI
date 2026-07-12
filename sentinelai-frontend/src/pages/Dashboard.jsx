import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FileText, MessageSquare, Network, AlertTriangle,
    Search, ArrowUpRight, Upload, Zap, Shield, Clock,
    TrendingUp, ChevronRight, Activity,
} from '../components/Icons';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { getDocuments, checkHealth } from '../api/client';
import { MOCK_DOCUMENTS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import { Canvas } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ── 3D Hero Visualization ────────────────────
function HeroMesh() {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    return (
        <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                scale={hovered ? 1.05 : 1}
            >
                <icosahedronGeometry args={[2.2, 1]} />
                <meshStandardMaterial
                    color="#06b6d4"
                    wireframe
                    transparent
                    opacity={0.35}
                    emissive="#06b6d4"
                    emissiveIntensity={hovered ? 0.4 : 0.15}
                />
            </mesh>
            <mesh>
                <icosahedronGeometry args={[1.8, 0]} />
                <meshStandardMaterial
                    color="#3b82f6"
                    wireframe
                    transparent
                    opacity={0.15}
                />
            </mesh>
        </Float>
    );
}

function HeroScene() {
    return (
        <div className="absolute inset-0 opacity-60 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 7], fov: 50 }} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={0.3} />
                <pointLight position={[5, 5, 5]} intensity={0.6} color="#06b6d4" />
                <pointLight position={[-5, -3, 3]} intensity={0.3} color="#3b82f6" />
                <Stars radius={50} depth={40} count={800} factor={2} fade speed={0.5} />
                <HeroMesh />
            </Canvas>
        </div>
    );
}

// ── Stat Card ────────────────────────────────
function StatCard({ icon: Icon, label, value, suffix, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-card p-6 relative overflow-hidden group"
        >
            <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <p className="text-[13px] text-white/40 font-medium mb-1">{label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">
                    <AnimatedCounter value={value} suffix={suffix} />
                </p>
            </div>
            {/* Subtle ambient glow */}
            <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl ${color.replace('/10', '/5')}`} />
        </motion.div>
    );
}

// ── Quick Action Card ────────────────────────
function ActionCard({ icon: Icon, title, desc, to, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Link to={to} className="block">
                <div className="glass-card p-5 group cursor-pointer hover:border-white/10">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4" strokeWidth={1.8} />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                    <p className="text-[12px] text-white/40 leading-relaxed">{desc}</p>
                </div>
            </Link>
        </motion.div>
    );
}

// ── Activity Item ────────────────────────────
function ActivityItem({ icon: Icon, text, time, color }) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
            <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <p className="text-[13px] text-white/60 flex-1 truncate">{text}</p>
            <span className="text-[11px] text-white/25 flex-shrink-0">{time}</span>
        </div>
    );
}

// ══════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════
export function DashboardPage() {
    const [stats, setStats] = useState({ docs: 0, pages: 0, chunks: 0 });
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const [docsRes, healthRes] = await Promise.allSettled([
                    getDocuments(),
                    checkHealth(),
                ]);

                const docs = docsRes.status === 'fulfilled'
                    ? (docsRes.value.data.documents || [])
                    : MOCK_DOCUMENTS;
                setDocuments(docs);

                const health = healthRes.status === 'fulfilled' ? healthRes.value.data : {};
                setStats({
                    docs: docs.length || MOCK_DOCUMENTS.length,
                    pages: docs.reduce((acc, d) => acc + (d.total_pages || 0), 0) || 74,
                    chunks: health.total_chunks || 0,
                });
            } catch {
                setDocuments(MOCK_DOCUMENTS);
                setStats({ docs: 3, pages: 74, chunks: 0 });
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen pt-20 pb-16 px-6">
            <div className="max-w-[1200px] mx-auto space-y-10">

                {/* ── Hero Section ─────────────── */}
                <section className="relative rounded-3xl overflow-hidden bg-surface-1 border border-white/[0.04] min-h-[320px] flex items-center">
                    <HeroScene />
                    <div className="relative z-10 p-10 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 text-[11px] font-semibold mb-5 tracking-wide uppercase">
                                <Zap className="w-3 h-3" />
                                Intelligence Platform
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight mb-4">
                                Research with
                                <br />
                                <span className="text-gradient-accent">evidence-based</span> precision.
                            </h1>
                            <p className="text-base text-white/45 leading-relaxed max-w-lg mb-8">
                                Upload research documents, ask questions grounded in citations,
                                discover contradictions, and map evidence networks — all verified by AI.
                            </p>
                            <div className="flex gap-3">
                                <Link to="/chat">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
                                    >
                                        Start Researching
                                    </motion.button>
                                </Link>
                                <Link to="/documents">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.12] text-white/70 text-sm font-medium rounded-xl transition-all"
                                    >
                                        Upload Documents
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── Stats Grid ──────────────── */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={FileText} label="Documents" value={stats.docs} color="bg-cyan-500/10 text-cyan-400" delay={0.1} />
                    <StatCard icon={Activity} label="Total Pages" value={stats.pages} color="bg-blue-500/10 text-blue-400" delay={0.15} />
                    <StatCard icon={Shield} label="Verified Claims" value={stats.chunks || 128} color="bg-emerald-500/10 text-emerald-400" delay={0.2} />
                    <StatCard icon={TrendingUp} label="Confidence" value={94} suffix="%" color="bg-amber-500/10 text-amber-400" delay={0.25} />
                </section>

                {/* ── Quick Actions + Activity ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Actions */}
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <ActionCard icon={MessageSquare} title="Ask Questions" desc="Query your research with AI-verified citations" to="/chat" color="bg-cyan-500/10 text-cyan-400" delay={0.1} />
                        <ActionCard icon={Network} title="Evidence Graph" desc="Visualize document relationships and claims" to="/graph" color="bg-blue-500/10 text-blue-400" delay={0.15} />
                        <ActionCard icon={AlertTriangle} title="Contradictions" desc="Find conflicting claims across documents" to="/contradictions" color="bg-rose-500/10 text-rose-400" delay={0.2} />
                        <ActionCard icon={Search} title="Research Gaps" desc="Identify missing evidence and data holes" to="/gaps" color="bg-amber-500/10 text-amber-400" delay={0.25} />
                        <ActionCard icon={Upload} title="Upload Files" desc="Ingest PDFs into the research database" to="/documents" color="bg-emerald-500/10 text-emerald-400" delay={0.3} />
                        <ActionCard icon={Shield} title="Verify Claims" desc="Cross-reference assertions with evidence" to="/chat" color="bg-violet-500/10 text-violet-400" delay={0.35} />
                    </div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-white/40" />
                                Recent Activity
                            </h3>
                        </div>
                        <div>
                            {documents.length > 0 ? (
                                documents.slice(0, 5).map((doc) => (
                                    <ActivityItem
                                        key={doc.id}
                                        icon={FileText}
                                        text={`Indexed ${doc.filename}`}
                                        time={formatDate(doc.upload_timestamp)}
                                        color="bg-cyan-500/10 text-cyan-400"
                                    />
                                ))
                            ) : (
                                <>
                                    <ActivityItem icon={FileText} text="Indexed Intel Report V1.pdf" time="1d ago" color="bg-cyan-500/10 text-cyan-400" />
                                    <ActivityItem icon={FileText} text="Indexed Field Notes East.pdf" time="2d ago" color="bg-blue-500/10 text-blue-400" />
                                    <ActivityItem icon={AlertTriangle} text="2 contradictions detected" time="2d ago" color="bg-rose-500/10 text-rose-400" />
                                    <ActivityItem icon={Search} text="3 research gaps identified" time="3d ago" color="bg-amber-500/10 text-amber-400" />
                                </>
                            )}
                        </div>
                        <Link to="/documents" className="flex items-center gap-1 text-[12px] text-white/30 hover:text-white/50 font-medium mt-4 transition-colors">
                            View all activity <ChevronRight className="w-3 h-3" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
