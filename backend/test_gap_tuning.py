from api.models.gap_detector import cluster_and_rank_gaps

test_items = [
    # Should cluster: same gap, worded differently, across 3 docs -> should be flagged
    {'doc_id': 'a', 'doc_name': 'paper_a.pdf', 'category': 'limitations', 'text': 'The model was not tested on low-light conditions.'},
    {'doc_id': 'b', 'doc_name': 'paper_b.pdf', 'category': 'limitations', 'text': 'Nighttime performance remains unevaluated.'},
    {'doc_id': 'c', 'doc_name': 'paper_c.pdf', 'category': 'future_work', 'text': 'Future work should test under dark or low-light scenarios.'},

    # Should NOT cluster: only mentioned in 1 doc
    {'doc_id': 'a', 'doc_name': 'paper_a.pdf', 'category': 'limitations', 'text': 'Training required significant GPU resources.'},

    # Should NOT cluster: different gaps entirely
    {'doc_id': 'b', 'doc_name': 'paper_b.pdf', 'category': 'challenges', 'text': 'Real-time inference latency remains a challenge.'},
    {'doc_id': 'c', 'doc_name': 'paper_c.pdf', 'category': 'limitations', 'text': 'The dataset lacks diversity in speaker accents.'},
]

gaps = cluster_and_rank_gaps(test_items, min_doc_mentions=2)
print(f"Found {len(gaps)} gaps (expect 1: the low-light/nighttime cluster across 3 docs)")
for g in gaps:
    print(f"\n  Title: {g['title']}")
    print(f"  Priority: {g['priority']}")
    print(f"  Sources: {g['source_ref']}")
