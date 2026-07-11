from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import health, documents, query, contradictions, gaps, graph_data

app = FastAPI(
    title="SentinelAI Intelligence Engine",
    description="Backend services for cross-document analysis, contradictions detection, graph navigation, and research gaps identification.",
    version="1.0.0"
)

# Set up CORS middleware
# Vite frontend dev server runs on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(documents.router)
app.include_router(query.router)
app.include_router(contradictions.router)
app.include_router(gaps.router)
app.include_router(graph_data.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to SentinelAI Intelligence Engine API. Access /docs for Interactive API Swagger docs.",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
