resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-user-pool"
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]
  tags = { Name = "${local.name_prefix}-user-pool" }
}

resource "aws_cognito_user_pool_client" "main" {
  name                         = "${local.name_prefix}-client"
  user_pool_id                 = aws_cognito_user_pool.main.id
  generate_secret              = false
  explicit_auth_flows          = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  supported_identity_providers = ["COGNITO"]
  callback_urls                = ["http://localhost:5173"]
  logout_urls                  = ["http://localhost:5173"]
  allowed_oauth_flows          = ["code"]
  allowed_oauth_scopes         = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-${random_string.suffix.result}"
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}
