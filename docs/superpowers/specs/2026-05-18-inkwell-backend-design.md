# Inkwell Backend — Design Spec

**Date:** 2026-05-18
**Project:** AI Story Prompt Generator
**Stack:** FastAPI + PostgreSQL on EC2, Bedrock AI, Cognito auth, Terraform infra

---

## 1. Project Structure

```
inkwell.back/
├── app/
│   ├── __init__.py           # FastAPI app factory
│   ├── main.py               # Entry point (uvicorn)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py         # Settings from env vars
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   └── security.py       # Cognito JWT verification
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── book.py
│   │   ├── generation_job.py
│   │   ├── challenge.py
│   │   └── pdf_job.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── book.py           # Pydantic request/response models
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
│   │   ├── auth.py           # JWT parse → user lookup/create
│   │   ├── generation.py     # Bedrock Nova Lite + Nova Canvas
│   │   ├── pdf.py            # SQS enqueue
│   │   └── challenge.py      # Daily challenge + streak logic
│   └── tasks/
│       ├── __init__.py
│       └── generate.py       # Background task for story gen
├── lambda/
│   └── pdf_export/
│       ├── main.py            # SQS-triggered PDF generator
│       └── requirements.txt   # reportlab, boto3, psycopg2
├── terraform/
│   ├── main.tf               # Provider + backend state
│   ├── network.tf            # VPC, subnets, security groups
│   ├── ec2.tf                # EC2 t3.micro + ALB
│   ├── rds.tf                # PostgreSQL db.t3.micro
│   ├── cognito.tf            # User pool, client, domain
│   ├── bedrock.tf            # IAM roles for Bedrock
│   ├── storage.tf            # S3: frontend, covers, PDFs
│   ├── queue.tf              # SQS for PDF jobs
│   ├── lambda.tf             # Lambda for PDF generation
│   ├── frontend.tf           # S3 bucket + CloudFront for React SPA
│   ├── events.tf             # EventBridge scheduler
│   ├── ses.tf                # SES email identity
│   └── outputs.tf            # Exports (ALB DNS, Cognito IDs, S3 buckets)
├── tests/
│   ├── conftest.py           # Fixtures (DB session, auth client)
│   ├── test_routes/
│   │   ├── test_books.py
│   │   ├── test_generation.py
│   │   ├── test_challenge.py
│   │   └── test_pdf.py
│   └── test_services/
│       ├── test_auth.py
│       ├── test_generation.py
│       └── test_challenge.py
├── requirements.txt
├── pyproject.toml
├── Dockerfile                # For EC2 deployment
└── README.md
```

## 2. API Endpoints

All routes prefixed with `/api/v1`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | No | Health check |
| GET | `/api/v1/books` | Yes | List current user's books (page, per_page query params) |
| GET | `/api/v1/books/:id` | Yes | Get single book |
| POST | `/api/v1/generate` | Yes | Enqueue story generation, returns jobId |
| GET | `/api/v1/generate/:jobId` | Yes | Poll generation job status |
| GET | `/api/v1/challenge` | Yes | Today's challenge + user streak |
| POST | `/api/v1/pdf/export` | Yes | Queue PDF export job, returns jobId |
| GET | `/api/v1/pdf/:jobId` | Yes | Poll PDF export job status |
| POST | `/api/v1/internal/challenge-seed` | No | Internal: EventBridge target, generates today's challenge via Bedrock (ALB internal listener only) |

### Auth

Cognito JWT verification via FastAPI dependency. The `Authorization: Bearer <id_token>` header is decoded and verified against the Cognito JWKS endpoint. `cognito_sub` from the token is used to look up or auto-create the user record. The authenticated `user_id` is injected into every request handler.

**JSON convention:** All API responses use `camelCase` property names to match frontend conventions. SQLAlchemy models use `snake_case` internally; Pydantic schemas handle the conversion.

### Error response format

```json
{
  "error": {
    "code": "not_found",
    "message": "Book not found"
  }
}
```

### Response schemas

**`GET /api/v1/books?page=0&per_page=8` → `200`**
```json
{
  "books": [
    {
      "id": "uuid",
      "title": "The Dragon Wakes",
      "genre": "Fantasy",
      "characters": "Arin, a reluctant mage",
      "setting": "A collapsing empire",
      "coverImageUrl": "https://s3...",
      "pages": ["page 1...", "page 2..."],
      "createdAt": "2026-05-04T10:00:00Z"
    }
  ],
  "total": 12
}
```
Query params: `page` (0-indexed, default 0), `per_page` (default 8, max 50). `total` is the total book count for the user.

**`POST /api/v1/generate` → `202`**
Request:
```json
{
  "genre": "Fantasy",
  "characters": "Arin, a reluctant mage",
  "setting": "A collapsing empire at war"
}
```
Response:
```json
{
  "jobId": "uuid"
}
```

