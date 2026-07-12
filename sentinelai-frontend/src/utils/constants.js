// ═══════════════════════════════════════════════
// Constants — SentinelAI Design System
// ═══════════════════════════════════════════════

export const ROUTES = {
    DASHBOARD: '/',
    CHAT: '/chat',
    GRAPH: '/graph',
    CONTRADICTIONS: '/contradictions',
    GAPS: '/gaps',
    DOCUMENTS: '/documents',
};

export const NAV_ITEMS = [
    { path: ROUTES.DASHBOARD, label: 'Overview', iconName: 'LayoutDashboard' },
    { path: ROUTES.CHAT, label: 'Research', iconName: 'MessageSquare' },
    { path: ROUTES.GRAPH, label: 'Graph', iconName: 'Network' },
    { path: ROUTES.CONTRADICTIONS, label: 'Conflicts', iconName: 'GitCompareArrows' },
    { path: ROUTES.GAPS, label: 'Gaps', iconName: 'Search' },
    { path: ROUTES.DOCUMENTS, label: 'Documents', iconName: 'FileStack' },
];

export const ACCENT_COLORS = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', hex: '#06b6d4' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', hex: '#3b82f6' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hex: '#10b981' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', hex: '#f59e0b' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', hex: '#f43f5e' },
};

export const SEVERITY = {
    HIGH: { label: 'High', color: ACCENT_COLORS.rose },
    MEDIUM: { label: 'Medium', color: ACCENT_COLORS.amber },
    LOW: { label: 'Low', color: ACCENT_COLORS.blue },
};

// Mock data for standalone frontend operation
export const MOCK_DOCUMENTS = [
    { id: 'doc-1', filename: 'Intel Report V1.pdf', total_pages: 24, status: 'indexed', upload_timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'doc-2', filename: 'Field Notes East.pdf', total_pages: 12, status: 'indexed', upload_timestamp: new Date(Date.now() - 172800000).toISOString() },
    { id: 'doc-3', filename: 'Recon Summary Q2.pdf', total_pages: 38, status: 'indexed', upload_timestamp: new Date(Date.now() - 259200000).toISOString() },
];

export const MOCK_CONTRADICTIONS = [
    {
        id: 'c-1',
        topic: 'Base Camp Alpha Coordinates',
        doc_a: 'Intel Report V1.pdf',
        claim_a: 'Base Camp Alpha is located at grid coordinates 45-89, confirmed by ground survey.',
        doc_b: 'Field Notes East.pdf',
        claim_b: 'Visual reconnaissance photo shows no base camp at coordinates 45-89.',
        explanation: 'Direct contradiction between ground survey confirmation and aerial visual evidence. One source may have outdated information or coordinates may be misreferenced.',
        confidence: 0.92,
        differences: { location: true, evidence: true, method: true, time: false, source: true },
    },
    {
        id: 'c-2',
        topic: 'Convoy Departure Time',
        doc_a: 'Intel Report V1.pdf',
        claim_a: 'Supply convoy departed at 0400 hours from Forward Base.',
        doc_b: 'Recon Summary Q2.pdf',
        claim_b: 'Convoy departure logged at 0630 hours with delayed clearance.',
        explanation: 'Two-hour discrepancy in reported departure time. Could indicate communication delay or separate convoy movements.',
        confidence: 0.78,
        differences: { time: true, location: false, evidence: true, method: false, source: true },
    },
];

export const MOCK_GAPS = [
    {
        id: 'g-1',
        title: 'Missing Cargo Manifests: North Sector',
        priority: 'High',
        details: 'Reports from June 10-15 reference convoy deliveries, but the database contains no cargo manifests verifying cargo contents.',
        source_ref: 'recon_report_north.pdf (Page 15)',
        suggestion: 'Upload logistics logs or base receipt vouchers matching June 10-15.',
    },
    {
        id: 'g-2',
        title: 'Patrol Team Delta Roster',
        priority: 'Medium',
        details: 'Patrol logs state Team Delta was dispatched to sector 4 grid 21-04, but personnel roster and comms logs are absent.',
        source_ref: 'patrol_schedule_june.pdf (Page 4)',
        suggestion: 'Upload platoon allocation roster or communications log sheets.',
    },
    {
        id: 'g-3',
        title: 'Base Camp Alpha Fuel Reports',
        priority: 'Low',
        details: 'Reports state base operations at 100% capacity, but fuel inventory figures and generator health reports are missing.',
        source_ref: 'maintenance_status.pdf (Page 1)',
        suggestion: 'Upload fuel management spreadsheets or generator inspection reports.',
    },
];

export const MOCK_GRAPH_DATA = {
    nodes: [
        { id: 'doc-1', label: 'Intel Report V1', type: 'document', desc: 'Overview of troop movement logs in North Sector.', x: 180, y: 140 },
        { id: 'doc-2', label: 'Field Notes East', type: 'document', desc: 'Local patrol feedback from East border sector.', x: 520, y: 140 },
        { id: 'doc-3', label: 'Recon Summary Q2', type: 'document', desc: 'Quarterly reconnaissance and surveillance summary.', x: 350, y: 80 },
        { id: 'ev-1', label: 'Base Camp Alpha', type: 'evidence', desc: 'Identified Base Camp Alpha coordinate at grid 45-89.', x: 180, y: 340 },
        { id: 'ev-2', label: 'Supply Convoy Log', type: 'evidence', desc: 'Confirms convoy departed at 0400 hours.', x: 350, y: 260 },
        { id: 'ev-3', label: 'Visual Recon Photo', type: 'evidence', desc: 'Photo showing no base camp at coordinates 45-89.', x: 520, y: 340 },
        { id: 'ev-4', label: 'Patrol Route Delta', type: 'entity', desc: 'Patrol route covering grid sectors 20-24.', x: 350, y: 420 },
    ],
    links: [
        { source: 'doc-1', target: 'ev-1', type: 'supports' },
        { source: 'doc-1', target: 'ev-2', type: 'supports' },
        { source: 'doc-2', target: 'ev-2', type: 'supports' },
        { source: 'doc-2', target: 'ev-3', type: 'supports' },
        { source: 'doc-3', target: 'ev-4', type: 'supports' },
        { source: 'doc-3', target: 'ev-1', type: 'supports' },
        { source: 'ev-1', target: 'ev-3', type: 'contradicts' },
    ],
};
