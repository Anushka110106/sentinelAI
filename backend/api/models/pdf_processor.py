import fitz 

def extract_text_with_metadata(pdf_path, max_chunk_chars=800):
    """Extract text preserving page/paragraph structure, splitting into
    reasonably-sized chunks so retrieval works on focused pieces of text."""
    doc = fitz.open(pdf_path)
    chunks = []
    for page_num, page in enumerate(doc):
        text = page.get_text()

        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

        if len(paragraphs) <= 1:
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            paragraphs = []
            current = ""
            for line in lines:
                if len(current) + len(line) < max_chunk_chars:
                    current += " " + line
                else:
                    if current.strip():
                        paragraphs.append(current.strip())
                    current = line
            if current.strip():
                paragraphs.append(current.strip())

        for para_num, paragraph in enumerate(paragraphs):
            if paragraph.strip():
                chunks.append({
                    'doc_id': pdf_path,
                    'page_num': page_num + 1,
                    'para_num': para_num,
                    'text': paragraph,
                    'char_offset': 0
                })
    return chunks
