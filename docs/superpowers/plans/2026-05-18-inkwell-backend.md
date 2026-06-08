# Inkwell Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Inkwell FastAPI backend with PostgreSQL, Cognito auth, Bedrock AI generation, and AWS infrastructure via Terraform.

**Architecture:** Modular FastAPI app with SQLAlchemy models, Pydantic schemas, service layer, and background task generation. PDF export uses SQS → Lambda pipeline. All AWS infra provisioned with Terraform.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, boto3, Terraform, Docker

---

## File Map

```
inkwell.back/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── book.py
│   │   ├── generation_job.py
│   │   ├── challenge.py
│   │   └── pdf_job.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── book.py
│   │   ├── generation.py
│   │   ├── challenge.py
│   │   └── pdf.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── books.py
│   │   ├── generation.py
│   │   ├── challenge.py
│   │   ├── pdf.py
│   │   └── health.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── generation.py
│   │   ├── pdf.py
│   │   └── challenge.py
│   └── tasks/
│       ├── __init__.py
│       └── generate.py
├── lambda/
│   └── pdf_export/
│       ├── main.py
│       └── requirements.txt
├── terraform/
│   ├── main.tf
│   ├── network.tf
│   ├── ec2.tf
│   ├── rds.tf
│   ├── cognito.tf
│   ├── bedrock.tf
│   ├── storage.tf
│   ├── queue.tf
│   ├── lambda.tf
│   ├── frontend.tf
│   ├── events.tf
│   ├── ses.tf
│   └── outputs.tf
├── tests/
│   ├── conftest.py
│   ├── test_routes/
│   │   ├── __init__.py
│   │   ├── test_books.py
│   │   ├── test_generation.py
│   │   ├── test_challenge.py
│   │   └── test_pdf.py
│   └── test_services/
│       ├── __init__.py
│       ├── test_auth.py
│       ├── test_generation.py
│       └── test_challenge.py
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── README.md
```

---

### Task 1: Project Scaffold + Core Config

**Files:**
- Create: `inkwell.back/requirements.txt`
- Create: `inkwell.back/pyproject.toml`
- Create: `inkwell.back/Dockerfile`
- Create: `inkwell.back/app/__init__.py`
- Create: `inkwell.back/app/main.py`
- Create: `inkwell.back/app/core/__init__.py`
- Create: `inkwell.back/app/core/config.py`
- Create: `inkwell.back/app/core/database.py`
- Create: `inkwell.back/app/core/security.py`
- Create: `inkwell.back/README.md`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.30.0
alembic==1.13.0
pydantic==2.9.0
pydantic-settings==2.5.0
boto3==1.35.0
python-jose[cryptography]==3.3.0
pytest==8.3.0
pytest-asyncio==0.24.0
aiosqlite==0.20.0
httpx==0.27.0
```

- [ ] **Step 2: Create pyproject.toml**

```toml
[project]
name = "inkwell-backend"
version = "0.1.0"
requires-python = ">=3.12"

[build-system]
requires = ["setuptools>=75.0"]
build-backend = "setuptools.backends._legacy:_Backend"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3: Create app/core/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/inkwell"
    cognito_user_pool_id: str = ""
    cognito_client_id: str = ""
    cognito_region: str = "us-east-1"
    bedrock_region: str = "us-east-1"
    s3_covers_bucket: str = "inkwell-covers"
    s3_pdfs_bucket: str = "inkwell-pdfs"
    sqs_pdf_queue_url: str = ""
    aws_default_region: str = "us-east-1"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
```

- [ ] **Step 4: Create app/core/database.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

- [ ] **Step 5: Create app/core/security.py**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    # Placeholder — real JWKS verification added in Task 4
    return {"sub": token, "email": "", "name": ""}


async def get_current_user(claims: dict = Depends(verify_token)) -> dict:
    return claims
```

- [ ] **Step 6: Create app/main.py**

```python
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
```

- [ ] **Step 7: Create app/__init__.py and app/core/__init__.py** (both empty files)

- [ ] **Step 8: Create Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
```

- [ ] **Step 9: Verify the app starts**

Run:
```bash
cd /home/ahmed/dev/js/WebstormProjects/storyteller/inkwell.back
pip install -r requirements.txt
uvicorn app.main:app --port 8000 &
curl http://localhost:8000/api/v1/health
kill %1 2>/dev/null
```
Expected: `{"status":"ok"}`

- [ ] **Step 10: Commit**

```bash
git add inkwell.back/
git commit -m "feat: scaffold Inkwell backend — FastAPI + SQLAlchemy + Docker"
```

---

### Task 2: SQLAlchemy Models

**Files:**
- Create: `inkwell.back/app/models/__init__.py`
- Create: `inkwell.back/app/models/user.py`
- Create: `inkwell.back/app/models/book.py`
- Create: `inkwell.back/app/models/generation_job.py`
- Create: `inkwell.back/app/models/challenge.py`
- Create: `inkwell.back/app/models/pdf_job.py`

- [ ] **Step 1: Create app/models/__init__.py**

```python
from app.models.user import User
from app.models.book import Book
from app.models.generation_job import GenerationJob
from app.models.challenge import Challenge
from app.models.pdf_job import PdfJob

