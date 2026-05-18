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