**`GET /api/v1/generate/:jobId` → `200`**
```json
{
  "jobId": "uuid",
  "status": "pending" | "processing" | "complete" | "failed",
  "book": { ... },        // only when status = complete
  "error": "..."           // only when status = failed
}
```

**`POST /api/v1/pdf/export` → `202`**
Request:
```json
{
  "bookId": "uuid"
}
```
Response:
```json
{
  "jobId": "uuid"
}
```

**`GET /api/v1/pdf/:jobId` → `200`**
```json
{
  "jobId": "uuid",
  "status": "pending" | "processing" | "complete" | "failed",
  "downloadUrl": "https://s3...",  // only when complete
  "error": "..."
}
```

**`GET /api/v1/challenge` → `200`**
```json
{
  "id": "uuid",
  "prompt": "Write about a clock that counts down...",
  "date": "2026-05-18",
  "streakCount": 12
}
```

## 3. Database Schema

All tables in PostgreSQL database `inkwell`.

### `users`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| cognito_sub | TEXT | NOT NULL, UNIQUE |
| email | TEXT | |
| name | TEXT | |
| streak_count | INTEGER | NOT NULL, DEFAULT 0 |
| last_challenge_date | DATE | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### `books`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → users(id) |
| title | TEXT | NOT NULL |
| genre | TEXT | NOT NULL |
| characters | TEXT | NOT NULL |
| setting | TEXT | NOT NULL |
| cover_image_url | TEXT | |
| pages | JSONB | NOT NULL, DEFAULT '[]' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### `generation_jobs`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| user_id | UUID | NOT NULL, FK → users(id) |
| genre | TEXT | NOT NULL |
| characters | TEXT | NOT NULL |
| setting | TEXT | NOT NULL |
| status | TEXT | NOT NULL, DEFAULT 'pending' (pending/processing/complete/failed) |
| result_book_id | UUID | FK → books(id) |
| error | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### `challenges`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| prompt | TEXT | NOT NULL |
| date | DATE | NOT NULL, UNIQUE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

### `pdf_jobs`
| Column | Type | Constraints |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| book_id | UUID | NOT NULL, FK → books(id) |
| user_id | UUID | NOT NULL, FK → users(id) |
| status | TEXT | NOT NULL, DEFAULT 'pending' (pending/processing/complete/failed) |
| download_url | TEXT | |
| error | TEXT | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

## 4. Service Layer

### `services/auth.py`
- `verify_token(token: str) -> dict` — fetches Cognito JWKS, verifies JWT signature and expiry, returns decoded claims
- `get_or_create_user(cognito_sub: str, email: str, name: str) -> User` — looks up by cognito_sub, creates if not found
- FastAPI `Depends(get_current_user)` — extracts Bearer token, calls verify + get_or_create, injects `User` into route

### `services/generation.py`
- `generate_story(genre, characters, setting) -> tuple[list[str], bytes]` — calls Bedrock Nova Lite with structured prompt, returns list of page texts + cover image bytes
- `upload_cover(image_bytes: bytes, book_id: str) -> str` — uploads to S3 `covers/` prefix, returns public URL
- `create_book_record(user_id, title, genre, characters, setting, cover_url, pages) -> Book` — inserts into `books` table

### `services/pdf.py`
- `enqueue_pdf_export(book_id: str, user_id: str) -> str` — creates `pdf_jobs` record, sends `{"job_id": "<uuid>"}` to SQS queue, returns jobId
- The Lambda function polls SQS, reads `job_id`, queries `pdf_jobs` + `books` from RDS, generates PDF, uploads to S3, updates `pdf_jobs.status` to `complete` with `download_url`

### `services/challenge.py`
- `get_today_challenge() -> Challenge` — queries `challenges` for today's date
- `update_streak(user: User) -> int` — checks if user has a `last_challenge_date`, computes streak, updates user record

## 5. Background Generation Flow

1. `POST /api/v1/generate` validates input, creates `generation_jobs` row (`status: pending`)
2. FastAPI schedules a `BackgroundTask` that:
   a. Updates job to `status: processing`
   b. Calls `services/generation.generate_story()` → Bedrock Nova Lite returns story, Bedrock Nova Canvas returns cover image
   c. Uploads cover image to S3
   d. Creates `Book` record in RDS
   e. Updates job to `status: complete` with `result_book_id`
3. Frontend polls `GET /api/v1/generate/:jobId` every 2s until complete or failed

**Note:** This is a v1 simplification. If the EC2 instance restarts mid-generation, the job stays stuck at `processing`. A production improvement would use SQS for generation jobs too, matching the PDF pattern.

## 6. PDF Export Flow (SQS → Lambda)