__all__ = ["User", "Book", "GenerationJob", "Challenge", "PdfJob"]
```

- [ ] **Step 2: Create app/models/user.py**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cognito_sub: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_challenge_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    books = relationship("Book", back_populates="user")
    generation_jobs = relationship("GenerationJob", back_populates="user")
    pdf_jobs = relationship("PdfJob", back_populates="user")
```

- [ ] **Step 3: Create app/models/book.py**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    genre: Mapped[str] = mapped_column(String, nullable=False)
    characters: Mapped[str] = mapped_column(String, nullable=False)
    setting: Mapped[str] = mapped_column(String, nullable=False)
    cover_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    pages: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="books")
```

- [ ] **Step 4: Create app/models/generation_job.py**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    genre: Mapped[str] = mapped_column(String, nullable=False)
    characters: Mapped[str] = mapped_column(String, nullable=False)
    setting: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    result_book_id: Mapped[str | None] = mapped_column(String, ForeignKey("books.id"), nullable=True)
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="generation_jobs")
```

- [ ] **Step 5: Create app/models/challenge.py**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[datetime] = mapped_column(Date, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

- [ ] **Step 6: Create app/models/pdf_job.py**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PdfJob(Base):
    __tablename__ = "pdf_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    book_id: Mapped[str] = mapped_column(String, ForeignKey("books.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    download_url: Mapped[str | None] = mapped_column(String, nullable=True)
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="pdf_jobs")
```

- [ ] **Step 7: Verify models import correctly**

Run:
```bash
cd /home/ahmed/dev/js/WebstormProjects/storyteller/inkwell.back
python -c "from app.models import User, Book, GenerationJob, Challenge, PdfJob; print('OK')"
```
Expected: `OK`

- [ ] **Step 8: Commit**

```bash
git add inkwell.back/app/models/
git commit -m "feat: add SQLAlchemy models for User, Book, GenerationJob, Challenge, PdfJob"
```

---

### Task 3: Pydantic Schemas

**Files:**
- Create: `inkwell.back/app/schemas/__init__.py`
- Create: `inkwell.back/app/schemas/book.py`
- Create: `inkwell.back/app/schemas/generation.py`
- Create: `inkwell.back/app/schemas/challenge.py`
- Create: `inkwell.back/app/schemas/pdf.py`

- [ ] **Step 1: Create app/schemas/__init__.py**

```python
from app.schemas.book import BookResponse, BookListResponse
from app.schemas.generation import GenerateRequest, GenerationJobResponse
from app.schemas.challenge import ChallengeResponse
from app.schemas.pdf import PdfExportRequest, PdfJobResponse

__all__ = [
    "BookResponse", "BookListResponse",
    "GenerateRequest", "GenerationJobResponse",
    "ChallengeResponse",
    "PdfExportRequest", "PdfJobResponse",
]
```

- [ ] **Step 2: Create app/schemas/book.py**

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BookResponse(BaseModel):
    id: str
    title: str
    genre: str
    characters: str
    setting: str
    coverImageUrl: str | None = None
    pages: list[str]
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BookListResponse(BaseModel):
    books: list[BookResponse]
    total: int
```

- [ ] **Step 3: Create app/schemas/generation.py**

```python
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.book import BookResponse


class GenerateRequest(BaseModel):
    genre: str
    characters: str
    setting: str


class GenerationJobResponse(BaseModel):
    jobId: str
    status: str
    book: BookResponse | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)
```

- [ ] **Step 4: Create app/schemas/challenge.py**

```python
from datetime import date
from pydantic import BaseModel, ConfigDict


class ChallengeResponse(BaseModel):
    id: str
    prompt: str
    date: date
    streakCount: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
```

- [ ] **Step 5: Create app/schemas/pdf.py**

```python
from pydantic import BaseModel, ConfigDict


class PdfExportRequest(BaseModel):
    bookId: str


class PdfJobResponse(BaseModel):
    jobId: str
    status: str
    downloadUrl: str | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)
```

- [ ] **Step 6: Verify schemas work**

Run:
```bash
cd /home/ahmed/dev/js/WebstormProjects/storyteller/inkwell.back
python -c "from app.schemas import BookResponse, GenerateRequest; print('OK')"
```
Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add inkwell.back/app/schemas/
git commit -m "feat: add Pydantic schemas with camelCase serialization"
```

---

### Task 4: Auth Service — Cognito JWT Verification

**Files:**
- Create: `inkwell.back/app/services/__init__.py`
- Create: `inkwell.back/app/services/auth.py`
- Modify: `inkwell.back/app/core/security.py`

- [ ] **Step 1: Create app/services/__init__.py** (empty)

- [ ] **Step 2: Write the auth service**

```python
# app/services/auth.py
import httpx
from jose import jwk, jwt
from jose.utils import base64url_decode
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User


class CognitoJWKS:
    def __init__(self):
        self._keys: list[dict] | None = None

    async def get_keys(self) -> list[dict]:
        if self._keys is not None:
            return self._keys
        url = f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            self._keys = resp.json()["keys"]
        return self._keys

    def invalidate(self):
        self._keys = None


jwks = CognitoJWKS()


