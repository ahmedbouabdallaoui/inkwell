from fastapi import FastAPI
from app.core.database import engine, Base
from app.routes import health_router, books_router, pdf_router, generation_router, challenge_router
from app.routes.internal import router as internal_router

app = FastAPI(title="Inkwell API", version="0.1.0")

app.include_router(health_router)
app.include_router(books_router)
app.include_router(pdf_router)
app.include_router(generation_router)
app.include_router(challenge_router)
app.include_router(internal_router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
