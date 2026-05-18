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