async def verify_cognito_token(token: str) -> dict:
    headers = jwt.get_unverified_headers(token)
    kid = headers.get("kid")
    keys = await jwks.get_keys()
    key = next((k for k in keys if k["kid"] == kid), None)
    if not key:
        raise ValueError("Invalid token: key not found")

    public_key = jwk.construct(key)
    message, encoded_sig = token.rsplit(".", 1)
    decoded_sig = base64url_decode(encoded_sig)

    if not public_key.verify(message.encode(), decoded_sig):
        raise ValueError("Invalid token: signature mismatch")

    claims = jwt.get_unverified_claims(token)
    if claims.get("token_use") != "id":
        raise ValueError("Invalid token: not an id token")

    return claims


async def get_or_create_user(db: AsyncSession, claims: dict) -> User:
    cognito_sub = claims["sub"]
    result = await db.execute(select(User).where(User.cognito_sub == cognito_sub))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            cognito_sub=cognito_sub,
            email=claims.get("email", ""),
            name=claims.get("name", ""),
        )
        db.add(user)
        await db.flush()
    return user
```

- [ ] **Step 3: Update app/core/security.py to use real verification**

```python
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.auth import verify_cognito_token, get_or_create_user
from app.models.user import User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if request.url.path.startswith("/api/v1/internal/"):
        return None
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    try:
        claims = await verify_cognito_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    user = await get_or_create_user(db, claims)
    return user
```

- [ ] **Step 4: Commit**

```bash
git add inkwell.back/app/services/auth.py inkwell.back/app/core/security.py
git commit -m "feat: add Cognito JWT verification service with JWKS caching"
```

---

### Task 5: Books API

**Files:**
- Create: `inkwell.back/app/routes/__init__.py`
- Create: `inkwell.back/app/routes/books.py`
- Create: `inkwell.back/app/routes/health.py`
- Modify: `inkwell.back/app/main.py`

- [ ] **Step 1: Create app/routes/__init__.py**

```python
from app.routes.books import router as books_router
from app.routes.health import router as health_router
from app.routes.generation import router as generation_router
from app.routes.challenge import router as challenge_router
from app.routes.pdf import router as pdf_router

__all__ = ["books_router", "health_router", "generation_router", "challenge_router", "pdf_router"]
```

- [ ] **Step 2: Create app/routes/health.py**

```python
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/api/v1/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Create app/routes/books.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.book import Book
from app.schemas.book import BookResponse, BookListResponse

router = APIRouter(prefix="/api/v1/books", tags=["books"])


@router.get("")
async def list_books(
    page: int = Query(0, ge=0),
    per_page: int = Query(8, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookListResponse:
    total_result = await db.execute(select(func.count(Book.id)).where(Book.user_id == user.id))
    total = total_result.scalar() or 0
    result = await db.execute(
        select(Book)
        .where(Book.user_id == user.id)
        .order_by(Book.created_at.desc())
        .offset(page * per_page)
        .limit(per_page)
    )
    books = result.scalars().all()
    return BookListResponse(
        books=[BookResponse.model_validate(b) for b in books],
        total=total,
    )


@router.get("/{book_id}")
async def get_book(
    book_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookResponse:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user.id))
    book = result.scalar_one_or_none()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return BookResponse.model_validate(book)
```

- [ ] **Step 4: Update app/main.py to include routers**

```python
from fastapi import FastAPI
from app.core.database import engine, Base
from app.routes import health_router, books_router, generation_router, challenge_router, pdf_router

app = FastAPI(title="Inkwell API", version="0.1.0")

app.include_router(health_router)
app.include_router(books_router)
app.include_router(generation_router)
app.include_router(challenge_router)
app.include_router(pdf_router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
```

- [ ] **Step 5: Commit**

```bash
git add inkwell.back/app/routes/ inkwell.back/app/main.py
git commit -m "feat: add health and books routes with pagination"
```

---

### Task 6: Generation Service + Background Task + API

**Files:**
- Create: `inkwell.back/app/services/generation.py`
- Create: `inkwell.back/app/tasks/__init__.py`
- Create: `inkwell.back/app/tasks/generate.py`
- Create: `inkwell.back/app/routes/generation.py`

- [ ] **Step 1: Create app/services/generation.py**

```python
import base64
import json

import boto3

from app.core.config import settings


def generate_story_sync(genre: str, characters: str, setting: str) -> tuple[list[str], bytes]:
    bedrock = boto3.client("bedrock-runtime", region_name=settings.bedrock_region)

    prompt = f"""Write a 400-500 word short story in the {genre} genre.
Characters: {characters}
Setting: {setting}

Return the story split into paragraphs separated by "---". Each paragraph is one page."""

    response = bedrock.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "maxTokens": 1500,
        }),
    )
    body = json.loads(response["body"].read())
    text = body["output"]["message"]["content"][0]["text"]
    pages = [p.strip() for p in text.split("---") if p.strip()]

    # Generate cover image
    image_prompt = f"A beautiful book cover for a {genre} story: {setting}, featuring {characters}"
    image_response = bedrock.invoke_model(
        modelId="amazon.nova-canvas-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {"text": image_prompt},
            "imageGenerationConfig": {"width": 1024, "height": 1024, "numberOfImages": 1},
        }),
    )
    image_body = json.loads(image_response["body"].read())
    image_bytes = base64.b64decode(image_body["images"][0])

    return pages, image_bytes


