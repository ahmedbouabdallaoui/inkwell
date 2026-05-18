import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cognito_sub: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_challenge_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    books = relationship("Book", back_populates="user")
    generation_jobs = relationship("GenerationJob", back_populates="user")
    pdf_jobs = relationship("PdfJob", back_populates="user")
