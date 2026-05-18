output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.main.id
}

output "cognito_domain" {
  value = aws_cognito_user_pool_domain.main.domain
}

output "s3_covers_bucket" {
  value = aws_s3_bucket.covers.id
}

output "s3_pdfs_bucket" {
  value = aws_s3_bucket.pdfs.id
}

output "sqs_pdf_queue_url" {
  value = aws_sqs_queue.pdf_jobs.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "frontend_s3_bucket" {
  value = aws_s3_bucket.frontend.id
}
