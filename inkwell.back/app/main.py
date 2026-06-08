import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base, get_db
from app.routes import health_router, books_router, pdf_router, generation_router, challenge_router
from app.routes.internal import router as internal_router
from app.services.challenge import seed_todays_challenge_if_missing

app = FastAPI(title="Inkwell API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    async for db in get_db():
        try:
            await seed_todays_challenge_if_missing(db)
            await db.commit()
        except Exception:
            pass
        finally:
            await db.close()
        break


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
