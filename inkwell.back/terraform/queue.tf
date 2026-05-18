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
