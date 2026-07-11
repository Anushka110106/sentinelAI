from typing import List, Dict
import random
from src.database import SentinelDB

class GraphBuilder:
    """Build interactive evidence navigation graph"""
    
    def create_graph_data(self) -> Dict:
        """
        Return nodes and links for the interactive frontend SVG visualizer
        """
        docs = SentinelDB.get_all_documents()
        chunks = SentinelDB.get_all_chunks()
        claims = SentinelDB.get_all_claims()
        contradictions = SentinelDB.get_contradictions()
        
        nodes = []
        links = []
        
        # Position generators
        # We place documents in the upper row (y=150)
        # We place evidence claims in the lower row (y=350)
        doc_count = len(docs)
        claim_count = len(claims)
        
        doc_x_spacing = 700 / max(doc_count + 1, 2)
        claim_x_spacing = 700 / max(claim_count + 1, 2)
        
        # 1. Add document nodes
        for idx, doc in enumerate(docs):
            x = int(doc_x_spacing * (idx + 1))
            y = 150
            nodes.append({
                'id': doc['id'],
                'label': doc['filename'][:20] + ('...' if len(doc['filename']) > 20 else ''),
                'type': 'document',
                'desc': f"Intel file with {doc['total_pages']} pages.",
                'color': '#3b82f6',  # Blue
                'x': x,
                'y': y
            })
            
        # 2. Add claim nodes and connect them to their source documents
        claim_node_ids = {}
        for idx, claim in enumerate(claims):
            claim_id = f"claim-{claim['claim_id']}"
            claim_node_ids[claim['claim']] = claim_id
            
            x = int(claim_x_spacing * (idx + 1))
            # Slightly stagger y to prevent node overlaps
            y = 350 + (15 if idx % 2 == 0 else -15)
            
            nodes.append({
                'id': claim_id,
                'label': claim['claim'][:20] + '...',
                'type': 'evidence',
                'desc': claim['claim'],
                'color': '#a78bfa',  # Purple
                'x': x,
                'y': y
            })
            
            # Link from document to its claim
            links.append({
                'source': claim['doc_id'],
                'target': claim_id,
                'type': 'support',
                'color': '#60a5fa'
            })
            
        # 3. Add contradiction links between claims
        for contra in contradictions:
            claim_a_text = contra['claim_a']
            claim_b_text = contra['claim_b']
            
            node_a = None
            node_b = None
            
            # Find node IDs based on claim text substring match
            for node in nodes:
                if node['type'] == 'evidence':
                    if node_a is None and (claim_a_text in node['desc'] or node['desc'] in claim_a_text):
                        node_a = node['id']
                    if node_b is None and (claim_b_text in node['desc'] or node['desc'] in claim_b_text):
                        node_b = node['id']
                        
            if node_a and node_b:
                links.append({
                    'source': node_a,
                    'target': node_b,
                    'type': 'contradiction',
                    'color': '#f43f5e'  # Red
                })
                
        # If database is empty, return a nice mock fallback so the graph always renders
        if not docs:
            return {
                "nodes": [
                    { 'id': 'doc-1', 'label': 'Intel Report V1', 'type': 'document', 'desc': 'Overview of troop movement logs in North Sector.', 'color': '#3b82f6', 'x': 200, 'y': 150 },
                    { 'id': 'doc-2', 'label': 'Field Notes East', 'type': 'document', 'desc': 'Local patrol feedback from East border sector.', 'color': '#3b82f6', 'x': 500, 'y': 150 },
                    { 'id': 'ev-1', 'label': 'Base Camp Alpha', 'type': 'evidence', 'desc': 'Identified Base Camp Alpha coordinate at grid 45-89.', 'color': '#a78bfa', 'x': 200, 'y': 350 },
                    { 'id': 'ev-2', 'label': 'Supply Convoy Log', 'type': 'evidence', 'desc': 'Confirms convoy departed at 0400 hours.', 'color': '#a78bfa', 'x': 350, 'y': 250 },
                    { 'id': 'ev-3', 'label': 'Visual Recon Photo', 'type': 'evidence', 'desc': 'Photo showing no base camp at coordinates 45-89.', 'color': '#f43f5e', 'x': 500, 'y': 350 }
                ],
                "links": [
                    { 'source': 'doc-1', 'target': 'ev-1', 'type': 'support', 'color': '#60a5fa' },
                    { 'source': 'doc-1', 'target': 'ev-2', 'type': 'support', 'color': '#60a5fa' },
                    { 'source': 'doc-2', 'target': 'ev-2', 'type': 'support', 'color': '#60a5fa' },
                    { 'source': 'doc-2', 'target': 'ev-3', 'type': 'support', 'color': '#60a5fa' },
                    { 'source': 'ev-1', 'target': 'ev-3', 'type': 'contradiction', 'color': '#f43f5e' }
                ]
            }
            
        return {"nodes": nodes, "links": links}
