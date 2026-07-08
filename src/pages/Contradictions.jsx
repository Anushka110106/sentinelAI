import { useState, useEffect } from 'react';
import { getContradictions } from '../api/client';

export function ContradictionsPage() {
    const [contradictions, setContradictions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getContradictions()
            .then(res => {
                if (res.data) {
                    setContradictions(res.data);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.log('Contradiction API offline, loading mock fallback', err);
                // Fallback mock data
                setContradictions([
                    {
                        id: 'c-1',
                        topic: 'Base Camp Alpha Coordinates',
                        severity: 'High',
                        claim_a: 'Base Camp Alpha is established at grid coordinates 45.12, -89.43.',
                        doc_a: 'recon_report_north.pdf',
                        page_a: 12,
                        claim_b: 'Visual satellite checks verify grid coordinates 45.12, -89.43 are empty sand.',
                        doc_b: 'sat_recon_v3.pdf',
                        page_b: 2,
                        description: 'Discrepancy between operational reports claiming bases exist versus photographic confirmation.'
                    },
                    {
                        id: 'c-2',
                        topic: 'Supply Convoy 4 Departure',
                        severity: 'Medium',
                        claim_a: 'Convoy 4 departed the depot at 04:00 hours for Sector 2.',
                        doc_a: 'depot_dispatch_logs.pdf',
                        page_a: 43,
                        claim_b: 'Convoy 4 did not leave the depot until 07:15 hours due to generator failure.',
                        doc_b: 'incident_reports_east.pdf',
                        page_b: 8,
                        description: 'Time variance affects timeline of troop arrivals at Sector 2 check points.'
                    },
                    {
                        id: 'c-3',
                        topic: 'Sector 4 Patrol Count',
                        severity: 'Low',
                        claim_a: 'Daily patrols in Sector 4 are maintained at 3 teams.',
                        doc_a: 'patrol_schedule_june.pdf',
                        page_a: 5,
                        claim_b: 'Sector 4 was patrolled by only 2 teams due to vehicle shortage.',
                        doc_b: 'maintenance_status.pdf',
                        page_b: 1,
                        description: 'Patrol records do not match actual resource availability logs.'
                    }
                ]);
                setIsLoading(false);
            });
    }, []);

    const getSeverityStyles = (severity) => {
        switch (severity.toLowerCase()) {
            case 'high':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'medium':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default:
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-[calc(100vh-80px)]">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Cross-Document Contradictions
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    System-extracted conflicts and logical clashes discovered across your document database.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></span>
                </div>
            ) : contradictions.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-slate-800">
                    <span className="text-4xl">⚖️</span>
                    <h3 className="text-lg font-bold text-slate-200 mt-4">No contradictions found</h3>
                    <p className="text-sm text-slate-400 mt-1">Excellent! All uploaded documents are in logical agreement.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {contradictions.map((item) => (
                        <div 
                            key={item.id} 
                            className="glass rounded-2xl p-6 border border-slate-800 hover:border-slate-700/80 transition-all duration-300 shadow-xl flex flex-col gap-4"
                        >
                            {/* Title & Severity */}
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                        <span>⚖️</span> {item.topic}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${getSeverityStyles(item.severity)}`}>
                                    {item.severity} Severity
                                </span>
                            </div>

                            {/* Claims Comparison Container */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {/* Claim A */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                            Claim Version A
                                        </span>
                                        <p className="text-sm text-slate-300 italic">
                                            "{item.claim_a}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-slate-400">
                                        <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 truncate max-w-[200px]">
                                            {item.doc_a}
                                        </span>
                                        {item.page_a && (
                                            <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded shrink-0">
                                                Page {item.page_a}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Claim B */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                                            Claim Version B
                                        </span>
                                        <p className="text-sm text-slate-300 italic">
                                            "{item.claim_b}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-slate-400">
                                        <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 truncate max-w-[200px]">
                                            {item.doc_b}
                                        </span>
                                        {item.page_b && (
                                            <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded shrink-0">
                                                Page {item.page_b}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