def upload_cover_sync(image_bytes: bytes, book_id: str) -> str:
    s3 = boto3.client("s3", region_name=settings.aws_default_region)
    key = f"covers/{book_id}.png"
    s3.put_object(Bucket=settings.s3_covers_bucket, Key=key, Body=image_bytes, ContentType="image/png")
    return f"https://{settings.s3_covers_bucket}.s3.{settings.aws_default_region}.amazonaws.com/{key}"
```

- [ ] **Step 2: Create app/tasks/__init__.py** (empty)

- [ ] **Step 3: Create app/tasks/generate.py**

```python
import asyncio
from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.generation_job import GenerationJob
from app.models.book import Book
from app.services.generation import generate_story_sync, upload_cover_sync


async def run_generation(job_id: str):
    async with async_session_factory() as db:
        result = await db.execute(
            select(GenerationJob).where(GenerationJob.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            return

        try:
            job.status = "processing"
            await db.flush()

            pages, image_bytes = await asyncio.to_thread(generate_story_sync, job.genre, job.characters, job.setting)

            book = Book(
                user_id=job.user_id,
                title=f"{job.genre} Story",
                genre=job.genre,
                characters=job.characters,
                setting=job.setting,
                pages=pages,
            )
            db.add(book)
            await db.flush()

            cover_url = await asyncio.to_thread(upload_cover_sync, image_bytes, book.id)
            book.cover_image_url = cover_url

            job.status = "complete"
            job.result_book_id = book.id
        except Exception as e:
            job.status = "failed"
            job.error = str(e)

        await db.commit()
```

- [ ] **Step 4: Create app/routes/generation.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.generation_job import GenerationJob
from app.schemas.generation import GenerateRequest, GenerationJobResponse
from app.tasks.generate import run_generation
from app.schemas.book import BookResponse

router = APIRouter(prefix="/api/v1", tags=["generation"])


@router.post("/generate", status_code=202)
async def create_generation(
    body: GenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationJobResponse:
    job = GenerationJob(
        user_id=user.id,
        genre=body.genre,
        characters=body.characters,
        setting=body.setting,
    )
    db.add(job)
    await db.flush()
    job_id = job.id

    import asyncio
    asyncio.create_task(run_generation(job_id))

    return GenerationJobResponse(jobId=job_id, status="pending")


@router.get("/generate/{job_id}")
async def get_generation_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationJobResponse:
    result = await db.execute(
        select(GenerationJob).where(GenerationJob.id == job_id, GenerationJob.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Generation job not found")

    resp = GenerationJobResponse(jobId=job.id, status=job.status, error=job.error)
    if job.result_book_id:
        book_result = await db.execute(
            select(Book).where(Book.id == job.result_book_id)
        )
        book = book_result.scalar_one_or_none()
        if book:
            resp.book = BookResponse.model_validate(book)
    return resp
```

- [ ] **Step 5: Commit**

```bash
git add inkwell.back/app/services/generation.py inkwell.back/app/tasks/ inkwell.back/app/routes/generation.py
git commit -m "feat: add story generation with Bedrock async background task"
```

---

### Task 7: Challenge API

**Files:**
- Create: `inkwell.back/app/services/challenge.py`
- Create: `inkwell.back/app/routes/challenge.py`

- [ ] **Step 1: Create app/services/challenge.py**

```python
from datetime import date, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.challenge import Challenge
from app.models.user import User


async def get_today_challenge(db: AsyncSession) -> Challenge | None:
    today = date.today()
    result = await db.execute(select(Challenge).where(Challenge.date == today))
    return result.scalar_one_or_none()


async def update_streak(db: AsyncSession, user: User) -> int:
    today = date.today()
    if user.last_challenge_date == today:
        return user.streak_count
    if user.last_challenge_date:
        from datetime import timedelta
        if user.last_challenge_date == today - timedelta(days=1):
            user.streak_count += 1
        else:
            user.streak_count = 1
    else:
        user.streak_count = 1
    user.last_challenge_date = today
    await db.flush()
    return user.streak_count
```

- [ ] **Step 2: Create app/routes/challenge.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.challenge import ChallengeResponse
from app.services.challenge import get_today_challenge, update_streak

router = APIRouter(prefix="/api/v1", tags=["challenge"])


@router.get("/challenge")
async def get_challenge(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChallengeResponse:
    challenge = await get_today_challenge(db)
    streak = await update_streak(db, user)
    return ChallengeResponse(
        id=challenge.id if challenge else "",
        prompt=challenge.prompt if challenge else "No challenge today",
        date=challenge.date if challenge else None,
        streakCount=streak,
    )
```

- [ ] **Step 3: Commit**

```bash
git add inkwell.back/app/services/challenge.py inkwell.back/app/routes/challenge.py
git commit -m "feat: add daily challenge endpoint with streak tracking"
```

---

### Task 8: PDF Export Service + API

**Files:**
- Create: `inkwell.back/app/services/pdf.py`
- Create: `inkwell.back/app/routes/pdf.py`

- [ ] **Step 1: Create app/services/pdf.py**

```python
import json
import boto3
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.pdf_job import PdfJob
from app.models.book import Book


async def enqueue_pdf_export(db: AsyncSession, book_id: str, user_id: str) -> str:
    result = await db.execute(select(Book).where(Book.id == book_id, Book.user_id == user_id))
    book = result.scalar_one_or_none()
    if book is None:
        raise ValueError("Book not found")

    job = PdfJob(book_id=book_id, user_id=user_id)
    db.add(job)
    await db.flush()

    sqs = boto3.client("sqs", region_name=settings.aws_default_region)
    sqs.send_message(
        QueueUrl=settings.sqs_pdf_queue_url,
        MessageBody=json.dumps({"job_id": job.id}),
    )
    return job.id
```

- [ ] **Step 2: Create app/routes/pdf.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.pdf_job import PdfJob
from app.schemas.pdf import PdfExportRequest, PdfJobResponse
from app.services.pdf import enqueue_pdf_export

router = APIRouter(prefix="/api/v1", tags=["pdf"])


@router.post("/pdf/export", status_code=202)
async def export_pdf(
    body: PdfExportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PdfJobResponse:
    try:
        job_id = await enqueue_pdf_export(db, body.bookId, user.id)
        return PdfJobResponse(jobId=job_id, status="pending")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/pdf/{job_id}")
async def get_pdf_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PdfJobResponse:
    result = await db.execute(
        select(PdfJob).where(PdfJob.id == job_id, PdfJob.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="PDF job not found")
    return PdfJobResponse(jobId=job.id, status=job.status, downloadUrl=job.download_url, error=job.error)
```

- [ ] **Step 3: Commit**

```bash
git add inkwell.back/app/services/pdf.py inkwell.back/app/routes/pdf.py
git commit -m "feat: add PDF export endpoint with SQS enqueue"
```

---

### Task 9: Internal Challenge Seed Endpoint

**Files:**
- Create: `inkwell.back/app/routes/internal.py`
- Modify: `inkwell.back/app/main.py`

- [ ] **Step 1: Create app/routes/internal.py**

```python
import json
from datetime import date

import boto3
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.models.challenge import Challenge

router = APIRouter(prefix="/api/v1/internal", tags=["internal"])


@router.post("/challenge-seed")
async def seed_challenge(db: AsyncSession = Depends(get_db)):
    bedrock = boto3.client("bedrock-runtime", region_name=settings.bedrock_region)
    prompt = "Generate a creative writing prompt for a daily challenge. One sentence, evocative."
    response = bedrock.invoke_model(
        modelId="amazon.nova-lite-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "maxTokens": 100,
        }),
    )
    body = json.loads(response["body"].read())
    text = body["output"]["message"]["content"][0]["text"].strip()

    challenge = Challenge(prompt=text, date=date.today())
    db.add(challenge)
    await db.flush()
    return {"id": challenge.id, "prompt": challenge.prompt, "date": str(challenge.date)}
```

- [ ] **Step 2: Add internal router to app/main.py**

Add `from app.routes.internal import router as internal_router` and `app.include_router(internal_router)` to `inkwell.back/app/main.py`.

- [ ] **Step 3: Commit**

```bash
git add inkwell.back/app/routes/internal.py inkwell.back/app/main.py
git commit -m "feat: add internal challenge-seed endpoint for EventBridge"
```

---

### Task 10: Terraform — Network + RDS + Cognito

**Files:**
- Create: `inkwell.back/terraform/main.tf`
- Create: `inkwell.back/terraform/network.tf`
- Create: `inkwell.back/terraform/rds.tf`
- Create: `inkwell.back/terraform/cognito.tf`

- [ ] **Step 1: Create terraform/main.tf**

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "inkwell-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

locals {
  name_prefix = "inkwell"
}
```

- [ ] **Step 2: Create terraform/network.tf**

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${local.name_prefix}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name_prefix}-igw" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "${local.name_prefix}-public-${count.index}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${local.name_prefix}-private-${count.index}" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = "${local.name_prefix}-nat" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${local.name_prefix}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  tags = { Name = "${local.name_prefix}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_security_group" "ec2" {
  vpc_id = aws_vpc.main.id
  name   = "${local.name_prefix}-ec2-sg"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name_prefix}-ec2-sg" }
}

resource "aws_security_group" "rds" {
  vpc_id = aws_vpc.main.id
  name   = "${local.name_prefix}-rds-sg"
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name_prefix}-rds-sg" }
}

resource "aws_security_group" "lambda" {
  vpc_id = aws_vpc.main.id
  name   = "${local.name_prefix}-lambda-sg"
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name_prefix}-lambda-sg" }
}
```

- [ ] **Step 3: Create terraform/rds.tf**

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier             = "${local.name_prefix}-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "inkwell"
  username               = "inkwell"
  password               = random_password.db.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  tags                   = { Name = "${local.name_prefix}-db" }
}

resource "random_password" "db" {
  length  = 24
  special = false
}
```

- [ ] **Step 4: Create terraform/cognito.tf**

```hcl
resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-user-pool"
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]
  tags = { Name = "${local.name_prefix}-user-pool" }
}

