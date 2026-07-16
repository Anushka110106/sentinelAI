from api.models.contradiction_detector import find_contradictions
import time

test_cases = [
    # Should be caught: clear numeric contradiction
    {'doc_id': 'a', 'claim': 'The model achieved 95% accuracy on the test set.'},
    {'doc_id': 'b', 'claim': 'The model achieved only 68% accuracy on the same test set.'},

    # Should be caught: opposite conclusions
    {'doc_id': 'a', 'claim': 'Increasing batch size improves training stability.'},
    {'doc_id': 'b', 'claim': 'Larger batch sizes led to unstable training in our experiments.'},

    # Should NOT be caught: same claim, different phrasing (not a contradiction)
    {'doc_id': 'a', 'claim': 'The model uses a transformer architecture with 12 layers.'},
    {'doc_id': 'b', 'claim': 'Our approach is based on a 12-layer transformer.'},

    # Should NOT be caught: different topics entirely (low similarity, shouldn't even trigger LLM check)
    {'doc_id': 'a', 'claim': 'The dataset contains 10,000 labeled images.'},
    {'doc_id': 'b', 'claim': 'We propose a new loss function for regression tasks.'},

    # Edge case: related but complementary, not contradictory
    {'doc_id': 'a', 'claim': 'Our method works well on English text.'},
    {'doc_id': 'b', 'claim': 'We extend this approach to also support French and German.'},
]

for threshold in [0.6, 0.7, 0.75, 0.8]:
    print(f"\n{'='*60}")
    print(f"Testing similarity_threshold = {threshold}")
    start = time.time()
    contradictions = find_contradictions(test_cases, similarity_threshold=threshold)
    elapsed = time.time() - start
    print(f"Found {len(contradictions)} contradictions in {elapsed:.1f}s")
    for c in contradictions:
        print(f"  A: {c['claim_a'][:60]}")
        print(f"  B: {c['claim_b'][:60]}")
        print(f"  Confidence: {c['confidence']:.2f}")
