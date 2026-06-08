resource "aws_iam_policy" "bedrock" {
  name = "${local.name_prefix}-bedrock-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
      ]
      Resource = [
        "arn:aws:bedrock:us-west-2::foundation-model/meta.llama3-1-8b-instruct-v1:0",
        "arn:aws:bedrock:us-west-2::foundation-model/meta.llama3-1-70b-instruct-v1:0",
        "arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-image-generator-v2:0",
        "arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-text-express-v1:0",
        "arn:aws:bedrock:us-west-2::foundation-model/meta.llama3-2-3b-instruct-v1:0",
      ]
    }]
  })
}