resource "aws_cognito_user_pool_client" "main" {
  name                         = "${local.name_prefix}-client"
  user_pool_id                 = aws_cognito_user_pool.main.id
  generate_secret              = false
  explicit_auth_flows          = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  supported_identity_providers = ["COGNITO"]
  callback_urls                = ["http://localhost:5173"]
  logout_urls                  = ["http://localhost:5173"]
  allowed_oauth_flows          = ["code"]
  allowed_oauth_scopes         = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-${random_string.suffix.result}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}
```

- [ ] **Step 5: Commit**

```bash
git add inkwell.back/terraform/
git commit -m "feat: add Terraform config for network, RDS, and Cognito"
```

---

### Task 11: Terraform — EC2 + Bedrock + S3 + SQS + Lambda

**Files:**
- Create: `inkwell.back/terraform/ec2.tf`
- Create: `inkwell.back/terraform/bedrock.tf`
- Create: `inkwell.back/terraform/storage.tf`
- Create: `inkwell.back/terraform/queue.tf`
- Create: `inkwell.back/terraform/lambda.tf`

- [ ] **Step 1: Create terraform/ec2.tf**

```hcl
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

resource "aws_iam_role_policy_attachment" "ec2_bedrock" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.bedrock.arn
}

resource "aws_instance" "app" {
  ami                  = data.aws_ami.amazon_linux.id
  instance_type        = "t3.micro"
  subnet_id            = aws_subnet.public[0].id
  iam_instance_profile = aws_iam_instance_profile.ec2.name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  user_data = templatefile("${path.module}/userdata.sh", {
    database_url     = "postgresql://inkwell:${random_password.db.result}@${aws_db_instance.main.address}:5432/inkwell"
    cognito_pool_id  = aws_cognito_user_pool.main.id
    cognito_client_id = aws_cognito_user_pool_client.main.id
    s3_covers_bucket = aws_s3_bucket.covers.id
    s3_pdfs_bucket   = aws_s3_bucket.pdfs.id
    sqs_queue_url    = aws_sqs_queue.pdf_jobs.id
  })
  tags = { Name = "${local.name_prefix}-app" }
}

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ec2.id]
  subnets            = aws_subnet.public[*].id
  tags               = { Name = "${local.name_prefix}-alb" }
}

