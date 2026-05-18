from app.routes.books import router as books_router
from app.routes.health import router as health_router
from app.routes.generation import router as generation_router
from app.routes.challenge import router as challenge_router
from app.routes.pdf import router as pdf_router

__all__ = ["books_router", "health_router", "generation_router", "challenge_router", "pdf_router"]
