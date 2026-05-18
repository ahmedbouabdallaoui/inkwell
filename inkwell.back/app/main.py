from fastapi import FastAPI
from app.core.database import engine, Base

app = FastAPI(title="Inkwell API", version="0.1.0")


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
