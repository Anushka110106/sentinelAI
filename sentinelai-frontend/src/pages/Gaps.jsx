import { useState, useEffect } from 'react';
import { getGaps } from '../api/client';

export function GapsPage() {
    const [gaps, setGaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getGaps()
            .then(res => {
                if (res.data) {
                    setGaps(res.data);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.log('Research Gaps API offline, loading mock fallback', err);
                // Fallback mock data
                setGaps([
                    {
                        id: 'g-1',
                        title: 'Missing Cargo Manifests: North Sector',
                        priority: 'High',
                        details: 'Reports from June 10-15 make multiple references to convoy deliveries, but the database contains no cargo manifests or dispatch sheets verifying the cargo contents.',
                        source_ref: 'recon_report_north.pdf (Page 15)',
                        suggestion: 'Upload logistics logs or base receipt vouchers matching June 10-15.'
                    },
                    {
                        id: 'g-2',
                        title: 'Patrol Team Delta Roster',
                        priority: 'Medium',
                        details: 'Patrol logs state Team Delta was dispatched to sector 4 grid coordinates 21-04, but the individual personnel roster, mission commander, and communications frequency logs are completely absent.',
                        source_ref: 'patrol_schedule_june.pdf (Page 4)',
                        suggestion: 'Upload platoon allocation roster files or communications log sheets.'
                    },
                    {
                        id: 'g-3',
                        title: 'Base Camp Alpha Fuel Reports',
                        priority: 'Low',
                        details: 'Reports state base operations are running at 100% capacity, but fuel inventory figures and reserve generator health reports are missing.',
                        source_ref: 'maintenance_status.pdf (Page 1)',
                        suggestion: 'Upload fuel management spreadsheets or generator inspection reports.'
                    }
                ]);
                setIsLoading(false);
            });
    }, []);

    const getPriorityStyles = (priority) => {
        switch (priority.toLowerCase()) {
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
                    Identified Research Gaps
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Analysis of missing links, unrecorded manifests, or referenced documents that are absent from the database.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></span>
                </div>
            ) : gaps.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-slate-800">
                    <span className="text-4xl">🔍</span>
                    <h3 className="text-lg font-bold text-slate-200 mt-4">No research gaps detected</h3>
                    <p className="text-sm text-slate-400 mt-1">All referenced logs and supporting records are fully uploaded and accounted for.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gaps.map((gap) => (
                        <div 
                            key={gap.id} 
                            className="glass rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 transition-all duration-300 shadow-xl flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Title & Priority */}
                                <div className="flex justify-between items-start gap-3">
                                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                                        🔍 {gap.title}
                                    </h3>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${getPriorityStyles(gap.priority)}`}>
                                        {gap.priority} Priority
                                    </span>
                                </div>

                                {/* Details */}
                                <p className="text-xs text-slate-300 leading-relaxed min-h-[60px]">
                                    {gap.details}
                                </p>

                                {/* Source ref */}
                                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                                        Identified In Source
                                    </span>
                                    <span className="text-[11px] font-medium text-blue-400 block mt-0.5 truncate">
                                        {gap.source_ref}
                                    </span>
                                </div>
                            </div>

                            {/* Resolution Suggestion */}
                            <div className="mt-5 pt-4 border-t border-slate-800/80">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                                    Recommended Action
                                </span>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed italic">
                                    "{gap.suggestion}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
