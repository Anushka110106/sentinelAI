import fitz 

def extract_text_with_metadata(pdf_path):
    """Extract text preserving page/paragraph structure"""
    doc = fitz.open(pdf_path)
    chunks = []
    for page_num, page in enumerate(doc):
        text = page.get_text()
        paragraphs = text.split('\n\n')
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
