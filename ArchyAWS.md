# AI Story Prompt Generator
## Executive Summary

An AI-powered web application that generates creative story prompts from user input. Users provide a short description — genre, characters, setting — and the application returns a 400–500 word story prompt suitable for writers, game masters, and content creators. The app includes AI-generated story covers, PDF export, user authentication for saving prompts, a daily writing challenge system, writing streak tracking, and prompt collections.

---

## Architecture Overview

```mermaid
flowchart LR
    Browser["🌐 Browser\nReact SPA"]

    subgraph edge ["Edge Layer"]
        CF["CloudFront\nCDN + SSL"]
        S3F["S3\nStatic Frontend"]
    end

    subgraph compute ["Application Layer"]
        ALB["ALB\nLoad Balancer"]
        EC2["EC2 · t3.micro\nFastAPI Backend"]
    end

    subgraph services ["AWS Services (all native)"]
        direction TB
        Bedrock["Amazon Bedrock\nNova Lite · Story Text"]
        Canvas["Amazon Bedrock\nNova Canvas · Cover Image"]
        Cognito["Cognito\nAuth + MFA"]
        RDS["RDS\nPostgreSQL"]
        EB["EventBridge\nScheduler"]
        SES["SES\nEmail"]
        SQS["SQS\nPDF Queue"]
        Lambda["Lambda\nPDF Generator"]
        S3P["S3\nPDF Storage"]
    end

    Browser -->|HTTPS| CF
    CF -->|Static assets| S3F
    CF -->|API requests| ALB
    ALB --> EC2

    EC2 -->|InvokeModel — text| Bedrock
    EC2 -->|InvokeModel — image| Canvas
    EC2 -->|Verify token| Cognito
    EC2 -->|Read / Write| RDS
    EC2 -->|Queue PDF job| SQS

    EB -->|Daily trigger| EC2
    EC2 -->|Send challenge email| SES

    SQS --> Lambda
    Lambda -->|Upload| S3P
    S3P -->|Presigned URL| EC2
```

---

## Infrastructure Components

### AWS Services Reference

| Component | Service | Tier | Purpose |
|-----------|---------|------|---------|
| CDN + SSL | CloudFront | Free tier | Caches static assets, terminates HTTPS |
| Static hosting | S3 | Free tier | Serves the compiled React app |
| Load balancing | ALB | **Paid ~$16/mo** | Distributes traffic to EC2 |
| Backend | EC2 t3.micro | Free tier (12 mo.) | Runs FastAPI application server |
| **AI model — text** | **Amazon Bedrock — Nova Lite** | **Pay-per-token · very low cost** | **Generates story prompts — Amazon's own creative storytelling model** |
| **AI model — image** | **Amazon Bedrock — Nova Canvas** | **Pay-per-image · ~$0.04/image** | **Generates story cover art from the prompt description** |
| Authentication | Cognito | Free tier (50k MAU) | User sign-up, login, MFA, social OAuth |
| Database | RDS PostgreSQL db.t3.micro | Free tier (12 mo.) | Persists users, prompts, streaks, collections |
| PDF queue | SQS | Free tier (1M req.) | Decouples async PDF jobs from API response |
| PDF generation | Lambda | Free tier (1M req.) | Generates PDF from Markdown, uploads to S3 |
| PDF storage | S3 | Free tier | Stores exported PDF files |
| Daily challenge | EventBridge Scheduler | Free tier | Triggers challenge generation every morning |
| Email delivery | SES | Free tier (3k/day) | Sends daily writing challenge emails |

