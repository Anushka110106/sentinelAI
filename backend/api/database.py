import sqlite3
import json
import os
import time
from typing import List, Dict, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sentinelai.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        total_pages INTEGER,
        filepath TEXT,
        status TEXT NOT NULL
    )
    """)
    
    # Chunks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chunks (
        chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT,
        doc_name TEXT,
        page INTEGER,
        paragraph INTEGER,
        text TEXT,
        FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
    )
    """)
    
    # Claims table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT,
        claim TEXT,
        source_text TEXT,
        confidence REAL,
        FOREIGN KEY (doc_id) REFERENCES documents (id) ON DELETE CASCADE
    )
    """)
    
    # Contradictions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contradictions (
        id TEXT PRIMARY KEY,
        topic TEXT,
        severity TEXT,
        claim_a TEXT,
        doc_a TEXT,
        page_a INTEGER,
        claim_b TEXT,
        doc_b TEXT,
        page_b INTEGER,
        description TEXT,
        explanation TEXT,
        differences TEXT,
        confidence REAL
    )
    """)
    
    # Gaps table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gaps (
        id TEXT PRIMARY KEY,
        title TEXT,
        priority TEXT,
        details TEXT,
        source_ref TEXT,
        suggestion TEXT
    )
    """)
    
    # Graph Nodes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_nodes (
        id TEXT PRIMARY KEY,
        label TEXT,
        type TEXT,
        desc TEXT,
        color TEXT,
        x REAL,
        y REAL
    )
    """)
    
    # Graph Links table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        target TEXT,
        type TEXT,
        color TEXT,
        FOREIGN KEY (source) REFERENCES graph_nodes (id) ON DELETE CASCADE,
        FOREIGN KEY (target) REFERENCES graph_nodes (id) ON DELETE CASCADE
    )
    """)

    # Chat history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answer TEXT,
        citations TEXT,
        created_at REAL
    )
    """)
    
    conn.commit()
    conn.close()

# Helper class for DB interactions
class SentinelDB:
    @staticmethod
    def get_all_documents() -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    
    @staticmethod
    def add_document(doc_id: str, filename: str, total_pages: int, filepath: str, status: str = "uploaded"):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO documents (id, filename, total_pages, filepath, status) VALUES (?, ?, ?, ?, ?)",
            (doc_id, filename, total_pages, filepath, status)
        )
        conn.commit()
        conn.close()
        
    @staticmethod
    def update_document_status(doc_id: str, status: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET status = ? WHERE id = ?", (status, doc_id))
        conn.commit()
        conn.close()

    @staticmethod
    def delete_document(doc_id: str):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        cursor.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
        cursor.execute("DELETE FROM claims WHERE doc_id = ?", (doc_id,))
        conn.commit()
        conn.close()
        
    @staticmethod
    def add_chunks(chunks_data: List[Dict]):
        conn = get_db_connection()
        cursor = conn.cursor()
        for chunk in chunks_data:
            cursor.execute(
                "INSERT INTO chunks (doc_id, doc_name, page, paragraph, text) VALUES (?, ?, ?, ?, ?)",
                (chunk['doc_id'], chunk['doc_name'], chunk['page'], chunk.get('paragraph', 0), chunk['text'])
            )
        conn.commit()
        conn.close()

    @staticmethod
    def get_all_chunks() -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM chunks")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def add_claims(claims_data: List[Dict]):
        conn = get_db_connection()
        cursor = conn.cursor()
        for claim in claims_data:
            cursor.execute(
                "INSERT INTO claims (doc_id, claim, source_text, confidence) VALUES (?, ?, ?, ?)",
                (claim['doc_id'], claim['claim'], claim.get('source_text', ''), claim.get('confidence', 0.8))
            )
        conn.commit()
        conn.close()

    @staticmethod
    def get_all_claims() -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM claims")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def save_contradictions(contradictions: List[Dict]):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM contradictions")
        for item in contradictions:
            differences_str = json.dumps(item.get('differences', {}))
            cursor.execute(
                """INSERT INTO contradictions 
                (id, topic, severity, claim_a, doc_a, page_a, claim_b, doc_b, page_b, description, explanation, differences, confidence) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    item.get('id', ''),
                    item.get('topic', 'Discrepancy'),
                    item.get('severity', 'Medium'),
                    item.get('claim_a', ''),
                    item.get('doc_a', ''),
                    item.get('page_a', 0),
                    item.get('claim_b', ''),
                    item.get('doc_b', ''),
                    item.get('page_b', 0),
                    item.get('description', ''),
                    item.get('explanation', ''),
                    differences_str,
                    item.get('confidence', 0.0)
                )
            )
        conn.commit()
        conn.close()

    @staticmethod
    def get_contradictions() -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM contradictions")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for r in rows:
            d = dict(r)
            try:
                d['differences'] = json.loads(d['differences'])
            except:
                d['differences'] = {}
            result.append(d)
        return result

    @staticmethod
    def save_gaps(gaps: List[Dict]):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM gaps")
        for gap in gaps:
            cursor.execute(
                "INSERT INTO gaps (id, title, priority, details, source_ref, suggestion) VALUES (?, ?, ?, ?, ?, ?)",
                (gap.get('id'), gap.get('title'), gap.get('priority'), gap.get('details'), gap.get('source_ref'), gap.get('suggestion'))
            )
        conn.commit()
        conn.close()

    @staticmethod
    def get_gaps() -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM gaps")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def save_graph(graph_data: Dict):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM graph_links")
        cursor.execute("DELETE FROM graph_nodes")
        
        for node in graph_data.get('nodes', []):
            cursor.execute(
                "INSERT INTO graph_nodes (id, label, type, desc, color, x, y) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (node.get('id'), node.get('label'), node.get('type'), node.get('desc'), node.get('color'), node.get('x', 0), node.get('y', 0))
            )
            
        for link in graph_data.get('links', []):
            cursor.execute(
                "INSERT INTO graph_links (source, target, type, color) VALUES (?, ?, ?, ?)",
                (link.get('source'), link.get('target'), link.get('type'), link.get('color'))
            )
        conn.commit()
        conn.close()

    @staticmethod
    def get_graph_data() -> Dict:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM graph_nodes")
        nodes_rows = cursor.fetchall()
        cursor.execute("SELECT * FROM graph_links")
        links_rows = cursor.fetchall()
        conn.close()
        
        return {
            "nodes": [dict(n) for n in nodes_rows],
            "links": [dict(l) for l in links_rows]
        }

    @staticmethod
    def add_chat_message(question: str, answer: str, citations: List[Dict]):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_history (question, answer, citations, created_at) VALUES (?, ?, ?, ?)",
            (question, answer, json.dumps(citations), time.time())
        )
        conn.commit()
        conn.close()

    @staticmethod
    def get_chat_history() -> List[Dict]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM chat_history ORDER BY created_at ASC")
        rows = cursor.fetchall()
        conn.close()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d['citations'] = json.loads(d['citations'])
            except:
                d['citations'] = []
            result.append(d)
        return result

    @staticmethod
    def clear_chat_history():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_history")
        conn.commit()
        conn.close()

init_db()
