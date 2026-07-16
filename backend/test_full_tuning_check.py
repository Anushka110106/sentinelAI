from api.models.contradiction_detector import find_contradictions

test_cases = [
    {'doc_id': 'a', 'claim': 'The model achieved 95% accuracy on the test set.'},
    {'doc_id': 'b', 'claim': 'The model achieved only 68% accuracy on the same test set.'},
    {'doc_id': 'a', 'claim': 'Increasing batch size improves training stability.'},
    {'doc_id': 'b', 'claim': 'Larger batch sizes led to unstable training in our experiments.'},
    {'doc_id': 'a', 'claim': 'The model uses a transformer architecture with 12 layers.'},
    {'doc_id': 'b', 'claim': 'Our approach is based on a 12-layer transformer.'},
    {'doc_id': 'a', 'claim': 'The dataset contains 10,000 labeled images.'},
    {'doc_id': 'b', 'claim': 'We propose a new loss function for regression tasks.'},
    {'doc_id': 'a', 'claim': 'Our method works well on English text.'},
    {'doc_id': 'b', 'claim': 'We extend this approach to also support French and German.'},
]

contradictions = find_contradictions(test_cases, similarity_threshold=0.70)
print(f"Found {len(contradictions)} contradictions (expect exactly 2: accuracy and batch size)")
for c in contradictions:
    print(f"\n  A: {c['claim_a']}")
    print(f"  B: {c['claim_b']}")
    print(f"  Confidence: {c['confidence']:.2f}")
