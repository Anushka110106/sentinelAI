export function CitationCard({ citations = [] }) {
    if (!citations || citations.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 bg-slate-800/40 border-l-4 border-blue-500 rounded-r-2xl p-4 border border-y-slate-800/60 border-r-slate-800/60">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📄</span>
                <p className="text-sm font-semibold text-slate-300">
                    Supporting Evidence & Sources:
                </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {citations.map((cite, i) => (
                    <div 
                        key={i} 
                        className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-md"
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5 text-xs">◆</span>
                            <span className="text-xs text-slate-200 font-medium break-all line-clamp-2">
                                {cite.doc_name}
                            </span>
                        </div>
                        <div className="flex gap-3 mt-2 pl-4 text-[11px] text-slate-400 font-medium">
                            {cite.page && (
                                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                                    Page {cite.page}
                                </span>
                            )}
                            {cite.para && (
                                <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                                    Para {cite.para}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
