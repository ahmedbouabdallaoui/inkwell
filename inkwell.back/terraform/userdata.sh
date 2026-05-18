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
