# Inkwell

AI-powered story generation and reading platform. Generate stories via Amazon Bedrock, read them in a 3D flip-book, edit inline, and export as PDF.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Python 3.12+, FastAPI, SQLAlchemy (async), PostgreSQL |
| Auth | AWS Cognito (JWT) |
| AI | Amazon Bedrock (Meta Llama 3.1 8B) |
| PDF | SQS + Lambda + S3 |

## Quick Start

```bash
docker-compose up
```

Frontend at `http://localhost:5173`, backend at `http://localhost:8000`.

### Manual

**Backend:**
```bash
cd inkwell.back
pip install -e .
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
npm install
npm run dev
```
