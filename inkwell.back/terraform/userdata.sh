#!/bin/bash
exec > /var/log/user-data.log 2>&1
set -x
dnf update -y
dnf install -y docker awscli
systemctl enable docker
systemctl start docker
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${account_id}.dkr.ecr.us-east-1.amazonaws.com
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

# Retry loop: the container should start within 60s
for i in $(seq 1 6); do
  docker rm -f inkwell-backend 2>/dev/null || true
  docker run -d \
    --name inkwell-backend \
    --restart always \
    --env-file /app/.env \
    -p 80:80 \
    ${account_id}.dkr.ecr.us-east-1.amazonaws.com/inkwell/backend:latest
  sleep 10
  if curl -sf http://localhost:80/api/v1/health >/dev/null 2>&1; then
    echo "Backend started successfully"
    exit 0
  fi
  echo "Container not ready yet, retry $i/6..."
  docker logs inkwell-backend 2>&1 | tail -10
done
echo "Backend failed to start after 6 attempts" >&2
docker logs inkwell-backend 2>&1 | tail -40
exit 1
