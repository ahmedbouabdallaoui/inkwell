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