resource "aws_lb_target_group" "app" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "instance"
  health_check {
    path                = "/api/v1/health"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_target_group_attachment" "app" {
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_instance.app.id
  port             = 80
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
```

- [ ] **Step 2: Create terraform/userdata.sh**

```bash
#!/bin/bash
dnf update -y
dnf install -y docker
systemctl enable docker
systemctl start docker
mkdir -p /app
cat > /app/.env <<EOF
DATABASE_URL=${database_url}
COGNITO_USER_POOL_ID=${cognito_pool_id}
COGNITO_CLIENT_ID=${cognito_client_id}
COGNITO_REGION=us-east-1
BEDROCK_REGION=us-east-1
S3_COVERS_BUCKET=${s3_covers_bucket}
S3_PDFS_BUCKET=${s3_pdfs_bucket}
SQS_PDF_QUEUE_URL=${sqs_queue_url}
AWS_DEFAULT_REGION=us-east-1
EOF
docker run -d --restart always --env-file /app/.env -p 80:80 inkwell/backend:latest
```

- [ ] **Step 3: Create terraform/bedrock.tf**

```hcl
resource "aws_iam_policy" "bedrock" {
  name = "${local.name_prefix}-bedrock-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel"]
      Resource = [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-canvas-v1:0",
      ]
    }]
  })
}
```

- [ ] **Step 4: Create terraform/storage.tf**

```hcl
resource "aws_s3_bucket" "covers" {
  bucket = "${local.name_prefix}-covers-${random_string.suffix.result}"
  tags   = { Name = "${local.name_prefix}-covers" }
}

