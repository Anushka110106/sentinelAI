from fastapi import APIRouter, HTTPException
from src.graph_builder import GraphBuilder

router = APIRouter(prefix="/api", tags=["analysis"])

@router.get("/graph-data")
async def get_graph_data():
    """
    Retrieve relationship graph data
    """
    try:
        builder = GraphBuilder()
        graph_data = builder.create_graph_data()
        return graph_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
