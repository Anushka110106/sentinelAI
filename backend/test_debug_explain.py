from api.models.contradiction_detector import explain_difference

result = explain_difference(
    "The model achieved 95% accuracy on the test set.",
    "The model achieved only 68% accuracy on the same test set."
)
print(f"Result: {result}")

result2 = explain_difference(
    "Increasing batch size improves training stability.",
    "Larger batch sizes led to unstable training in our experiments."
)
print(f"Result2: {result2}")
