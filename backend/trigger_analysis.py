from api.main import run_full_analysis
import time

start = time.time()
run_full_analysis()
print(f"Analysis completed in {time.time() - start:.1f}s")

