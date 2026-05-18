resource "aws_s3_bucket" "covers" {
  bucket = "${local.name_prefix}-covers-${random_string.suffix.result}"
  tags   = { Name = "${local.name_prefix}-covers" }
}

resource "aws_s3_bucket_public_access_block" "covers" {
  bucket = aws_s3_bucket.covers.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "covers_public" {
  bucket = aws_s3_bucket.covers.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.covers.arn}/*"
    }]
  })
}

resource "aws_s3_bucket" "pdfs" {
  bucket = "${local.name_prefix}-pdfs-${random_string.suffix.result}"
  tags   = { Name = "${local.name_prefix}-pdfs" }
}