1. `POST /api/v1/pdf/export` creates `pdf_jobs` row (`status: pending`), sends message to SQS queue
2. Lambda function (Python) polls SQS:
   a. Fetches book data and database credentials from env vars, queries RDS directly for the book pages + title
   b. Generates PDF from `book.pages` using reportlab or similar
   c. Uploads PDF to S3 under `pdfs/{book_id}.pdf`
   d. Generates presigned URL (expiry: 1 hour)
   e. Updates `pdf_jobs` row with `status: complete` and `download_url`
3. Frontend polls `GET /api/v1/pdf/:jobId` every 2s until complete

**Lambda network:** The Lambda function must be in the same VPC as RDS (with appropriate security group) to query the database directly. Since the Lambda is in a VPC, it also needs **VPC endpoints** for SQS and S3 (or a NAT gateway) to poll the queue and upload PDFs.

## 7. Terraform Infrastructure

### Resources provisioned

| File | Resources |
|------|-----------|
| `network.tf` | VPC (10.0.0.0/16), public/private subnets, Internet Gateway, security groups |
| `ec2.tf` | ALB (internet-facing), target group, EC2 t3.micro with userdata to pull Docker image, IAM role with Bedrock/S3/SQS/Cognito access |
| `rds.tf` | PostgreSQL db.t3.micro, subnet group, parameter group, security group allowing EC2 |
| `cognito.tf` | User pool, user pool client (public), user pool domain, resource server |
| `bedrock.tf` | IAM policy allowing `bedrock:InvokeModel` on Nova Lite + Nova Canvas |
| `storage.tf` | S3 bucket for covers (public read — cover images are shown directly in the browser), S3 bucket for PDFs (private + presigned URLs) |
| `frontend.tf` | S3 bucket (static website hosting), CloudFront distribution, origin access identity, CloudFront outputs for DNS. **Upload:** v1 uses manual `aws s3 sync` from the CI pipeline after building `inkwell.front/` |
| `queue.tf` | SQS queue (PDF jobs), dead-letter queue |
| `lambda.tf` | Lambda function (PDF generator), IAM role (SQS poll + S3 write + RDS query), event source mapping from SQS |
| `events.tf` | EventBridge rule (daily cron at 06:00 UTC) targets the EC2 instance's challenge-seed endpoint (internal ALB), which calls Bedrock to generate a new challenge prompt and inserts a row into the `challenges` table. SES notification is sent to all users with a non-null `last_challenge_date`. |
| `ses.tf` | SES verified email identity, email sending IAM policy |

### EC2 deployment

The EC2 instance runs the FastAPI app via Docker. Terraform passes userdata that:
1. Installs Docker
2. Pulls the image from ECR or builds from source
3. Runs the container with env vars for DB, Cognito, S3, SQS
4. Enables auto-start via systemd

## 8. Configuration

### EC2 FastAPI app — environment variables

```
DATABASE_URL=postgresql://user:pass@host:5432/inkwell
COGNITO_USER_POOL_ID=us-east-1_XXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXX
COGNITO_REGION=us-east-1
BEDROCK_REGION=us-east-1
S3_COVERS_BUCKET=inkwell-covers
S3_PDFS_BUCKET=inkwell-pdfs
SQS_PDF_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
AWS_DEFAULT_REGION=us-east-1
```

### Lambda PDF generator — environment variables

```
DATABASE_URL=postgresql://user:pass@host:5432/inkwell
S3_PDFS_BUCKET=inkwell-pdfs
SQS_PDF_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
PRESIGNED_URL_EXPIRY_SECONDS=3600
AWS_DEFAULT_REGION=us-east-1
```

## 9. Testing Strategy

### Unit tests (`tests/test_services/`)
- Mock `boto3` calls (Bedrock, S3, SQS) with `moto` or manual stubs
- Mock Cognito JWKS fetch
- Test each service function in isolation

### Integration tests (`tests/test_routes/`)
- Use test PostgreSQL database (via `pytest-postgresql` or ephemeral Docker container)
- Test each endpoint with valid/invalid auth tokens
- Test generation job lifecycle (create → process → complete)
- Test error cases (not found, auth failure, validation errors)

### Fixtures (`tests/conftest.py`)
- `test_db` — creates tables, yields session, drops tables
- `auth_headers` — generates mock Cognito token for test user
- `test_user` — creates user in test DB
- `mock_bedrock` — patches Bedrock invoke_model to return test story
- `client` — FastAPI TestClient with overridden DB dependency

## 10. Error Handling

- 401 `unauthorized`: Missing or invalid auth token
- 403 `forbidden`: Valid token but not authorized for resource
- 404 `not_found`: Resource not found
- 422 `validation_error`: Request validation failure (Pydantic)
- 500 `internal_error`: Unexpected server error (logged, generic message returned)
- 202 poll response `generation_failed`: Generation job failed (details in `error` field)

All errors return consistent shape:
```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable description"
  }
}
```