resource "aws_s3_bucket_public_access_block" "covers" {
  bucket = aws_s3_bucket.covers.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "covers_public" {
  bucket = aws_s3_bucket.covers.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.covers.arn}/*"
    }]
  })
}

resource "aws_s3_bucket" "pdfs" {
  bucket = "${local.name_prefix}-pdfs-${random_string.suffix.result}"
  tags   = { Name = "${local.name_prefix}-pdfs" }
}
```

- [ ] **Step 5: Create terraform/queue.tf**

```hcl
resource "aws_sqs_queue" "pdf_jobs" {
  name                      = "${local.name_prefix}-pdf-jobs"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.pdf_jobs_dlq.arn
    maxReceiveCount     = 3
  })
  tags = { Name = "${local.name_prefix}-pdf-jobs" }
}

resource "aws_sqs_queue" "pdf_jobs_dlq" {
  name = "${local.name_prefix}-pdf-jobs-dlq"
  tags = { Name = "${local.name_prefix}-pdf-jobs-dlq" }
}
```

- [ ] **Step 6: Create terraform/lambda.tf**

```hcl
resource "aws_iam_role" "pdf_lambda" {
  name = "${local.name_prefix}-pdf-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "pdf_lambda_sqs" {
  role       = aws_iam_role.pdf_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_iam_role_policy_attachment" "pdf_lambda_vpc" {
  role       = aws_iam_role.pdf_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_policy" "pdf_lambda_extra" {
  name = "${local.name_prefix}-pdf-lambda-extra"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:PutObject"]
        Resource = ["${aws_s3_bucket.pdfs.arn}/*"]
      },
      {
        Effect = "Allow"
        Action = ["rds-data:*"]
        Resource = [aws_db_instance.main.arn]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "pdf_lambda_extra" {
  role       = aws_iam_role.pdf_lambda.name
  policy_arn = aws_iam_policy.pdf_lambda_extra.arn
}

data "archive_file" "pdf_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/pdf_export"
  output_path = "${path.module}/pdf_lambda.zip"
}

resource "aws_lambda_function" "pdf_export" {
  filename         = data.archive_file.pdf_lambda.output_path
  function_name    = "${local.name_prefix}-pdf-export"
  role             = aws_iam_role.pdf_lambda.arn
  handler          = "main.handler"
  runtime          = "python3.12"
  timeout          = 120
  memory_size      = 512
  source_code_hash = data.archive_file.pdf_lambda.output_base64sha256
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  environment {
    variables = {
      DATABASE_URL          = "postgresql://inkwell:${random_password.db.result}@${aws_db_instance.main.address}:5432/inkwell"
      S3_PDFS_BUCKET        = aws_s3_bucket.pdfs.id
      SQS_PDF_QUEUE_URL     = aws_sqs_queue.pdf_jobs.id
      PRESIGNED_URL_EXPIRY_SECONDS = "3600"
      AWS_DEFAULT_REGION    = "us-east-1"
    }
  }
  tags = { Name = "${local.name_prefix}-pdf-export" }
}

resource "aws_lambda_event_source_mapping" "pdf_export" {
  event_source_arn = aws_sqs_queue.pdf_jobs.arn
  function_name    = aws_lambda_function.pdf_export.arn
  batch_size       = 1
}

resource "aws_vpc_endpoint" "sqs" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.us-east-1.sqs"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.lambda.id]
  tags = { Name = "${local.name_prefix}-sqs-vpce" }
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
  tags = { Name = "${local.name_prefix}-s3-vpce" }
}
```

- [ ] **Step 7: Commit**

```bash
git add inkwell.back/terraform/ec2.tf inkwell.back/terraform/bedrock.tf inkwell.back/terraform/storage.tf inkwell.back/terraform/queue.tf inkwell.back/terraform/lambda.tf inkwell.back/terraform/userdata.sh
git commit -m "feat: add Terraform config for EC2, S3, SQS, and Lambda"
```

---

### Task 12: Terraform — Frontend, Events, SES, Outputs

**Files:**
- Create: `inkwell.back/terraform/frontend.tf`
- Create: `inkwell.back/terraform/events.tf`
- Create: `inkwell.back/terraform/ses.tf`
- Create: `inkwell.back/terraform/outputs.tf`

- [ ] **Step 1: Create terraform/frontend.tf**

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend-${random_string.suffix.result}"
  tags   = { Name = "${local.name_prefix}-frontend" }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = aws_cloudfront_origin_access_identity.main.iam_arn }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "${local.name_prefix}-oai"
}

resource "aws_cloudfront_distribution" "main" {
  enabled = true
  origins {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3-frontend"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    forwarded_values {
      query_string = false
      cookies      { forward = "none" }
    }
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  default_root_object = "index.html"
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  tags = { Name = "${local.name_prefix}-cdn" }
}
```

- [ ] **Step 2: Create terraform/events.tf**

```hcl
resource "aws_iam_role" "eventbridge" {
  name = "${local.name_prefix}-eventbridge-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "events.amazonaws.com" }
    }]
  })
}

resource "aws_cloudwatch_event_rule" "daily_challenge" {
  name                = "${local.name_prefix}-daily-challenge"
  schedule_expression = "cron(0 6 * * ? *)"
  description         = "Generate daily challenge prompt at 06:00 UTC"
}

resource "aws_cloudwatch_event_target" "challenge_seed" {
  rule      = aws_cloudwatch_event_rule.daily_challenge.name
  arn       = aws_lb.main.arn
  role_arn  = aws_iam_role.eventbridge.arn

  http_target {
    path_pattern = "/api/v1/internal/challenge-seed"
  }
}
```

- [ ] **Step 3: Create terraform/ses.tf**

```hcl
resource "aws_ses_domain_identity" "main" {
  domain = "inkwell.app"
}

resource "aws_iam_policy" "ses_send" {
  name = "${local.name_prefix}-ses-send"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = [aws_ses_domain_identity.main.arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ses" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ses_send.arn
}
```

- [ ] **Step 4: Create terraform/outputs.tf**

```hcl
output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.main.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.main.domain
}

output "s3_covers_bucket" {
  value = aws_s3_bucket.covers.id
}

output "s3_pdfs_bucket" {
  value = aws_s3_bucket.pdfs.id
}

output "sqs_pdf_queue_url" {
  value = aws_sqs_queue.pdf_jobs.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "frontend_s3_bucket" {
  value = aws_s3_bucket.frontend.id
}
```

- [ ] **Step 5: Commit**

```bash
git add inkwell.back/terraform/frontend.tf inkwell.back/terraform/events.tf inkwell.back/terraform/ses.tf inkwell.back/terraform/outputs.tf
git commit -m "feat: add Terraform config for frontend CloudFront, EventBridge, SES, outputs"
```

---

### Task 13: Lambda PDF Generator

**Files:**
- Create: `inkwell.back/lambda/pdf_export/main.py`
- Create: `inkwell.back/lambda/pdf_export/requirements.txt`

- [ ] **Step 1: Create lambda/pdf_export/main.py**

```python
import json
import os
import boto3
import psycopg2
from urllib.parse import urlparse

DATABASE_URL = os.environ["DATABASE_URL"]
S3_PDFS_BUCKET = os.environ["S3_PDFS_BUCKET"]
PRESIGNED_EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "3600"))


def handler(event, context):
    for record in event["Records"]:
        body = json.loads(record["body"])
        job_id = body["job_id"]
        _process_job(job_id)


def _process_job(job_id: str):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Get job + book data
    cur.execute(
        """SELECT b.id, b.title, b.pages::text
           FROM pdf_jobs j JOIN books b ON j.book_id = b.id
           WHERE j.id = %s""",
        (job_id,),
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return

    book_id, title, pages_json = row
    import json as j
    pages = j.loads(pages_json)

    # Generate PDF content
    pdf_content = _generate_pdf(title, pages)

    # Upload to S3
    s3 = boto3.client("s3")
    key = f"pdfs/{book_id}.pdf"
    s3.put_object(Bucket=S3_PDFS_BUCKET, Key=key, Body=pdf_content, ContentType="application/pdf")

    # Generate presigned URL
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_PDFS_BUCKET, "Key": key},
        ExpiresIn=PRESIGNED_EXPIRY,
    )

    # Update job status
    cur.execute(
        "UPDATE pdf_jobs SET status = 'complete', download_url = %s, updated_at = NOW() WHERE id = %s",
        (url, job_id),
    )
    conn.commit()
    cur.close()
    conn.close()


def _generate_pdf(title: str, pages: list[str]) -> bytes:
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=24, spaceAfter=30)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=12, leading=20)

    elements = [Paragraph(title, title_style), Spacer(1, 20)]
    for page in pages:
        elements.append(Paragraph(page.replace("\n", "<br/>"), body_style))
        elements.append(Spacer(1, 12))

    doc.build(elements)
    return buffer.getvalue()
```

- [ ] **Step 2: Create lambda/pdf_export/requirements.txt**

```
reportlab==4.2.0
boto3==1.35.0
psycopg2-binary==2.9.9
```

- [ ] **Step 3: Commit**

```bash
git add inkwell.back/lambda/
git commit -m "feat: add Lambda PDF generator with SQS trigger and Reportlab"
```

---

### Task 14: Integration Tests

**Files:**
- Create: `inkwell.back/tests/conftest.py`
- Create: `inkwell.back/tests/__init__.py`
- Create: `inkwell.back/tests/test_routes/__init__.py`
- Create: `inkwell.back/tests/test_services/__init__.py`
- Create: `inkwell.back/tests/test_routes/test_books.py`
- Create: `inkwell.back/tests/test_routes/test_health.py`

- [ ] **Step 1: Create tests/conftest.py**

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.models.user import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    user = User(cognito_sub="test-sub", email="test@test.com", name="Test User")
    db_session.add(user)
    await db_session.flush()
    return user
```

- [ ] **Step 2: Create tests/test_routes/test_health.py**

```python
import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_books_empty(client):
    response = await client.get("/api/v1/books")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["books"] == []
```

- [ ] **Step 3: Create tests/test_routes/test_books.py**

```python
import pytest
from app.models.book import Book


@pytest.mark.asyncio
async def test_create_and_list_books(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="Test Book",
        genre="Fantasy",
        characters="Hero",
        setting="World",
        pages=["Page 1", "Page 2"],
    )
    db_session.add(book)
    await db_session.flush()

    response = await client.get("/api/v1/books")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["books"][0]["title"] == "Test Book"
    assert data["books"][0]["pages"] == ["Page 1", "Page 2"]


@pytest.mark.asyncio
async def test_get_single_book(client, db_session, test_user):
    book = Book(
        user_id=test_user.id,
        title="Single Book",
        genre="Sci-Fi",
        characters="Alien",
        setting="Mars",
        pages=["Only page"],
    )
    db_session.add(book)
    await db_session.flush()

    response = await client.get(f"/api/v1/books/{book.id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Single Book"


@pytest.mark.asyncio
async def test_get_nonexistent_book(client):
    response = await client.get("/api/v1/books/nonexistent-id")
    assert response.status_code == 404
```

- [ ] **Step 4: Run tests**

```bash
cd /home/ahmed/dev/js/WebstormProjects/storyteller/inkwell.back
pip install -r requirements.txt pytest-asyncio httpx aiosqlite
pytest tests/ -v
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add inkwell.back/tests/
git commit -m "feat: add integration tests for health and books endpoints"
```

---

### Task 15: Requirements and Final Touches

**Files:**
- Modify: `inkwell.back/requirements.txt`

- [ ] **Step 1: Update requirements.txt with all dependencies**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.30.0
alembic==1.13.0
pydantic==2.9.0
pydantic-settings==2.5.0
boto3==1.35.0
python-jose[cryptography]==3.3.0
httpx==0.27.0
pytest==8.3.0
pytest-asyncio==0.24.0
aiosqlite==0.20.0
```

- [ ] **Step 2: Run full test suite**

```bash
cd /home/ahmed/dev/js/WebstormProjects/storyteller/inkwell.back
pip install -r requirements.txt
pytest tests/ -v
```
Expected: all tests pass

- [ ] **Step 3: Final commit**

```bash
git add inkwell.back/requirements.txt
git commit -m "chore: finalize requirements and verify tests pass"
```
