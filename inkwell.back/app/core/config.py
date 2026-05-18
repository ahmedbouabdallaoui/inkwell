from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/inkwell"
    cognito_user_pool_id: str = ""
    cognito_client_id: str = ""
    cognito_region: str = "us-east-1"
    bedrock_region: str = "us-east-1"
    s3_covers_bucket: str = "inkwell-covers"
    s3_pdfs_bucket: str = "inkwell-pdfs"
    sqs_pdf_queue_url: str = ""
    aws_default_region: str = "us-east-1"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
